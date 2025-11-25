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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { productId, amount, quantity = 1, schoolId } = await req.json();

    console.log('Processing donation:', { productId, amount, quantity, schoolId, userId: user.id });

    // Get product details
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*, schools(id, wallet_address)')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Create donation record
    const { data: donation, error: donationError } = await supabaseClient
      .from('donations')
      .insert({
        donor_id: user.id,
        school_id: product.schools?.id || schoolId,
        product_id: productId,
        amount: amount,
        quantity: quantity,
        status: 'pending',
        purpose: `Donation for ${product.name}`,
      })
      .select()
      .single();

    if (donationError) {
      console.error('Donation creation error:', donationError);
      throw new Error('Failed to create donation record');
    }

    // Initialize Bitnob payment
    const bitnobApiKey = Deno.env.get('BITNOB_API_KEY');
    
    if (!bitnobApiKey) {
      console.error('BITNOB_API_KEY not configured');
      throw new Error('Payment system not configured');
    }

    const paymentPayload = {
      amount: amount,
      currency: 'USD',
      description: `Donation: ${product.name}`,
      customerEmail: user.email,
      reference: donation.id,
      callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
    };

    console.log('Creating Bitnob payment:', paymentPayload);

    const bitnobResponse = await fetch('https://api.bitnob.com/api/v1/wallets/create-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bitnobApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    const bitnobData = await bitnobResponse.json();

    if (!bitnobResponse.ok) {
      console.error('Bitnob API error:', bitnobData);
      throw new Error('Failed to initialize payment');
    }

    console.log('Bitnob payment created successfully:', bitnobData);

    // Update donation with transaction details
    await supabaseClient
      .from('donations')
      .update({
        transaction_hash: bitnobData.data?.reference || bitnobData.reference,
        status: 'processing',
      })
      .eq('id', donation.id);

    return new Response(
      JSON.stringify({
        success: true,
        donationId: donation.id,
        paymentUrl: bitnobData.data?.paymentUrl || bitnobData.paymentUrl,
        reference: bitnobData.data?.reference || bitnobData.reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error processing donation:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred processing the donation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
