import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const payload = await req.json();
    
    console.log('Received Bitnob webhook:', JSON.stringify(payload, null, 2));

    // Bitnob webhook payload structure
    const { event, data } = payload;
    
    if (!event || !data) {
      console.log('Invalid webhook payload - missing event or data');
      return new Response(
        JSON.stringify({ success: true, message: 'Acknowledged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // The reference field contains our donation ID
    const donationId = data.reference || data.id;
    
    if (!donationId) {
      console.log('No donation reference found in webhook');
      return new Response(
        JSON.stringify({ success: true, message: 'No reference found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Processing webhook event: ${event} for donation: ${donationId}`);

    // Map Bitnob events to donation status
    let newStatus: string | null = null;
    
    switch (event) {
      case 'checkout.payment.successful':
      case 'checkout.completed':
      case 'payment.successful':
      case 'payment.completed':
        newStatus = 'completed';
        break;
      case 'checkout.payment.failed':
      case 'checkout.failed':
      case 'payment.failed':
        newStatus = 'failed';
        break;
      case 'checkout.payment.pending':
      case 'payment.pending':
        newStatus = 'processing';
        break;
      case 'checkout.expired':
        newStatus = 'expired';
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    if (newStatus) {
      // Update donation status
      const { data: donation, error: updateError } = await serviceClient
        .from('donations')
        .update({ 
          status: newStatus,
          transaction_hash: data.transactionHash || data.transaction_hash || data.id || undefined
        })
        .eq('id', donationId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating donation:', updateError);
        // Try to find by transaction_hash if donation ID doesn't match
        const { error: altUpdateError } = await serviceClient
          .from('donations')
          .update({ status: newStatus })
          .eq('transaction_hash', donationId);
        
        if (altUpdateError) {
          console.error('Alternative update also failed:', altUpdateError);
        } else {
          console.log(`Updated donation by transaction_hash: ${donationId} -> ${newStatus}`);
        }
      } else {
        console.log(`Updated donation ${donationId} status to: ${newStatus}`);
        
        // If payment completed, update school's total_received
        if (newStatus === 'completed' && donation?.school_id && donation?.amount) {
          const { data: school } = await serviceClient
            .from('schools')
            .select('total_received')
            .eq('id', donation.school_id)
            .single();
          
          if (school) {
            await serviceClient
              .from('schools')
              .update({ 
                total_received: (parseFloat(school.total_received) || 0) + parseFloat(donation.amount) 
              })
              .eq('id', donation.school_id);
            
            console.log(`Updated school ${donation.school_id} total_received`);
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Bitnob from retrying
    return new Response(
      JSON.stringify({ success: true, message: 'Acknowledged with error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
