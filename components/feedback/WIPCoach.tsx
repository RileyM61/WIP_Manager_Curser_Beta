import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { useOnboarding } from '../../hooks/useOnboarding';

type CoachingMood = 'celebrate' | 'support' | 'insight';

interface CoachMessage {
    id: string;
    title: string;
    message: string;
    mood: CoachingMood;
    duration?: number;
}

interface WIPCoachContextType {
    say: (title: string, message: string, mood?: CoachingMood) => void;
    celebrate: (title: string, message: string) => void;
}

const WIPCoachContext = createContext<WIPCoachContextType | undefined>(undefined);

export const useWIPCoach = () => {
    const context = useContext(WIPCoachContext);
    if (!context) {
        throw new Error('useWIPCoach must be used within a WIPCoachProvider');
    }
    return context;
};

export const WIPCoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeMessage, setActiveMessage] = useState<CoachMessage | null>(null);
    const { incrementStreak } = useOnboarding();

    const say = useCallback((title: string, message: string, mood: CoachingMood = 'insight') => {
        const id = Date.now().toString();
        setActiveMessage({ id, title, message, mood });

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            setActiveMessage((current) => (current?.id === id ? null : current));
        }, 5000);
    }, []);

    const celebrate = useCallback((title: string, message: string) => {
        say(title, message, 'celebrate');
        // Also quietly increment streak/gamification stats in background
        incrementStreak();
    }, [say, incrementStreak]);

    return (
        <WIPCoachContext.Provider value={{ say, celebrate }}>
            {children}

            {/* The Coach UI */}
            <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
                <Transition
                    show={!!activeMessage}
                    enter="transform ease-out duration-300 transition"
                    enterFrom="translate-y-20 opacity-0 scale-95"
                    enterTo="translate-y-0 opacity-100 scale-100"
                    leave="transition ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                    className="pointer-events-auto"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 max-w-sm flex items-start gap-4">
                        {/* Avatar / Icon */}
                        <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner
              ${activeMessage?.mood === 'celebrate' ? 'bg-gradient-to-br from-yellow-300 to-orange-500' : ''}
              ${activeMessage?.mood === 'support' ? 'bg-gradient-to-br from-blue-300 to-indigo-500' : ''}
              ${activeMessage?.mood === 'insight' ? 'bg-gradient-to-br from-emerald-300 to-teal-500' : ''}
            `}>
                            {activeMessage?.mood === 'celebrate' && '🎉'}
                            {activeMessage?.mood === 'support' && '🛡️'}
                            {activeMessage?.mood === 'insight' && '💡'}
                        </div>

                        <div className="flex-1 pt-1">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                {activeMessage?.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug">
                                {activeMessage?.message}
                            </p>
                        </div>

                        <button
                            onClick={() => setActiveMessage(null)}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </Transition>
            </div>
        </WIPCoachContext.Provider>
    );
};
