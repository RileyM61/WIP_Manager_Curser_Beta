import React, { useState, useEffect } from 'react';
import { Job, JobStatus, CostBreakdown, UserRole, JobType, TMSettings, LaborBillingType, MobilizationPhase } from '../../types';
import { XIcon } from '../shared/icons';
import { CurrencyInput } from '../shared/CurrencyInput';
import { getDefaultTMSettings } from '../../lib/jobCalculations';
import InfoTooltip from '../help/InfoTooltip';
import { helpContent } from '../../lib/helpContent';

// Default mobilization phases
const getDefaultMobilizations = (): MobilizationPhase[] => [
  { id: 1, enabled: true, mobilizeDate: 'TBD', demobilizeDate: 'TBD', description: '' },
  { id: 2, enabled: false, mobilizeDate: 'TBD', demobilizeDate: 'TBD', description: '' },
  { id: 3, enabled: false, mobilizeDate: 'TBD', demobilizeDate: 'TBD', description: '' },
  { id: 4, enabled: false, mobilizeDate: 'TBD', demobilizeDate: 'TBD', description: '' },
];

// Tab type
type FormTab = 'details' | 'scheduling' | 'financials';

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
      mobilizations: getDefaultMobilizations(),
      asOfDate: new Date().toISOString().split('T')[0], // Default to today
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
      // Format asOfDate (default to today if not set)
      if (jobWithFormattedDates.asOfDate) {
        jobWithFormattedDates.asOfDate = new Date(jobWithFormattedDates.asOfDate).toISOString().split('T')[0];
      } else {
        jobWithFormattedDates.asOfDate = new Date().toISOString().split('T')[0];
      }
      // Format mobilization dates
      if (jobWithFormattedDates.mobilizations) {
        jobWithFormattedDates.mobilizations = jobWithFormattedDates.mobilizations.map(mob => ({
          ...mob,
          mobilizeDate: mob.mobilizeDate && mob.mobilizeDate !== 'TBD' 
            ? new Date(mob.mobilizeDate).toISOString().split('T')[0] 
            : mob.mobilizeDate,
          demobilizeDate: mob.demobilizeDate && mob.demobilizeDate !== 'TBD'
            ? new Date(mob.demobilizeDate).toISOString().split('T')[0]
            : mob.demobilizeDate,
        }));
      } else {
        jobWithFormattedDates.mobilizations = getDefaultMobilizations();
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

  const handleMobilizationChange = (
    phaseId: number,
    field: keyof MobilizationPhase,
    value: string | boolean
  ) => {
    setJob(prev => ({
      ...prev,
      mobilizations: (prev.mobilizations || getDefaultMobilizations()).map(mob =>
        mob.id === phaseId ? { ...mob, [field]: value } : mob
      ),
    }));
  };

  const handleMobDateTBDChange = (
    phaseId: number,
    field: 'mobilizeDate' | 'demobilizeDate',
    isTBD: boolean
  ) => {
    setJob(prev => ({
      ...prev,
      mobilizations: (prev.mobilizations || getDefaultMobilizations()).map(mob =>
        mob.id === phaseId
          ? { ...mob, [field]: isTBD ? 'TBD' : new Date().toISOString().split('T')[0] }
          : mob
      ),
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
              onClick={() => setActiveTab('scheduling')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'scheduling'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Scheduling
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

                {/* Targets (only for Fixed Price) */}
                {!isTM && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Profit Targets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                )}

                {/* T&M Settings */}
                {isTM && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">T&M Billing Settings</h3>
                    
                    {/* Labor Billing Type */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor Billing Method</label>
                        <InfoTooltip
                          title={helpContent.laborBillingType.title}
                          shortText={helpContent.laborBillingType.short}
                          detailedText={helpContent.laborBillingType.detailed}
                          example={helpContent.laborBillingType.example}
                        />
                      </div>
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
                        <div className="flex items-center gap-2">
                          <label htmlFor="laborMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor Markup (%)</label>
                          <InfoTooltip
                            title={helpContent.laborMarkup.title}
                            shortText={helpContent.laborMarkup.short}
                            detailedText={helpContent.laborMarkup.detailed}
                            formula={helpContent.laborMarkup.formula}
                            example={helpContent.laborMarkup.example}
                          />
                        </div>
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
                        <div className="flex items-center gap-2">
                          <label htmlFor="materialMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material Markup (%)</label>
                          <InfoTooltip
                            title={helpContent.materialMarkup.title}
                            shortText={helpContent.materialMarkup.short}
                            detailedText={helpContent.materialMarkup.detailed}
                            formula={helpContent.materialMarkup.formula}
                          />
                        </div>
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

            {/* Tab 2: Scheduling */}
            {activeTab === 'scheduling' && (
              <div className="space-y-6">
                {/* Contract Dates */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Contract Dates</h3>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contractual project start date</p>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contractual completion date</p>
                    </div>
                  </div>
                </div>

                {/* Mobilization Phases */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mobilization Phases</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Used for Gantt chart scheduling</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Define when your crew mobilizes and demobilizes on site. Enable additional phases for projects with multiple work periods.
                  </p>
                  
                  <div className="space-y-4">
                    {(job.mobilizations || getDefaultMobilizations()).map((mob, idx) => {
                      const isMobDateTBD = mob.mobilizeDate === 'TBD';
                      const isDemobDateTBD = mob.demobilizeDate === 'TBD';
                      const phaseColors = [
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                        'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                        'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
                      ];
                      const phaseAccentColors = [
                        'text-emerald-700 dark:text-emerald-300',
                        'text-blue-700 dark:text-blue-300',
                        'text-purple-700 dark:text-purple-300',
                        'text-amber-700 dark:text-amber-300',
                      ];
                      
                      return (
                        <div 
                          key={mob.id}
                          className={`rounded-lg border-2 p-4 transition-all ${
                            mob.enabled 
                              ? phaseColors[idx] 
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                          }`}
                        >
                          {/* Phase Header with Enable Checkbox */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`mob-enabled-${mob.id}`}
                                checked={mob.enabled}
                                onChange={(e) => handleMobilizationChange(mob.id, 'enabled', e.target.checked)}
                                disabled={isEstimatorWithRestrictedAccess || (mob.id === 1)} // Phase 1 always enabled
                                className="h-5 w-5 text-brand-blue focus:ring-brand-blue border-gray-300 dark:border-gray-600 rounded"
                              />
                              <label 
                                htmlFor={`mob-enabled-${mob.id}`} 
                                className={`font-semibold ${mob.enabled ? phaseAccentColors[idx] : 'text-gray-500 dark:text-gray-400'}`}
                              >
                                Phase {mob.id}
                              </label>
                              {mob.id === 1 && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">(Required)</span>
                              )}
                            </div>
                            {mob.enabled && (
                              <input
                                type="text"
                                placeholder="Description (optional)"
                                value={mob.description || ''}
                                onChange={(e) => handleMobilizationChange(mob.id, 'description', e.target.value)}
                                disabled={isEstimatorWithRestrictedAccess}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-40 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                              />
                            )}
                          </div>
                          
                          {/* Date Fields (only shown when enabled) */}
                          {mob.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mobilize Date
                                  </label>
                                  <div className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      checked={isMobDateTBD} 
                                      onChange={(e) => handleMobDateTBDChange(mob.id, 'mobilizeDate', e.target.checked)}
                                      className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 dark:border-gray-600 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">TBD</span>
                                  </div>
                                </div>
                                <input
                                  type="date"
                                  value={isMobDateTBD ? '' : mob.mobilizeDate}
                                  onChange={(e) => handleMobilizationChange(mob.id, 'mobilizeDate', e.target.value)}
                                  disabled={isMobDateTBD || isEstimatorWithRestrictedAccess}
                                  className={inputClassName}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Demobilize Date
                                  </label>
                                  <div className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      checked={isDemobDateTBD} 
                                      onChange={(e) => handleMobDateTBDChange(mob.id, 'demobilizeDate', e.target.checked)}
                                      className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 dark:border-gray-600 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">TBD</span>
                                  </div>
                                </div>
                                <input
                                  type="date"
                                  value={isDemobDateTBD ? '' : mob.demobilizeDate}
                                  onChange={(e) => handleMobilizationChange(mob.id, 'demobilizeDate', e.target.value)}
                                  disabled={isDemobDateTBD || isEstimatorWithRestrictedAccess}
                                  className={inputClassName}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Target Completion */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Target Completion</h3>
                  <div className="max-w-md">
                    <div className="flex items-center justify-between">
                      <label htmlFor="targetEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Completion Date</label>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your internal goal for project completion (may differ from contract)</p>
                  </div>
                </div>

                {/* Schedule Summary */}
                {!isStartDateTBD && !isEndDateTBD && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Schedule Summary</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Contract Duration</span>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {(() => {
                              const start = new Date(job.startDate);
                              const end = new Date(job.endDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              const months = Math.floor(diffDays / 30);
                              const weeks = Math.floor((diffDays % 30) / 7);
                              if (months > 0) return `${months} mo ${weeks > 0 ? `${weeks} wk` : ''}`;
                              return `${Math.ceil(diffDays / 7)} weeks`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Active Phases</span>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {(job.mobilizations || []).filter(m => m.enabled).length} of 4
                          </p>
                        </div>
                        {!isTargetEndDateTBD && job.targetEndDate !== 'TBD' && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Target vs Contract</span>
                            <p className={`font-semibold ${
                              new Date(job.targetEndDate) <= new Date(job.endDate) 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {(() => {
                                const target = new Date(job.targetEndDate);
                                const end = new Date(job.endDate);
                                const diffTime = end.getTime() - target.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (diffDays === 0) return 'On target';
                                if (diffDays > 0) return `${diffDays} days early`;
                                return `${Math.abs(diffDays)} days late`;
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Financials */}
            {activeTab === 'financials' && (
              <div className="space-y-6">
                {/* Contract Breakdown (only for Fixed Price) */}
                {!isTM && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contract Breakdown</h3>
                      <InfoTooltip
                        title={helpContent.contract.title}
                        shortText={helpContent.contract.short}
                        detailedText={helpContent.contract.detailed}
                        example={helpContent.contract.example}
                      />
                    </div>
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
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost Budget</h3>
                      <InfoTooltip
                        title={helpContent.budget.title}
                        shortText={helpContent.budget.short}
                        detailedText={helpContent.budget.detailed}
                        formula={helpContent.budget.formula}
                        example={helpContent.budget.example}
                      />
                    </div>
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
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoiced to Date</h3>
                    <InfoTooltip
                      title={helpContent.invoiced.title}
                      shortText={helpContent.invoiced.short}
                      detailedText={helpContent.invoiced.detailed}
                    />
                  </div>
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

                {/* Financial Data As Of Date */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="asOfDate" className="block text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        Financial Data As Of
                      </label>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                        Set the date this cost/billing data represents (for accurate period reporting)
                      </p>
                      <input
                        type="date"
                        id="asOfDate"
                        name="asOfDate"
                        value={job.asOfDate || ''}
                        onChange={(e) => setJob(prev => ({ ...prev, asOfDate: e.target.value }))}
                        className="w-48 px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled={isEstimatorWithRestrictedAccess}
                      />
                    </div>
                  </div>
                </div>

                {/* Costs to Date */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Costs to Date</h3>
                    <InfoTooltip
                      title={helpContent.costsToDate.title}
                      shortText={helpContent.costsToDate.short}
                      detailedText={helpContent.costsToDate.detailed}
                    />
                  </div>
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
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost to Complete</h3>
                      <InfoTooltip
                        title={helpContent.costToComplete.title}
                        shortText={helpContent.costToComplete.short}
                        detailedText={helpContent.costToComplete.detailed}
                        formula={helpContent.costToComplete.formula}
                        example={helpContent.costToComplete.example}
                      />
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

                {/* Labor Cost Per Hour */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Labor Rate</h3>
                  </div>
                  <div className="max-w-xs">
                    <label htmlFor="laborCostPerHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labor Cost Per Hour</label>
                    <div className="mt-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        id="laborCostPerHour"
                        name="laborCostPerHour"
                        value={job.laborCostPerHour || ''}
                        onChange={(e) => setJob(prev => ({ ...prev, laborCostPerHour: e.target.value ? Number(e.target.value) : undefined }))}
                        disabled={isEstimatorWithRestrictedAccess}
                        className={`${inputClassName} pl-7`}
                        step={0.01}
                        min={0}
                        placeholder="65.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">/hr</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Used to calculate labor hours for capacity planning
                      {job.laborCostPerHour && job.costToComplete.labor > 0 && (
                        <span className="block mt-1 text-blue-600 dark:text-blue-400 font-medium">
                          ≈ {Math.round(job.costToComplete.labor / job.laborCostPerHour).toLocaleString()} hours remaining
                        </span>
                      )}
                    </p>
                  </div>
                </div>

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
