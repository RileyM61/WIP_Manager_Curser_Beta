# Security Audit Report: WIP Manager

**Date:** December 27, 2025  
**Auditor:** Automated Security Review  
**Scope:** Full application security audit

---

## Executive Summary

This security audit covers the WIP Manager SaaS application built with React, Supabase, and Stripe. The application demonstrates **good security fundamentals** with Row Level Security (RLS) enabled across all tables and proper authentication patterns. However, several issues require attention.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 3 |
| 🟡 Medium | 5 |
| 🟢 Low | 4 |

---

## 🟠 High Severity Issues

### 1. CORS Wildcard on All Edge Functions
**Files:** All edge functions in `supabase/functions/`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ← Allows any origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Risk:** Allows cross-origin requests from any website, which could be exploited for CSRF-like attacks against authenticated users.

**Remediation:**
```typescript
const ALLOWED_ORIGINS = [
  'https://yourapp.com',
  'https://www.yourapp.com',
  'http://localhost:5173' // dev only
];

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') || '') 
    ? req.headers.get('Origin') 
    : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### 2. Unauthenticated Email Edge Functions
**Files:** 
- `supabase/functions/send-invitation-email/index.ts`
- `supabase/functions/send-cfo-pro-application/index.ts`  
- `supabase/functions/send-value-builder-lead/index.ts`

**Risk:** These functions accept POST requests without authentication, allowing abuse for spam or email enumeration.

**Current Code (send-invitation-email):**
```typescript
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // No auth check! Directly processes request body
  const { to, inviteLink, companyName, role, inviterEmail } = await req.json();
```

**Remediation:** Add authentication check:
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: "Missing authorization" }),
    { status: 401, headers: corsHeaders }
  );
}
// Verify the token before proceeding
```

---

### 3. Weekly Snapshots Function Uses Service Role Without Auth
**File:** `supabase/functions/create-weekly-snapshots/index.ts`

```typescript
// Create Supabase client with service role for admin access
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, ...);

// Optional company filter from request body - NO AUTH CHECK
let targetCompanyId: string | null = null;
const body = await req.json();
targetCompanyId = body.companyId || null;
```

**Risk:** Anyone who discovers this endpoint can trigger snapshot creation for any company or all companies.

**Remediation:** Either:
1. Add authentication and verify the user owns/has access to the target company
2. Remove the HTTP trigger and only use cron invocation
3. Add a secret token verification for webhook-style access

---

## 🟡 Medium Severity Issues

### 4. Function Search Path Not Set (Supabase Advisor)
**Functions affected:**
- `public.update_value_driver_assessments_updated_at`
- `public.update_forecast_updated_at`

**Risk:** Mutable search_path can lead to security vulnerabilities if an attacker can create objects in the public schema.

**Remediation:** Add a migration to set search_path:
```sql
ALTER FUNCTION public.update_value_driver_assessments_updated_at() SET search_path = public;
ALTER FUNCTION public.update_forecast_updated_at() SET search_path = public;
```

---

### 5. Dependency Vulnerability: xlsx Package
**Result from `npm audit`:**
```
xlsx  *
Severity: high
- Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
- ReDoS vulnerability (GHSA-5pgg-2g8v-p9x9)
No fix available
```

**Risk:** If user-uploaded Excel files are processed, these could lead to DoS or code execution.

**Remediation:** Consider alternatives:
- `exceljs` - actively maintained, no known vulnerabilities
- `SheetJS Pro` (commercial, maintained)
- Server-side processing in isolated environment

---

### 6. Missing Input Validation on Form Submissions
**Files:** 
- `supabase/functions/send-cfo-pro-application/index.ts`
- `supabase/functions/send-value-builder-lead/index.ts`

**Current Code:**
```typescript
const data: ApplicationData = await req.json();
// No validation - directly interpolates into HTML email
const emailHtml = `... ${data.companyName} ... ${data.challenges} ...`;
```

**Risk:** Email injection or XSS in email clients if malicious data is submitted.

**Remediation:** Add validation and sanitization:
```typescript
const sanitize = (str: string) => str.replace(/[<>&"']/g, '');

// Validate required fields and lengths
if (!data.companyName || data.companyName.length > 100) {
  return new Response(JSON.stringify({ error: 'Invalid company name' }), { status: 400 });
}
```

---

### 7. returnTo Parameter Open Redirect Risk
**File:** `pages/AuthPage.tsx`

