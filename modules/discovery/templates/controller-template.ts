/**
 * Controller / CFO Interview Template
 * 
 * Interview focused on financial systems, reporting accuracy,
 * cash management, and accounting operations.
 * 
 * Estimated Duration: 45-60 minutes
 */

import { InterviewTemplate } from '../types';

export const CONTROLLER_INTERVIEW_TEMPLATE: InterviewTemplate = {
  id: 'controller-discovery-v1',
  role: 'controller',
  name: 'Controller Financial Discovery Interview',
  description: 'Deep dive into financial systems, reporting, cash management, and accounting operations.',
  estimatedMinutes: 45,
  version: '1.0',
  
  sections: [
    // ========================================================================
    // SECTION 1: Financial Systems
    // ========================================================================
    {
      id: 'ctrl-systems',
      title: 'Financial Systems & Tools',
      description: 'Understanding the technology and tools used for financial management.',
      icon: '💻',
      questions: [
        {
          id: 'ctrl-s1',
          text: 'What accounting software do you use?',
          type: 'text',
          category: 'systems',
          required: true,
          followUp: 'How long have you been on this system? Any plans to change?',
          aiAnalysisHint: 'Assess system maturity and potential upgrade needs.',
        },
        {
          id: 'ctrl-s2',
          text: 'How integrated are your financial systems?',
          helpText: 'Consider: payroll, job costing, invoicing, banking, etc.',
          type: 'scale',
          category: 'systems',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Mostly manual/spreadsheets', mid: 'Some integration', high: 'Fully integrated' },
          required: true,
          aiAnalysisHint: 'Low integration = efficiency opportunity and data quality risk.',
        },
        {
          id: 'ctrl-s3',
          text: 'How would you rate your job costing accuracy?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Unreliable', mid: 'Reasonable estimates', high: 'Very accurate' },
          required: true,
          followUp: 'What causes inaccuracies when they occur?',
          aiAnalysisHint: 'Critical for construction/project businesses.',
        },
        {
          id: 'ctrl-s4',
          text: 'How much time do you spend on manual data entry or reconciliation?',
          type: 'multiple-choice',
          category: 'systems',
          options: [
            'Minimal - mostly automated',
            'A few hours per week',
            '1-2 days per week',
            '3-4 days per week',
            'Most of my time',
          ],
          required: true,
          aiAnalysisHint: 'High manual effort = process improvement opportunity.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 2: Financial Reporting
    // ========================================================================
    {
      id: 'ctrl-reporting',
      title: 'Financial Reporting',
      description: 'Assessing report quality, timeliness, and confidence.',
      icon: '📊',
      questions: [
        {
          id: 'ctrl-r1',
          text: 'How quickly can you close the books each month?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Within 5 business days',
            '6-10 business days',
            '11-15 business days',
            '16-20 business days',
            'More than 20 days',
          ],
          required: true,
          aiAnalysisHint: 'Slow closes indicate process issues or resource constraints.',
        },
        {
          id: 'ctrl-r2',
          text: 'How confident are you in the accuracy of your financial statements?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Significant doubts', mid: 'Mostly accurate', high: 'Completely confident' },
          required: true,
          followUp: 'What areas have the most uncertainty?',
          aiAnalysisHint: 'Compare with CEO perception.',
        },
        {
          id: 'ctrl-r3',
          text: 'What financial reports does management receive regularly?',
          type: 'textarea',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Identify reporting gaps and management visibility.',
        },
        {
          id: 'ctrl-r4',
          text: 'Do you produce WIP (Work-in-Progress) reports?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Yes, monthly with full analysis',
            'Yes, but basic/high-level only',
            'Quarterly only',
            'Occasionally/when needed',
            'No WIP reporting',
          ],
          required: true,
          aiAnalysisHint: 'Critical for project-based businesses.',
        },
        {
          id: 'ctrl-r5',
          text: 'How far in advance can you project cash flow?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Don\'t do cash flow projections',
            'Week-to-week only',
            '30 days ahead',
            '60-90 days ahead',
            '6+ months ahead',
          ],
          required: true,
          aiAnalysisHint: 'Limited forecasting = opportunity for CFO value-add.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 3: Cash Management
    // ========================================================================
    {
      id: 'ctrl-cash',
      title: 'Cash Management',
      description: 'Understanding cash flow patterns and treasury operations.',
      icon: '💵',
      questions: [
        {
          id: 'ctrl-c1',
          text: 'What is your average Days Sales Outstanding (DSO)?',
          helpText: 'Average days to collect receivables after invoicing.',
          type: 'number',
          category: 'financial',
          required: true,
          aiAnalysisHint: 'Industry benchmark: construction typically 45-60 days.',
        },
        {
          id: 'ctrl-c2',
          text: 'What is your biggest challenge with accounts receivable?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Identify collection process issues.',
        },
        {
          id: 'ctrl-c3',
          text: 'How often do you experience cash crunches?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Never',
            'Rarely (1-2 times per year)',
            'Occasionally (quarterly)',
            'Frequently (monthly)',
            'Constantly',
          ],
          required: true,
          aiAnalysisHint: 'Compare with CEO response.',
        },
        {
          id: 'ctrl-c4',
          text: 'What triggers cash flow problems when they occur?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Root cause analysis for cash flow issues.',
        },
        {
          id: 'ctrl-c5',
          text: 'How do you manage vendor payment timing?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'Pay all bills immediately',
            'Pay on terms consistently',
            'Strategic - prioritize key vendors',
            'Stretch payments when needed',
            'Constantly managing/stretching',
          ],
          required: true,
          aiAnalysisHint: 'Stretched payments indicate working capital stress.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 4: Budgeting & Planning
    // ========================================================================
    {
      id: 'ctrl-budget',
      title: 'Budgeting & Planning',
      description: 'Understanding planning processes and variance management.',
      icon: '📋',
      questions: [
        {
          id: 'ctrl-b1',
          text: 'Do you have a formal annual budget?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Yes, detailed and actively tracked',
            'Yes, but loosely followed',
            'High-level targets only',
            'No formal budget',
          ],
          required: true,
          aiAnalysisHint: 'No budget = significant planning gap.',
        },
        {
          id: 'ctrl-b2',
          text: 'How often do you review budget vs. actual performance?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Weekly',
            'Monthly',
            'Quarterly',
            'Annually',
            'Rarely/never',
          ],
          required: true,
          aiAnalysisHint: 'Infrequent review = missed opportunities for course correction.',
        },
        {
          id: 'ctrl-b3',
          text: 'What are your typical budget variances?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Within 5% - very accurate',
            '5-10% variance typical',
            '10-20% variance typical',
            'More than 20% variance common',
            'Don\'t track variances',
          ],
          required: true,
          aiAnalysisHint: 'Large variances indicate estimating or execution issues.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 5: Compliance & Controls
    // ========================================================================
    {
      id: 'ctrl-compliance',
      title: 'Compliance & Internal Controls',
      description: 'Assessing regulatory compliance and financial controls.',
      icon: '✅',
      questions: [
        {
          id: 'ctrl-comp1',
          text: 'When was your last external audit or review?',
          type: 'multiple-choice',
          category: 'financial',
          options: [
            'Never had one',
            'More than 3 years ago',
            '2-3 years ago',
            'Within the last year',
            'Currently in process',
          ],
          required: true,
          aiAnalysisHint: 'No recent audit may indicate control gaps or limit financing options.',
        },
        {
          id: 'ctrl-comp2',
          text: 'Are you current on all tax filings and payments?',
          type: 'multiple-choice',
          category: 'risk',
          options: [
            'Yes, fully current',
            'Mostly current, minor delays',
            'Behind on some filings',
            'Significantly behind',
            'Unsure',
          ],
          required: true,
          aiAnalysisHint: 'Tax issues are major red flag for any transaction or financing.',
        },
        {
          id: 'ctrl-comp3',
          text: 'How would you rate your internal controls?',
          type: 'scale',
          category: 'risk',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Minimal controls', mid: 'Basic controls', high: 'Robust controls' },
          required: true,
          followUp: 'What controls need improvement?',
          aiAnalysisHint: 'Weak controls = fraud/error risk.',
        },
        {
          id: 'ctrl-comp4',
          text: 'Do you have any concerns about fraud or misappropriation?',
          type: 'yes-no',
          category: 'risk',
          required: true,
          followUp: 'If yes, what specifically concerns you?',
          aiAnalysisHint: 'Even "no" response should be noted - compare with other observations.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 6: Team & Resources
    // ========================================================================
    {
      id: 'ctrl-team',
      title: 'Accounting Team & Resources',
      description: 'Understanding team capacity and capability.',
      icon: '👥',
      questions: [
        {
          id: 'ctrl-t1',
          text: 'How many people are in your accounting department?',
          type: 'number',
          category: 'people',
          required: true,
          aiAnalysisHint: 'Benchmark against company size.',
        },
        {
          id: 'ctrl-t2',
          text: 'Do you have adequate staff to handle your workload?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Severely understaffed', mid: 'Managing but stretched', high: 'Well-staffed' },
          required: true,
          aiAnalysisHint: 'Understaffing = burnout risk and quality issues.',
        },
        {
          id: 'ctrl-t3',
          text: 'What is your biggest frustration in your role?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Reveals systemic issues and pain points.',
        },
        {
          id: 'ctrl-t4',
          text: 'If you had one wish for improving financial operations, what would it be?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Often reveals the most impactful improvement opportunity.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 7: Relationships
    // ========================================================================
    {
      id: 'ctrl-relationships',
      title: 'Key Relationships',
      description: 'Understanding external relationships and dependencies.',
      icon: '🤝',
      questions: [
        {
          id: 'ctrl-rel1',
          text: 'How is your relationship with your bank?',
          type: 'scale',
          category: 'financial',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Strained/problematic', mid: 'Transactional', high: 'Strong partner' },
          required: true,
          aiAnalysisHint: 'Banking relationship affects financing options.',
        },
        {
          id: 'ctrl-rel2',
          text: 'Do you have any bank covenants? If so, are you in compliance?',
          type: 'multiple-choice',
          category: 'risk',
          options: [
            'No covenants',
            'Yes, fully in compliance',
            'Yes, close to limits on some',
            'Yes, in violation of some',
            'Unsure',
          ],
          required: true,
          aiAnalysisHint: 'Covenant issues are serious and need immediate attention.',
        },
        {
          id: 'ctrl-rel3',
          text: 'How would you rate your relationship with your external CPA firm?',
          type: 'scale',
          category: 'systems',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Poor/looking to change', mid: 'Adequate', high: 'Excellent partner' },
          required: false,
          aiAnalysisHint: 'Poor CPA relationship may indicate unaddressed issues.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 8: Wrap-Up
    // ========================================================================
    {
      id: 'ctrl-wrapup',
      title: 'Final Thoughts',
      description: 'Closing questions and open discussion.',
      icon: '💭',
      questions: [
        {
          id: 'ctrl-w1',
          text: 'What would make this CFO engagement successful from your perspective?',
          type: 'textarea',
          category: 'strategy',
          required: true,
          aiAnalysisHint: 'Controller buy-in is critical for implementation success.',
        },
        {
          id: 'ctrl-w2',
          text: 'Is there anything else I should know about the financial operations?',
          type: 'textarea',
          category: 'challenges',
          required: false,
          aiAnalysisHint: 'May reveal issues not covered in structured questions.',
        },
      ],
    },
  ],
};

export default CONTROLLER_INTERVIEW_TEMPLATE;

