/**
 * Value Driver Questionnaire for Construction Companies
 * Based on market research of construction valuation multiples
 */

export type ValueDriverCategory = 
  | 'financial'
  | 'ownerDependency'
  | 'revenuePredictability'
  | 'marketPosition'
  | 'operationalSystems'
  | 'customerConcentration'
  | 'projectPortfolio'
  | 'managementDepth'
  | 'cashFlow'
  | 'safetyCompliance';

export interface Question {
  id: string;
  category: ValueDriverCategory;
  question: string;
  options: {
    value: number; // Score from -2 to +2
    label: string;
    description?: string;
  }[];
  weight: number; // How much this question affects the multiple (0-1)
  tooltip?: string;
}

export interface QuestionnaireAnswers {
  [questionId: string]: number; // Selected option value
}

export interface ValueDriverScore {
  category: ValueDriverCategory;
  score: number; // -2 to +2
  weight: number;
  impact: number; // Calculated impact on multiple
}

// Category weights (how much each category affects the multiple)
export const CATEGORY_WEIGHTS: Record<ValueDriverCategory, number> = {
  financial: 0.20,              // 20% - Most important
  ownerDependency: 0.15,        // 15% - Critical for transferability
  revenuePredictability: 0.15,  // 15% - Predictability = value
  marketPosition: 0.12,          // 12% - Competitive advantage
  operationalSystems: 0.10,     // 10% - Scalability
  customerConcentration: 0.08,  // 8% - Risk factor
  projectPortfolio: 0.08,       // 8% - Diversification
  managementDepth: 0.06,        // 6% - Succession
  cashFlow: 0.04,               // 4% - Working capital
  safetyCompliance: 0.02,       // 2% - Risk mitigation
};

