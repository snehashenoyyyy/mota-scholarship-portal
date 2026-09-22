"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const SCHEMES = [
    {
        id: "pre-matric",
        name: "Pre-Matric Scholarship",
        short: "Pre-Matric",
        level: "School Education",
        icon: "🎓",
        color: "blue",
        description:
            "Financial assistance for eligible ST students studying at the pre-matric level.",
        incomeLimit: 250000,
        criteria: [
            "Applicant belongs to Scheduled Tribe category",
            "Applicant is studying at the pre-matric level",
            "Family income falls within the configured threshold",
        ],
        action: "Start Application",
    },
    {
        id: "post-matric",
        name: "Post-Matric Scholarship",
        short: "Post-Matric",
        level: "Higher Education",
        icon: "📚",
        color: "indigo",
        description:
            "Support for eligible ST students pursuing post-matriculation education.",
        incomeLimit: 250000,
        criteria: [
            "Applicant belongs to Scheduled Tribe category",
            "Applicant is pursuing post-matric education",
            "Family income falls within the configured threshold",
        ],
        action: "Start Application",
    },
    {
        id: "top-class",
        name: "Top Class Scholarship",
        short: "Top Class",
        level: "Premier Institutions",
        icon: "🏆",
        color: "amber",
        description:
            "Scholarship support for eligible ST students studying in selected premier institutions.",
        incomeLimit: 600000,
        criteria: [
            "Applicant belongs to Scheduled Tribe category",
            "Applicant is studying in an eligible institution",
            "Family income falls within the configured threshold",
        ],
        action: "Start Application",
    },
    {
        id: "nfst",
        name: "National Fellowship for ST Students",
        short: "NFST",
        level: "PhD / Research",
        icon: "🔬",
        color: "purple",
        description:
            "Fellowship pathway for eligible ST students pursuing doctoral research.",
        incomeLimit: null,
        criteria: [
            "Applicant belongs to Scheduled Tribe category",
            "Applicant is pursuing eligible doctoral research",
            "Academic and admission requirements are satisfied",
        ],
        action: "Explore Fellowship",
    },
    {
        id: "nos",
        name: "National Overseas Scholarship",
        short: "NOS",
        level: "Overseas Higher Education",
        icon: "🌍",
        color: "emerald",
        description:
            "Support pathway for eligible ST students pursuing higher studies overseas.",
        incomeLimit: null,
        criteria: [
            "Applicant belongs to Scheduled Tribe category",
            "Applicant has an eligible overseas admission",
            "Academic and scheme-specific conditions are satisfied",
        ],
        action: "Explore Scholarship",
    },
];

const COLOR_STYLES = {
    blue: {
        icon: "bg-blue-100 text-blue-700",
        border: "border-blue-200",
        soft: "bg-blue-50",
        text: "text-blue-700",
    },
    indigo: {
        icon: "bg-indigo-100 text-indigo-700",
        border: "border-indigo-200",
        soft: "bg-indigo-50",
        text: "text-indigo-700",
    },
    amber: {
        icon: "bg-amber-100 text-amber-700",
        border: "border-amber-200",
        soft: "bg-amber-50",
        text: "text-amber-700",
    },
    purple: {
        icon: "bg-purple-100 text-purple-700",
        border: "border-purple-200",
        soft: "bg-purple-50",
        text: "text-purple-700",
    },
    emerald: {
        icon: "bg-emerald-100 text-emerald-700",
        border: "border-emerald-200",
        soft: "bg-emerald-50",
        text: "text-emerald-700",
    },
};

function getResult(scheme, profile) {
    const checks = [
        {
            label: "ST Category",
            passed: profile.category === "ST",
            detail:
                profile.category === "ST"
                    ? "Category requirement satisfied"
                    : "Scheme is intended for ST applicants",
        },
        {
            label: "Family Income",
            passed:
                scheme.incomeLimit === null ||
                Number(profile.income || 0) <= scheme.incomeLimit,
            detail:
                scheme.incomeLimit === null
                    ? "No income threshold configured in this demo"
                    : `Configured threshold: ₹${scheme.incomeLimit.toLocaleString(
                        "en-IN"
                    )}`,
        },
        {
            label: "Education Level",
            passed:
                scheme.id === "nfst"
                    ? profile.level === "phd"
                    : scheme.id === "nos"
                        ? profile.level === "pg" ||
                        profile.level === "phd"
                        : profile.level !== "school" ||
                        scheme.id === "pre-matric",
            detail:
                scheme.id === "nfst"
                    ? "NFST demo pathway checks doctoral study"
                    : scheme.id === "nos"
                        ? "NOS demo pathway checks higher education"
                        : "Education level is considered by the configured rule set",
        },
        {
            label: "Academic Requirement",
            passed: Number(profile.marks || 0) >= 50,
            detail: "Demo academic threshold check",
        },
    ];

    const passed = checks.filter((check) => check.passed).length;
    const eligible = passed === checks.length;

    return {
        checks,
        passed,
        total: checks.length,
        eligible,
    };
}

