/**
 * Centralized workflow guides for WIP Insights
 * 
 * These structured workflows serve multiple purposes:
 * 1. User documentation (displayed in WorkflowsPage)
 * 2. Chatbot reference (AI can parse and present steps)
 * 3. Future video guides (steps map to chapters)
 */

export interface WorkflowStep {
  title: string;
  description: string;
  tips?: string[];
  action?: string;
  route?: string;
}

export interface Workflow {
  id: string;
  title: string;
  icon: string;
  description: string;
  when: string;
  frequency: 'one-time' | 'as-needed' | 'weekly' | 'monthly';
  estimatedMinutes: number;
  steps: WorkflowStep[];
  tips: string[];
  relatedTerms: string[];
}

// WORKFLOW 1: Setting Up a New Company
const setupCompanyWorkflow: Workflow = {
  id: 'setup-company',
  title: 'Setting Up a New Company',
  icon: '🏢',
  description: 'Configure your company settings, add team members, and prepare WIP Insights for your first job.',
  when: 'When you first sign up or need to set up a new client company',
  frequency: 'one-time',
  estimatedMinutes: 10,
  steps: [
    {
      title: 'Complete Company Registration',
      description: 'Sign up with your email and create your account. Enter your company name during onboarding.',
      tips: ['Use a work email for professional correspondence', 'Choose a company name that matches your legal business name'],
    },
    {
      title: 'Upload Your Company Logo',
      description: 'Go to Settings and upload your company logo. This appears on reports and exports.',
      action: 'Open Settings',
      tips: ['Use a square image (PNG or JPG)', 'Recommended size: 200x200 pixels or larger'],
    },
    {
      title: 'Add Project Managers',
      description: 'In Settings, add your Project Managers. Each job will be assigned to a PM for accountability.',
      tips: ['Add at least one PM before creating jobs', 'Use full names for clarity in reports'],
    },
    {
      title: 'Add Estimators (Optional)',
      description: 'If your company has dedicated estimators, add them here. Estimators have access to Future jobs.',
      tips: ['Estimators can only edit Future (not-yet-started) jobs', 'This role is optional for smaller companies'],
    },
    {
      title: 'Set Your Week End Day',
      description: 'Choose when your work week ends (typically Friday or Saturday). This affects weekly reports.',
      tips: ['Match this to your payroll week for consistency', 'Most contractors use Friday or Saturday'],
    },
    {
      title: 'Configure Labor Capacity (Optional)',
      description: 'Set up your available labor hours to help forecast if you have bandwidth for new work.',
      tips: ['Enter average available hours per week', 'Update seasonally if your workforce changes'],
    },
  ],
  tips: [
    'You can update settings anytime as your company grows',
    'Invite team members after initial setup is complete',
    'Start with just the basics - you can add more detail later',
  ],
  relatedTerms: ['settings', 'status'],
};

// WORKFLOW 2: Creating a New Job
const createJobWorkflow: Workflow = {
  id: 'create-job',
  title: 'Creating a New Job',
  icon: '📋',
  description: 'Set up a new job with contract details, budget, and assignment. Get it ready for cost tracking.',
  when: 'When you win a new contract or start a new project',
  frequency: 'as-needed',
  estimatedMinutes: 5,
  steps: [
    {
      title: 'Click "Add Job" Button',
      description: 'From the main dashboard, click the "Add Job" button in the header.',
      action: 'Add Job',
      tips: ['Keyboard shortcut: Press "N" for new job'],
    },
    {
      title: 'Enter Job Details',
      description: 'Fill in Job Number (your internal reference), Job Name (descriptive title), and Client name.',
      tips: ['Use your existing job numbering system', 'Be descriptive - "Smith Residence Addition" not "Smith"'],
    },
    {
      title: 'Select Job Type',
      description: 'Choose Fixed Price or Time & Material (T&M). This determines how earned revenue is calculated.',
      tips: ['Fixed Price: Set contract amount, earn based on % complete', 'T&M: Bill costs plus markup, no fixed contract'],
    },
    {
      title: 'Assign Project Manager',
      description: 'Select the PM responsible for this job. They will see it in their filtered view.',
      tips: ['PM assignment affects role-based filtering', 'You can reassign later if needed'],
    },
    {
      title: 'Set Start and End Dates',
      description: 'Enter planned start and completion dates. Use "TBD" if dates are not confirmed.',
      tips: ['These dates drive the Gantt view', 'Update as the schedule evolves'],
    },
    {
      title: 'Enter Contract Amount',
      description: 'For Fixed Price jobs, enter the total contract by Labor, Material, and Other.',
      tips: ['Break down by category for margin analysis', 'Include all change orders', 'For T&M, leave at $0'],
    },
    {
      title: 'Enter Cost Budget',
      description: 'Enter your estimated costs to complete the job. This is your internal budget.',
      tips: ['Budget should be less than Contract', 'Use your estimate or bid numbers', 'Do not change after job starts'],
    },
    {
      title: 'Set Job Status',
      description: 'Choose the initial status: Future (not started), Active (in progress), etc.',
      tips: ['Start as Future if work has not begun', 'Move to Active when work starts'],
    },
    {
      title: 'Save the Job',
      description: 'Click Save to create the job. It appears in your job list ready for tracking.',
      tips: ['You can edit any field later', 'Add notes for context or special instructions'],
    },
  ],
  tips: [
    'Set up jobs as soon as contracts are signed',
    'Keep job numbers consistent with your accounting system',
    'Use Future status for jobs in your sales pipeline',
  ],
  relatedTerms: ['jobType', 'status', 'contract', 'budget'],
};

