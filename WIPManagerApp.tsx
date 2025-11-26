import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Job, JobStatus, ViewMode, SortKey, SortDirection, FilterType, Note, Settings, JobsSnapshot, UserRole, CostBreakdown, CapacityPlan, StaffingDiscipline } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSupabaseJobs } from './hooks/useSupabaseJobs';
import { useSupabaseSettings } from './hooks/useSupabaseSettings';
import { useSupabaseNotes } from './hooks/useSupabaseNotes';
import { useAuth } from './context/AuthContext';
import { exportJobsToCSV, exportJobsToPDF } from './lib/exportUtils';
import Header from './components/layout/Header';
import Controls from './components/layout/Controls';
import JobCardGrid from './components/jobs/JobCardGrid';
import JobTable from './components/jobs/JobTable';
import JobFormModal from './components/modals/JobFormModal';
import CompanyView from './components/views/CompanyView';
import ForecastView from './components/views/ForecastView';
import NotesModal from './components/modals/NotesModal';
import SettingsModal from './components/modals/SettingsModal';
import CapacityModal from './components/modals/CapacityModal';

const baseCapacityPlan: CapacityPlan = {
  planningHorizonWeeks: 8,
  notes: 'Baseline staffing plan for current backlog and awarded work.',
  lastUpdated: '2024-07-01T08:00:00Z',
  rows: [
    {
      id: 'cap-pm',
      discipline: StaffingDiscipline.ProjectManagement,
      label: StaffingDiscipline.ProjectManagement,
      headcount: 3,
      hoursPerPerson: 40,
      committedHours: 110,
    },
    {
      id: 'cap-super',
      discipline: StaffingDiscipline.Superintendents,
      label: StaffingDiscipline.Superintendents,
      headcount: 4,
      hoursPerPerson: 45,
      committedHours: 150,
    },
    {
      id: 'cap-engineering',
      discipline: StaffingDiscipline.Engineering,
      label: StaffingDiscipline.Engineering,
      headcount: 5,
      hoursPerPerson: 40,
      committedHours: 165,
    },
    {
      id: 'cap-field',
      discipline: StaffingDiscipline.FieldLabor,
      label: StaffingDiscipline.FieldLabor,
      headcount: 32,
      hoursPerPerson: 38,
      committedHours: 1120,
    },
    {
      id: 'cap-safety',
      discipline: StaffingDiscipline.Safety,
      label: StaffingDiscipline.Safety,
      headcount: 2,
      hoursPerPerson: 40,
      committedHours: 60,
    },
  ],
};

const cloneCapacityPlan = (plan: CapacityPlan): CapacityPlan => ({
  ...plan,
  rows: plan.rows.map(row => ({ ...row })),
});

