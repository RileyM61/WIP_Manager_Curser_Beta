// Supabase Edge Function: Send CFO Pro Application Notification
// This function sends an email notification when someone applies for CFO Pro

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFICATION_EMAIL = Deno.env.get("CFO_PRO_NOTIFICATION_EMAIL") || "martin@junctionpeak.com";

// ============================================================================
// Rate Limiting
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 submissions per IP per hour

// In-memory rate limit store (resets on cold start, but good enough for basic protection)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { limited: true, retryAfter };
  }
  
  record.count++;
  return { limited: false };
}

function getClientIP(req: Request): string {
  // Check various headers for the real IP (behind proxies/load balancers)
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         req.headers.get("cf-connecting-ip") ||
         "unknown";
}

// ============================================================================
// Input Sanitization
// ============================================================================
function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// Types
// ============================================================================
interface ApplicationData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  annualRevenue: string;
  activeJobs: string;
  challenges: string;
  referralSource?: string;
  // Honeypot field - should be empty if real user
  website?: string;
}

// Allowed origins for CORS - add your production domains here
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://wip-insights.com",
  "https://www.wip-insights.com",
  "https://chainlinkcfo.com",
  "https://www.chainlinkcfo.com",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = getClientIP(req);
    const rateLimit = isRateLimited(clientIP);
    if (rateLimit.limited) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter)
          } 
        }
      );
    }

    const data: ApplicationData = await req.json();

    // Honeypot check - if 'website' field is filled, it's likely a bot
    if (data.website) {
      console.log("Honeypot triggered - likely bot submission");
      // Return success to not reveal detection to bots
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
    if (!data.companyName || !data.contactName || !data.email || !data.annualRevenue || !data.activeJobs || !data.challenges) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const safeData = {
      companyName: sanitize(data.companyName),
      contactName: sanitize(data.contactName),
      email: sanitize(data.email),
      phone: data.phone ? sanitize(data.phone) : undefined,
      annualRevenue: sanitize(data.annualRevenue),
      activeJobs: sanitize(data.activeJobs),
      challenges: sanitize(data.challenges),
      referralSource: data.referralSource ? sanitize(data.referralSource) : undefined,
    };

    // Format revenue for display
    const revenueLabels: Record<string, string> = {
      "under-1m": "Under $1 million",
      "1m-5m": "$1M - $5M",
      "5m-10m": "$5M - $10M",
      "10m-25m": "$10M - $25M",
      "25m-50m": "$25M - $50M",
      "50m-100m": "$50M - $100M",
      "over-100m": "Over $100M",
    };

    const jobsLabels: Record<string, string> = {
      "1-5": "1-5 active jobs",
      "6-15": "6-15 active jobs",
      "16-30": "16-30 active jobs",
      "31-50": "31-50 active jobs",
      "over-50": "50+ active jobs",
    };

    const referralLabels: Record<string, string> = {
      "google": "Google search",
      "linkedin": "LinkedIn",
      "referral": "Referral from someone",
      "conference": "Conference or event",
      "podcast": "Podcast",
      "other": "Other",
    };

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New CFO Pro Application</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🎉 New CFO Pro Application!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #71717a; margin: 0 0 24px 0; font-size: 16px;">
        Someone just applied for ChainLink CFO Pro. Here are their details:
      </p>
      
      <!-- Company Info -->
      <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Company Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 140px;">Company Name:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">${safeData.companyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Annual Revenue:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">${revenueLabels[data.annualRevenue] || safeData.annualRevenue}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Active Jobs:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">${jobsLabels[data.activeJobs] || safeData.activeJobs}</td>
          </tr>
        </table>
      </div>
      
      <!-- Contact Info -->
      <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Contact Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 140px;">Name:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">${safeData.contactName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">
              <a href="mailto:${safeData.email}" style="color: #f97316; text-decoration: none;">${safeData.email}</a>
            </td>
          </tr>
          ${safeData.phone ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Phone:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">
              <a href="tel:${safeData.phone}" style="color: #f97316; text-decoration: none;">${safeData.phone}</a>
            </td>
          </tr>
          ` : ''}
          ${safeData.referralSource ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Referral Source:</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">${referralLabels[data.referralSource] || safeData.referralSource}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Challenges -->
      <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: #18181b; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Challenges They're Facing</h2>
        <p style="color: #18181b; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeData.challenges}</p>
      </div>
      
      <!-- CTA -->
      <div style="text-align: center;">
        <a href="mailto:${safeData.email}?subject=Your%20ChainLink%20CFO%20Pro%20Application&body=Hi%20${encodeURIComponent(safeData.contactName)},%0A%0AThank%20you%20for%20your%20interest%20in%20ChainLink%20CFO%20Pro!%0A%0A" 
           style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Reply to ${safeData.contactName}
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
      <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
        This notification was sent from ChainLink CFO Pro application form.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ChainLink CFO <onboarding@resend.dev>",
        to: [NOTIFICATION_EMAIL],
        subject: `🎉 New CFO Pro Application: ${safeData.companyName}`,
        html: emailHtml,
        reply_to: safeData.email,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-cfo-pro-application:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

