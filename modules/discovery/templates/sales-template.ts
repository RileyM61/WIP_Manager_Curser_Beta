/**
 * Sales Manager Interview Template
 * 
 * Interview focused on pipeline, customer relationships,
 * pricing, competition, and growth opportunities.
 * 
 * Estimated Duration: 45-60 minutes
 */

import { InterviewTemplate } from '../types';

export const SALES_INTERVIEW_TEMPLATE: InterviewTemplate = {
  id: 'sales-discovery-v1',
  role: 'sales',
  name: 'Sales Manager Discovery Interview',
  description: 'Deep dive into pipeline, customer relationships, pricing, competition, and growth opportunities.',
  estimatedMinutes: 45,
  version: '1.0',
  
  sections: [
    // ========================================================================
    // SECTION 1: Pipeline & Backlog
    // ========================================================================
    {
      id: 'sales-pipeline',
      title: 'Pipeline & Backlog',
      description: 'Understanding current sales pipeline and future work.',
      icon: '📈',
      questions: [
        {
          id: 'sales-p1',
          text: 'What is your current backlog/contracted work value?',
          type: 'currency',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Backlog indicates revenue visibility.',
        },
        {
          id: 'sales-p2',
          text: 'How many months of work does your backlog represent?',
          type: 'number',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Compare to industry norms - typically 3-6 months is healthy.',
        },
        {
          id: 'sales-p3',
          text: 'What is your current active pipeline value (proposals out)?',
          type: 'currency',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Pipeline should be 3-5x annual sales for healthy coverage.',
        },
        {
          id: 'sales-p4',
          text: 'What is your typical win rate on proposals?',
          type: 'percentage',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Industry norms: 20-30% is typical; higher may indicate not bidding enough.',
        },
        {
          id: 'sales-p5',
          text: 'What is your average deal/project size?',
          type: 'currency',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Important for understanding revenue concentration and sales efficiency.',
        },
        {
          id: 'sales-p6',
          text: 'How has your pipeline trended over the past 6 months?',
          type: 'multiple-choice',
          category: 'growth',
          options: [
            'Growing significantly',
            'Growing moderately',
            'Stable',
            'Declining moderately',
            'Declining significantly',
          ],
          required: true,
          aiAnalysisHint: 'Pipeline trend is leading indicator of future revenue.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 2: Customer Base
    // ========================================================================
    {
      id: 'sales-customers',
      title: 'Customer Base',
      description: 'Understanding customer mix and relationships.',
      icon: '🤝',
      questions: [
        {
          id: 'sales-c1',
          text: 'What percentage of revenue comes from repeat customers?',
          type: 'percentage',
          category: 'customers',
          required: true,
          aiAnalysisHint: 'High repeat rate indicates strong relationships; low may indicate project-based volatility.',
        },
        {
          id: 'sales-c2',
          text: 'What percentage of revenue comes from your top 3 customers?',
          type: 'percentage',
          category: 'customers',
          required: true,
          aiAnalysisHint: 'High concentration = risk factor for valuation multiple.',
        },
        {
          id: 'sales-c3',
          text: 'How would you rate your customer relationships?',
          type: 'scale',
          category: 'customers',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Transactional only', mid: 'Good relationships', high: 'True partnerships' },
          required: true,
          aiAnalysisHint: 'Strong relationships indicate revenue stability.',
        },
        {
          id: 'sales-c4',
          text: 'How dependent are customer relationships on specific individuals?',
          helpText: 'Consider: Are relationships tied to the owner or specific salespeople?',
          type: 'multiple-choice',
          category: 'risk',
          options: [
            'Relationships are with the company, not individuals',
            'Mostly company relationships, some personal',
            'Mixed - some company, some personal',
            'Mostly tied to specific people',
            'Almost entirely personal relationships',
          ],
          required: true,
          aiAnalysisHint: 'Personal relationships = key person risk for customer retention.',
        },
        {
          id: 'sales-c5',
          text: 'Have you lost any significant customers in the past year? Why?',
          type: 'textarea',
          category: 'risk',
          required: true,
          aiAnalysisHint: 'Customer losses may indicate competitive or quality issues.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 3: Pricing & Margins
    // ========================================================================
    {
      id: 'sales-pricing',
      title: 'Pricing & Margins',
      description: 'Understanding pricing strategy and margin visibility.',
      icon: '💰',
      questions: [
        {
          id: 'sales-pr1',
          text: 'How do you typically develop pricing for proposals?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Detailed bottom-up cost estimation + margin',
            'Historical cost data + adjustment',
            'Market-based pricing',
            'Competitive matching',
            'Gut feel / experience-based',
          ],
          required: true,
          aiAnalysisHint: 'Pricing methodology affects margin consistency.',
        },
        {
          id: 'sales-pr2',
          text: 'How accurate are your job cost estimates vs. actual costs?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Often significantly off', mid: 'Usually close', high: 'Very accurate' },
          required: true,
          aiAnalysisHint: 'Poor estimating = margin erosion.',
        },
        {
          id: 'sales-pr3',
          text: 'What is your target gross margin on new work?',
          type: 'percentage',
          category: 'financial',
          required: true,
          followUp: 'What margin do you actually achieve on average?',
          aiAnalysisHint: 'Gap between target and actual reveals execution issues.',
        },
        {
          id: 'sales-pr4',
          text: 'How much pricing pressure are you facing from competitors?',
          type: 'scale',
          category: 'market',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Minimal pressure', mid: 'Moderate', high: 'Intense pressure' },
          required: true,
          aiAnalysisHint: 'High pressure indicates commoditized market or lack of differentiation.',
        },
        {
          id: 'sales-pr5',
          text: 'Do you have visibility into job profitability during execution?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Yes - real-time cost tracking',
            'Yes - weekly/bi-weekly updates',
            'Yes - monthly updates',
            'Limited - know at job completion',
            'No - don\'t track job costs well',
          ],
          required: true,
          aiAnalysisHint: 'Lack of visibility leads to margin surprises.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 4: Sales Process
    // ========================================================================
    {
      id: 'sales-process',
      title: 'Sales Process',
      description: 'Understanding how opportunities are identified and pursued.',
      icon: '🎯',
      questions: [
        {
          id: 'sales-sp1',
          text: 'How do most of your leads/opportunities come in?',
          type: 'multiple-choice',
          category: 'customers',
          options: [
            'Inbound - customers come to us',
            'Referrals - existing customers/partners',
            'Outbound - we actively prospect',
            'Relationships - long-term accounts',
            'Bid lists - invited to bid',
            'Mix of all sources',
          ],
          required: true,
          aiAnalysisHint: 'Lead source affects customer acquisition costs and predictability.',
        },
        {
          id: 'sales-sp2',
          text: 'Do you have a formal sales process?',
          type: 'multiple-choice',
          category: 'systems',
          options: [
            'Yes - documented with stages and tracking',
            'Yes - informal but consistent',
            'Somewhat - varies by salesperson',
            'No - everyone does their own thing',
          ],
          required: true,
          aiAnalysisHint: 'Lack of process = inconsistent results and scaling issues.',
        },
        {
          id: 'sales-sp3',
          text: 'What CRM or sales tracking tools do you use?',
          type: 'text',
          category: 'systems',
          required: true,
          aiAnalysisHint: 'No CRM = pipeline visibility issues.',
        },
        {
          id: 'sales-sp4',
          text: 'What is your typical sales cycle from lead to contract?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'Less than 2 weeks',
            '2-4 weeks',
            '1-2 months',
            '2-3 months',
            '3-6 months',
            'More than 6 months',
          ],
          required: true,
          aiAnalysisHint: 'Long sales cycles affect cash flow and forecasting.',
        },
        {
          id: 'sales-sp5',
          text: 'How do you decide which opportunities to pursue vs. pass on?',
          type: 'textarea',
          category: 'strategy',
          required: true,
          aiAnalysisHint: 'Bid/no-bid discipline affects win rates and resource efficiency.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 5: Competition
    // ========================================================================
    {
      id: 'sales-competition',
      title: 'Competitive Landscape',
      description: 'Understanding market position and competition.',
      icon: '🏆',
      questions: [
        {
          id: 'sales-comp1',
          text: 'Who are your top 3 competitors?',
          type: 'textarea',
          category: 'market',
          required: true,
          aiAnalysisHint: 'Know your competition for market analysis.',
        },
        {
          id: 'sales-comp2',
          text: 'What is your main competitive advantage?',
          type: 'textarea',
          category: 'market',
          required: true,
          followUp: 'Do customers perceive this advantage?',
          aiAnalysisHint: 'Compare with CEO answer - should be aligned.',
        },
        {
          id: 'sales-comp3',
          text: 'How do you typically lose deals when you don\'t win?',
          type: 'multiple-choice',
          category: 'market',
          options: [
            'Price - we\'re too high',
            'Relationships - competitor has better connections',
            'Capabilities - we can\'t do what they need',
            'Capacity - we can\'t deliver when needed',
            'Reputation - competitor is better known',
            'Mix of reasons',
          ],
          required: true,
          aiAnalysisHint: 'Understanding losses helps address root causes.',
        },
        {
          id: 'sales-comp4',
          text: 'How is competition changing in your market?',
          type: 'multiple-choice',
          category: 'market',
          options: [
            'Getting more intense - new entrants',
            'Getting more intense - price wars',
            'Staying about the same',
            'Getting easier - competitors exiting',
            'Consolidating - fewer larger players',
          ],
          required: true,
          aiAnalysisHint: 'Market dynamics affect strategy and valuation.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 6: Growth Opportunities
    // ========================================================================
    {
      id: 'sales-growth',
      title: 'Growth Opportunities',
      description: 'Identifying untapped potential and expansion paths.',
      icon: '🚀',
      questions: [
        {
          id: 'sales-g1',
          text: 'What market segments are you NOT serving that you could?',
          type: 'textarea',
          category: 'growth',
          required: true,
          aiAnalysisHint: 'Identify adjacent market opportunities.',
        },
        {
          id: 'sales-g2',
          text: 'What services could you add that customers are asking for?',
          type: 'textarea',
          category: 'growth',
          required: true,
          aiAnalysisHint: 'Service expansion opportunities.',
        },
        {
          id: 'sales-g3',
          text: 'What geographic areas could you expand into?',
          type: 'textarea',
          category: 'growth',
          required: false,
          aiAnalysisHint: 'Geographic expansion potential.',
        },
        {
          id: 'sales-g4',
          text: 'What is the biggest untapped opportunity you see?',
          type: 'textarea',
          category: 'growth',
          required: true,
          aiAnalysisHint: 'Often reveals strategic opportunities.',
        },
        {
          id: 'sales-g5',
          text: 'What would it take to double sales in the next 3-5 years?',
          type: 'textarea',
          category: 'growth',
          required: true,
          aiAnalysisHint: 'Understand scaling requirements and constraints.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 7: Team & Resources
    // ========================================================================
    {
      id: 'sales-team',
      title: 'Sales Team & Resources',
      description: 'Understanding sales capacity and needs.',
      icon: '👥',
      questions: [
        {
          id: 'sales-t1',
          text: 'How many people are involved in sales/business development?',
          type: 'number',
          category: 'people',
          required: true,
          aiAnalysisHint: 'Assess sales capacity relative to targets.',
        },
        {
          id: 'sales-t2',
          text: 'Is the owner/CEO actively involved in sales?',
          type: 'multiple-choice',
          category: 'people',
          options: [
            'No - dedicated sales team handles it',
            'Occasionally - for major accounts',
            'Yes - involved in most significant deals',
            'Yes - handles majority of sales',
            'Owner IS the sales function',
          ],
          required: true,
          aiAnalysisHint: 'Heavy owner involvement = key person dependency for sales.',
        },
        {
          id: 'sales-t3',
          text: 'Do you have adequate sales resources to hit your targets?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Significantly understaffed', mid: 'Adequate', high: 'Well-resourced' },
          required: true,
          aiAnalysisHint: 'Understaffed sales limits growth potential.',
        },
        {
          id: 'sales-t4',
          text: 'What is your biggest challenge in sales right now?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Primary constraint to address.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 8: Wrap-Up
    // ========================================================================
    {
      id: 'sales-wrapup',
      title: 'Final Thoughts',
      description: 'Closing questions and open discussion.',
      icon: '💭',
      questions: [
        {
          id: 'sales-w1',
          text: 'What one change would most help you grow sales?',
          type: 'textarea',
          category: 'strategy',
          required: true,
          aiAnalysisHint: 'Often reveals highest-impact opportunity.',
        },
        {
          id: 'sales-w2',
          text: 'How confident are you in hitting this year\'s sales targets?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Very unlikely', mid: 'Possible', high: 'Very confident' },
          required: true,
          aiAnalysisHint: 'Sales confidence affects revenue projections.',
        },
        {
          id: 'sales-w3',
          text: 'Is there anything else important about sales I should know?',
          type: 'textarea',
          category: 'challenges',
          required: false,
          aiAnalysisHint: 'May reveal issues not covered in structured questions.',
        },
      ],
    },
  ],
};

export default SALES_INTERVIEW_TEMPLATE;