const initialJobs: Job[] = [
  {
    id: '1',
    jobNo: '23-001',
    jobName: 'Downtown Office Tower',
    client: 'SkyHigh Developments',
    projectManager: 'Alice Johnson',
    startDate: '2023-08-15',
    endDate: '2025-06-30',
    contract: { labor: 7000000, material: 6500000, other: 1500000 },
    invoiced: { labor: 3500000, material: 3000000, other: 500000 },
    costs: { labor: 3000000, material: 2500000, other: 1000000 },
    budget: { labor: 6000000, material: 5500000, other: 1500000 },
    costToComplete: { labor: 3200000, material: 3100000, other: 500000 }, // Showing some slippage
    targetProfit: 2250000,
    targetMargin: 15,
    targetEndDate: '2025-06-01',
    status: JobStatus.Active,
    notes: [
        { id: 'n1', text: 'Client requested a change order for the lobby flooring. Awaiting pricing.', date: '2024-07-15T14:30:00Z'},
        { id: 'n2', text: 'Weekly safety inspection passed with no issues.', date: '2024-07-18T10:00:00Z'},
    ],
    lastUpdated: '2024-07-18T11:00:00Z',
  },
  {
    id: '2',
    jobNo: '22-105',
    jobName: 'Greenwood Shopping Mall',
    client: 'Retail Estates Inc.',
    projectManager: 'Bob Williams',
    startDate: '2022-05-20',
    endDate: '2024-11-10',
    contract: { labor: 12500000, material: 10000000, other: 2500000 },
    invoiced: { labor: 12500000, material: 10000000, other: 2500000 },
    costs: { labor: 12000000, material: 10000000, other: 2500000 },
    budget: { labor: 12000000, material: 10000000, other: 2500000 },
    costToComplete: { labor: 0, material: 0, other: 0 },
    targetProfit: 2500000,
    targetMargin: 10,
    targetEndDate: '2024-10-31',
    status: JobStatus.Completed,
    lastUpdated: '2024-06-20T09:00:00Z',
  },
  {
    id: '3',
    jobNo: '24-003',
    jobName: 'Coastal Highway Bridge',
    client: 'State DOT',
    projectManager: 'Charlie Brown',
    startDate: '2024-01-10',
    endDate: '2025-12-20',
    contract: { labor: 4000000, material: 3500000, other: 700000 },
    invoiced: { labor: 600000, material: 800000, other: 100000 },
    costs: { labor: 500000, material: 600000, other: 100000 },
    budget: { labor: 3500000, material: 3000000, other: 500000 },
    costToComplete: { labor: 3000000, material: 2400000, other: 400000 },
    targetProfit: 1200000,
    targetMargin: 14.5,
    targetEndDate: '2025-11-30',
    status: JobStatus.OnHold,
    onHoldDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // On hold for 10 days
    lastUpdated: '2024-07-10T16:20:00Z',
  },
   {
    id: '4',
    jobNo: '21-012',
    jobName: 'Sunrise Residential Complex',
    client: 'Evergreen Homes',
    projectManager: 'Alice Johnson',
    startDate: '2021-03-01',
    endDate: '2023-09-15',
    contract: { labor: 5500000, material: 6500000, other: 1000000 },
    invoiced: { labor: 5500000, material: 6500000, other: 1000000 },
    costs: { labor: 5000000, material: 6000000, other: 800000 },
    budget: { labor: 5000000, material: 6000000, other: 800000 },
    costToComplete: { labor: 0, material: 0, other: 0 },
    targetProfit: 1800000,
    targetMargin: 13.8,
    targetEndDate: '2023-09-15',
    status: JobStatus.Archived,
    lastUpdated: '2023-10-01T12:00:00Z',
  },
  {
    id: '5',
    jobNo: '25-001',
    jobName: 'Northgate Logistics Hub',
    client: 'Global Shipping Co.',
    projectManager: 'David Chen',
    startDate: 'TBD',
    endDate: '2026-10-31',
    contract: { labor: 8000000, material: 8500000, other: 1500000 },
    invoiced: { labor: 0, material: 0, other: 0 },
    costs: { labor: 0, material: 0, other: 0 },
    budget: { labor: 7000000, material: 8000000, other: 1000000 },
    costToComplete: { labor: 7000000, material: 8000000, other: 1000000 },
    targetProfit: 3000000,
    targetMargin: 16.5,
    targetEndDate: '2026-09-30',
    status: JobStatus.Future,
    lastUpdated: '2024-05-15T09:30:00Z',
  },
   {
    id: '6',
    jobNo: '25-002',
    jobName: 'West End Hospital Wing',
    client: 'Community Health',
    projectManager: 'Alice Johnson',
    startDate: 'TBD',
    endDate: '2027-01-15',
    contract: { labor: 11000000, material: 9500000, other: 2000000 },
    invoiced: { labor: 0, material: 0, other: 0 },
    costs: { labor: 0, material: 0, other: 0 },
    budget: { labor: 10000000, material: 9000000, other: 1500000 },
    costToComplete: { labor: 10000000, material: 9000000, other: 1500000 },
    targetProfit: 3500000,
    targetMargin: 15.6,
    targetEndDate: '2026-12-15',
    status: JobStatus.Future,
    lastUpdated: '2024-06-01T14:00:00Z',
  },
];

