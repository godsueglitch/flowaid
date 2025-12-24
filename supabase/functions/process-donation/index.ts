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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Use service role for anonymous donations, anon key for authenticated
    const authHeader = req.headers.get('Authorization');
    
    const { 
      productId, 
      amount, 
      quantity = 1, 
      schoolId,
      isAnonymous = false,
      anonymousEmail,
      anonymousName
    } = await req.json();

    console.log('Processing donation:', { 
      productId, 
      amount, 
      quantity, 
      schoolId, 
      isAnonymous,
      anonymousEmail: anonymousEmail ? '***' : undefined
    });

    // Validate required fields
    if (!productId || !amount || amount <= 0) {
      throw new Error('Invalid donation data: productId and positive amount required');
    }

    if (isAnonymous && !anonymousEmail) {
      throw new Error('Email is required for anonymous donations');
    }

    // Create appropriate client
    let supabaseClient;
    let userId = null;

    if (isAnonymous) {
      // Use service role for anonymous donations
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      // Use user's auth for registered donations
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: authHeader! },
        },
      });

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        throw new Error('Unauthorized - please log in or donate anonymously');
      }
      userId = user.id;
    }

    // Get product details
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*, schools(id, wallet_address)')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product error:', productError);
      throw new Error('Product not found');
    }

    // Determine school ID
    const finalSchoolId = product.schools?.id || schoolId || product.school_id;

    // Create donation record
    const donationData: any = {
      school_id: finalSchoolId,
      product_id: productId,
      amount: amount,
      quantity: quantity,
      status: 'pending',
      purpose: isAnonymous 
        ? `Anonymous donation for ${product.name}${anonymousName ? ` from ${anonymousName}` : ''}`
        : `Donation for ${product.name}`,
    };

    // Only set donor_id for registered users
    if (userId) {
      donationData.donor_id = userId;
    }

    // Use service role client for inserting (to bypass RLS for anonymous)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: donation, error: donationError } = await serviceClient
      .from('donations')
      .insert(donationData)
      .select()
      .single();

    if (donationError) {
      console.error('Donation creation error:', donationError);
      throw new Error('Failed to create donation record');
    }

    console.log('Donation created:', donation.id);

    // Initialize Bitnob payment
    const bitnobApiKey = Deno.env.get('BITNOB_API_KEY');
    
    if (!bitnobApiKey) {
      console.error('BITNOB_API_KEY not configured');
      throw new Error('Payment system not configured. Please contact support.');
    }

    const customerEmail = isAnonymous ? anonymousEmail : (await supabaseClient.auth.getUser()).data.user?.email;

    const paymentPayload = {
      amount: amount,
      currency: 'USD',
      description: `Donation: ${product.name}`,
      customerEmail: customerEmail,
      reference: donation.id,
      callbackUrl: `${supabaseUrl}/functions/v1/payment-callback`,
      successUrl: `${req.headers.get('origin') || 'https://flowaid.lovable.app'}/donor/dashboard?donation=success`,
      failureUrl: `${req.headers.get('origin') || 'https://flowaid.lovable.app'}/donate?donation=failed`,
    };

    console.log('Creating Bitnob payment for:', customerEmail);

    const bitnobResponse = await fetch('https://api.bitnob.com/api/v1/checkout', {
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
      // Update donation status to failed
      await serviceClient
        .from('donations')
        .update({ status: 'failed' })
        .eq('id', donation.id);
      throw new Error(bitnobData.message || 'Failed to initialize payment');
    }

    console.log('Bitnob payment created successfully');

    // Update donation with transaction details
    await serviceClient
      .from('donations')
      .update({
        transaction_hash: bitnobData.data?.reference || bitnobData.reference || donation.id,
        status: 'processing',
      })
      .eq('id', donation.id);

    return new Response(
      JSON.stringify({
        success: true,
        donationId: donation.id,
        paymentUrl: bitnobData.data?.checkoutUrl || bitnobData.data?.paymentUrl || bitnobData.checkoutUrl,
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