import React, { useState, useEffect } from 'react';
import { Job, JobStatus, CostBreakdown, UserRole, JobType, TMSettings, LaborBillingType } from '../../types';
import { XIcon } from '../shared/icons';
import { getDefaultTMSettings } from '../../lib/jobCalculations';

// --- Helper component for currency input ---
interface CurrencyInputProps {
  id: string;
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  disabled?: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

const parseInput = (input: string): number => {
    const numericString = input.replace(/[^0-9.-]/g, '');
    const number = parseFloat(numericString);
    return isNaN(number) ? 0 : number;
};

const CurrencyInput: React.FC<CurrencyInputProps> = ({ id, name, value, onChange, disabled = false }) => {
    const [displayValue, setDisplayValue] = useState(formatCurrency(value));

    useEffect(() => {
        // Update display value if the underlying model value changes, but not while typing.
        if (parseInput(displayValue) !== value) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value]);
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
        // Show raw number for easy editing. Show empty string for 0 to speed up new entry.
        setDisplayValue(value === 0 ? '' : value.toString());
    };

    const handleBlur = () => {
        const numericValue = parseInput(displayValue);
        // Only notify parent if the value has actually changed
        if (numericValue !== value) {
            onChange(name, numericValue);
        }
        // Always format the display on blur
        setDisplayValue(formatCurrency(numericValue));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    return (
        <input
            type="text"
            id={id}
            name={name}
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-right dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
            inputMode="decimal"
            autoComplete="off"
        />
    );
};
// --- End of helper component ---

// Tab type
type FormTab = 'details' | 'financials';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Job) => void;
  onDelete: (jobId: string) => void;
  jobToEdit: Job | null;
  projectManagers: string[];
  estimators?: string[];
  defaultStatus: JobStatus;
  userRole?: UserRole;
  activeEstimator?: string;
}