// Questions for each category
export const VALUE_DRIVER_QUESTIONS: Question[] = [
  // FINANCIAL PERFORMANCE
  {
    id: 'financial_margin',
    category: 'financial',
    question: 'What is your average EBITDA margin over the last 3 years?',
    options: [
      { value: -1, label: 'Less than 5%', description: 'Below industry average' },
      { value: 0, label: '5-10%', description: 'Industry average' },
      { value: 1, label: '10-15%', description: 'Above average' },
      { value: 2, label: '15%+', description: 'Exceptional margins' },
    ],
    weight: 0.3,
    tooltip: 'Higher margins indicate better pricing power and operational efficiency',
  },
  {
    id: 'financial_growth',
    category: 'financial',
    question: 'What has been your revenue growth rate over the last 3 years?',
    options: [
      { value: -2, label: 'Declining', description: 'Revenue decreasing' },
      { value: -1, label: 'Flat (0-5%)', description: 'Stable but not growing' },
      { value: 0, label: 'Moderate (5-15%)', description: 'Steady growth' },
      { value: 1, label: 'Strong (15-30%)', description: 'Rapid growth' },
      { value: 2, label: 'Exceptional (30%+)', description: 'Hypergrowth' },
    ],
    weight: 0.25,
  },
  {
    id: 'financial_records',
    category: 'financial',
    question: 'How would you describe your financial record-keeping?',
    options: [
      { value: -1, label: 'Basic/Informal', description: 'Spreadsheets, minimal documentation' },
      { value: 0, label: 'Standard', description: 'Accounting software, regular reports' },
      { value: 1, label: 'Professional', description: 'Audited, detailed financials, KPIs' },
      { value: 2, label: 'Enterprise-grade', description: 'Real-time dashboards, sophisticated reporting' },
    ],
    weight: 0.15,
  },
  {
    id: 'financial_consistency',
    category: 'financial',
    question: 'How consistent is your profitability year-over-year?',
    options: [
      { value: -1, label: 'Highly volatile', description: 'Large swings in profit' },
      { value: 0, label: 'Some variation', description: 'Moderate fluctuations' },
      { value: 1, label: 'Relatively stable', description: 'Consistent margins' },
      { value: 2, label: 'Very predictable', description: 'Steady, growing profits' },
    ],
    weight: 0.3,
  },

  // OWNER DEPENDENCY (Switzerland Factor)
  {
    id: 'owner_involvement',
    category: 'ownerDependency',
    question: 'How involved are you in day-to-day operations?',
    options: [
      { value: -2, label: 'Hands-on daily', description: 'You make most decisions' },
      { value: -1, label: 'Very involved', description: 'You oversee most activities' },
      { value: 0, label: 'Moderately involved', description: 'You manage key areas' },
      { value: 1, label: 'Strategic only', description: 'You focus on big picture' },
      { value: 2, label: 'Minimal involvement', description: 'Business runs without you' },
    ],
    weight: 0.3,
    tooltip: 'Lower owner dependency increases transferability and value',
  },
  {
    id: 'management_team',
    category: 'ownerDependency',
    question: 'Do you have a management team that can run the business without you?',
    options: [
      { value: -2, label: 'No management team', description: 'You do everything' },
      { value: -1, label: 'Weak team', description: 'Team exists but needs oversight' },
      { value: 0, label: 'Capable team', description: 'Team can handle most operations' },
      { value: 1, label: 'Strong team', description: 'Team is highly capable' },
      { value: 2, label: 'Autonomous team', description: 'Team runs business independently' },
    ],
    weight: 0.4,
  },
  {
    id: 'documented_processes',
    category: 'ownerDependency',
    question: 'How well documented are your key business processes?',
    options: [
      { value: -1, label: 'Not documented', description: 'Everything is in your head' },
      { value: 0, label: 'Partially documented', description: 'Some processes written down' },
      { value: 1, label: 'Well documented', description: 'Most processes documented' },
      { value: 2, label: 'Fully documented', description: 'Complete SOPs, training materials' },
    ],
    weight: 0.3,
  },

  // REVENUE PREDICTABILITY
  {
    id: 'recurring_revenue',
    category: 'revenuePredictability',
    question: 'What percentage of revenue comes from repeat clients or long-term contracts?',
    options: [
      { value: -1, label: 'Less than 20%', description: 'Mostly one-time projects' },
      { value: 0, label: '20-40%', description: 'Some repeat business' },
      { value: 1, label: '40-60%', description: 'Good repeat client base' },
      { value: 2, label: '60%+', description: 'Strong recurring revenue' },
    ],
    weight: 0.3,
  },
  {
    id: 'backlog_visibility',
    category: 'revenuePredictability',
    question: 'How far in advance can you see your revenue pipeline?',
    options: [
      { value: -1, label: 'Less than 3 months', description: 'Short-term visibility' },
      { value: 0, label: '3-6 months', description: 'Moderate visibility' },
      { value: 1, label: '6-12 months', description: 'Good visibility' },
      { value: 2, label: '12+ months', description: 'Excellent visibility' },
    ],
    weight: 0.25,
  },
  {
    id: 'contract_types',
    category: 'revenuePredictability',
    question: 'What percentage of projects are fixed-price vs. cost-plus?',
    options: [
      { value: -1, label: 'Mostly cost-plus', description: 'Less predictable margins' },
      { value: 0, label: 'Mixed', description: 'Balance of both' },
      { value: 1, label: 'Mostly fixed-price', description: 'More predictable margins' },
      { value: 2, label: 'All fixed-price', description: 'Maximum predictability' },
    ],
    weight: 0.2,
  },
  {
    id: 'seasonality',
    category: 'revenuePredictability',
    question: 'How seasonal is your business?',
    options: [
      { value: -1, label: 'Highly seasonal', description: 'Large seasonal swings' },
      { value: 0, label: 'Some seasonality', description: 'Moderate variations' },
      { value: 1, label: 'Minimal seasonality', description: 'Relatively steady' },
      { value: 2, label: 'No seasonality', description: 'Year-round consistent' },
    ],
    weight: 0.25,
  },

  // MARKET POSITION
  {
    id: 'competitive_advantage',
    category: 'marketPosition',
    question: 'What is your primary competitive advantage?',
    options: [
      { value: -1, label: 'Price only', description: 'Competing on price' },
      { value: 0, label: 'Quality/service', description: 'Standard differentiation' },
      { value: 1, label: 'Specialized expertise', description: 'Unique capabilities' },
      { value: 2, label: 'Market leader', description: 'Dominant position' },
    ],
    weight: 0.3,
  },
  {
    id: 'brand_recognition',
    category: 'marketPosition',
    question: 'How strong is your brand recognition in your market?',
    options: [
      { value: -1, label: 'Unknown', description: 'No brand recognition' },
      { value: 0, label: 'Local recognition', description: 'Known in local area' },
      { value: 1, label: 'Regional recognition', description: 'Known regionally' },
      { value: 2, label: 'Industry leader', description: 'Recognized industry-wide' },
    ],
    weight: 0.25,
  },
  {
    id: 'market_growth',
    category: 'marketPosition',
    question: 'Is your primary market segment growing?',
    options: [
      { value: -1, label: 'Declining', description: 'Market shrinking' },
      { value: 0, label: 'Stable', description: 'No growth' },
      { value: 1, label: 'Growing', description: 'Market expanding' },
      { value: 2, label: 'Rapidly growing', description: 'High growth market' },
    ],
    weight: 0.25,
  },
  {
    id: 'niche_specialization',
    category: 'marketPosition',
    question: 'Do you specialize in a high-value niche?',
    options: [
      { value: -1, label: 'General contractor', description: 'Broad, competitive market' },
      { value: 0, label: 'Some specialization', description: 'Focused but not unique' },
      { value: 1, label: 'Specialized', description: 'Clear niche focus' },
      { value: 2, label: 'Highly specialized', description: 'Unique, defensible niche' },
    ],
    weight: 0.2,
  },

  // OPERATIONAL SYSTEMS
  {
    id: 'technology_systems',
    category: 'operationalSystems',
    question: 'How sophisticated are your technology systems?',
    options: [
      { value: -1, label: 'Basic/Manual', description: 'Spreadsheets, paper-based' },
      { value: 0, label: 'Standard software', description: 'Basic construction software' },
      { value: 1, label: 'Integrated systems', description: 'ERP, project management tools' },
      { value: 2, label: 'Advanced tech', description: 'AI, automation, real-time data' },
    ],
    weight: 0.3,
  },
  {
    id: 'quality_control',
    category: 'operationalSystems',
    question: 'How formalized is your quality control process?',
    options: [
      { value: -1, label: 'Informal', description: 'Ad-hoc quality checks' },
      { value: 0, label: 'Basic processes', description: 'Some QC procedures' },
      { value: 1, label: 'Formal system', description: 'Documented QC program' },
      { value: 2, label: 'Certified system', description: 'ISO, Six Sigma, etc.' },
    ],
    weight: 0.25,
  },
  {
    id: 'project_management',
    category: 'operationalSystems',
    question: 'How sophisticated is your project management approach?',
    options: [
      { value: -1, label: 'Reactive', description: 'Fire-fighting mode' },
      { value: 0, label: 'Basic tracking', description: 'Track progress, costs' },
      { value: 1, label: 'Proactive management', description: 'Forecasting, risk management' },
      { value: 2, label: 'Advanced PM', description: 'Predictive analytics, optimization' },
    ],
    weight: 0.25,
  },
  {
    id: 'scalability',
    category: 'operationalSystems',
    question: 'Can your operations scale without proportional cost increases?',
    options: [
      { value: -1, label: 'No scalability', description: 'Linear cost growth' },
      { value: 0, label: 'Limited scalability', description: 'Some efficiency gains' },
      { value: 1, label: 'Good scalability', description: 'Efficient operations' },
      { value: 2, label: 'Highly scalable', description: 'Strong operating leverage' },
    ],
    weight: 0.2,
  },

  // CUSTOMER CONCENTRATION
  {
    id: 'customer_diversification',
    category: 'customerConcentration',
    question: 'What percentage of revenue comes from your top 3 customers?',
    options: [
      { value: -2, label: '80%+', description: 'High concentration risk' },
      { value: -1, label: '60-80%', description: 'Moderate concentration' },
      { value: 0, label: '40-60%', description: 'Some diversification' },
      { value: 1, label: '20-40%', description: 'Well diversified' },
      { value: 2, label: 'Less than 20%', description: 'Highly diversified' },
    ],
    weight: 1.0,
    tooltip: 'Lower concentration reduces risk and increases value',
  },

  // PROJECT PORTFOLIO
  {
    id: 'project_size',
    category: 'projectPortfolio',
    question: 'What is your typical project size?',
    options: [
      { value: -1, label: 'Small projects', description: 'Under $100K average' },
      { value: 0, label: 'Mid-size', description: '$100K-$1M average' },
      { value: 1, label: 'Large projects', description: '$1M-$10M average' },
      { value: 2, label: 'Enterprise projects', description: '$10M+ average' },
    ],
    weight: 0.3,
  },
  {
    id: 'project_diversification',
    category: 'projectPortfolio',
    question: 'How diversified is your project portfolio?',
    options: [
      { value: -1, label: 'Single type', description: 'One project type only' },
      { value: 0, label: 'Limited types', description: '2-3 project types' },
      { value: 1, label: 'Diversified', description: 'Multiple project types' },
      { value: 2, label: 'Highly diversified', description: 'Broad portfolio' },
    ],
    weight: 0.3,
  },
  {
    id: 'geographic_diversification',
    category: 'projectPortfolio',
    question: 'How geographically diversified are your projects?',
    options: [
      { value: -1, label: 'Single location', description: 'One market only' },
      { value: 0, label: 'Local/Regional', description: 'Limited geography' },
      { value: 1, label: 'Multi-regional', description: 'Multiple regions' },
      { value: 2, label: 'National/International', description: 'Broad geography' },
    ],
    weight: 0.4,
  },

  // MANAGEMENT DEPTH
  {
    id: 'succession_planning',
    category: 'managementDepth',
    question: 'Do you have a succession plan?',
    options: [
      { value: -2, label: 'No plan', description: 'No succession planning' },
      { value: -1, label: 'Informal plan', description: 'Some thought but not documented' },
      { value: 0, label: 'Developing plan', description: 'Plan in progress' },
      { value: 1, label: 'Formal plan', description: 'Documented succession plan' },
      { value: 2, label: 'Executed plan', description: 'Successor identified and trained' },
    ],
    weight: 0.4,
  },
  {
    id: 'key_person_risk',
    category: 'managementDepth',
    question: 'How dependent is the business on key individuals?',
    options: [
      { value: -2, label: 'Highly dependent', description: 'Critical key person risk' },
      { value: -1, label: 'Some dependency', description: 'Moderate key person risk' },
      { value: 0, label: 'Limited dependency', description: 'Low key person risk' },
      { value: 1, label: 'Minimal dependency', description: 'Very low risk' },
      { value: 2, label: 'No dependency', description: 'No key person risk' },
    ],
    weight: 0.6,
  },

  // CASH FLOW MANAGEMENT
  {
    id: 'payment_cycles',
    category: 'cashFlow',
    question: 'What is your average payment cycle from clients?',
    options: [
      { value: -1, label: '60+ days', description: 'Slow payment' },
      { value: 0, label: '30-60 days', description: 'Standard terms' },
      { value: 1, label: '15-30 days', description: 'Fast payment' },
      { value: 2, label: 'Under 15 days', description: 'Very fast payment' },
    ],
    weight: 0.4,
  },
  {
    id: 'working_capital',
    category: 'cashFlow',
    question: 'How well do you manage working capital?',
    options: [
      { value: -1, label: 'Struggles', description: 'Frequent cash flow issues' },
      { value: 0, label: 'Adequate', description: 'Manageable but tight' },
      { value: 1, label: 'Good', description: 'Healthy working capital' },
      { value: 2, label: 'Excellent', description: 'Strong cash position' },
    ],
    weight: 0.6,
  },

  // SAFETY & COMPLIANCE
  {
    id: 'safety_record',
    category: 'safetyCompliance',
    question: 'What is your safety record (OSHA incident rate)?',
    options: [
      { value: -1, label: 'Above industry average', description: 'Poor safety record' },
      { value: 0, label: 'Industry average', description: 'Standard safety' },
      { value: 1, label: 'Below industry average', description: 'Good safety record' },
      { value: 2, label: 'Exceptional', description: 'Outstanding safety' },
    ],
    weight: 0.5,
  },
  {
    id: 'bonding_capacity',
    category: 'safetyCompliance',
    question: 'What is your bonding capacity relative to revenue?',
    options: [
      { value: -1, label: 'Limited bonding', description: 'Less than 2x revenue' },
      { value: 0, label: 'Standard', description: '2-3x revenue' },
      { value: 1, label: 'Strong', description: '3-5x revenue' },
      { value: 2, label: 'Exceptional', description: '5x+ revenue' },
    ],
    weight: 0.5,
  },
];

