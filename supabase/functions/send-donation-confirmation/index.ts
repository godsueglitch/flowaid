import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DonationEmailRequest {
  email: string;
  donorName?: string;
  productName: string;
  amount: number;
  quantity: number;
  schoolName?: string;
  donationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      donorName, 
      productName, 
      amount, 
      quantity, 
      schoolName, 
      donationId 
    }: DonationEmailRequest = await req.json();

    console.log("Sending donation confirmation to:", email);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const displayName = donorName || "Generous Donor";
    const school = schoolName || "a school in need";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #ec4899, #f97316); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You, ${displayName}! 💝</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your generosity makes a difference</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're thrilled to confirm your donation to <strong>${school}</strong>. Your support helps provide essential hygiene products to girls in need.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">Donation Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #6b7280; padding: 8px 0;">Product:</td>
                <td style="color: #1f2937; font-weight: 600; text-align: right;">${productName}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0;">Quantity:</td>
                <td style="color: #1f2937; font-weight: 600; text-align: right;">${quantity} pack(s)</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0;">Amount:</td>
                <td style="color: #ec4899; font-weight: 700; font-size: 20px; text-align: right;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0;">Reference:</td>
                <td style="color: #6b7280; font-size: 12px; text-align: right;">${donationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: linear-gradient(135deg, #fdf2f8, #fff7ed); padding: 20px; border-radius: 12px; border-left: 4px solid #ec4899;">
            <p style="color: #831843; margin: 0; font-size: 14px;">
              <strong>Your Impact:</strong> Every donation helps keep girls in school by providing essential hygiene products. Together, we're breaking barriers to education.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px; text-align: center;">
            Questions? Reply to this email and we'll be happy to help.
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} FlowAid. Empowering girls through education.
        </p>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FlowAid <onboarding@resend.dev>",
        to: [email],
        subject: "Thank you for your donation! 💝",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending donation confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