```typescript
const returnTo = params.get('returnTo');
// Only partial validation
const redirectPath = returnTo && returnTo.startsWith('/') ? returnTo : '/app';
navigate(redirectPath);
```

**Risk:** While paths must start with `/`, protocol-relative URLs like `//evil.com` could bypass this.

**Remediation:**
```typescript
const isValidReturnPath = (path: string) => {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes(':');
};
const redirectPath = returnTo && isValidReturnPath(returnTo) ? returnTo : '/app';
```

---

### 8. Invitation Token Exposure in Frontend
**File:** `components/settings/UsersSettings.tsx`

```typescript
// Token is stored in state and available in DOM
const [copiedToken, setCopiedToken] = useState<string | null>(null);
const copyInviteLink = (token: string) => {
  const link = `${window.location.origin}/auth?invite=${token}`;
```

**Risk:** Invitation tokens visible in React DevTools and potentially in browser history.

**Recommendation:** This is acceptable for invite links, but consider:
- Adding token expiration checks before displaying
- Rate limiting invitation creation

---

## 🟢 Low Severity Issues

### 9. Console Error Logging May Leak Sensitive Data
**Multiple files** log full error objects:
```typescript
console.error('[useSupabaseSettings] Error details:', {
  message: err?.message,
  code: err?.code,
  details: err?.details,  // Could contain sensitive info
  hint: err?.hint,
  companyId,
  settingsRowId,
});
```

**Recommendation:** In production, use structured logging that filters sensitive data.

---

### 10. innerHTML Usage (Minor XSS Vector)
**File:** `components/ai-cfo/CFOChatFAB.tsx`

```typescript
(e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-lg font-bold">CM</span>';
```

**Risk:** Low - hardcoded string, no user input. However, innerHTML should be avoided.

**Remediation:** Use React state to conditionally render the fallback.

---

### 11. Password Requirements Could Be Stronger
**File:** `pages/AuthPage.tsx`

```typescript
minLength={6}
```

**Recommendation:** Consider enforcing stronger passwords:
- Minimum 8 characters
- Mix of character types
- Enable Supabase "Block Leaked Passwords" in Dashboard

---

### 12. AI Data Sharing Default Behavior
**File:** `lib/ai/contextBuilder.ts`

```typescript
// Financial totals shared by default
if (dataSharing?.includeJobFinancialTotals !== false) {
```

**Current behavior:** Data sharing is opt-out, not opt-in.

**Recommendation:** Consider making this opt-in for better privacy defaults.

---

## ✅ Security Strengths

### Row Level Security (RLS) - EXCELLENT
All tables have RLS enabled with proper company-based isolation:
- `companies` - Owner and profile-based access
- `jobs` - Company-scoped with proper predicates
- `settings` - Company-scoped
- `invitations` - Owner-only with role check
- `audit_log` - Read-only for company members
- `subscriptions` - User-scoped

### Authentication Patterns - GOOD
- Proper JWT verification in edge functions
- Auth context properly manages session state
- Invitation system uses secure random tokens

### Stripe Integration - GOOD
- Webhook signature verification implemented
- Customer metadata links to Supabase user IDs
- No sensitive keys in frontend code

### Data Privacy Controls - GOOD
- AI data sharing respects user settings
- Client identifiers optional
- Cost breakdown requires explicit opt-in

---

## Recommended Actions

### Immediate (Before Production)
1. ✅ Fix CORS configuration on all edge functions
2. ✅ Add authentication to email functions
3. ✅ Secure weekly-snapshots endpoint
4. ✅ Replace xlsx package

### Short-term (Next Sprint)
1. Fix function search_path issues
2. Add input validation to form handlers
3. Improve returnTo validation
4. Enable leaked password protection in Supabase Dashboard

### Long-term (Ongoing)
1. Implement rate limiting on all endpoints
2. Add CSRF tokens for state-changing operations
3. Set up security monitoring/alerting
4. Regular dependency audits

---

## Testing Recommendations

### Penetration Testing Scope
1. **Authentication flows** - Test password reset, session handling
2. **Authorization** - Verify RLS policies with different user roles
3. **Input validation** - Fuzz all form inputs
4. **API security** - Test edge functions with malformed requests

### Tools to Use
- **Supabase Dashboard** → Security Advisor (run regularly)
- **npm audit** → Run in CI/CD
- **OWASP ZAP** → DAST scanning
- **Snyk** → Comprehensive dependency scanning

---

*This report was generated through automated code review. Manual penetration testing is recommended before production deployment.*

