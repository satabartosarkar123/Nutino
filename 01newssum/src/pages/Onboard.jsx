import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitOnboarding } from '../api/authAPI';

// ─── IPTC Taxonomy (mirrored from server/config/taxonomy.js) ────────────────

const TAXONOMY = {
    '04000000': {
        name: 'Economy, Business & Finance',
        sub_topics: [
            'Venture Capital',
            'Corporate Earnings',
            'Semiconductors',
            'Cryptocurrency',
            'Stock Markets',
            'Mergers & Acquisitions',
            'Startups',
            'Central Banking',
        ],
    },
    '11000000': {
        name: 'Politics',
        sub_topics: [
            'Tech Policy',
            'Antitrust Laws',
            'Global Trade Agreements',
            'Elections',
            'Legislation',
            'Diplomacy',
        ],
    },
    '13000000': {
        name: 'Science & Technology',
        sub_topics: [
            'Large Language Models',
            'Agentic Systems',
            'Biotech',
            'Quantum Computing',
            'Space Exploration',
            'Robotics',
            'Climate Tech',
        ],
    },
    '16000000': {
        name: 'Conflict & Defence',
        sub_topics: [
            'Aerospace & Defense',
            'Cybersecurity',
            'Geopolitical Unrest',
            'Arms Trade',
            'Intelligence Agencies',
        ],
    },
    '07000000': {
        name: 'Health',
        sub_topics: [
            'Public Health',
            'Pharmaceuticals',
            'Mental Health',
            'Medical Research',
            'Healthcare Policy',
        ],
    },
    '01000000': {
        name: 'Arts, Culture & Entertainment',
        sub_topics: [
            'Streaming & Media',
            'Gaming Industry',
            'Film & Television',
            'Music Industry',
        ],
    },
    '06000000': {
        name: 'Environmental Issues',
        sub_topics: [
            'Climate Change',
            'Renewable Energy',
            'Carbon Markets',
            'Sustainability',
        ],
    },
    '10000000': {
        name: 'Lifestyle & Leisure',
        sub_topics: [
            'Future of Work',
            'Digital Nomads',
            'Personal Finance',
            'Consumer Tech',
        ],
    },
};

const PERSONAS = [
    {
        value: 'Investor',
        icon: '📈',
        desc: 'Markets, valuations, portfolio signals',
    },
    {
        value: 'Researcher',
        icon: '🔬',
        desc: 'Deep dives, data, methodologies',
    },
    {
        value: 'Student',
        icon: '🎓',
        desc: 'Accessible explanations, context',
    },
    {
        value: 'Founder',
        icon: '🚀',
        desc: 'Market sizing, competitive intelligence',
    },
    {
        value: 'Generalist',
        icon: '🌐',
        desc: 'Balanced, broad-spectrum coverage',
    },
];

const DEPTHS = [
    {
        value: 'bullet_points',
        label: 'Bullet Points',
        icon: '📋',
        desc: '3-5 concise key takeaways',
    },
    {
        value: 'deep_analysis',
        label: 'Deep Analysis',
        icon: '🔍',
        desc: 'Comprehensive context & implications',
    },
    {
        value: 'exec_summary',
        label: 'Executive Summary',
        icon: '📊',
        desc: 'C-suite ready, 2-3 paragraphs',
    },
];

