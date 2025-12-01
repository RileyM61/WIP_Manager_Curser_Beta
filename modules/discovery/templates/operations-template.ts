/**
 * Operations Manager Interview Template
 * 
 * Interview focused on capacity, efficiency, quality,
 * safety, and workforce management.
 * 
 * Estimated Duration: 45-60 minutes
 */

import { InterviewTemplate } from '../types';

export const OPERATIONS_INTERVIEW_TEMPLATE: InterviewTemplate = {
  id: 'operations-discovery-v1',
  role: 'operations',
  name: 'Operations Manager Discovery Interview',
  description: 'Deep dive into capacity, efficiency, quality, safety, and workforce management.',
  estimatedMinutes: 45,
  version: '1.0',
  
  sections: [
    // ========================================================================
    // SECTION 1: Capacity & Utilization
    // ========================================================================
    {
      id: 'ops-capacity',
      title: 'Capacity & Utilization',
      description: 'Understanding current capacity and utilization levels.',
      icon: '📊',
      questions: [
        {
          id: 'ops-cap1',
          text: 'What is your current capacity utilization?',
          helpText: 'Percentage of maximum capacity currently being used.',
          type: 'percentage',
          category: 'operations',
          required: true,
          aiAnalysisHint: 'Below 70% may indicate underutilization; above 90% may limit growth.',
        },
        {
          id: 'ops-cap2',
          text: 'How much additional work could you take on with current resources?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'None - we\'re maxed out',
            '10-20% more',
            '20-40% more',
            '40%+ more',
            'Unsure - haven\'t calculated',
          ],
          required: true,
          followUp: 'What would be the limiting factor?',
          aiAnalysisHint: 'Compare with sales pipeline and growth targets.',
        },
        {
          id: 'ops-cap3',
          text: 'What is your biggest capacity constraint?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'Labor availability',
            'Equipment/tools',
            'Space/facilities',
            'Management bandwidth',
            'Supply chain/materials',
            'Permits/regulatory',
            'No significant constraints',
          ],
          required: true,
          aiAnalysisHint: 'Key constraint to address for growth enablement.',
        },
        {
          id: 'ops-cap4',
          text: 'How accurately can you forecast labor needs for upcoming jobs?',
          type: 'scale',
          category: 'operations',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Often surprised', mid: 'Reasonable estimates', high: 'Very accurate' },
          required: true,
          aiAnalysisHint: 'Poor forecasting leads to overtime, delays, or understaffing.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 2: Efficiency & Productivity
    // ========================================================================
    {
      id: 'ops-efficiency',
      title: 'Efficiency & Productivity',
      description: 'Assessing operational efficiency and productivity metrics.',
      icon: '⚡',
      questions: [
        {
          id: 'ops-eff1',
          text: 'How would you rate your overall operational efficiency?',
          type: 'scale',
          category: 'operations',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Significant waste', mid: 'Average', high: 'Highly efficient' },
          required: true,
          followUp: 'Where do you see the biggest inefficiencies?',
          aiAnalysisHint: 'Low scores indicate margin improvement opportunities.',
        },
        {
          id: 'ops-eff2',
          text: 'What is your typical project/job completion rate vs. estimated time?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'Usually under budget hours',
            'Usually close to estimate (within 10%)',
            'Often 10-20% over',
            'Often 20-30% over',
            'Frequently significantly over',
            'Don\'t track this',
          ],
          required: true,
          aiAnalysisHint: 'Consistent overruns indicate estimating or execution issues.',
        },
        {
          id: 'ops-eff3',
          text: 'What are the main causes of delays or downtime?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Identify root causes for operational improvements.',
        },
        {
          id: 'ops-eff4',
          text: 'How much time is wasted due to rework or corrections?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'Minimal - less than 5%',
            'Moderate - 5-10%',
            'Significant - 10-20%',
            'High - 20%+ of time',
            'Don\'t track this',
          ],
          required: true,
          aiAnalysisHint: 'High rework = quality system issues.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 3: Quality
    // ========================================================================
    {
      id: 'ops-quality',
      title: 'Quality Management',
      description: 'Understanding quality control and customer satisfaction.',
      icon: '✅',
      questions: [
        {
          id: 'ops-q1',
          text: 'How would you rate your quality control processes?',
          type: 'scale',
          category: 'operations',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Reactive only', mid: 'Basic processes', high: 'Comprehensive QC' },
          required: true,
          aiAnalysisHint: 'Weak QC = reputation risk and rework costs.',
        },
        {
          id: 'ops-q2',
          text: 'How often do you receive customer complaints about quality?',
          type: 'multiple-choice',
          category: 'customers',
          options: [
            'Rarely - less than 1% of jobs',
            'Occasionally - 1-5% of jobs',
            'Sometimes - 5-10% of jobs',
            'Frequently - more than 10% of jobs',
            'Don\'t track this systematically',
          ],
          required: true,
          aiAnalysisHint: 'High complaint rate indicates systemic quality issues.',
        },
        {
          id: 'ops-q3',
          text: 'What is your warranty callback rate?',
          type: 'multiple-choice',
          category: 'operations',
          options: [
            'Very low - less than 2%',
            'Low - 2-5%',
            'Moderate - 5-10%',
            'High - more than 10%',
            'Don\'t track this',
          ],
          required: true,
          aiAnalysisHint: 'High callbacks = hidden costs eating into margins.',
        },
        {
          id: 'ops-q4',
          text: 'What is your biggest quality challenge?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Identify specific areas needing process improvement.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 4: Safety
    // ========================================================================
    {
      id: 'ops-safety',
      title: 'Safety Management',
      description: 'Assessing safety culture and performance.',
      icon: '🦺',
      questions: [
        {
          id: 'ops-s1',
          text: 'What is your current Experience Modification Rate (EMR)?',
          helpText: 'Workers comp modifier - 1.0 is average, lower is better.',
          type: 'number',
          category: 'risk',
          required: true,
          aiAnalysisHint: 'EMR > 1.0 indicates safety issues; affects insurance and bid eligibility.',
        },
        {
          id: 'ops-s2',
          text: 'How would you rate your safety culture?',
          type: 'scale',
          category: 'risk',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Safety not prioritized', mid: 'Compliance-focused', high: 'Safety-first culture' },
          required: true,
          aiAnalysisHint: 'Low safety culture = liability risk and insurance cost issues.',
        },
        {
          id: 'ops-s3',
          text: 'Have you had any OSHA citations or significant incidents in the past 3 years?',
          type: 'multiple-choice',
          category: 'risk',
          options: [
            'No incidents or citations',
            'Minor incidents only',
            'One significant incident',
            'Multiple incidents',
            'OSHA citations received',
          ],
          required: true,
          followUp: 'If any, what were the circumstances?',
          aiAnalysisHint: 'Safety record affects insurance, bonding, and reputation.',
        },
        {
          id: 'ops-s4',
          text: 'Do you have a formal safety program with regular training?',
          type: 'multiple-choice',
          category: 'risk',
          options: [
            'Yes - comprehensive program with regular training',
            'Yes - basic program, periodic training',
            'Informal - safety discussed but not structured',
            'Minimal - compliance-only approach',
            'No formal safety program',
          ],
          required: true,
          aiAnalysisHint: 'Lack of formal program is a liability and insurance issue.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 5: Workforce
    // ========================================================================
    {
      id: 'ops-workforce',
      title: 'Workforce Management',
      description: 'Understanding staffing, skills, and labor challenges.',
      icon: '👷',
      questions: [
        {
          id: 'ops-wf1',
          text: 'How difficult is it to find qualified workers?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Easy to hire', mid: 'Manageable', high: 'Very difficult' },
          required: true,
          aiAnalysisHint: 'Labor shortage affects capacity and wage pressure.',
        },
        {
          id: 'ops-wf2',
          text: 'What is your current turnover rate?',
          type: 'multiple-choice',
          category: 'people',
          options: [
            'Low - less than 10% annually',
            'Moderate - 10-20% annually',
            'High - 20-30% annually',
            'Very high - more than 30% annually',
            'Don\'t track this',
          ],
          required: true,
          aiAnalysisHint: 'High turnover = training costs and quality issues.',
        },
        {
          id: 'ops-wf3',
          text: 'How would you rate the skill level of your workforce?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Significant gaps', mid: 'Adequate', high: 'Highly skilled' },
          required: true,
          followUp: 'Where are the biggest skill gaps?',
          aiAnalysisHint: 'Skill gaps limit what work you can pursue.',
        },
        {
          id: 'ops-wf4',
          text: 'Do you have a training and development program?',
          type: 'multiple-choice',
          category: 'people',
          options: [
            'Yes - formal program with career paths',
            'Yes - regular training but informal',
            'Some training - mostly on-the-job',
            'Minimal training',
            'No formal training',
          ],
          required: true,
          aiAnalysisHint: 'Lack of training = retention and quality issues.',
        },
        {
          id: 'ops-wf5',
          text: 'How is morale among your team?',
          type: 'scale',
          category: 'people',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Very low morale', mid: 'Average', high: 'Excellent morale' },
          required: true,
          followUp: 'What affects morale most?',
          aiAnalysisHint: 'Compare with CEO perception of morale.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 6: Supply Chain
    // ========================================================================
    {
      id: 'ops-supply',
      title: 'Supply Chain & Equipment',
      description: 'Understanding vendor relationships and equipment needs.',
      icon: '🔧',
      questions: [
        {
          id: 'ops-sc1',
          text: 'How reliable is your material supply chain?',
          type: 'scale',
          category: 'operations',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Frequent problems', mid: 'Occasionally disrupted', high: 'Very reliable' },
          required: true,
          aiAnalysisHint: 'Supply chain issues affect project timelines and costs.',
        },
        {
          id: 'ops-sc2',
          text: 'Are you dependent on any single vendor for critical materials?',
          type: 'yes-no',
          category: 'risk',
          required: true,
          followUp: 'If yes, what is the risk if that vendor fails?',
          aiAnalysisHint: 'Vendor concentration is a risk factor.',
        },
        {
          id: 'ops-sc3',
          text: 'How would you rate the condition of your equipment and tools?',
          type: 'scale',
          category: 'operations',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'Aging/unreliable', mid: 'Adequate', high: 'Modern/well-maintained' },
          required: true,
          aiAnalysisHint: 'Poor equipment = efficiency loss and capex needs.',
        },
        {
          id: 'ops-sc4',
          text: 'What equipment investments are needed in the next 1-2 years?',
          type: 'textarea',
          category: 'operations',
          required: false,
          aiAnalysisHint: 'Identify capital requirements.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 7: Process & Systems
    // ========================================================================
    {
      id: 'ops-process',
      title: 'Processes & Systems',
      description: 'Understanding operational processes and technology.',
      icon: '⚙️',
      questions: [
        {
          id: 'ops-p1',
          text: 'How documented are your operational processes?',
          type: 'scale',
          category: 'systems',
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: { low: 'In people\'s heads', mid: 'Some documentation', high: 'Fully documented' },
          required: true,
          aiAnalysisHint: 'Undocumented processes = key person risk and scaling issues.',
        },
        {
          id: 'ops-p2',
          text: 'What technology/software do you use for operations management?',
          type: 'textarea',
          category: 'systems',
          required: true,
          aiAnalysisHint: 'Assess technology maturity.',
        },
        {
          id: 'ops-p3',
          text: 'What is the biggest bottleneck in your operations?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Key constraint for improvement focus.',
        },
      ],
    },
    
    // ========================================================================
    // SECTION 8: Wrap-Up
    // ========================================================================
    {
      id: 'ops-wrapup',
      title: 'Final Thoughts',
      description: 'Closing questions and open discussion.',
      icon: '💭',
      questions: [
        {
          id: 'ops-w1',
          text: 'What one change would most improve your operations?',
          type: 'textarea',
          category: 'strategy',
          required: true,
          aiAnalysisHint: 'Often reveals highest-impact opportunity.',
        },
        {
          id: 'ops-w2',
          text: 'What support do you need from leadership that you\'re not getting?',
          type: 'textarea',
          category: 'challenges',
          required: true,
          aiAnalysisHint: 'Reveals leadership alignment gaps.',
        },
        {
          id: 'ops-w3',
          text: 'Is there anything else important about operations I should know?',
          type: 'textarea',
          category: 'challenges',
          required: false,
          aiAnalysisHint: 'May reveal issues not covered in structured questions.',
        },
      ],
    },
  ],
};

export default OPERATIONS_INTERVIEW_TEMPLATE;