const initialSettings: Settings = {
    companyName: 'WIP Insights',
    projectManagers: [...new Set(initialJobs.map(j => j.projectManager).filter(Boolean))].sort(),
    weekEndDay: 'Friday',
    defaultStatus: JobStatus.Future,
    defaultRole: 'owner',
    capacityEnabled: true,
    capacityPlan: cloneCapacityPlan(baseCapacityPlan),
};

type FocusMode = 'default' | 'pm-at-risk' | 'pm-late';

type QuickFilterKey =
  | 'owner-backlog'
  | 'owner-capacity'
  | 'pm-my-jobs'
  | 'pm-at-risk'
  | 'pm-late';

const sumBreakdown = (breakdown: CostBreakdown): number =>
  breakdown.labor + breakdown.material + breakdown.other;

const getForecastedProfit = (job: Job): number => {
  const totalContract = sumBreakdown(job.contract);
  const totalCosts = sumBreakdown(job.costs);
  const totalCostToComplete = sumBreakdown(job.costToComplete);
  return totalContract - (totalCosts + totalCostToComplete);
};

const isJobBehindTargetDate = (job: Job): boolean => {
  if (!job.targetEndDate || job.targetEndDate === 'TBD' || job.endDate === 'TBD') {
    return false;
  }
  const plannedCompletion = new Date(job.targetEndDate).getTime();
  const currentCompletion = new Date(job.endDate).getTime();
  return currentCompletion > plannedCompletion;
};