/**
 * Calculate value driver scores from questionnaire answers
 */
export function calculateValueDriverScores(
  answers: QuestionnaireAnswers
): ValueDriverScore[] {
  const categoryScores: Map<ValueDriverCategory, { totalScore: number; totalWeight: number }> = new Map();

  // Calculate weighted scores for each category
  VALUE_DRIVER_QUESTIONS.forEach(question => {
    const answer = answers[question.id];
    if (answer === undefined) return;

    const questionScore = answer * question.weight;
    const category = question.category;

    if (!categoryScores.has(category)) {
      categoryScores.set(category, { totalScore: 0, totalWeight: 0 });
    }

    const current = categoryScores.get(category)!;
    current.totalScore += questionScore;
    current.totalWeight += question.weight;
  });

  // Calculate final scores and impacts
  return Array.from(categoryScores.entries()).map(([category, { totalScore, totalWeight }]) => {
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const categoryWeight = CATEGORY_WEIGHTS[category];
    const impact = normalizedScore * categoryWeight * 0.5; // Scale impact (max ±0.5x multiple)

    return {
      category,
      score: normalizedScore,
      weight: categoryWeight,
      impact,
    };
  });
}

/**
 * Calculate adjusted multiple range based on questionnaire answers
 */
export function calculateAdjustedMultipleRange(
  baseRange: { low: number; mid: number; high: number },
  answers: QuestionnaireAnswers
): { low: number; mid: number; high: number; adjustment: number } {
  const scores = calculateValueDriverScores(answers);
  const totalAdjustment = scores.reduce((sum, score) => sum + score.impact, 0);

  // Clamp adjustment to reasonable range (±1.5x)
  const clampedAdjustment = Math.max(-1.5, Math.min(1.5, totalAdjustment));

  return {
    low: Math.max(1.0, baseRange.low + clampedAdjustment),
    mid: Math.max(1.5, baseRange.mid + clampedAdjustment),
    high: Math.max(2.0, baseRange.high + clampedAdjustment),
    adjustment: clampedAdjustment,
  };
}

