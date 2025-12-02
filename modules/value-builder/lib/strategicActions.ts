/**
 * Strategic Actions Library
 * Maps value driver categories to actionable improvements
 */

import { ValueDriverCategory } from './questionnaire';

export interface CategoryAction {
  category: ValueDriverCategory;
  scoreRange: [number, number]; // Applicable score range
  action: string;
  description: string;
  estimatedCost: 'low' | 'medium' | 'high';
  estimatedTimeline: string;
  valueImpact: number; // Expected multiple increase
}

export const STRATEGIC_ACTIONS: CategoryAction[] = [
  // FINANCIAL PERFORMANCE
  {
    category: 'financial',
    scoreRange: [-2, -0.5],
    action: 'Implement financial reporting system',
    description: 'Upgrade to professional accounting software with real-time dashboards',
    estimatedCost: 'medium',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.15,
  },
  {
    category: 'financial',
    scoreRange: [-0.5, 0.5],
    action: 'Improve profit margins through pricing optimization',
    description: 'Analyze project profitability and adjust pricing strategy',
    estimatedCost: 'low',
    estimatedTimeline: '1-3 months',
    valueImpact: 0.10,
  },
  {
    category: 'financial',
    scoreRange: [0.5, 2],
    action: 'Maintain financial discipline and consistency',
    description: 'Continue strong financial practices and consider advanced reporting',
    estimatedCost: 'low',
    estimatedTimeline: 'Ongoing',
    valueImpact: 0.05,
  },
  
  // OWNER DEPENDENCY
  {
    category: 'ownerDependency',
    scoreRange: [-2, -1],
    action: 'Build management team',
    description: 'Hire and train operations manager and key department heads',
    estimatedCost: 'high',
    estimatedTimeline: '6-12 months',
    valueImpact: 0.25,
  },
  {
    category: 'ownerDependency',
    scoreRange: [-1, 0],
    action: 'Document key processes',
    description: 'Create SOPs for critical business operations',
    estimatedCost: 'low',
    estimatedTimeline: '2-4 months',
    valueImpact: 0.12,
  },
  {
    category: 'ownerDependency',
    scoreRange: [0, 1],
    action: 'Delegation and empowerment',
    description: 'Increase delegation to management team and reduce owner involvement',
    estimatedCost: 'low',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.08,
  },
  
  // REVENUE PREDICTABILITY
  {
    category: 'revenuePredictability',
    scoreRange: [-2, -0.5],
    action: 'Develop recurring revenue streams',
    description: 'Create maintenance/service contracts or retainer agreements',
    estimatedCost: 'medium',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.20,
  },
  {
    category: 'revenuePredictability',
    scoreRange: [-0.5, 0.5],
    action: 'Improve backlog visibility',
    description: 'Implement CRM and project pipeline tracking',
    estimatedCost: 'low',
    estimatedTimeline: '1-2 months',
    valueImpact: 0.08,
  },
  {
    category: 'revenuePredictability',
    scoreRange: [0.5, 2],
    action: 'Expand recurring revenue base',
    description: 'Increase percentage of recurring revenue through new service offerings',
    estimatedCost: 'medium',
    estimatedTimeline: '6-12 months',
    valueImpact: 0.12,
  },
  
  // MARKET POSITION
  {
    category: 'marketPosition',
    scoreRange: [-2, -0.5],
    action: 'Develop competitive differentiation',
    description: 'Identify and market unique value propositions',
    estimatedCost: 'medium',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.15,
  },
  {
    category: 'marketPosition',
    scoreRange: [-0.5, 0.5],
    action: 'Build brand recognition',
    description: 'Invest in marketing and thought leadership',
    estimatedCost: 'medium',
    estimatedTimeline: '6-12 months',
    valueImpact: 0.10,
  },
  {
    category: 'marketPosition',
    scoreRange: [0.5, 2],
    action: 'Strengthen market leadership',
    description: 'Expand market share and reinforce competitive position',
    estimatedCost: 'high',
    estimatedTimeline: '12+ months',
    valueImpact: 0.12,
  },
  
  // OPERATIONAL SYSTEMS
  {
    category: 'operationalSystems',
    scoreRange: [-2, -0.5],
    action: 'Implement integrated technology systems',
    description: 'Deploy ERP, project management, and financial systems',
    estimatedCost: 'high',
    estimatedTimeline: '6-12 months',
    valueImpact: 0.18,
  },
  {
    category: 'operationalSystems',
    scoreRange: [-0.5, 0.5],
    action: 'Upgrade project management tools',
    description: 'Implement advanced PM software with forecasting capabilities',
    estimatedCost: 'medium',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.10,
  },
  {
    category: 'operationalSystems',
    scoreRange: [0.5, 2],
    action: 'Optimize existing systems',
    description: 'Fine-tune processes and leverage advanced features',
    estimatedCost: 'low',
    estimatedTimeline: '1-3 months',
    valueImpact: 0.05,
  },
  
  // CUSTOMER CONCENTRATION
  {
    category: 'customerConcentration',
    scoreRange: [-2, -0.5],
    action: 'Diversify customer base',
    description: 'Aggressively pursue new clients to reduce concentration risk',
    estimatedCost: 'medium',
    estimatedTimeline: '6-12 months',
    valueImpact: 0.15,
  },
  {
    category: 'customerConcentration',
    scoreRange: [-0.5, 0.5],
    action: 'Expand client relationships',
    description: 'Develop relationships with additional clients in existing markets',
    estimatedCost: 'low',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.08,
  },
  
  // PROJECT PORTFOLIO
  {
    category: 'projectPortfolio',
    scoreRange: [-2, -0.5],
    action: 'Diversify project types',
    description: 'Expand into complementary project types and markets',
    estimatedCost: 'high',
    estimatedTimeline: '12+ months',
    valueImpact: 0.12,
  },
  {
    category: 'projectPortfolio',
    scoreRange: [-0.5, 0.5],
    action: 'Optimize project mix',
    description: 'Balance project sizes and types for better risk management',
    estimatedCost: 'low',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.06,
  },
  
  // MANAGEMENT DEPTH
  {
    category: 'managementDepth',
    scoreRange: [-2, -0.5],
    action: 'Develop succession plan',
    description: 'Create formal succession plan and identify/train successors',
    estimatedCost: 'medium',
    estimatedTimeline: '6-12 months',
    valueImpact: 0.15,
  },
  {
    category: 'managementDepth',
    scoreRange: [-0.5, 0.5],
    action: 'Reduce key person dependency',
    description: 'Cross-train team members and document critical knowledge',
    estimatedCost: 'low',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.08,
  },
  
  // CASH FLOW
  {
    category: 'cashFlow',
    scoreRange: [-2, -0.5],
    action: 'Improve payment terms and collections',
    description: 'Negotiate better payment terms and implement collection processes',
    estimatedCost: 'low',
    estimatedTimeline: '1-3 months',
    valueImpact: 0.10,
  },
  {
    category: 'cashFlow',
    scoreRange: [-0.5, 0.5],
    action: 'Optimize working capital management',
    description: 'Improve cash flow forecasting and working capital efficiency',
    estimatedCost: 'low',
    estimatedTimeline: '2-4 months',
    valueImpact: 0.05,
  },
  
  // SAFETY & COMPLIANCE
  {
    category: 'safetyCompliance',
    scoreRange: [-2, -0.5],
    action: 'Implement comprehensive safety program',
    description: 'Develop formal safety protocols and training programs',
    estimatedCost: 'medium',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.08,
  },
  {
    category: 'safetyCompliance',
    scoreRange: [-0.5, 0.5],
    action: 'Enhance bonding capacity',
    description: 'Work with surety to increase bonding capacity',
    estimatedCost: 'low',
    estimatedTimeline: '3-6 months',
    valueImpact: 0.05,
  },
];