function App() {
  const { companyId, signOut } = useAuth();
  // Supabase hooks for data
  const { jobs, loading: jobsLoading, addJob, updateJob, deleteJob, refreshJobs } = useSupabaseJobs(companyId);
  const { settings, loading: settingsLoading, error: settingsError, updateSettings, refreshSettings } = useSupabaseSettings(companyId);
  const { loadNotes, addNote: addNoteToSupabase } = useSupabaseNotes(companyId);
  
  // Local storage for UI preferences (not stored in Supabase)
  const [snapshot, setSnapshot] = useLocalStorage<JobsSnapshot | null>('wip-jobs-snapshot', null);
  const [userRole, setUserRole] = useLocalStorage<UserRole>('wip-user-role', 'owner');
  const [activeProjectManager, setActiveProjectManager] = useLocalStorage<string>('wip-active-pm', '');
  const [activeEstimator, setActiveEstimator] = useLocalStorage<string>('wip-active-estimator', '');
  const [filter, setFilter] = useLocalStorage<FilterType>('wip-filter', JobStatus.Active);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('wip-theme', 
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('jobNo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pmFilter, setPmFilter] = useState('all');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [jobForNotes, setJobForNotes] = useState<Job | null>(null);
  const [jobNotes, setJobNotes] = useState<Note[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('default');
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Migrate old company names to WIP Insights
  useEffect(() => {
    if (settings && (settings.companyName === 'WIP Manager' || settings.companyName === 'WIP Job Manager')) {
      updateSettings({
        ...settings,
        companyName: 'WIP Insights',
      });
    }
  }, [settings, updateSettings]);

  useEffect(() => {
    if (settings && activeProjectManager && !settings.projectManagers.includes(activeProjectManager)) {
      const fallback = settings.projectManagers[0] || '';
      setActiveProjectManager(fallback);
      if (pmFilter === activeProjectManager) {
        setPmFilter(fallback || 'all');
      }
    }
  }, [activeProjectManager, settings, setActiveProjectManager, pmFilter]);

  useEffect(() => {
    if (settings && userRole === 'projectManager' && !activeProjectManager && settings.projectManagers.length > 0) {
      setActiveProjectManager(settings.projectManagers[0]);
    }
  }, [userRole, activeProjectManager, settings, setActiveProjectManager]);

  // Set default estimator when switching to estimator role
  useEffect(() => {
    if (settings && userRole === 'estimator' && !activeEstimator && settings.projectManagers.length > 0) {
      setActiveEstimator(settings.projectManagers[0]);
    }
  }, [userRole, activeEstimator, settings, setActiveEstimator]);

  useEffect(() => {
    if (!settings) return;
    
    setFocusMode('default');
    if (userRole === 'owner') {
      setFilter('company');
      setViewMode('table');
      setPmFilter('all');
    } else if (userRole === 'projectManager') {
      setFilter(JobStatus.Active);
      setViewMode('table');
      setPmFilter(activeProjectManager || 'all');
    } else if (userRole === 'estimator') {
      // Estimators see Future jobs by default (where they can edit)
      setFilter(JobStatus.Future);
      setViewMode('grid');
      setPmFilter('all');
    }
  }, [userRole, activeProjectManager, settings, setFilter, setFocusMode, setPmFilter, setViewMode]);

  const handleToggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (!settings || jobs.length === 0) return;
    
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekEndDayIndex = weekDays.indexOf(settings.weekEndDay);
    if (weekEndDayIndex === -1) return;

    // A "WIP Week" starts on the day after the weekEndDay.
    const weekStartDayIndex = (weekEndDayIndex + 1) % 7;

    const getStartOfWeek = (date: Date): Date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = (day - weekStartDayIndex + 7) % 7;
      d.setDate(d.getDate() - diff);
      return d;
    };

    if (!snapshot) {
      // If no snapshot exists, create one for the current state.
      setSnapshot({ timestamp: new Date().toISOString(), jobs });
      return;
    }

    const startOfCurrentWeek = getStartOfWeek(new Date());
    const startOfSnapshotWeek = getStartOfWeek(new Date(snapshot.timestamp));
    
    // If the last snapshot was taken in a previous week, it's time to take a new one.
    if (startOfSnapshotWeek.getTime() < startOfCurrentWeek.getTime()) {
      setSnapshot({ timestamp: new Date().toISOString(), jobs });
    }
  }, [jobs, settings, snapshot, setSnapshot]);


  const projectManagersForFilter = useMemo(() => {
    if (!settings) return ['all'];
    return ['all', ...settings.projectManagers];
  }, [settings]);

  const handleFilterChange = useCallback((nextFilter: FilterType) => {
    setFocusMode('default');
    setFilter(nextFilter);
  }, [setFilter, setFocusMode]);

  const handleSortKeyChange = useCallback((key: SortKey) => {
    setFocusMode('default');
    setSortKey(key);
  }, [setFocusMode, setSortKey]);

  const handleSortDirectionChange = useCallback((direction: SortDirection) => {
    setFocusMode('default');
    setSortDirection(direction);
  }, [setFocusMode, setSortDirection]);

  const handleSearchChange = useCallback((query: string) => {
    setFocusMode('default');
    setSearchQuery(query);
  }, [setFocusMode, setSearchQuery]);

  const handlePmFilterChange = useCallback((pm: string) => {
    setFocusMode('default');
    setPmFilter(pm);
    if (userRole === 'projectManager' && pm !== 'all') {
      setActiveProjectManager(pm);
    }
  }, [userRole, setActiveProjectManager, setFocusMode, setPmFilter]);

  const handleRoleChange = useCallback((role: UserRole) => {
    setFocusMode('default');
    setUserRole(role);
  }, [setFocusMode, setUserRole]);

  const handleActivePmChange = useCallback((pm: string) => {
    setFocusMode('default');
    setActiveProjectManager(pm);
    if (userRole === 'projectManager') {
      setPmFilter(pm || 'all');
    }
  }, [setActiveProjectManager, setFocusMode, setPmFilter, userRole]);

  const handleActiveEstimatorChange = useCallback((estimator: string) => {
    setFocusMode('default');
    setActiveEstimator(estimator);
  }, [setActiveEstimator, setFocusMode]);

  const handleQuickFilterSelect = useCallback((quick: QuickFilterKey) => {
    if (!settings) return;
    const myPm = activeProjectManager || settings.projectManagers[0] || 'all';

    switch (quick) {
      case 'owner-backlog':
        setFocusMode('default');
        setFilter('forecast');
        setViewMode('table');
        setPmFilter('all');
        break;
      case 'owner-capacity':
        setFocusMode('default');
        setFilter('company');
        setViewMode('table');
        setPmFilter('all');
        if (settings.capacityEnabled && settings.capacityPlan) {
          setIsCapacityModalOpen(true);
        } else {
          alert('Enable capacity tracking in Settings before managing staffing plans.');
        }
        break;
      case 'pm-my-jobs':
        setFilter(JobStatus.Active);
        setPmFilter(myPm);
        setViewMode('table');
        setFocusMode('default');
        break;
      case 'pm-at-risk':
        setFilter(JobStatus.Active);
        setPmFilter(myPm);
        setViewMode('table');
        setFocusMode('pm-at-risk');
        break;
      case 'pm-late':
        setFilter(JobStatus.Active);
        setPmFilter(myPm);
        setViewMode('table');
        setFocusMode('pm-late');
        break;
      default:
        break;
    }
  }, [activeProjectManager, settings, setFilter, setFocusMode, setPmFilter, setViewMode]);

  const handleOpenCapacityModal = useCallback(() => {
    if (!settings?.capacityEnabled || !settings.capacityPlan) {
      alert('Enable capacity tracking in Settings before editing the plan.');
      return;
    }
    setIsCapacityModalOpen(true);
  }, [settings]);

  const handleCloseCapacityModal = useCallback(() => {
    setIsCapacityModalOpen(false);
  }, []);

  const handleSaveCapacityPlan = useCallback(async (plan: CapacityPlan) => {
    if (!settings || !settings.capacityEnabled) {
      alert('Enable capacity tracking in Settings before editing the plan.');
      return;
    }
    
    try {
      await updateSettings({
        ...settings,
        capacityPlan: plan,
      });
      setIsCapacityModalOpen(false);
    } catch (err) {
      console.error('Error saving capacity plan:', err);
      alert('Failed to save capacity plan. Please try again.');
    }
  }, [settings, updateSettings]);

  const handleAddJobClick = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleEditJobClick = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSaveJob = async (jobToSave: Job) => {
    if (!companyId) return;
    try {
      const updatedJob = { ...jobToSave, lastUpdated: new Date().toISOString() };
      updatedJob.companyId = companyId;

      // If it's an edit, find the original job to compare statuses for onHoldDate logic
      if (editingJob) {
        const originalJob = jobs.find(j => j.id === updatedJob.id);
        
        if (originalJob) {
          // Status changed TO On Hold from another status
          if (updatedJob.status === JobStatus.OnHold && originalJob.status !== JobStatus.OnHold) {
            updatedJob.onHoldDate = new Date().toISOString();
          } 
          // Status changed FROM On Hold to another status
          else if (updatedJob.status !== JobStatus.OnHold && originalJob.status === JobStatus.OnHold) {
            delete updatedJob.onHoldDate;
          }
        }
        await updateJob(updatedJob);
      } else {
        // It's a new job, set onHoldDate if status is On Hold
        if (updatedJob.status === JobStatus.OnHold) {
          updatedJob.onHoldDate = new Date().toISOString();
        }
        // Generate a temporary ID if not provided
        if (!updatedJob.id) {
          updatedJob.id = `temp-${Date.now()}`;
        }
        await addJob(updatedJob);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving job:', err);
      alert('Failed to save job. Please try again.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      handleCloseModal();
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleOpenNotes = async (job: Job) => {
    setJobForNotes(job);
    setIsNotesModalOpen(true);
    // Load notes from Supabase
    try {
      const notes = await loadNotes(job.id);
      setJobNotes(notes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setJobNotes([]);
    }
  };

  const handleCloseNotes = () => {
    setIsNotesModalOpen(false);
    setJobForNotes(null);
    setJobNotes([]);
  };

  const handleAddNote = async (jobId: string, noteText: string) => {
    try {
      const newNote = await addNoteToSupabase(jobId, noteText);
      setJobNotes(prev => [newNote, ...prev]);
      // Refresh jobs to update lastUpdated timestamp
      await refreshJobs();
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note. Please try again.');
    }
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    if (!settings || !companyId) return;
    
    try {
      console.log('handleSaveSettings called with logo:', newSettings.companyLogo ? 'Logo present' : 'No logo');
      await updateSettings({ ...newSettings, companyId });
      
      if (userRole === settings.defaultRole && userRole !== newSettings.defaultRole) {
        setUserRole(newSettings.defaultRole);
      }
      if (newSettings.defaultRole === 'projectManager' && (!activeProjectManager || !newSettings.projectManagers.includes(activeProjectManager))) {
        setActiveProjectManager(newSettings.projectManagers[0] || '');
      }
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings. Please try again.');
    }
  };

  const sortedAndFilteredJobs = useMemo(() => {
    if (filter === 'company' || filter === 'forecast') {
      return [];
    }
    
    let filteredJobs = jobs.filter(job => job.status === filter);

    // Estimators can only see jobs where they are the assigned estimator
    if (userRole === 'estimator' && activeEstimator) {
      filteredJobs = filteredJobs.filter(job => job.estimator === activeEstimator);
    }

    if (pmFilter !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.projectManager === pmFilter);
    }

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.jobName.toLowerCase().includes(lowercasedQuery) ||
        job.client.toLowerCase().includes(lowercasedQuery) ||
        job.projectManager.toLowerCase().includes(lowercasedQuery) ||
        job.jobNo.toLowerCase().includes(lowercasedQuery)
      );
    }

    if (focusMode === 'pm-at-risk') {
      filteredJobs = filteredJobs.filter(job => {
        if (typeof job.targetProfit !== 'number') {
          return false;
        }
        const forecastedProfit = getForecastedProfit(job);
        return forecastedProfit < job.targetProfit;
      });
    } else if (focusMode === 'pm-late') {
      filteredJobs = filteredJobs.filter(job => isJobBehindTargetDate(job));
    }

    return filteredJobs.sort((a, b) => {
      if (sortKey === 'startDate') {
        const isATBD = a.startDate === 'TBD';
        const isBTBD = b.startDate === 'TBD';

        if (isATBD && isBTBD) return 0;
        if (isATBD) return 1;
        if (isBTBD) return -1;

        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();

        if (sortDirection === 'desc') {
          return dateB - dateA;
        }
        return dateA - dateB;
      }
      
      const valA = a[sortKey];
      const valB = b[sortKey];

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }, [jobs, filter, sortKey, sortDirection, searchQuery, pmFilter, focusMode, userRole, activeEstimator]);

  const renderContent = () => {
    if (!settings) return null;
    
    if (filter === 'company') {
      return (
        <CompanyView
          jobs={jobs}
          snapshot={snapshot}
          projectManagers={settings.projectManagers}
          capacityPlan={settings.capacityPlan || null}
          capacityEnabled={settings.capacityEnabled}
          onEditCapacity={handleOpenCapacityModal}
        />
      );
    }
    if (filter === 'forecast') {
        return <ForecastView jobs={jobs} />;
    }
    if (viewMode === 'grid') {
      return <JobCardGrid jobs={sortedAndFilteredJobs} onEdit={handleEditJobClick} onOpenNotes={handleOpenNotes} userRole={userRole} activeEstimator={activeEstimator}/>;
    }
    return <JobTable jobs={sortedAndFilteredJobs} onEdit={handleEditJobClick} onOpenNotes={handleOpenNotes} userRole={userRole} focusMode={focusMode} activeEstimator={activeEstimator}/>;
  }

  // Show loading state while data is being fetched
  if (jobsLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-brand-gray dark:bg-gray-900 text-brand-dark-gray dark:text-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading...</div>
          <div className="text-sm text-gray-500">Fetching data from Supabase</div>
        </div>
      </div>
    );
  }

  // Show error state if settings failed to load
  if (!settings && !settingsLoading) {
    return (
      <div className="min-h-screen bg-brand-gray dark:bg-gray-900 text-brand-dark-gray dark:text-gray-300 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Error Loading Settings</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-2">
            <p>Please check your Supabase configuration:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-left text-xs font-mono">
              <p className="mb-2"><strong>1. Check browser console</strong> for detailed error messages</p>
              <p className="mb-2"><strong>2. Verify .env.local</strong> has correct keys:</p>
              <ul className="list-disc list-inside ml-2 mb-2">
                <li>VITE_SUPABASE_URL=https://xzmzsutxmvwcqpjjoapc.supabase.co</li>
                <li>VITE_SUPABASE_ANON_KEY=sb_publishable_...</li>
              </ul>
              <p className="mb-2"><strong>3. Restart dev server</strong> after changing .env.local</p>
              <p className="mb-2"><strong>4. Check RLS policies</strong> in Supabase dashboard</p>
              {settingsError && (
                <p className="mt-2 text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {settingsError}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray dark:bg-gray-900 text-brand-dark-gray dark:text-gray-300">
      <Header 
        companyName={settings.companyName} 
        companyLogo={settings.companyLogo}
        onAddJob={handleAddJobClick} 
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSignOut={signOut}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        userRole={userRole}
        onRoleChange={handleRoleChange}
        projectManagers={settings.projectManagers}
        activeProjectManager={activeProjectManager}
        onActiveProjectManagerChange={handleActivePmChange}
        activeEstimator={activeEstimator}
        onActiveEstimatorChange={handleActiveEstimatorChange}
      />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <Controls
            filter={filter}
            setFilter={handleFilterChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortKey={sortKey}
            setSortKey={handleSortKeyChange}
            sortDirection={sortDirection}
            setSortDirection={handleSortDirectionChange}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            pmFilter={pmFilter}
            setPmFilter={handlePmFilterChange}
            projectManagers={projectManagersForFilter}
            userRole={userRole}
            focusMode={focusMode}
            onQuickFilterSelect={handleQuickFilterSelect}
            activeProjectManager={activeProjectManager}
            onActiveProjectManagerChange={handleActivePmChange}
            onExportCSV={() => exportJobsToCSV(sortedAndFilteredJobs, 'wip-jobs-export')}
            onExportPDF={() => exportJobsToPDF(sortedAndFilteredJobs, 'wip-report', { companyName: settings.companyName })}
            jobCount={sortedAndFilteredJobs.length}
          />

          <div>
            {renderContent()}
          </div>
        </div>
      </main>
      <JobFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveJob}
        jobToEdit={editingJob}
        projectManagers={settings.projectManagers}
        defaultStatus={settings.defaultStatus}
        onDelete={handleDeleteJob}
        userRole={userRole}
        activeEstimator={activeEstimator}
      />
      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={handleCloseNotes}
        onAddNote={handleAddNote}
        job={jobForNotes ? { ...jobForNotes, notes: jobNotes } : null}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
      {settings.capacityEnabled && settings.capacityPlan && (
        <CapacityModal
          isOpen={isCapacityModalOpen}
          onClose={handleCloseCapacityModal}
          capacityPlan={settings.capacityPlan}
          onSave={handleSaveCapacityPlan}
        />
      )}
    </div>
  );
}

export default App;