export default function SchemeSelectionPage() {
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [profile, setProfile] = useState({
        category: "ST",
        income: "180000",
        level: "pg",
        marks: "86.5",
    });

    const [checked, setChecked] = useState(false);
    const [search, setSearch] = useState("");

    const filteredSchemes = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return SCHEMES;

        return SCHEMES.filter(
            (scheme) =>
                scheme.name.toLowerCase().includes(query) ||
                scheme.short.toLowerCase().includes(query) ||
                scheme.level.toLowerCase().includes(query)
        );
    }, [search]);

    const result = selectedScheme
        ? getResult(selectedScheme, profile)
        : null;

    function handleCheck() {
        setChecked(true);
    }

    function selectScheme(scheme) {
        setSelectedScheme(scheme);
        setChecked(false);
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                                AI Eligibility Checker
                            </div>

                            <h1 className="text-2xl font-bold sm:text-3xl">
                                Find the right scholarship for you
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                                Select a scholarship or fellowship and let the
                                configurable eligibility engine check your
                                profile against the demo scheme rules.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-indigo-100">
                                Available pathways
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                                5
                            </p>

                            <p className="text-xs text-indigo-100">
                                Scholarship & fellowship schemes
                            </p>
                        </div>
                    </div>
                </section>

                {/* Main layout */}
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">

                    {/* Scheme list */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Select a Scheme
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Choose a pathway to evaluate your eligibility.
                                </p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔍
                                </span>

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search schemes..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4">
                            {filteredSchemes.map((scheme) => {
                                const colors =
                                    COLOR_STYLES[scheme.color];

                                const active =
                                    selectedScheme?.id === scheme.id;

                                return (
                                    <button
                                        key={scheme.id}
                                        onClick={() =>
                                            selectScheme(scheme)
                                        }
                                        className={`w-full rounded-2xl border p-5 text-left transition ${active
                                                ? `${colors.border} ${colors.soft} shadow-sm`
                                                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${colors.icon}`}
                                            >
                                                {scheme.icon}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900">
                                                            {scheme.name}
                                                        </h3>

                                                        <p
                                                            className={`mt-1 text-xs font-semibold ${colors.text}`}
                                                        >
                                                            {scheme.level}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${active
                                                                ? `${colors.icon}`
                                                                : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {active
                                                            ? "SELECTED"
                                                            : "VIEW"}
                                                    </span>
                                                </div>

                                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                                    {scheme.description}
                                                </p>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <span className="rounded-lg bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                                        ST Category
                                                    </span>

                                                    {scheme.incomeLimit !==
                                                        null && (
                                                            <span className="rounded-lg bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                                                Income ≤ ₹
                                                                {scheme.incomeLimit.toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </span>
                                                        )}

                                                    <span className="rounded-lg bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                                        AI Rule Check
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className={`hidden text-lg sm:block ${active
                                                        ? colors.text
                                                        : "text-slate-300"
                                                    }`}
                                            >
                                                →
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Eligibility panel */}
                    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
                        {!selectedScheme ? (
                            <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-4xl">
                                    🎯
                                </div>

                                <h2 className="mt-5 text-lg font-bold text-slate-900">
                                    Select a scheme
                                </h2>

                                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                    Choose one of the five pathways to see its
                                    eligibility criteria and run the demo
                                    eligibility engine.
                                </p>

                                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
                                    <p className="text-xs font-bold text-slate-700">
                                        How it works
                                    </p>

                                    <div className="mt-3 space-y-3">
                                        {[
                                            "Select a scheme",
                                            "Review your profile",
                                            "Run eligibility check",
                                            "Continue to application",
                                        ].map((step, index) => (
                                            <div
                                                key={step}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                                    {index + 1}
                                                </span>

                                                <span className="text-xs text-slate-600">
                                                    {step}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Selected Scheme
                                        </p>

                                        <h2 className="mt-1 text-lg font-bold text-slate-900">
                                            {selectedScheme.short}
                                        </h2>
                                    </div>

                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${COLOR_STYLES[
                                                selectedScheme.color
                                            ].icon
                                            }`}
                                    >
                                        {selectedScheme.icon}
                                    </div>
                                </div>

                                {/* Profile */}
                                <div className="mt-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Eligibility Details
                                        </h3>

                                        <span className="text-[10px] font-semibold text-slate-400">
                                            Demo inputs
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">
                                                Category
                                            </label>

                                            <select
                                                value={profile.category}
                                                onChange={(event) =>
                                                    setProfile({
                                                        ...profile,
                                                        category:
                                                            event.target.value,
                                                    })
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                            >
                                                <option value="ST">
                                                    Scheduled Tribe (ST)
                                                </option>
                                                <option value="General">
                                                    General
                                                </option>
                                                <option value="OBC">
                                                    OBC
                                                </option>
                                                <option value="SC">
                                                    SC
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">
                                                Annual Family Income
                                            </label>

                                            <div className="relative mt-1.5">
                                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                    ₹
                                                </span>

                                                <input
                                                    type="number"
                                                    value={profile.income}
                                                    onChange={(event) =>
                                                        setProfile({
                                                            ...profile,
                                                            income:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                                />
                                            </div>

                                            {selectedScheme.incomeLimit !==
                                                null && (
                                                    <p className="mt-1.5 text-[10px] text-slate-400">
                                                        Configured limit: ₹
                                                        {selectedScheme.incomeLimit.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">
                                                Education Level
                                            </label>

                                            <select
                                                value={profile.level}
                                                onChange={(event) =>
                                                    setProfile({
                                                        ...profile,
                                                        level:
                                                            event.target.value,
                                                    })
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                            >
                                                <option value="school">
                                                    School
                                                </option>
                                                <option value="ug">
                                                    Undergraduate
                                                </option>
                                                <option value="pg">
                                                    Postgraduate
                                                </option>
                                                <option value="phd">
                                                    PhD / Research
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">
                                                Academic Percentage
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={profile.marks}
                                                onChange={(event) =>
                                                    setProfile({
                                                        ...profile,
                                                        marks:
                                                            event.target.value,
                                                    })
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheck}
                                        className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                                    >
                                        Check Eligibility
                                    </button>
                                </div>

                                {/* Result */}
                                {checked && result && (
                                    <div className="mt-6 border-t border-slate-200 pt-6">
                                        <div
                                            className={`rounded-2xl border p-4 ${result.eligible
                                                    ? "border-emerald-200 bg-emerald-50"
                                                    : "border-rose-200 bg-rose-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${result.eligible
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-rose-100 text-rose-700"
                                                        }`}
                                                >
                                                    {result.eligible
                                                        ? "✓"
                                                        : "!"}
                                                </div>

                                                <div>
                                                    <p
                                                        className={`text-sm font-bold ${result.eligible
                                                                ? "text-emerald-800"
                                                                : "text-rose-800"
                                                            }`}
                                                    >
                                                        {result.eligible
                                                            ? "Eligible based on demo rules"
                                                            : "Additional review required"}
                                                    </p>

                                                    <p
                                                        className={`mt-1 text-xs leading-5 ${result.eligible
                                                                ? "text-emerald-700"
                                                                : "text-rose-700"
                                                            }`}
                                                    >
                                                        {result.passed} of{" "}
                                                        {result.total} configured
                                                        checks passed.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {result.checks.map((check) => (
                                                <div
                                                    key={check.label}
                                                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                                                >
                                                    <span
                                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${check.passed
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-rose-100 text-rose-700"
                                                            }`}
                                                    >
                                                        {check.passed
                                                            ? "✓"
                                                            : "×"}
                                                    </span>

                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">
                                                            {check.label}
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                                                            {check.detail}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {result.eligible && (
                                            <Link
                                                href="/upload"
                                                className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                                            >
                                                Continue to Application →
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </aside>
                </div>

                {/* Configurable engine explanation */}
                <section className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-700">
                            ⚙
                        </div>

                        <div className="flex-1">
                            <h2 className="text-sm font-bold text-indigo-900">
                                Configurable eligibility engine
                            </h2>

                            <p className="mt-1 max-w-4xl text-xs leading-5 text-indigo-800">
                                The portal is designed around scheme-specific
                                rules rather than hardcoded eligibility logic.
                                In the full backend implementation, each scheme
                                can define its own income, academic, category,
                                document and education-level conditions.
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/70 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                                Engine
                            </p>
                            <p className="mt-1 text-xs font-bold text-indigo-900">
                                JSON-based rules
                            </p>
                        </div>
                    </div>
                </section>

                {/* Demo disclaimer */}
                <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs leading-5 text-amber-800">
                        <strong>Demo note:</strong> The eligibility values and
                        checks shown here are configured demonstration rules
                        for the SIH prototype. Final scheme eligibility should
                        be determined from the applicable official scheme
                        guidelines.
                    </p>
                </section>
            </div>
        </main>
    );
}