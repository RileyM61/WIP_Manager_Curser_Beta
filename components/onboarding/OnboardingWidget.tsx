import React from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
    id: string;
    label: string;
    action?: () => void;
    cta: string;
}

interface OnboardingWidgetProps {
    onAction?: (actionId: string) => void;
}

export const OnboardingWidget: React.FC<OnboardingWidgetProps> = ({ onAction }) => {
    const { state, dismissChecklist, updateChecklist, loading } = useOnboarding();
    const navigate = useNavigate();

    if (state.checklist_dismissed || !state.user_level || state.user_level === 'undecided') {
        return null;
    }

    // Define checklists based on level
    const newbieItems: ChecklistItem[] = [
        {
            id: 'profile_setup',
            label: 'Complete your Company Profile',
            cta: 'Go to Settings',
            action: () => navigate('/settings')
        },
        {
            id: 'first_job',
            label: 'Create your first Job (manually)',
            cta: 'Create Job',
            action: () => navigate('/app/wip') // Assuming this navigates to job list where there is a create button
        },
        {
            id: 'review_wip',
            label: 'Review Job Health (Check for Risk)',
            cta: 'View Insights',
            action: () => navigate('/app/wip')
        }
    ];

    const ninjaItems: ChecklistItem[] = [
        {
            id: 'profile_setup',
            label: 'Complete your Company Profile',
            cta: 'Company Settings',
            action: () => navigate('/settings')
        },
        {
            id: 'configure_markups',
            label: 'Set Job Defaults & T&M Markups',
            cta: 'Job Defaults',
            action: () => navigate('/settings')
        },
        {
            id: 'seed_jobs',
            label: 'Add your initial Jobs (manual)',
            cta: 'Go to Jobs',
            action: () => navigate('/app/wip')
        },
        {
            id: 'invite_team',
            label: 'Invite your Project Managers',
            cta: 'Users & Team',
            action: () => navigate('/settings')
        },
        {
            id: 'weekly_update',
            label: 'Run your first Weekly Update (Effective Date + inputs)',
            cta: 'Weekly Update',
            action: () => navigate('/app/wip')
        },
        {
            id: 'create_snapshot',
            label: 'Create a Snapshot (after updates)',
            cta: 'Data Admin',
            action: () => navigate('/settings')
        },
        {
            id: 'review_wip',
            label: 'Review Insights (find risk & take action)',
            cta: 'View Insights',
            action: () => navigate('/app/wip')
        }
    ];

    const items = state.user_level === 'newbie' ? newbieItems : ninjaItems;
    const completedCount = items.filter(i => state.checklist_progress?.[i.id]).length;
    const progress = Math.round((completedCount / items.length) * 100);

    const handleAction = async (item: ChecklistItem) => {
        // Mark as complete when they click the action
        if (!state.checklist_progress?.[item.id]) {
            await updateChecklist(item.id, true);
        }

        if (onAction) {
            onAction(item.id);
        } else {
            item.action?.();
        }
    };

    return (
        <div className="mb-8 w-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {state.user_level === 'newbie' ? '🌱 Getting Started with WIP' : '⚡ Power-Up Checklist'}
                        <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                            {progress}% Complete
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {state.user_level === 'newbie'
                            ? "Follow these steps to get comfortable with your new financial dashboard."
                            : "Let's get your workspace fully operational for your team."}
                    </p>
                </div>
                <button
                    onClick={() => dismissChecklist()}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Dismiss Checklist"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
                {items.map((item) => {
                    const isCompleted = state.checklist_progress?.[item.id];
                    return (
                        <div
                            key={item.id}
                            className={`
                relative p-4 rounded-xl border transition-all duration-300
                ${isCompleted
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                                }
              `}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                `}>
                                    {isCompleted ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span>{items.indexOf(item) + 1}</span>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${isCompleted ? 'text-emerald-900 dark:text-emerald-300 line-through opacity-70' : 'text-gray-900 dark:text-white'}`}>
                                    {item.label}
                                </span>
                            </div>

                            {!isCompleted && (
                                <button
                                    onClick={() => handleAction(item)}
                                    className="w-full py-2 px-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-1 group"
                                >
                                    {item.cta}
                                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
