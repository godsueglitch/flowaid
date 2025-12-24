import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID regex pattern
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation schema
const donationSchema = z.object({
  productId: z.string().regex(uuidRegex, 'Invalid product ID format'),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount exceeds maximum limit'),
  quantity: z.number().int().positive().max(10000).default(1),
  schoolId: z.string().regex(uuidRegex, 'Invalid school ID format').optional().nullable(),
  isAnonymous: z.boolean().default(false),
  anonymousEmail: z.string().email('Invalid email format').max(255).optional().nullable(),
  anonymousName: z.string().max(100, 'Name too long').optional().nullable(),
});

// Simple in-memory rate limiting (per IP/email)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: entry.resetTime - now };
}

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
    
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = donationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation failed:', errorMessages);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errorMessages}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { productId, amount, quantity, schoolId, isAnonymous, anonymousEmail, anonymousName } = validationResult.data;

    // Check rate limit using email or IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const rateLimitKey = isAnonymous ? (anonymousEmail || clientIp) : clientIp;
    const rateCheck = checkRateLimit(rateLimitKey);
    
    if (!rateCheck.allowed) {
      console.warn('Rate limit exceeded for:', rateLimitKey);
      return new Response(
        JSON.stringify({ 
          error: 'Too many donation attempts. Please try again later.',
          retryAfter: Math.ceil(rateCheck.resetIn / 1000)
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000))
          }, 
          status: 429 
        }
      );
    }

    console.log('Processing donation:', { 
      productId, 
      amount, 
      quantity, 
      schoolId, 
      isAnonymous,
      anonymousEmail: anonymousEmail ? '***' : undefined
    });

    // Additional business logic validation
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
    const rawBitnobApiKey = Deno.env.get('BITNOB_API_KEY')?.trim();

    if (!rawBitnobApiKey) {
      console.error('BITNOB_API_KEY not configured');
      throw new Error('Payment system not configured. Please contact support.');
    }

    // Users sometimes paste "Bearer <key>" instead of the raw key
    const bitnobApiKey = rawBitnobApiKey.replace(/^Bearer\s+/i, '').trim();

    const customerEmail = isAnonymous
      ? anonymousEmail
      : (await supabaseClient.auth.getUser()).data.user?.email;

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

    // Using Bitnob PRODUCTION endpoint
    // NOTE: Bitnob docs use *.bitnob.co for API base URLs (sandboxapi.bitnob.co / api.bitnob.co)
    const bitnobResponse = await fetch('https://api.bitnob.co/api/v1/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bitnobApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

      if (bitnobResponse.status === 401) {
        throw new Error(
          'Bitnob authentication failed. Please confirm BITNOB_API_KEY is a valid API key (paste the raw key, not "Bearer ...") and that it matches your environment (sandbox vs production).'
        );
      }

      throw new Error(bitnobData?.message || bitnobData?.detail || 'Failed to initialize payment');
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

    // Get school name for email
    let schoolName = null;
    if (finalSchoolId) {
      const { data: school } = await serviceClient
        .from('schools')
        .select('name')
        .eq('id', finalSchoolId)
        .single();
      schoolName = school?.name;
    }

    // Send confirmation email (fire and forget - don't block the response)
    const emailPayload = {
      email: customerEmail,
      donorName: isAnonymous ? anonymousName : null,
      productName: product.name,
      amount: amount,
      quantity: quantity,
      schoolName: schoolName,
      donationId: donation.id,
    };

    // Send email asynchronously
    fetch(`${supabaseUrl}/functions/v1/send-donation-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(emailPayload),
    }).catch(err => console.error('Failed to send confirmation email:', err));

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