const JobFormModal: React.FC<JobFormModalProps> = ({ isOpen, onClose, onSave, onDelete, jobToEdit, projectManagers, estimators = [], defaultStatus, userRole = 'owner', activeEstimator = '' }) => {
  // Estimators can only edit Future jobs
  const isEstimatorWithRestrictedAccess = userRole === 'estimator' && jobToEdit && jobToEdit.status !== JobStatus.Future;
  // Estimators cannot delete jobs
  const canDelete = userRole !== 'estimator';
  
  // Tab state
  const [activeTab, setActiveTab] = useState<FormTab>('details');

  const getInitialState = (): Job => {
    const defaults: Job = {
      id: '',
      jobNo: '',
      jobName: '',
      client: '',
      projectManager: projectManagers[0] || '',
      estimator: userRole === 'estimator' ? activeEstimator : '',
      startDate: 'TBD',
      endDate: 'TBD',
      contract: { labor: 0, material: 0, other: 0 },
      invoiced: { labor: 0, material: 0, other: 0 },
      costs: { labor: 0, material: 0, other: 0 },
      budget: { labor: 0, material: 0, other: 0 },
      costToComplete: { labor: 0, material: 0, other: 0 },
      status: defaultStatus,
      targetProfit: 0,
      targetMargin: 0,
      targetEndDate: 'TBD',
      jobType: 'fixed-price',
    };

    if (jobToEdit) {
      const jobWithFormattedDates = { ...jobToEdit };
      if (jobWithFormattedDates.startDate && jobWithFormattedDates.startDate !== 'TBD') {
        jobWithFormattedDates.startDate = new Date(jobWithFormattedDates.startDate).toISOString().split('T')[0];
      }
      if (jobWithFormattedDates.endDate && jobWithFormattedDates.endDate !== 'TBD') {
        jobWithFormattedDates.endDate = new Date(jobWithFormattedDates.endDate).toISOString().split('T')[0];
      }
      if (jobWithFormattedDates.targetEndDate && jobWithFormattedDates.targetEndDate !== 'TBD') {
        jobWithFormattedDates.targetEndDate = new Date(jobWithFormattedDates.targetEndDate).toISOString().split('T')[0];
      }
      return { ...defaults, ...jobWithFormattedDates };
    }
    return defaults;
  };

  const [job, setJob] = useState<Job>(getInitialState());

  useEffect(() => {
    setJob(getInitialState());
    setActiveTab('details'); // Reset to first tab when modal opens
  }, [jobToEdit, isOpen, projectManagers, defaultStatus, userRole, activeEstimator]);
  
  const handleDateTBDChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setJob(prev => ({ ...prev, [field]: 'TBD' }));
    } else {
      setJob(prev => ({ ...prev, [field]: new Date().toISOString().split('T')[0] }));
    }
  };

  const handleTargetDateTBDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setJob(prev => ({ ...prev, targetEndDate: 'TBD' }));
    } else {
      setJob(prev => ({ ...prev, targetEndDate: new Date().toISOString().split('T')[0] }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'targetMargin') {
      setJob(prev => ({ ...prev, targetMargin: value === '' ? undefined : Number(value) }));
      return;
    }
    setJob({ ...job, [name]: value });
  };

  const handleJobTypeChange = (newType: JobType) => {
    setJob(prev => {
      if (newType === 'time-material' && !prev.tmSettings) {
        // Initialize T&M settings with defaults
        return {
          ...prev,
          jobType: newType,
          tmSettings: getDefaultTMSettings(),
        };
      }
      return { ...prev, jobType: newType };
    });
  };

  const handleTMSettingChange = (field: keyof TMSettings, value: number | LaborBillingType) => {
    setJob(prev => ({
      ...prev,
      tmSettings: {
        ...(prev.tmSettings || getDefaultTMSettings()),
        [field]: value,
      },
    }));
  };
  
  const handleCurrencyChange = (name: string, value: number) => {
    if (name.includes('.')) {
      const [group, key] = name.split('.') as [keyof Job, keyof CostBreakdown];
      setJob(prev => ({ 
          ...prev, 
          [group]: { ...(prev[group] as CostBreakdown), [key]: value } 
      }));
      return;
    }

    setJob(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job.jobName || !job.client || !job.jobNo) {
      alert("Job Name, Job Number, and Client are required.");
      setActiveTab('details'); // Switch to details tab to show required fields
      return;
    }
    
    const isNewJob = !jobToEdit;
    const finalCostToComplete = isNewJob ? job.budget : job.costToComplete;

    const jobToSave: Job = {
        ...job,
        id: jobToEdit ? jobToEdit.id : new Date().getTime().toString(),
        status: job.status,
        costToComplete: finalCostToComplete
    };
    onSave(jobToSave);
  };

  const handleDelete = () => {
    if (jobToEdit) {
      if (window.confirm(`Are you sure you want to delete the job "${jobToEdit.jobName}"? This action cannot be undone.`)) {
        onDelete(jobToEdit.id);
      }
    }
  };
  
  if (!isOpen) return null;

  const isStartDateTBD = job.startDate === 'TBD';
  const isEndDateTBD = job.endDate === 'TBD';
  const isTargetEndDateTBD = job.targetEndDate === 'TBD';
  const isTM = job.jobType === 'time-material';
  const tmSettings = job.tmSettings || getDefaultTMSettings();

  const inputClassName = "mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed";

  // Helper to format markup as percentage for display
  const markupToPercent = (markup: number) => ((markup - 1) * 100).toFixed(0);
  const percentToMarkup = (percent: number) => 1 + (percent / 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{jobToEdit ? 'Edit Job' : 'Add New Job'}</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <XIcon />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'details'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Job Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('financials')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'financials'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Financials
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6">
            {/* Tab 1: Job Details */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {/* Job Type Selector */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Job Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleJobTypeChange('fixed-price')}
                      disabled={isEstimatorWithRestrictedAccess}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                        job.jobType === 'fixed-price'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="font-semibold">Fixed Price</div>
                      <div className="text-xs mt-1 opacity-75">Lump sum contract</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJobTypeChange('time-material')}
                      disabled={isEstimatorWithRestrictedAccess}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                        job.jobType === 'time-material'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="font-semibold">Time & Material</div>
                      <div className="text-xs mt-1 opacity-75">Cost plus markup</div>
                    </button>
                  </div>
                </div>

                {/* Job Name & Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jobName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Name <span className="text-red-500">*</span></label>
                    <input type="text" name="jobName" id="jobName" value={job.jobName} onChange={handleChange} disabled={isEstimatorWithRestrictedAccess} className={inputClassName} required />
                  </div>
                  <div>
                    <label htmlFor="jobNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Number <span className="text-red-500">*</span></label>
                    <input type="text" name="jobNo" id="jobNo" value={job.jobNo} onChange={handleChange} disabled={isEstimatorWithRestrictedAccess} className={inputClassName} required />
                  </div>
                </div>

                {/* Client & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client <span className="text-red-500">*</span></label>
                    <input type="text" name="client" id="client" value={job.client} onChange={handleChange} disabled={isEstimatorWithRestrictedAccess} className={inputClassName} required />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      name="status"
                      id="status"
                      value={job.status}
                      onChange={handleChange}
                      disabled={isEstimatorWithRestrictedAccess}
                      className={inputClassName}
                    >
                      {Object.values(JobStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PM & Estimator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="projectManager" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Manager</label>
                    <select
                      name="projectManager"
                      id="projectManager"
                      value={job.projectManager}
                      onChange={handleChange}
                      disabled={isEstimatorWithRestrictedAccess}
                      className={inputClassName}
                    >
                      <option value="">-- Select a PM --</option>
                      {projectManagers.map(pm => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="estimator" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimator</label>
                    <select
                      name="estimator"
                      id="estimator"
                      value={job.estimator || ''}
                      onChange={handleChange}
                      disabled={isEstimatorWithRestrictedAccess}
                      className={inputClassName}
                    >
                      <option value="">-- Select an Estimator --</option>
                      {estimators.map(est => (
                        <option key={est} value={est}>{est}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <div className="flex items-center">
                        <input id="startDateTBD" type="checkbox" checked={isStartDateTBD} onChange={(e) => handleDateTBDChange(e, 'startDate')} className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 dark:border-gray-600 rounded"/>
                        <label htmlFor="startDateTBD" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">TBD</label>
                      </div>
                    </div>
                    <input type="date" name="startDate" id="startDate" value={isStartDateTBD ? '' : job.startDate} onChange={handleChange} className={inputClassName} disabled={isStartDateTBD} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <div className="flex items-center">
                        <input id="endDateTBD" type="checkbox" checked={isEndDateTBD} onChange={(e) => handleDateTBDChange(e, 'endDate')} className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 dark:border-gray-600 rounded"/>
                        <label htmlFor="endDateTBD" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">TBD</label>
                      </div>
                    </div>
                    <input type="date" name="endDate" id="endDate" value={isEndDateTBD ? '' : job.endDate} onChange={handleChange} className={inputClassName} disabled={isEndDateTBD} />
                  </div>
                </div>

                {/* Targets (only for Fixed Price) */}
                {!isTM && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Targets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="targetProfit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Profit</label>
                        <CurrencyInput id="targetProfit" name="targetProfit" value={job.targetProfit || 0} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="targetMargin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Margin (%)</label>
                        <input
                          type="number"
                          id="targetMargin"
                          name="targetMargin"
                          value={job.targetMargin ?? ''}
                          onChange={handleChange}
                          disabled={isEstimatorWithRestrictedAccess}
                          className={inputClassName}
                          step={0.1}
                          min={0}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label htmlFor="targetEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Completion</label>
                          <div className="flex items-center">
                            <input id="targetEndDateTBD" type="checkbox" checked={isTargetEndDateTBD} onChange={handleTargetDateTBDChange} className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 dark:border-gray-600 rounded" />
                            <label htmlFor="targetEndDateTBD" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">TBD</label>
                          </div>
                        </div>
                        <input
                          type="date"
                          name="targetEndDate"
                          id="targetEndDate"
                          value={isTargetEndDateTBD ? '' : job.targetEndDate}
                          onChange={handleChange}
                          className={inputClassName}
                          disabled={isTargetEndDateTBD || isEstimatorWithRestrictedAccess}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* T&M Settings */}
                {isTM && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">T&M Billing Settings</h3>
                    
                    {/* Labor Billing Type */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labor Billing Method</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleTMSettingChange('laborBillingType', 'fixed-rate')}
                          disabled={isEstimatorWithRestrictedAccess}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            tmSettings.laborBillingType === 'fixed-rate'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                          } disabled:opacity-50`}
                        >
                          Fixed Rate ($/hr)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTMSettingChange('laborBillingType', 'markup')}
                          disabled={isEstimatorWithRestrictedAccess}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            tmSettings.laborBillingType === 'markup'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                          } disabled:opacity-50`}
                        >
                          Markup (%)
                        </button>
                      </div>
                    </div>

                    {/* Labor Settings based on type */}
                    {tmSettings.laborBillingType === 'fixed-rate' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="laborBillRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bill Rate ($/hour)</label>
                          <div className="mt-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              id="laborBillRate"
                              value={tmSettings.laborBillRate || ''}
                              onChange={(e) => handleTMSettingChange('laborBillRate', Number(e.target.value))}
                              disabled={isEstimatorWithRestrictedAccess}
                              className={`${inputClassName} pl-7`}
                              step={0.01}
                              min={0}
                              placeholder="85.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="laborHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hours Worked</label>
                          <input
                            type="number"
                            id="laborHours"
                            value={tmSettings.laborHours || ''}
                            onChange={(e) => handleTMSettingChange('laborHours', Number(e.target.value))}
                            disabled={isEstimatorWithRestrictedAccess}
                            className={inputClassName}
                            step={0.5}
                            min={0}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <label htmlFor="laborMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor Markup (%)</label>
                        <div className="mt-1 relative">
                          <input
                            type="number"
                            id="laborMarkup"
                            value={markupToPercent(tmSettings.laborMarkup || 1)}
                            onChange={(e) => handleTMSettingChange('laborMarkup', percentToMarkup(Number(e.target.value)))}
                            disabled={isEstimatorWithRestrictedAccess}
                            className={`${inputClassName} pr-8`}
                            step={1}
                            min={0}
                            placeholder="50"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., 50% markup means billing 1.5× labor cost</p>
                      </div>
                    )}

                    {/* Material & Other Markup */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="materialMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material Markup (%)</label>
                        <div className="mt-1 relative">
                          <input
                            type="number"
                            id="materialMarkup"
                            value={markupToPercent(tmSettings.materialMarkup || 1)}
                            onChange={(e) => handleTMSettingChange('materialMarkup', percentToMarkup(Number(e.target.value)))}
                            disabled={isEstimatorWithRestrictedAccess}
                            className={`${inputClassName} pr-8`}
                            step={1}
                            min={0}
                            placeholder="15"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="otherMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other Costs Markup (%)</label>
                        <div className="mt-1 relative">
                          <input
                            type="number"
                            id="otherMarkup"
                            value={markupToPercent(tmSettings.otherMarkup || 1)}
                            onChange={(e) => handleTMSettingChange('otherMarkup', percentToMarkup(Number(e.target.value)))}
                            disabled={isEstimatorWithRestrictedAccess}
                            className={`${inputClassName} pr-8`}
                            step={1}
                            min={0}
                            placeholder="10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Financials */}
            {activeTab === 'financials' && (
              <div className="space-y-6">
                {/* Contract Breakdown (only for Fixed Price) */}
                {!isTM && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Contract Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="contract.labor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor</label>
                        <CurrencyInput id="contract.labor" name="contract.labor" value={job.contract.labor} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="contract.material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                        <CurrencyInput id="contract.material" name="contract.material" value={job.contract.material} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="contract.other" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other</label>
                        <CurrencyInput id="contract.other" name="contract.other" value={job.contract.other} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Budget (only for Fixed Price) */}
                {!isTM && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Cost Budget</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="budget.labor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor</label>
                        <CurrencyInput id="budget.labor" name="budget.labor" value={job.budget.labor} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="budget.material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                        <CurrencyInput id="budget.material" name="budget.material" value={job.budget.material} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="budget.other" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other</label>
                        <CurrencyInput id="budget.other" name="budget.other" value={job.budget.other} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoiced to Date */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Invoiced to Date</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="invoiced.labor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor</label>
                      <CurrencyInput id="invoiced.labor" name="invoiced.labor" value={job.invoiced.labor} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                    </div>
                    <div>
                      <label htmlFor="invoiced.material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                      <CurrencyInput id="invoiced.material" name="invoiced.material" value={job.invoiced.material} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                    </div>
                    <div>
                      <label htmlFor="invoiced.other" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other</label>
                      <CurrencyInput id="invoiced.other" name="invoiced.other" value={job.invoiced.other} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                    </div>
                  </div>
                </div>

                {/* Costs to Date */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Costs to Date</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="costs.labor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor</label>
                      <CurrencyInput id="costs.labor" name="costs.labor" value={job.costs.labor} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                    </div>
                    <div>
                      <label htmlFor="costs.material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                      <CurrencyInput id="costs.material" name="costs.material" value={job.costs.material} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                    </div>
                    <div>
                      <label htmlFor="costs.other" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other</label>
                      <CurrencyInput id="costs.other" name="costs.other" value={job.costs.other} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                    </div>
                  </div>
                </div>

                {/* Cost to Complete (only for Fixed Price) */}
                {!isTM && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost to Complete</h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Estimate of remaining costs</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="costToComplete.labor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor</label>
                        <CurrencyInput id="costToComplete.labor" name="costToComplete.labor" value={job.costToComplete.labor} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="costToComplete.material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                        <CurrencyInput id="costToComplete.material" name="costToComplete.material" value={job.costToComplete.material} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                      <div>
                        <label htmlFor="costToComplete.other" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other</label>
                        <CurrencyInput id="costToComplete.other" name="costToComplete.other" value={job.costToComplete.other} onChange={handleCurrencyChange} disabled={isEstimatorWithRestrictedAccess} />
                      </div>
                    </div>
                  </div>
                )}

                {/* T&M Info Box */}
                {isTM && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Time & Material Billing</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      For T&M jobs, earned revenue is calculated from your costs plus markup. 
                      Contract and budget fields are not used. Over/under billed is determined by 
                      comparing invoiced amounts to earned revenue.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Estimator Warning */}
            {isEstimatorWithRestrictedAccess && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>View Only:</strong> As an Estimator, you can only edit jobs with "Future" status. This job is currently "{jobToEdit?.status}".
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center flex-shrink-0">
            <div>
              {jobToEdit && canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Job
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 dark:border-gray-500 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                {isEstimatorWithRestrictedAccess ? 'Close' : 'Cancel'}
              </button>
              {!isEstimatorWithRestrictedAccess && (
                <button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Save Job
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobFormModal;
