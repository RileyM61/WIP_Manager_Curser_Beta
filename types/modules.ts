/**
 * Module System Configuration
 * 
 * Defines all available modules in the AI CFO Suite platform,
 * subscription tiers, and access control mappings.
 */

// Subscription tiers from basic to full suite
export type SubscriptionTier = 'trial' | 'starter' | 'professional' | 'enterprise' | 'cfo-suite';

// All module identifiers
export type ModuleId = 
  | 'wip'           // WIP Manager (core) - Always available
  | 'forecasting'   // Cash Flow Forecasting
  | 'capacity'      // Labor Capacity Planning (detailed)
  | 'jcurve'        // J-Curve Investment Analysis
  | 'ar'            // Accounts Receivable / Collections
  | 'budget'        // Budget vs Actual Analysis
  | 'covenant'      // Banking & Covenant Compliance
  | 'profitability' // Profitability Analytics
  | 'bidnobid'      // Bid/No-Bid Decision Tool
  | 'scenarios'     // Scenario Planning / What-If Analysis
  | 'reporting'     // Financial Statements & Reporting
  | 'discovery';    // Executive Discovery / Interviews

// Configuration for each module
export interface ModuleConfig {
  id: ModuleId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  requiredTier: SubscriptionTier;
  comingSoon: boolean;
  routes: string[];
}

// Full module definitions
export const MODULES: Record<ModuleId, ModuleConfig> = {
  wip: {
    id: 'wip',
    name: 'WIP Manager',
    shortName: 'WIP',
    description: 'Work-in-Progress tracking, job management, Gantt scheduling, and backlog forecasting',
    icon: '📊',
    requiredTier: 'starter',
    comingSoon: false,
    routes: ['jobs', 'gantt', 'backlog', 'company'],
  },
  forecasting: {
    id: 'forecasting',
    name: 'Cash Flow Forecasting',
    shortName: 'Forecasting',
    description: 'Project cash flow and financial projections based on your WIP data',
    icon: '📈',
    requiredTier: 'professional',
    comingSoon: true,
    routes: ['cashflow', 'projections', 'cash-scenarios'],
  },
  capacity: {
    id: 'capacity',
    name: 'Labor Capacity Planning',
    shortName: 'Capacity',
    description: 'Employee roster, loaded costs, department allocation, and cost projections',
    icon: '👷',
    requiredTier: 'professional',
    comingSoon: false,
    routes: ['dashboard', 'employees', 'departments'],
  },
  budget: {
    id: 'budget',
    name: 'Budget vs Actual',
    shortName: 'Budget',
    description: 'Track variances between budgeted and actual costs with trend alerts',
    icon: '📋',
    requiredTier: 'professional',
    comingSoon: true,
    routes: ['variance', 'trends', 'cost-codes'],
  },
  jcurve: {
    id: 'jcurve',
    name: 'J-Curve Investment Analysis',
    shortName: 'J-Curve',
    description: 'Investment decisioning with J-Curve modeling and ROI projections',
    icon: '💰',
    requiredTier: 'enterprise',
    comingSoon: true,
    routes: ['jcurve', 'investment-modeling'],
  },
  ar: {
    id: 'ar',
    name: 'AR & Collections',
    shortName: 'AR',
    description: 'Accounts receivable aging, collection probability scoring, and cash timing',
    icon: '💵',
    requiredTier: 'enterprise',
    comingSoon: true,
    routes: ['aging', 'collections', 'payment-patterns'],
  },
  covenant: {
    id: 'covenant',
    name: 'Covenant Compliance',
    shortName: 'Covenants',
    description: 'Bank covenant tracking, bonding capacity, and compliance projections',
    icon: '🏦',
    requiredTier: 'enterprise',
    comingSoon: true,
    routes: ['covenants', 'bonding', 'credit-lines'],
  },
  profitability: {
    id: 'profitability',
    name: 'Profitability Analytics',
    shortName: 'Profitability',
    description: 'Job, client, and PM profitability analysis with overhead allocation',
    icon: '📊',
    requiredTier: 'enterprise',
    comingSoon: true,
    routes: ['job-profit', 'client-profit', 'pm-performance'],
  },
  bidnobid: {
    id: 'bidnobid',
    name: 'Bid/No-Bid Decisions',
    shortName: 'Bid Analysis',
    description: 'Opportunity scoring, win probability, and portfolio balance analysis',
    icon: '🎯',
    requiredTier: 'cfo-suite',
    comingSoon: true,
    routes: ['opportunities', 'scoring', 'portfolio'],
  },
  scenarios: {
    id: 'scenarios',
    name: 'Scenario Planning',
    shortName: 'Scenarios',
    description: 'What-if analysis, stress testing, and Monte Carlo simulations',
    icon: '🔮',
    requiredTier: 'cfo-suite',
    comingSoon: true,
    routes: ['what-if', 'stress-test', 'simulations'],
  },
  reporting: {
    id: 'reporting',
    name: 'Financial Reporting',
    shortName: 'Reports',
    description: 'WIP-adjusted financials, management reports, and KPI scorecards',
    icon: '📑',
    requiredTier: 'cfo-suite',
    comingSoon: true,
    routes: ['financials', 'management-reports', 'kpis'],
  },
  discovery: {
    id: 'discovery',
    name: 'Executive Discovery',
    shortName: 'Discovery',
    description: 'Structured interviews with leadership team, AI analysis, and strategic recommendations',
    icon: '🎯',
    requiredTier: 'cfo-suite',
    comingSoon: false,
    routes: ['engagements', 'interviews', 'analysis'],
  },
};

// Which modules are included in each tier
export const TIER_MODULES: Record<SubscriptionTier, ModuleId[]> = {
  trial: ['wip'],
  starter: ['wip'],
  professional: ['wip', 'forecasting', 'capacity', 'budget'],
  enterprise: ['wip', 'forecasting', 'capacity', 'budget', 'jcurve', 'ar', 'covenant', 'profitability'],
  'cfo-suite': ['wip', 'forecasting', 'capacity', 'budget', 'jcurve', 'ar', 'covenant', 'profitability', 'bidnobid', 'scenarios', 'reporting', 'discovery'],
};

// Human-readable tier names for UI
export const TIER_NAMES: Record<SubscriptionTier, string> = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  'cfo-suite': 'CFO Suite',
};

// Tier pricing (for display purposes - actual billing handled by payment provider)
export const TIER_PRICING: Record<SubscriptionTier, { monthly: number; annual: number }> = {
  trial: { monthly: 0, annual: 0 },
  starter: { monthly: 49, annual: 490 },
  professional: { monthly: 149, annual: 1490 },
  enterprise: { monthly: 299, annual: 2990 },
  'cfo-suite': { monthly: 499, annual: 4990 },
};

// Helper to get all module IDs
export const ALL_MODULE_IDS: ModuleId[] = Object.keys(MODULES) as ModuleId[];

// Helper to check if a module is available in a tier
export const isModuleInTier = (moduleId: ModuleId, tier: SubscriptionTier): boolean => {
  return TIER_MODULES[tier]?.includes(moduleId) ?? false;
};

// Helper to get the minimum tier required for a module
export const getMinimumTierForModule = (moduleId: ModuleId): SubscriptionTier => {
  return MODULES[moduleId]?.requiredTier ?? 'cfo-suite';
};

