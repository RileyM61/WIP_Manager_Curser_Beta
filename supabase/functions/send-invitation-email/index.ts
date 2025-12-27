// Supabase Edge Function to send invitation emails via Resend
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface InvitationEmailRequest {
  to: string;
  inviteLink: string;
  companyName: string;
  role: string;
  inviterEmail?: string;
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
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication - only authenticated users can send invitation emails
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { to, inviteLink, companyName, role, inviterEmail }: InvitationEmailRequest = await req.json();

    if (!to || !inviteLink || !companyName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, inviteLink, companyName, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate invite link is from our domain
    const allowedLinkDomains = ['localhost', 'wip-insights.com', 'chainlinkcfo.com'];
    try {
      const linkUrl = new URL(inviteLink);
      const isAllowedDomain = allowedLinkDomains.some(domain => 
        linkUrl.hostname === domain || linkUrl.hostname.endsWith('.' + domain)
      );
      if (!isAllowedDomain) {
        return new Response(
          JSON.stringify({ error: 'Invalid invite link domain' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid invite link format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs to prevent HTML injection in email
    const sanitize = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    const safeCompanyName = sanitize(companyName);
    const safeInviterEmail = inviterEmail ? sanitize(inviterEmail) : undefined;

    const roleDisplay = role === 'projectManager' ? 'Project Manager' : 
                        role === 'estimator' ? 'Estimator' : 
                        role === 'owner' ? 'Owner' : role;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to WIP Insights</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">WIP Insights</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Construction Financial Management</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e40af; margin-top: 0;">You're Invited!</h2>
    
    <p>You've been invited to join <strong>${safeCompanyName}</strong> on WIP Insights as a <strong>${roleDisplay}</strong>.</p>
    
    ${safeInviterEmail ? `<p style="color: #64748b; font-size: 14px;">Invited by: ${safeInviterEmail}</p>` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="background: #e2e8f0; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #475569;">${inviteLink}</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} WIP Insights. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    const emailText = `
You're Invited to WIP Insights!

You've been invited to join ${safeCompanyName} on WIP Insights as a ${roleDisplay}.

${safeInviterEmail ? `Invited by: ${safeInviterEmail}` : ''}

Click here to accept the invitation:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `;

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WIP Insights <onboarding@resend.dev>',
        to: [to],
        subject: `You're invited to join ${safeCompanyName} on WIP Insights`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', resendData);

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
