"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

const DEMO_APPLICATIONS = [
    {
        id: "87736a90-d461-46ea-b989-3fd76279e3c8",
        applicant_name: "Rahul Munda",
        scheme_id: "post-matric",
        scheme_name: "Post-Matric Scholarship",
        status: "review",
        submitted_data: {
            income: 180000,
            percentage: 88.2,
            institution: "Demo Central University",
            course: "B.Tech Computer Science",
        },
    },
];

const SCHEMES = [
    {
        id: "pre-matric",
        name: "Pre-Matric Scholarship",
        description:
            "Scholarship support for eligible ST students at school level.",
        tag: "School",
    },
    {
        id: "post-matric",
        name: "Post-Matric Scholarship",
        description:
            "Financial assistance for eligible ST students pursuing higher education.",
        tag: "Higher Education",
    },
    {
        id: "top-class",
        name: "Top Class Scholarship",
        description:
            "Higher education support for eligible ST students in identified institutions.",
        tag: "Professional",
    },
    {
        id: "nfst",
        name: "NFST Fellowship",
        description:
            "Fellowship workflow for eligible ST research scholars.",
        tag: "Fellowship",
    },
    {
        id: "nos",
        name: "National Overseas Scholarship",
        description:
            "Application workflow for eligible overseas higher-study opportunities.",
        tag: "Overseas",
    },
];

const STATUS_CONFIG = {
    submitted: {
        label: "Submitted",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        description:
            "Your application has been submitted and is awaiting AI scrutiny.",
    },
    eligible: {
        label: "AI Scrutiny Passed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description:
            "Your application has passed the current AI eligibility checks.",
    },
    approved: {
        label: "AI Scrutiny Passed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description:
            "Your application has passed official scrutiny and is ready for institute verification.",
    },
    review: {
        label: "Defect / Review Required",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        description:
            "A document or application detail needs attention.",
    },
    institute_verified: {
        label: "Institute Verified",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        description:
            "Institute verification is complete. The application is ready for DBT processing.",
    },
    disbursed: {
        label: "DBT Disbursed",
        color: "bg-green-50 text-green-700 border-green-200",
        description:
            "The scholarship payment has been marked as disbursed.",
    },
    rejected: {
        label: "Rejected",
        color: "bg-red-50 text-red-700 border-red-200",
        description:
            "The application has been rejected.",
    },
};

function formatSchemeName(value) {
    if (!value) {
        return "Scholarship Application";
    }

    const match = SCHEMES.find(
        (scheme) => scheme.id === value
    );

    return match?.name || value;
}

function normalizeApplication(application, index) {
    if (!application) {
        return null;
    }

    return {
        ...application,
        _dashboardKey:
            application.id ||
            `application-${index}`,
        applicant_name:
            application.applicant_name ||
            application.applicants?.name ||
            "Rahul Munda",
        scheme_name:
            application.scheme_name ||
            application.schemes?.name ||
            formatSchemeName(
                application.scheme_id
            ),
    };
}