// WORKFLOW 3: Updating Job Financials
const updateJobWorkflow: Workflow = {
  id: 'update-job',
  title: 'Updating Job Financials',
  icon: '💰',
  description: 'Keep your WIP current by updating costs, billing, and estimates. The heart of accurate job tracking.',
  when: 'After receiving job cost reports, monthly close, or billing updates',
  frequency: 'weekly',
  estimatedMinutes: 15,
  steps: [
    {
      title: 'Set the "As Of" Date',
      description: 'Set the "Financial Data As Of" date before updating. This tells the system what period your data represents.',
      tips: ['Updating November data on December 3rd? Set As Of = November 30', 'Always set this BEFORE entering costs'],
    },
    {
      title: 'Update Costs to Date',
      description: 'Enter actual costs incurred by Labor, Material, and Other. Pull from your accounting system.',
      tips: ['Use cumulative totals, not just this period', 'Include all job costs: labor, subs, materials, equipment'],
    },
    {
      title: 'Update Cost to Complete',
      description: 'Estimate remaining costs to finish the job. Be realistic - this drives your profit forecast.',
      tips: ['Do not just copy Budget minus Costs - think it through', 'Consider scope changes and delays'],
    },
    {
      title: 'Update Invoiced to Date',
      description: 'Enter the cumulative amount billed to the client. Used to calculate Over/Under billing.',
      tips: ['Use total invoiced, not just recent invoices', 'Include retention held back'],
    },
    {
      title: 'Check the Job Card Indicators',
      description: 'Review Over/Under billing, % Complete, and Profit indicators for red flags.',
      tips: ['Under-billed by a lot? Invoice immediately!', '% Complete should match your gut feel of progress'],
    },
    {
      title: 'Add Notes for Context',
      description: 'Document unusual situations - delays, change orders, disputes. Creates an audit trail.',
      tips: ['Notes are timestamped automatically', 'Mention why numbers changed significantly'],
    },
    {
      title: 'Repeat for All Active Jobs',
      description: 'Update each active job. Use filters to show only Active jobs, then work through the list.',
      tips: ['Update big jobs first', 'Skip Completed jobs unless there are final costs'],
    },
  ],
  tips: [
    'Weekly updates are better than monthly - catch problems early',
    'Set a recurring calendar reminder for "WIP Update Day"',
    'Have PMs update their own jobs for accountability',
    'Save snapshots after updating for historical tracking',
  ],
  relatedTerms: ['costsToDate', 'costToComplete', 'invoiced', 'earnedRevenue', 'overUnderBilled'],
};

// WORKFLOW 4: Running Reports
const runReportsWorkflow: Workflow = {
  id: 'run-reports',
  title: 'Running Reports',
  icon: '📊',
  description: 'Generate weekly and month-end reports for management review and accounting.',
  when: 'Weekly for management updates, monthly for accounting close',
  frequency: 'weekly',
  estimatedMinutes: 5,
  steps: [
    {
      title: 'Navigate to Reports Tab',
      description: 'Click the "Reports" button in the top navigation to access the reporting dashboard.',
      action: 'Go to Reports',
      tips: ['Make sure all jobs are updated before running reports'],
    },
    {
      title: 'Weekly Earned Revenue Report',
      description: 'View the 5-week lookback of earned revenue. Shows trends and workload changes.',
      tips: ['Look for week-over-week changes', 'Significant drops may indicate delayed jobs'],
    },
    {
      title: 'Month-End WIP Report',
      description: 'Generate the comprehensive report showing all jobs, over/under billing, and profitability.',
      tips: ['Run after all jobs are updated with month-end data', 'This is your accountant\'s primary WIP report'],
    },
    {
      title: 'Export to PDF',
      description: 'Click "Export PDF" to generate a printable document with your company branding.',
      tips: ['PDFs include your company logo', 'Share with bankers, bonding agents, or management'],
    },
    {
      title: 'Review Company View',
      description: 'The Company view shows an executive summary by Project Manager.',
      tips: ['Drill down into any PM to see their jobs', 'Week-over-week changes show workload trends'],
    },
    {
      title: 'Check Forecast View',
      description: 'The Forecast view projects cash flow based on current job data.',
      tips: ['Shows when revenue will be earned', 'Helps identify cash flow gaps'],
    },
  ],
  tips: [
    'Run Weekly Earned Revenue every week for trend visibility',
    'Run Month-End Report after your accounting close each month',
    'Always update all jobs BEFORE running reports',
    'Keep PDF archives for year-over-year comparisons',
  ],
  relatedTerms: ['earnedRevenue', 'overUnderBilled', 'percentComplete'],
};

// EXPORT
export const workflows: Workflow[] = [
  setupCompanyWorkflow,
  createJobWorkflow,
  updateJobWorkflow,
  runReportsWorkflow,
];

export const getWorkflowById = (id: string): Workflow | undefined => {
  return workflows.find(w => w.id === id);
};

export const getWorkflowsByFrequency = (frequency: Workflow['frequency']): Workflow[] => {
  return workflows.filter(w => w.frequency === frequency);
};

// Helper for chatbot - returns plain text version
export const getWorkflowAsText = (workflow: Workflow): string => {
  let text = `# ${workflow.title}\n\n${workflow.description}\n\n`;
  text += `When: ${workflow.when}\nFrequency: ${workflow.frequency}\nTime: ${workflow.estimatedMinutes} min\n\n`;
  text += `## Steps\n\n`;
  workflow.steps.forEach((step, i) => {
    text += `${i + 1}. ${step.title}\n   ${step.description}\n`;
    step.tips?.forEach(tip => { text += `   - ${tip}\n`; });
    text += '\n';
  });
  text += `## Tips\n`;
  workflow.tips.forEach(tip => { text += `- ${tip}\n`; });
  return text;
};