/**
 * Get category name for display
 */
export function getCategoryName(category: ValueDriverCategory): string {
  const names: Record<ValueDriverCategory, string> = {
    financial: 'Financial Performance',
    ownerDependency: 'Owner Dependency',
    revenuePredictability: 'Revenue Predictability',
    marketPosition: 'Market Position',
    operationalSystems: 'Operational Systems',
    customerConcentration: 'Customer Concentration',
    projectPortfolio: 'Project Portfolio',
    managementDepth: 'Management Depth',
    cashFlow: 'Cash Flow Management',
    safetyCompliance: 'Safety & Compliance',
  };
  return names[category];
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: ValueDriverCategory): Question[] {
  return VALUE_DRIVER_QUESTIONS.filter(q => q.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): ValueDriverCategory[] {
  return Object.keys(CATEGORY_WEIGHTS) as ValueDriverCategory[];
}

/**
 * Calculate overall score from all answers
 */
export function calculateOverallScore(answers: QuestionnaireAnswers): number {
  const scores = calculateValueDriverScores(answers);
  const weightedSum = scores.reduce((sum, score) => sum + (score.score * score.weight), 0);
  const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Identify strengths and weaknesses
 */
export function identifyStrengthsAndWeaknesses(scores: ValueDriverScore[]): {
  strengths: ValueDriverCategory[];
  weaknesses: ValueDriverCategory[];
} {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 3).map(s => s.category);
  const weaknesses = sorted.slice(-3).reverse().map(s => s.category);
  return { strengths, weaknesses };
}

