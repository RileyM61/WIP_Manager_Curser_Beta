/**
 * CEO / Owner Interview Template
 * 
 * Comprehensive interview covering vision, strategy, challenges,
 * and personal goals. This is typically the most important interview.
 * 
 * Estimated Duration: 60-75 minutes
 */

import { InterviewTemplate } from '../types';

export const CEO_INTERVIEW_TEMPLATE: InterviewTemplate = {
  id: 'ceo-discovery-v1',
  role: 'ceo',
  name: 'CEO Strategic Discovery Interview',
  description: 'Comprehensive interview with the CEO/Owner covering vision, strategy, challenges, and exit planning.',
  estimatedMinutes: 60,
  version: '1.0',
  
  sections: [
    // ========================================================================
    // SECTION 1: Vision & Goals
    // ========================================================================
    {
      id: 'ceo-vision',
      title: 'Vision & Strategic Goals',
      description: 'Understanding where the company is headed and what success looks like.',
      icon: '🎯',
      questions: [
        {
          id: 'ceo-v1',
          text: 'Where do you see the company in 5 years?',
          helpText: 'Probe for specifics: revenue targets, market position, geographic expansion, service offerings.',
          type: 'textarea',
          category: 'vision',
          required: true,
          followUp: 'What would need to happen to make that vision a reality?',
          aiAnalysisHint: 'Look for clarity, ambition level, and alignment with current capabilities.',
        },
        {
          id: 'ceo-v2',
          text: 'What is your personal timeline for involvement in the business?',
          helpText: 'Exit planning context - understand owner dependency.',
          type: 'multiple-choice',
          category: 'vision',
          options: [
            'Actively growing - no exit plans',
            '5+ years before considering exit',
            '3-5 years to transition',
            '1-3 years to exit',
            'Actively seeking exit now',
          ],
          required: true,
          aiAnalysisHint: 'Critical for value builder multiple - shorter timeline may indicate urgency or burnout.',
        },
        {
          id: 'ceo-v3',
          text: 'How clear is your vision to your leadership team?',
          type: 'scale',
          category: 'vision',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Not communicated', mid: 'Partially aligned', high: 'Fully aligned' },
          required: true,
          aiAnalysisHint: 'Low scores indicate leadership alignment issues.',
        },
        {
          id: 'ceo-v4',
          text: 'What is the single most important goal for this year?',
          type: 'textarea',
          category: 'strategy',
          required: true,
          followUp: 'How will you measure success on this goal?',
          aiAnalysisHint: 'Compare with what other leaders say is the priority.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 2: Current Challenges
    // ========================================================================
    {
      id: 'ceo-challenges',
      title: 'Challenges & Pain Points',
      description: 'Identifying what keeps the CEO up at night and obstacles to growth.',
      icon: '⚠️',
      questions: [
        {
          id: 'ceo-c1',
          text: 'What are the top 3 challenges facing your business right now?',
          helpText: 'Rank in order of importance. Probe each one for root causes.',
          type: 'textarea',
          category: 'challenges',
          required: true,
          followUp: 'Which of these has the biggest financial impact?',
          aiAnalysisHint: 'Core input for SWOT weaknesses and strategic recommendations.',
        },
        {
          id: 'ceo-c2',
          text: 'What keeps you up at night about this business?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Emotional response reveals true concerns vs. stated priorities.',
        },
        {
          id: 'ceo-c3',
          text: 'If you could wave a magic wand and fix one thing, what would it be?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Often reveals the real bottleneck that formal answers miss.',
        },
        {
          id: 'ceo-c4',
          text: 'How would you rate your current stress level running this business?',
          type: 'scale',
          category: 'challenges',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Very manageable', mid: 'Moderate stress', high: 'Extremely stressed' },
          required: true,
          aiAnalysisHint: 'High stress + short exit timeline = potential burnout situation.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 3: Financial Overview
    // ========================================================================
    {
      id: 'ceo-financial',
      title: 'Financial Performance',
      description: 'Understanding the financial health and trajectory of the business.',
      icon: '💰',
      questions: [
        {
          id: 'ceo-f1',
          text: 'What is your approximate annual revenue?',
          type: 'currency',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Baseline for Value Builder calculation.',
        },
        {
          id: 'ceo-f2',
          text: 'How has revenue trended over the past 3 years?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Declining significantly (>15% down)',
            'Declining moderately (5-15% down)',
            'Flat (within 5%)',
            'Growing moderately (5-15% up)',
            'Growing significantly (>15% up)',
          ],
          required: true,
          aiAnalysisHint: 'Growth trajectory affects multiple.',
        },
        {
          id: 'ceo-f3',
          text: 'Are you satisfied with your current profitability?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Very dissatisfied', mid: 'Acceptable', high: 'Very satisfied' },
          required: true,
          followUp: 'What margin are you currently achieving?',
          aiAnalysisHint: 'Low satisfaction indicates margin improvement opportunity.',
        },
        {
          id: 'ceo-f4',
          text: 'How often do you experience cash flow challenges?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Never - cash is always comfortable',
            'Rarely - once or twice a year',
            'Sometimes - seasonally or project-based',
            'Often - monthly concerns',
            'Constantly - always tight',
          ],
          required: true,
          aiAnalysisHint: 'Cash flow stress indicates operational or structural issues.',
        },
        {
          id: 'ceo-f5',
          text: 'Do you have a line of credit, and if so, how often is it used?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'No line of credit',
            'Have one, rarely used',
            'Have one, occasionally used',
            'Have one, frequently used',
            'Maxed out or near limit often',
          ],
          required: false,
          aiAnalysisHint: 'Heavy LOC usage indicates working capital challenges.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 4: Leadership & People
    // ========================================================================
    {
      id: 'ceo-people',
      title: 'Leadership & Team',
      description: 'Assessing team strength, dependencies, and organizational health.',
      icon: '👥',
      questions: [
        {
          id: 'ceo-p1',
          text: 'How strong is your leadership team?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Significant gaps', mid: 'Adequate', high: 'A-players throughout' },
          required: true,
          followUp: 'Where are the biggest gaps?',
          aiAnalysisHint: 'Low scores indicate key person risk and growth constraints.',
        },
        {
          id: 'ceo-p2',
          text: 'Could the business run without you for 30 days?',
          type: 'multiple-choice',
          category: 'people',
          options: [
            'Yes, without any issues',
            'Yes, but some decisions would wait',
            'Probably, but things would slip',
            'No, major problems would occur',
            'No, it would fall apart',
          ],
          required: true,
          aiAnalysisHint: 'Critical owner dependency indicator - major multiple factor.',
        },
        {
          id: 'ceo-p3',
          text: 'Do you have a succession plan for your role?',
          type: 'multiple-choice',
          category: 'people',
          options: [
            'Yes, documented and communicated',
            'Yes, but not formalized',
            'Partially - have some candidates in mind',
            'No, but working on it',
            'No, haven\'t thought about it',
          ],
          required: true,
          aiAnalysisHint: 'No succession plan = owner dependency = lower multiple.',
        },
        {
          id: 'ceo-p4',
          text: 'How is employee morale and retention?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'High turnover, low morale', mid: 'Average', high: 'Excellent culture, low turnover' },
          required: true,
          aiAnalysisHint: 'Low morale indicates hidden operational issues.',
        },
        {
          id: 'ceo-p5',
          text: 'What percentage of your time is spent "working IN" vs "ON" the business?',
          helpText: 'IN = daily operations, ON = strategy/growth',
          type: 'multiple-choice',
          category: 'people',
          options: [
            '90% IN / 10% ON',
            '75% IN / 25% ON',
            '50% IN / 50% ON',
            '25% IN / 75% ON',
            '10% IN / 90% ON',
          ],
          required: true,
          aiAnalysisHint: 'Heavy IN time = owner trapped in operations.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 5: Market & Competition
    // ========================================================================
    {
      id: 'ceo-market',
      title: 'Market Position & Competition',
      description: 'Understanding competitive advantages and market dynamics.',
      icon: '🏆',
      questions: [
        {
          id: 'ceo-m1',
          text: 'What is your primary competitive advantage?',
          type: 'textarea',
          category: 'market',
          required: true,
          followUp: 'Is this advantage sustainable? What protects it?',
          aiAnalysisHint: 'Key SWOT strength - look for defensible moats.',
        },
        {
          id: 'ceo-m2',
          text: 'How concentrated is your customer base?',
          helpText: 'What percentage of revenue comes from your top 3 customers?',
          type: 'multiple-choice',
          category: 'customers',
          options: [
            'Less than 10% from top 3',
            '10-25% from top 3',
            '25-40% from top 3',
            '40-60% from top 3',
            'More than 60% from top 3',
          ],
          required: true,
          aiAnalysisHint: 'High concentration = significant risk factor for multiple.',
        },
        {
          id: 'ceo-m3',
          text: 'How would you describe your market position?',
          type: 'multiple-choice',
          category: 'market',
          options: [
            'Market leader in our niche',
            'Strong competitor, top 3 in market',
            'Mid-tier, one of many players',
            'Smaller player, fighting for share',
            'New entrant, building position',
          ],
          required: true,
          aiAnalysisHint: 'Market position affects growth potential and multiple.',
        },
        {
          id: 'ceo-m4',
          text: 'What is your biggest competitive threat?',
          type: 'textarea',
          category: 'risk',
          required: true,
          aiAnalysisHint: 'Input for SWOT threats.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 6: Growth & Strategy
    // ========================================================================
    {
      id: 'ceo-growth',
      title: 'Growth Strategy',
      description: 'Understanding growth plans and strategic direction.',
      icon: '🚀',
      questions: [
        {
          id: 'ceo-g1',
          text: 'What is your primary growth strategy?',
          type: 'multiple-choice',
          category: 'growth',
          options: [
            'Organic - grow with existing offerings',
            'New products/services',
            'Geographic expansion',
            'Acquisitions',
            'Combination of strategies',
            'Not focused on growth',
          ],
          required: true,
          followUp: 'What specific initiatives are planned?',
          aiAnalysisHint: 'Compare with capacity and resources available.',
        },
        {
          id: 'ceo-g2',
          text: 'What is your target growth rate for the next year?',
          type: 'percentage',
          category: 'growth',
          required: true,
          aiAnalysisHint: 'Compare with historical performance and capacity.',
        },
        {
          id: 'ceo-g3',
          text: 'What is the biggest barrier to growth?',
          type: 'textarea',
          category: 'growth',
          required: true,
          aiAnalysisHint: 'Key constraint to address in recommendations.',
        },
        {
          id: 'ceo-g4',
          text: 'How well are you positioned to capitalize on market opportunities?',
          type: 'scale',
          category: 'growth',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Not ready at all', mid: 'Somewhat prepared', high: 'Fully prepared' },
          required: true,
          aiAnalysisHint: 'Gap between opportunity and readiness = CFO action area.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 7: Systems & Operations
    // ========================================================================
    {
      id: 'ceo-systems',
      title: 'Systems & Processes',
      description: 'Understanding operational maturity and infrastructure.',
      icon: '⚙️',
      questions: [
        {
          id: 'ceo-s1',
          text: 'How would you rate your business systems and processes?',
          type: 'scale',
          category: 'systems',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Ad-hoc, in people\'s heads', mid: 'Basic documentation', high: 'Fully systematized' },
          required: true,
          aiAnalysisHint: 'Low scores = scalability issues and key person risk.',
        },
        {
          id: 'ceo-s2',
          text: 'How confident are you in your financial reporting?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Don\'t trust the numbers', mid: 'Mostly accurate', high: 'Completely reliable' },
          required: true,
          followUp: 'What specific concerns do you have?',
          aiAnalysisHint: 'Low confidence = urgent CFO intervention needed.',
        },
        {
          id: 'ceo-s3',
          text: 'What technology/software investments are needed?',
          type: 'textarea',
          category: 'systems',
          required: false,
          aiAnalysisHint: 'Identify capital needs and modernization opportunities.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 8: Wrap-Up
    // ========================================================================
    {
      id: 'ceo-wrapup',
      title: 'Final Thoughts',
      description: 'Closing questions and open discussion.',
      icon: '💭',
      questions: [
        {
          id: 'ceo-w1',
          text: 'What do you most want to get out of this CFO engagement?',
          type: 'textarea',
          category: 'strategy',
          required: true,
          aiAnalysisHint: 'Sets expectations and success criteria.',
        },
        {
          id: 'ceo-w2',
          text: 'Is there anything important we haven\'t discussed?',
          type: 'textarea',
          category: 'challenges',
          required: false,
          aiAnalysisHint: 'Often surfaces issues not covered by structured questions.',
        },
        {
          id: 'ceo-w3',
          text: 'Who else in the organization should I speak with?',
          type: 'textarea',
          category: 'people',
          required: false,
          aiAnalysisHint: 'May reveal other key stakeholders beyond standard roles.',
        },
      ],
    },
  ],
};

export default CEO_INTERVIEW_TEMPLATE;

