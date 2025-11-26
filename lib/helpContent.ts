/**
 * Centralized help content for tooltips and glossary
 * Each entry has:
 * - short: Quick 1-2 sentence explanation (shown on hover)
 * - detailed: Full explanation (shown in slide panel)
 * - formula: Optional calculation formula
 * - example: Optional real-world example
 */

export interface HelpContent {
  title: string;
  short: string;
  detailed: string;
  formula?: string;
  example?: string;
  category: 'basics' | 'financials' | 'billing' | 'metrics' | 'settings';
}

export const helpContent: Record<string, HelpContent> = {
  // ============================================
  // JOB BASICS
  // ============================================
  jobType: {
    title: 'Job Type',
    short: 'Fixed Price jobs have a set contract amount. T&M (Time & Material) jobs bill based on actual costs plus markup.',
    detailed: 'Choose the billing structure for this job:\n\n• Fixed Price: You agreed on a total contract amount upfront. Revenue is earned as you complete work, based on the percentage of budget consumed.\n\n• Time & Material (T&M): You bill the client based on actual costs incurred, plus a markup percentage. There\'s no fixed contract - you earn revenue as you spend.',
    example: 'Fixed Price: "Build a warehouse for $500,000"\nT&M: "Provide maintenance services at cost + 50% markup"',
    category: 'basics',
  },

  status: {
    title: 'Job Status',
    short: 'The current stage of the job: Future (not started), Active (in progress), On Hold, Completed, or Archived.',
    detailed: '• Future: Job is in the pipeline but work hasn\'t started yet. Good for tracking upcoming work.\n\n• Active: Work is currently in progress. These jobs are your focus for billing and cost tracking.\n\n• On Hold: Work has paused temporarily. The app tracks how long jobs have been on hold.\n\n• Completed: All work is done. Keep these for historical analysis.\n\n• Archived: Old jobs you want to hide from regular views but keep for records.',
    category: 'basics',
  },

  // ============================================
  // CONTRACT & BUDGET
  // ============================================
  contract: {
    title: 'Contract Amount',
    short: 'The total amount the client will pay you for this job, broken down by Labor, Material, and Other costs.',
    detailed: 'The contract is your revenue target - what you\'ll bill the client when the job is complete. Breaking it into Labor, Material, and Other helps track which parts of the job are most profitable.\n\nFor T&M jobs, this field isn\'t used since revenue is calculated from costs + markup.',
    example: 'Contract: $100,000\n• Labor: $60,000 (60%)\n• Material: $30,000 (30%)\n• Other: $10,000 (10%)',
    category: 'financials',
  },

  budget: {
    title: 'Cost Budget',
    short: 'Your estimated costs to complete the job. This is what you expect to spend, not what you\'ll charge.',
    detailed: 'The budget represents your cost estimate when the job was sold. It\'s used to:\n\n1. Calculate original profit margin (Contract - Budget)\n2. Measure % Complete (Costs ÷ Budget)\n3. Track budget variances\n\nKeep this as your original estimate - don\'t change it as the job progresses. Use Cost to Complete for updated forecasts.',
    formula: 'Original Profit = Contract - Budget',
    example: 'Budget: $80,000\nContract: $100,000\nOriginal Profit: $20,000 (20% margin)',
    category: 'financials',
  },

  costsToDate: {
    title: 'Costs to Date',
    short: 'Actual costs you\'ve incurred so far on this job - what you\'ve already spent.',
    detailed: 'This is your actual spending to date, pulled from your accounting system or entered manually. It includes:\n\n• Labor: Wages, burden, subcontractor labor\n• Material: Raw materials, supplies, equipment\n• Other: Permits, insurance, misc expenses\n\nCosts to Date is used to calculate % Complete and Earned Revenue.',
    category: 'financials',
  },

  costToComplete: {
    title: 'Cost to Complete',
    short: 'Your current estimate of remaining costs to finish the job. Update this regularly for accurate forecasting.',
    detailed: 'This is your forward-looking estimate - how much more you expect to spend to finish the job. Unlike Budget (which is fixed), Cost to Complete should be updated as you learn more about the job.\n\nForecasted Total Cost = Costs to Date + Cost to Complete\n\nIf this exceeds your original Budget, you\'re trending over budget.',
    formula: 'Forecasted Budget = Costs to Date + Cost to Complete',
    example: 'Original Budget: $80,000\nCosts to Date: $50,000\nCost to Complete: $40,000\nForecasted Budget: $90,000 (Over budget by $10,000)',
    category: 'financials',
  },

  // ============================================
  // BILLING & INVOICING
  // ============================================
  invoiced: {
    title: 'Invoiced to Date',
    short: 'Total amount you\'ve billed the client so far. Compare this to Earned Revenue to see if you\'re over or under billed.',
    detailed: 'This is the cumulative amount you\'ve invoiced (billed) the client. It should track closely with Earned Revenue to maintain healthy cash flow.\n\n• If Invoiced > Earned: You\'re over-billed (collected ahead of work)\n• If Invoiced < Earned: You\'re under-billed (need to invoice more)',
    category: 'billing',
  },

  earnedRevenue: {
    title: 'Earned Revenue',
    short: 'The portion of the contract you\'ve "earned" based on work completed. This is what you should have billed.',
    detailed: 'Earned Revenue represents how much of the contract value you\'ve earned through completed work. It\'s calculated differently for each job type:\n\nFixed Price: Each cost category (Labor, Material, Other) is calculated separately:\n• Labor Earned = Contract Labor × (Labor Cost ÷ Labor Budget)\n• Material Earned = Contract Material × (Material Cost ÷ Material Budget)\n• Total Earned = Sum of all components\n\nT&M: Earned = Costs × Markup',
    formula: 'Fixed Price: Earned = Contract × (Costs ÷ Budget)\nT&M: Earned = Costs × (1 + Markup%)',
    example: 'Contract: $100,000\nBudget: $80,000\nCosts to Date: $40,000\n% Complete: 50%\nEarned Revenue: $50,000',
    category: 'billing',
  },

  overUnderBilled: {
    title: 'Over/Under Billed',
    short: 'The difference between what you\'ve invoiced and what you\'ve earned. Positive = over-billed, Negative = under-billed.',
    detailed: 'This metric shows your billing position:\n\n• Over-Billed (positive): You\'ve collected more than you\'ve earned. Good for cash flow, but don\'t get too far ahead.\n\n• Under-Billed (negative): You\'ve done more work than you\'ve billed for. You\'re financing the client - invoice promptly!\n\nMost companies aim to be slightly over-billed to maintain positive cash flow.',
    formula: 'Over/Under = Invoiced - Earned Revenue',
    example: 'Earned Revenue: $50,000\nInvoiced: $45,000\nUnder-Billed: $5,000 (need to invoice $5K more)',
    category: 'billing',
  },

  // ============================================
  // PROFIT METRICS
  // ============================================
  originalProfit: {
    title: 'Original Profit',
    short: 'The profit you expected when the job was estimated: Contract minus original Budget.',
    detailed: 'Original Profit is your baseline - what you expected to make when you bid the job. It\'s calculated from your original estimates and shouldn\'t change as the job progresses.\n\nCompare this to Forecasted Profit to see if the job is trending better or worse than expected.',
    formula: 'Original Profit = Contract - Original Budget',
    category: 'metrics',
  },

  forecastedProfit: {
    title: 'Forecasted Profit',
    short: 'Your current profit projection based on actual costs and remaining estimates.',
    detailed: 'Forecasted Profit is your updated profit expectation based on:\n• Actual costs incurred so far\n• Your current Cost to Complete estimate\n\nThis tells you what profit you\'ll actually make if your current estimates hold. Compare to Original Profit to see the variance.',
    formula: 'Forecasted Profit = Contract - (Costs to Date + Cost to Complete)',
    example: 'Contract: $100,000\nCosts to Date: $50,000\nCost to Complete: $40,000\nForecasted Profit: $10,000',
    category: 'metrics',
  },

  profitMargin: {
    title: 'Profit Margin',
    short: 'Profit as a percentage of revenue. Higher is better - it shows how much of each dollar you keep.',
    detailed: 'Profit Margin shows profitability as a percentage, making it easy to compare jobs of different sizes.\n\n• 20%+ margin: Healthy job\n• 10-20% margin: Acceptable\n• <10% margin: Tight - watch closely\n• Negative: Losing money',
    formula: 'Margin % = (Profit ÷ Contract) × 100',
    example: 'Contract: $100,000\nProfit: $15,000\nMargin: 15%',
    category: 'metrics',
  },

  profitVariance: {
    title: 'Profit Variance',
    short: 'The difference between forecasted and original profit. Negative means you\'re trending worse than expected.',
    detailed: 'Profit Variance shows how the job is performing vs. your original estimate:\n\n• Positive variance: Making more than expected 🎉\n• Zero variance: Right on track\n• Negative variance: Making less than expected ⚠️\n\nThis is a key metric for identifying problem jobs early.',
    formula: 'Variance = Forecasted Profit - Original Profit',
    example: 'Original Profit: $20,000\nForecasted Profit: $15,000\nVariance: -$5,000 (worse than expected)',
    category: 'metrics',
  },

  percentComplete: {
    title: '% Complete',
    short: 'How much of the job is done, measured by costs incurred vs. budget. Used to calculate earned revenue.',
    detailed: 'Percent Complete measures progress based on the cost-to-cost method - a standard in construction accounting.\n\nEach cost category is calculated separately:\n• Labor % = Labor Costs ÷ Labor Budget\n• Material % = Material Costs ÷ Material Budget\n• Other % = Other Costs ÷ Other Budget\n\nThis drives Earned Revenue calculations.',
    formula: '% Complete = (Costs to Date ÷ Original Budget) × 100',
    example: 'Labor Budget: $50,000\nLabor Costs: $40,000\nLabor % Complete: 80%',
    category: 'metrics',
  },

  // ============================================
  // COMPANY VIEW METRICS
  // ============================================
  backlog: {
    title: 'Backlog',
    short: 'Total revenue remaining to be earned across all jobs. This is your "work on the books."',
    detailed: 'Backlog represents the total value of work you have contracted but haven\'t yet completed. It\'s calculated as:\n\nBacklog = Sum of (Contract - Earned Revenue) for all jobs\n\nA healthy backlog means you have work in the pipeline. Track this weekly to spot trends.',
    formula: 'Backlog = Σ (Contract - Earned Revenue)',
    category: 'metrics',
  },

  netBillingStatus: {
    title: 'Net Billing Status',
    short: 'Company-wide over/under billing position. Positive means you\'ve collected more than earned overall.',
    detailed: 'This aggregates the over/under billing status across all your jobs to show your company\'s overall billing position.\n\n• Net Over-Billed: Healthy cash position - you\'ve collected ahead of work\n• Net Under-Billed: Cash flow risk - you\'re financing clients\n\nAim to stay slightly over-billed for healthy cash flow.',
    category: 'billing',
  },

  // ============================================
  // T&M SPECIFIC
  // ============================================
  laborBillingType: {
    title: 'Labor Billing Method',
    short: 'How to calculate billable labor: Fixed hourly rate or markup on actual labor costs.',
    detailed: 'Choose how to bill labor for T&M jobs:\n\n• Fixed Rate: Bill a set $/hour regardless of your actual cost. Good when you have standard billing rates.\n\n• Markup: Bill your actual labor cost plus a percentage markup. Better when costs vary by employee.',
    example: 'Fixed Rate: Bill $85/hr for all labor\nMarkup: Cost $50/hr × 1.5 = Bill $75/hr',
    category: 'settings',
  },

  laborMarkup: {
    title: 'Labor Markup',
    short: 'Percentage added to labor costs for billing. 50% markup means billing 1.5× your cost.',
    detailed: 'The markup percentage applied to your labor costs to determine billing amount.\n\nCommon markups:\n• 40-60%: Typical for skilled trades\n• 25-40%: Competitive markets\n• 60-100%: Specialized/emergency work',
    formula: 'Billable Labor = Labor Cost × (1 + Markup%)',
    example: 'Labor Cost: $1,000\nMarkup: 50%\nBillable: $1,000 × 1.5 = $1,500',
    category: 'settings',
  },

  materialMarkup: {
    title: 'Material Markup',
    short: 'Percentage added to material costs for billing. Typically lower than labor markup.',
    detailed: 'The markup applied to materials and supplies. Usually lower than labor because:\n• Materials are pass-through costs\n• Clients can verify material prices\n• Competition is higher on materials\n\nTypical range: 10-25%',
    formula: 'Billable Materials = Material Cost × (1 + Markup%)',
    category: 'settings',
  },
};

/**
 * Get all help content for a specific category
 */
export const getHelpByCategory = (category: HelpContent['category']): Record<string, HelpContent> => {
  return Object.fromEntries(
    Object.entries(helpContent).filter(([_, content]) => content.category === category)
  );
};

/**
 * Get glossary entries sorted alphabetically by title
 */
export const getGlossaryEntries = (): Array<{ key: string } & HelpContent> => {
  return Object.entries(helpContent)
    .map(([key, content]) => ({ key, ...content }))
    .sort((a, b) => a.title.localeCompare(b.title));
};