export default function Onboard() {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [persona, setPersona] = useState('');
    const [interests, setInterests] = useState([]);
    const [ignored, setIgnored] = useState([]);
    const [depth, setDepth] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Guard: redirect if not authenticated or already onboarded
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.onboarded) return <Navigate to="/" replace />;

    const toggleChip = (topic, list, setList, maxItems = 15) => {
        if (list.includes(topic)) {
            setList(list.filter((t) => t !== topic));
        } else if (list.length < maxItems) {
            setList([...list, topic]);
        }
    };

    const handleNext = () => {
        setError('');
        if (step === 1 && !persona) {
            setError('Please select a persona to continue.');
            return;
        }
        if (step === 2 && interests.length === 0) {
            setError('Please select at least one interest.');
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        setError('');
        if (!depth) {
            setError('Please select a summary depth.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await submitOnboarding({
                persona,
                primary_interests: interests,
                ignored_topics: ignored,
                summary_depth: depth,
            });

            if (res.status === 'success') {
                updateUser(res.user);
                // Navigation happens via ProtectedRoute detecting onboarded=true
                window.location.href = '/';
            } else {
                setError(res.message || 'Onboarding failed.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Ambient background */}
            <div className="fixed top-[-10rem] left-[-10rem] w-[40rem] h-[40rem] bg-brand-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="fixed bottom-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
                        <span>Step {step} of 3</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                        {step === 1 && 'Who are you?'}
                        {step === 2 && 'What interests you?'}
                        {step === 3 && 'How deep should we go?'}
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        {step === 1 &&
                            'Choose a persona to customize your intelligence feed.'}
                        {step === 2 &&
                            'Select topics to emphasize — and optionally mute ones you do not care about.'}
                        {step === 3 &&
                            'Pick how Nutino should summarize articles for you.'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                s <= step
                                    ? 'bg-gradient-to-r from-brand-600 to-indigo-500'
                                    : 'bg-white/10'
                            }`}
                        />
                    ))}
                </div>

                {/* Card */}
                <div className="bg-[#1e1b4b]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                    {/* ── Step 1: Persona ──────────────────────────────── */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PERSONAS.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => {
                                        setPersona(p.value);
                                        setError('');
                                    }}
                                    className={`relative p-5 rounded-2xl border text-left transition-all duration-300 group ${
                                        persona === p.value
                                            ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                >
                                    {persona === p.value && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                                            <svg
                                                className="w-3.5 h-3.5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={3}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    <span className="text-3xl mb-3 block">
                                        {p.icon}
                                    </span>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {p.value}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {p.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Step 2: Interests & Ignored ─────────────────── */}
                    {step === 2 && (
                        <div className="space-y-8 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Primary Interests */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    I&apos;m interested in...
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Selected: {interests.length} / 15
                                </p>

                                {Object.entries(TAXONOMY).map(
                                    ([code, category]) => (
                                        <div key={code} className="mb-5">
                                            <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                                                {category.name}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {category.sub_topics.map(
                                                    (topic) => {
                                                        const isSelected =
                                                            interests.includes(
                                                                topic
                                                            );
                                                        const isIgnored =
                                                            ignored.includes(
                                                                topic
                                                            );
                                                        return (
                                                            <button
                                                                key={topic}
                                                                onClick={() => {
                                                                    if (isIgnored) return;
                                                                    toggleChip(
                                                                        topic,
                                                                        interests,
                                                                        setInterests
                                                                    );
                                                                }}
                                                                disabled={isIgnored}
                                                                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                                                                    isSelected
                                                                        ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                                                                        : isIgnored
                                                                          ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                                                                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-brand-500/30 hover:text-slate-200'
                                                                }`}
                                                            >
                                                                {isSelected && '✓ '}
                                                                {topic}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                    Optional
                                </span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>

                            {/* Ignored Topics */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    I don&apos;t care about...
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    These topics will be de-emphasized in your
                                    summaries.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(TAXONOMY)
                                        .flatMap((c) => c.sub_topics)
                                        .filter(
                                            (t) => !interests.includes(t)
                                        )
                                        .map((topic) => {
                                            const isIgn =
                                                ignored.includes(topic);
                                            return (
                                                <button
                                                    key={topic}
                                                    onClick={() =>
                                                        toggleChip(
                                                            topic,
                                                            ignored,
                                                            setIgnored
                                                        )
                                                    }
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                                                        isIgn
                                                            ? 'bg-red-500/15 border-red-500/40 text-red-300'
                                                            : 'bg-white/5 border-white/10 text-slate-500 hover:border-red-500/30 hover:text-slate-300'
                                                    }`}
                                                >
                                                    {isIgn && '✕ '}
                                                    {topic}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Summary Depth ───────────────────────── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {DEPTHS.map((d) => (
                                <button
                                    key={d.value}
                                    onClick={() => {
                                        setDepth(d.value);
                                        setError('');
                                    }}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-5 ${
                                        depth === d.value
                                            ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-3xl shrink-0">
                                        {d.icon}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">
                                            {d.label}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {d.desc}
                                        </p>
                                    </div>
                                    {depth === d.value && (
                                        <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                                            <svg
                                                className="w-3.5 h-3.5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={3}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm font-medium flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/25 transition-all duration-300 flex items-center gap-2"
                            >
                                Continue
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/25 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Launch Nutino
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