/**
 * Get action items for a category based on current score
 */
export function getActionItemsForCategory(
  category: ValueDriverCategory,
  currentScore: number
): string[] {
  return STRATEGIC_ACTIONS
    .filter(action => 
      action.category === category &&
      currentScore >= action.scoreRange[0] &&
      currentScore < action.scoreRange[1]
    )
    .map(action => action.action);
}

/**
 * Get all actions for a category
 */
export function getAllActionsForCategory(category: ValueDriverCategory): CategoryAction[] {
  return STRATEGIC_ACTIONS.filter(action => action.category === category);
}

/**
 * Estimate cost in dollars for a category
 */
export function estimateCostForCategory(category: ValueDriverCategory, costLevel?: 'low' | 'medium' | 'high'): number {
  // If specific cost level provided, use that
  if (costLevel) {
    const costMap = { low: 25000, medium: 75000, high: 150000 };
    return costMap[costLevel];
  }

  // Otherwise, return average cost for category
  const costMap: Record<ValueDriverCategory, number> = {
    financial: 50000,
    ownerDependency: 150000,
    revenuePredictability: 75000,
    marketPosition: 100000,
    operationalSystems: 125000,
    customerConcentration: 50000,
    projectPortfolio: 75000,
    managementDepth: 100000,
    cashFlow: 25000,
    safetyCompliance: 40000,
  };
  return costMap[category];
}

/**
 * Calculate ROI for a recommendation
 */
export function calculateROI(valueImpact: number, cost: number): number | null {
  if (cost === 0) return null;
  // ROI = (value increase in multiple * EBITDA) / cost
  // For now, we'll use a simplified ROI based on multiple impact
  // Assuming $1M EBITDA, a 0.1x multiple increase = $100K value increase
  const estimatedEbitda = 1000000; // This should be passed in, but using placeholder
  const valueIncrease = valueImpact * estimatedEbitda;
  return valueIncrease / cost;
}

/**
 * Get timeline estimate for a category
 */
export function estimateTimelineForCategory(category: ValueDriverCategory): string {
  const timelineMap: Record<ValueDriverCategory, string> = {
    financial: '3-6 months',
    ownerDependency: '6-12 months',
    revenuePredictability: '3-6 months',
    marketPosition: '6-12 months',
    operationalSystems: '6-12 months',
    customerConcentration: '6-12 months',
    projectPortfolio: '12+ months',
    managementDepth: '6-12 months',
    cashFlow: '1-3 months',
    safetyCompliance: '3-6 months',
  };
  return timelineMap[category];
}

