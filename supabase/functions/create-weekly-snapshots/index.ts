// Supabase Edge Function to create weekly job financial snapshots
// Can be triggered via cron job (with CRON_SECRET) or manual invocation (with user auth)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secret for cron job authentication - set this in Supabase Dashboard > Edge Functions > Secrets
const CRON_SECRET = Deno.env.get('CRON_SECRET');

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

interface Job {
    id: string;
    company_id: string;
    job_no: string;
    job_name: string;
    status: string;
    contract_labor: number;
    contract_material: number;
    contract_other: number;
    budget_labor: number;
    budget_material: number;
    budget_other: number;
    cost_labor: number;
    cost_material: number;
    cost_other: number;
    invoiced_labor: number;
    invoiced_material: number;
    invoiced_other: number;
    cost_to_complete_labor: number;
    cost_to_complete_material: number;
    cost_to_complete_other: number;
    target_profit?: number;
    target_margin?: number;
    end_date?: string;
    target_end_date?: string;
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Parse request body for optional company filter and cron secret
        let targetCompanyId: string | null = null;
        let providedCronSecret: string | null = null;
        try {
            const body = await req.json();
            targetCompanyId = body.companyId || null;
            providedCronSecret = body.cronSecret || null;
        } catch {
            // No body or invalid JSON - will require auth
        }

        // ============================================================================
        // AUTHORIZATION
        // ============================================================================
        // Two modes of operation:
        // 1. Cron job mode: No companyId, requires CRON_SECRET - processes all companies
        // 2. Manual mode: Has companyId, requires user auth - processes only user's company
        
        const authHeader = req.headers.get("Authorization");
        let authorizedCompanyId: string | null = null;

        if (!targetCompanyId) {
            // Mode 1: Processing all companies - requires cron secret
            if (!CRON_SECRET) {
                return new Response(
                    JSON.stringify({ success: false, error: 'CRON_SECRET not configured on server' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            if (providedCronSecret !== CRON_SECRET) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Invalid or missing cron secret' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            // Cron job is authorized to process all companies
            authorizedCompanyId = null;
        } else {
            // Mode 2: Processing specific company - requires user auth
            if (!authHeader) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Missing authorization header' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Create user-scoped client to verify auth
            const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: authHeader } },
            });

            // Verify the user is authenticated
            const { data: { user }, error: authError } = await userSupabase.auth.getUser();
            if (authError || !user) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Invalid authentication' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Verify user has access to the target company
            const { data: profile, error: profileError } = await userSupabase
                .from('profiles')
                .select('company_id, role')
                .eq('user_id', user.id)
                .single();

            if (profileError || !profile) {
                return new Response(
                    JSON.stringify({ success: false, error: 'User profile not found' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Only allow users to create snapshots for their own company
            // or if they're an owner role (could be managing multiple companies)
            if (profile.company_id !== targetCompanyId) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Not authorized for this company' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            authorizedCompanyId = targetCompanyId;
        }

        // ============================================================================
        // CREATE SNAPSHOTS (using service role for admin access to all data)
        // ============================================================================
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        });

        // Query active jobs - filtered by authorized company if in manual mode
        let query = supabase
            .from('jobs')
            .select('*')
            .eq('status', 'Active');

        if (authorizedCompanyId) {
            query = query.eq('company_id', authorizedCompanyId);
        }

        const { data: jobs, error: jobsError } = await query;

        if (jobsError) {
            throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
        }

        if (!jobs || jobs.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: 'No active jobs found', count: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const snapshotDate = new Date().toISOString();
        const snapshots: any[] = [];
        const errors: string[] = [];

        for (const job of jobs as Job[]) {
            try {
                // Calculate financial metrics
                const contractTotal = (job.contract_labor || 0) + (job.contract_material || 0) + (job.contract_other || 0);
                const budgetTotal = (job.budget_labor || 0) + (job.budget_material || 0) + (job.budget_other || 0);
                const costsTotal = (job.cost_labor || 0) + (job.cost_material || 0) + (job.cost_other || 0);
                const invoicedTotal = (job.invoiced_labor || 0) + (job.invoiced_material || 0) + (job.invoiced_other || 0);
                const costToCompleteTotal = (job.cost_to_complete_labor || 0) + (job.cost_to_complete_material || 0) + (job.cost_to_complete_other || 0);

                // Calculate earned revenue (percent complete * contract)
                const percentComplete = budgetTotal > 0 ? costsTotal / budgetTotal : 0;
                const earnedRevenue = contractTotal * Math.min(percentComplete, 1);

                // Forecasted values
                const forecastedCost = costsTotal + costToCompleteTotal;
                const forecastedRevenue = contractTotal;
                const forecastedProfit = forecastedRevenue - forecastedCost;
                const forecastedMargin = forecastedRevenue > 0 ? forecastedProfit / forecastedRevenue : 0;

                // Original targets
                const originalProfit = job.target_profit ?? (contractTotal - budgetTotal);
                const originalMargin = job.target_margin ?? (contractTotal > 0 ? originalProfit / contractTotal : 0);

                // Billing position
                const billingPosition = invoicedTotal - earnedRevenue;
                let billingLabel: string;
                if (billingPosition > 100) { // $100 threshold
                    billingLabel = 'over-billed';
                } else if (billingPosition < -100) {
                    billingLabel = 'under-billed';
                } else {
                    billingLabel = 'on-track';
                }

                // Health flags
                const atRiskMargin = forecastedMargin < (originalMargin * 0.8);
                const behindSchedule = job.end_date && job.target_end_date && job.end_date > job.target_end_date;

                snapshots.push({
                    company_id: job.company_id,
                    job_id: job.id,
                    snapshot_date: snapshotDate,
                    contract_amount: contractTotal,
                    original_budget_total: budgetTotal,
                    original_profit_target: originalProfit,
                    original_margin_target: originalMargin,
                    earned_to_date: earnedRevenue,
                    invoiced_to_date: invoicedTotal,
                    cost_labor_to_date: job.cost_labor || 0,
                    cost_material_to_date: job.cost_material || 0,
                    cost_other_to_date: job.cost_other || 0,
                    total_cost_to_date: costsTotal,
                    forecasted_cost_final: forecastedCost,
                    forecasted_revenue_final: forecastedRevenue,
                    forecasted_profit_final: forecastedProfit,
                    forecasted_margin_final: forecastedMargin,
                    billing_position_numeric: billingPosition,
                    billing_position_label: billingLabel,
                    at_risk_margin: atRiskMargin,
                    behind_schedule: behindSchedule || false,
                });
            } catch (err: any) {
                errors.push(`Job ${job.job_no}: ${err.message}`);
            }
        }

        // Insert all snapshots
        if (snapshots.length > 0) {
            const { error: insertError } = await supabase
                .from('job_financial_snapshots')
                .insert(snapshots);

            if (insertError) {
                throw new Error(`Failed to insert snapshots: ${insertError.message}`);
            }
        }

        console.log(`Created ${snapshots.length} snapshots for ${authorizedCompanyId || 'all companies'}`);

        return new Response(
            JSON.stringify({
                success: true,
                count: snapshots.length,
                errors: errors.length > 0 ? errors : undefined,
                message: `Created ${snapshots.length} snapshot(s) at ${snapshotDate}`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error creating snapshots:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
