import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';

export const OnboardingWizardModal: React.FC = () => {
    // Only show if user has a company (completed company onboarding)
    const { companyId } = useAuth();
    const { state, setLevel } = useOnboarding();
    const [isOpen, setIsOpen] = useState(!state.is_onboarding_completed && state.user_level === 'undecided');
    const [view, setView] = useState<'selection' | 'quiz'>('selection');
    const [quizStep, setQuizStep] = useState(0);
    const [quizScore, setQuizScore] = useState(0); // High score = Ninja

    // Safety check for critical state
    if (!state) return null;

    // If already completed or no company yet, don't show
    if (!companyId || state.is_onboarding_completed || state.user_level !== 'undecided') return null;

    const handleSelect = async (level: 'newbie' | 'ninja') => {
        await setLevel(level);
        setIsOpen(false);
    };

    const quizQuestions = [
        {
            q: "Do you currently track 'Over/Under Billings' on your jobs?",
            options: [
                { text: "What's that?", value: 0 },
                { text: "I've heard of it, but don't calculate it.", value: 1 },
                { text: "Yes, I track it monthly.", value: 3 } // Ninja
            ]
        },
        {
            q: "How do you currently recognize revenue?",
            options: [
                { text: "When I send an invoice (Cash/Billed)", value: 0 },
                { text: "Based on % complete (POC / Earned Value)", value: 3 } // Ninja
            ]
        },
        {
            q: "Do you reconcile your WIP report with your G/L?",
            options: [
                { text: "No, they are separate.", value: 0 },
                { text: "Sometimes.", value: 1 },
                { text: "Always, it's critical.", value: 3 } // Ninja
            ]
        }
    ];

    const handleQuizOption = (value: number) => {
        const newScore = quizScore + value;
        if (quizStep < quizQuestions.length - 1) {
            setQuizScore(newScore);
            setQuizStep(quizStep + 1);
        } else {
            // Finish Quiz
            const finalLevel = newScore >= 5 ? 'ninja' : 'newbie';
            handleSelect(finalLevel);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => { }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-8 text-left align-middle shadow-2xl transition-all border border-slate-200 dark:border-slate-800">
                                {view === 'selection' ? (
                                    <>
                                        <div className="text-center mb-10">
                                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-orange-500/20 mb-6">
                                                🚀
                                            </div>
                                            <Dialog.Title as="h3" className="text-3xl font-bold leading-6 text-gray-900 dark:text-white mb-3">
                                                Welcome to WIP Manager
                                            </Dialog.Title>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                                Let's personalize your experience. How familiar are you with WIP reporting?
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Newbie Card */}
                                            <button
                                                onClick={() => handleSelect('newbie')}
                                                className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all text-left hover:-translate-y-1 hover:shadow-xl"
                                            >
                                                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">🌱</div>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">I'm New to WIP</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    "I want to understand my job costs better, but I'm not an accountant. Guide me through the basics."
                                                </p>
                                                <div className="mt-4 flex items-center text-orange-600 dark:text-orange-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Start Guided Tour &rarr;
                                                </div>
                                            </button>

                                            {/* Ninja Card */}
                                            <button
                                                onClick={() => handleSelect('ninja')}
                                                className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all text-left hover:-translate-y-1 hover:shadow-xl"
                                            >
                                                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">🥷</div>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">I'm a WIP Ninja</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    "I know my Over/Under billings. Just give me the tools to import my data and generate reports."
                                                </p>
                                                <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Skip to Advanced Setup &rarr;
                                                </div>
                                            </button>
                                        </div>

                                        <div className="mt-8 text-center">
                                            <button
                                                onClick={() => setView('quiz')}
                                                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-4"
                                            >
                                                Not sure? Take a 30-second quiz
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Quiz View
                                    <div className="max-w-xl mx-auto">
                                        <div className="mb-8">
                                            <div className="flex justify-between text-sm font-medium text-gray-400 mb-2">
                                                <span>Question {quizStep + 1} of {quizQuestions.length}</span>
                                                <span>{Math.round(((quizStep) / quizQuestions.length) * 100)}% Complete</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                <div className="bg-brand-blue h-2 rounded-full transition-all duration-500" style={{ width: `${((quizStep) / quizQuestions.length) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                                            {quizQuestions[quizStep].q}
                                        </h3>

                                        <div className="space-y-4">
                                            {quizQuestions[quizStep].options.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleQuizOption(option.value)}
                                                    className="w-full p-4 text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-blue dark:hover:border-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                >
                                                    <span className="text-lg text-gray-700 dark:text-gray-200">{option.text}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                                            <button
                                                onClick={() => {
                                                    setQuizStep(0);
                                                    setQuizScore(0);
                                                    setView('selection');
                                                }}
                                                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            >
                                                Back to Selection
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
