import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Job, JobStatus, ViewMode, SortKey, SortDirection, FilterType, Note, Settings, JobsSnapshot, UserRole, CostBreakdown, CapacityPlan } from './types';
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
import GanttView from './components/views/GanttView';
import JobFormModal from './components/modals/JobFormModal';
import CompanyView from './components/views/CompanyView';
import ForecastView from './components/views/ForecastView';
import NotesModal from './components/modals/NotesModal';
import SettingsModal from './components/modals/SettingsModal';
import CapacityModal from './components/modals/CapacityModal';
import TeamManagementModal from './components/modals/TeamManagementModal';
import GuidedTour from './components/help/GuidedTour';
import GlossaryPage from './pages/GlossaryPage';
import { tourSteps, markTourCompleted } from './lib/tourSteps';

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
  const { companyId, signOut, user } = useAuth();
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
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('default');
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  
  // Help & Learning state
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

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

      // Check if this job already exists (update vs add)
      const existingJob = jobs.find(j => j.id === updatedJob.id);
      
      if (existingJob) {
        // It's an update - handle onHoldDate logic
        if (updatedJob.status === JobStatus.OnHold && existingJob.status !== JobStatus.OnHold) {
          updatedJob.onHoldDate = new Date().toISOString();
        } else if (updatedJob.status !== JobStatus.OnHold && existingJob.status === JobStatus.OnHold) {
          delete updatedJob.onHoldDate;
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
    if (viewMode === 'gantt') {
      return <GanttView jobs={sortedAndFilteredJobs} onUpdateJob={handleSaveJob} onEditJob={handleEditJobClick} />;
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
        onOpenTeamManagement={() => setIsTeamModalOpen(true)}
        onSignOut={signOut}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        userRole={userRole}
        onRoleChange={handleRoleChange}
        projectManagers={settings.projectManagers}
        estimators={settings.estimators}
        activeProjectManager={activeProjectManager}
        onActiveProjectManagerChange={handleActivePmChange}
        activeEstimator={activeEstimator}
        onActiveEstimatorChange={handleActiveEstimatorChange}
        onStartTour={() => setIsTourOpen(true)}
        onOpenGlossary={() => setShowGlossary(true)}
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
        estimators={settings.estimators}
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
      {companyId && user && (
        <TeamManagementModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          companyId={companyId}
          currentUserId={user.id}
        />
      )}
      {settings.capacityEnabled && settings.capacityPlan && (
        <CapacityModal
          isOpen={isCapacityModalOpen}
          onClose={handleCloseCapacityModal}
          capacityPlan={settings.capacityPlan}
          onSave={handleSaveCapacityPlan}
        />
      )}

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => {
          setIsTourOpen(false);
          markTourCompleted();
        }}
      />

      {/* Glossary Page (full-screen overlay) */}
      {showGlossary && (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900">
          <GlossaryPage onBack={() => setShowGlossary(false)} />
        </div>
      )}
    </div>
  );
}

export default App;