export default function DashboardPage() {
    const [student, setStudent] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiAvailable, setApiAvailable] = useState(true);
    const [savedApplicationId, setSavedApplicationId] =
        useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            try {
                const savedStudent =
                    window.localStorage.getItem(
                        "mota_student"
                    );

                const savedId =
                    window.localStorage.getItem(
                        "mota_application_id"
                    );

                if (savedStudent && !cancelled) {
                    try {
                        setStudent(
                            JSON.parse(savedStudent)
                        );
                    } catch {
                        setStudent({
                            name: "Rahul Munda",
                            category: "ST",
                            address: "Ranchi, Jharkhand",
                            bankStatus: "Seeded",
                            aadhaarVerified: true,
                            loginType: "student",
                        });
                    }
                } else if (!cancelled) {
                    setStudent({
                        name: "Rahul Munda",
                        category: "ST",
                        address: "Ranchi, Jharkhand",
                        bankStatus: "Seeded",
                        aadhaarVerified: true,
                        loginType: "student",
                    });
                }

                if (savedId && !cancelled) {
                    setSavedApplicationId(savedId);
                }

                try {
                    const response = await fetch(
                        `${API_URL}/applications`,
                        {
                            cache: "no-store",
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `HTTP ${response.status}`
                        );
                    }

                    const result =
                        await response.json();

                    const rawApplications =
                        Array.isArray(result)
                            ? result
                            : result.data ||
                            result.applications ||
                            [];

                    const normalized =
                        rawApplications
                            .map(
                                normalizeApplication
                            )
                            .filter(Boolean);

                    if (!cancelled) {
                        setApplications(
                            normalized.length
                                ? normalized
                                : DEMO_APPLICATIONS.map(
                                    normalizeApplication
                                )
                        );
                        setApiAvailable(true);
                    }
                } catch {
                    if (!cancelled) {
                        setApplications(
                            DEMO_APPLICATIONS.map(
                                normalizeApplication
                            )
                        );
                        setApiAvailable(false);
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const activeApplication = useMemo(() => {
        if (!applications.length) {
            return null;
        }

        if (savedApplicationId) {
            const savedApplication =
                applications.find(
                    (application) =>
                        String(application.id) ===
                        String(savedApplicationId)
                );

            if (savedApplication) {
                return savedApplication;
            }
        }

        return (
            applications.find(
                (application) =>
                    ![
                        "rejected",
                        "disbursed",
                    ].includes(
                        application.status
                    )
            ) || applications[0]
        );
    }, [
        applications,
        savedApplicationId,
    ]);

    const status =
        activeApplication?.status ||
        "submitted";

    const statusInfo =
        STATUS_CONFIG[status] ||
        STATUS_CONFIG.submitted;

    const studentName =
        student?.name || "Rahul Munda";

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 h-10 w-72 animate-pulse rounded-xl bg-slate-200" />

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="h-56 animate-pulse rounded-3xl bg-white shadow-sm lg:col-span-2" />
                        <div className="h-56 animate-pulse rounded-3xl bg-white shadow-sm" />
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="h-28 animate-pulse rounded-2xl bg-white" />
                        <div className="h-28 animate-pulse rounded-2xl bg-white" />
                        <div className="h-28 animate-pulse rounded-2xl bg-white" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <section className="mb-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <p className="mb-2 text-sm font-semibold text-indigo-600">
                                Student Portal
                            </p>

                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Welcome, {studentName} 👋
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Manage your scholarship and
                                fellowship applications from one
                                place.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                ✓ e-KYC Verified
                            </span>

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                ST Category
                            </span>

                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Bank: Seeded
                            </span>
                        </div>
                    </div>
                </section>

                {/* API / demo status */}
                {!apiAvailable && (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <span className="font-semibold">
                            Demo mode:
                        </span>{" "}
                        Backend applications could not be
                        reached, so the portal is showing
                        local demonstration data.
                    </div>
                )}

                {/* Main application + profile */}
                <section className="grid gap-6 lg:grid-cols-3">

                    {/* Active application */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Active Application
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                                        {activeApplication?.scheme_name ||
                                            "No active application"}
                                    </h2>
                                </div>

                                {activeApplication && (
                                    <span
                                        className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${statusInfo.color}`}
                                    >
                                        {statusInfo.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {activeApplication ? (
                            <div className="p-6">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">
                                            Application ID
                                        </p>

                                        <p className="mt-1 break-all text-sm font-bold text-slate-900">
                                            {activeApplication.id}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">
                                            Annual Income
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                            ₹
                                            {Number(
                                                activeApplication
                                                    .submitted_data
                                                    ?.income || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">
                                            Academic Score
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                            {activeApplication
                                                .submitted_data
                                                ?.percentage ||
                                                "—"}
                                            {activeApplication
                                                .submitted_data
                                                ?.percentage
                                                ? "%"
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={`mt-5 rounded-2xl border p-4 ${statusInfo.color}`}
                                >
                                    <p className="text-sm font-semibold">
                                        {statusInfo.description}
                                    </p>

                                    {status ===
                                        "review" && (
                                            <p className="mt-1 text-xs">
                                                Open the Status or
                                                Upload section to
                                                resolve document
                                                defects.
                                            </p>
                                        )}
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Link
                                        href={`/status?id=${activeApplication.id}`}
                                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                    >
                                        Track Application
                                    </Link>

                                    {status ===
                                        "review" && (
                                            <Link
                                                href={`/upload?application_id=${activeApplication.id}`}
                                                className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                                            >
                                                Resolve Defect
                                            </Link>
                                        )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                                    🎓
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-900">
                                    No application yet
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                    Check your eligibility and
                                    start a scholarship application.
                                </p>

                                <Link
                                    href="/scheme-selection"
                                    className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Check Eligibility
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Student profile */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Student Profile
                        </p>

                        <div className="mt-5 flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
                                {studentName
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    {studentName}
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Scheduled Tribe
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Location
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {student?.address ||
                                        "Ranchi, Jharkhand"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Aadhaar / e-KYC
                                </p>

                                <p className="mt-1 text-sm font-semibold text-emerald-700">
                                    Verified
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Bank Account
                                </p>

                                <p className="mt-1 text-sm font-semibold text-emerald-700">
                                    DBT Seeded
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick actions */}
                <section className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            Quick Actions
                        </h2>

                        <p className="text-sm text-slate-500">
                            Common tasks for your scholarship journey.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link
                            href="/scheme-selection"
                            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                                🎯
                            </div>

                            <h3 className="mt-4 font-bold text-slate-900">
                                Check Eligibility
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Find schemes matching your profile.
                            </p>
                        </Link>

                        <Link
                            href="/upload"
                            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                                📄
                            </div>

                            <h3 className="mt-4 font-bold text-slate-900">
                                Upload Documents
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Verify documents using AI OCR.
                            </p>
                        </Link>

                        <Link
                            href={
                                activeApplication
                                    ? `/status?id=${activeApplication.id}`
                                    : "/status"
                            }
                            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                                📍
                            </div>

                            <h3 className="mt-4 font-bold text-slate-900">
                                Track Status
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                See every stage of your application.
                            </p>
                        </Link>

                        <Link
                            href="/fellowship-claims"
                            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
                                💰
                            </div>

                            <h3 className="mt-4 font-bold text-slate-900">
                                Fellowship Claims
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Submit NFST/NOS fellowship claims.
                            </p>
                        </Link>
                    </div>
                </section>

                {/* Recommended schemes */}
                <section className="mt-10">
                    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Recommended Schemes
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Explore the scholarship and fellowship
                                workflows available in this demo.
                            </p>
                        </div>

                        <Link
                            href="/scheme-selection"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            View all schemes →
                        </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {SCHEMES.map(
                            (scheme) => (
                                <Link
                                    href={`/scheme-selection?scheme=${scheme.id}`}
                                    key={scheme.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                            {scheme.tag}
                                        </span>

                                        <span className="text-indigo-500">
                                            →
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold leading-5 text-slate-900">
                                        {scheme.name}
                                    </h3>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        {scheme.description}
                                    </p>
                                </Link>
                            )
                        )}
                    </div>
                </section>

                {/* Applications */}
                <section className="mt-10">
                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-slate-900">
                            My Applications
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Your recent scholarship applications.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        {applications.length ? (
                            <div className="divide-y divide-slate-100">
                                {applications.map(
                                    (application, index) => {
                                        const config =
                                            STATUS_CONFIG[
                                            application
                                                .status
                                            ] ||
                                            STATUS_CONFIG
                                                .submitted;

                                        return (
                                            <div
                                                key={
                                                    application._dashboardKey ||
                                                    `${application.id || "application"}-${index}`
                                                }
                                                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                                            >
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-bold text-slate-900">
                                                            {application.scheme_name}
                                                        </h3>

                                                        <span
                                                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${config.color}`}
                                                        >
                                                            {
                                                                config.label
                                                            }
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        ID:{" "}
                                                        {
                                                            application.id
                                                        }
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/status?id=${application.id}`}
                                                    className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    View Status
                                                </Link>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-slate-500">
                                No applications found.
                            </div>
                        )}
                    </div>
                </section>

                {/* Transparency */}
                <section className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                    <div className="flex gap-4">
                        <div className="text-xl">
                            ℹ️
                        </div>

                        <div>
                            <h3 className="font-bold text-indigo-900">
                                SIH Demonstration Environment
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-indigo-800">
                                This portal demonstrates an AI-assisted
                                scholarship workflow using synthetic
                                student data and documents. Production
                                deployment would connect verified
                                government identity, scheme databases,
                                institutional systems and DBT services.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}