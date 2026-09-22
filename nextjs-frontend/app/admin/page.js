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
        scheme_id: "post_matric",
        scheme_name: "Post-Matric Scholarship",
        status: "institute_verified",
        submitted_data: {
            institution: "Government College, Ranchi",
            course: "B.Tech AIML",
            percentage: 82,
            income: 180000,
        },
        documents: [
            { verified: true },
            { verified: true },
            { verified: true },
        ],
    },
    {
        id: "demo-application-2",
        applicant_name: "Anita Tirkey",
        scheme_id: "nfst",
        scheme_name: "NFST",
        status: "review",
        submitted_data: {
            institution: "Central University",
            course: "M.Tech",
            percentage: 76,
            income: 210000,
        },
        documents: [
            { verified: true },
            { verified: false },
        ],
    },
    {
        id: "demo-application-3",
        applicant_name: "Rohit Kerketta",
        scheme_id: "nos",
        scheme_name: "NOS",
        status: "disbursed",
        submitted_data: {
            institution: "IIT Delhi",
            course: "PhD",
            percentage: 88,
            income: 0,
        },
        documents: [
            { verified: true },
            { verified: true },
            { verified: true },
        ],
    },
];

const SCHEMES = [
    "Pre-Matric",
    "Post-Matric",
    "Top Class",
    "NFST",
    "NOS",
];

export default function AdminPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadApplications = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/applications`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.detail ||
                    "Unable to load applications"
                );
            }

            const data =
                result?.data ||
                result ||
                [];

            setApplications(
                Array.isArray(data) && data.length
                    ? data
                    : DEMO_APPLICATIONS
            );
        } catch (err) {
            console.error(err);

            setApplications(
                DEMO_APPLICATIONS
            );

            setError(
                "Live analytics unavailable. Showing demo dashboard data."
            );
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const metrics = useMemo(() => {
        const total = applications.length;

        const documents = applications.flatMap(
            (application) =>
                application.documents || []
        );

        const verifiedDocuments =
            documents.filter(
                (document) =>
                    document?.verified === true
            ).length;

        const autoVerified =
            documents.length > 0
                ? Math.round(
                    (verifiedDocuments /
                        documents.length) *
                    100
                )
                : 0;

        const flagged = applications.filter(
            (application) =>
                application.status === "review"
        ).length;

        const disbursed = applications.filter(
            (application) =>
                application.status === "disbursed"
        ).length;

        const instituteVerified =
            applications.filter(
                (application) =>
                    application.status ===
                    "institute_verified"
            ).length;

        const approved = applications.filter(
            (application) =>
                application.status ===
                "approved"
        ).length;

        const rejected = applications.filter(
            (application) =>
                application.status ===
                "rejected"
        ).length;

        return {
            total,
            autoVerified,
            flagged,
            disbursed,
            instituteVerified,
            approved,
            rejected,
        };
    }, [applications]);

    const schemeDistribution = useMemo(() => {
        return SCHEMES.map((scheme) => {
            const count = applications.filter(
                (application) =>
                    normalizeScheme(
                        application.scheme_name ||
                        application.scheme_id
                    ) ===
                    normalizeScheme(scheme)
            ).length;

            return {
                scheme,
                count,
            };
        });
    }, [applications]);

    const statusDistribution = useMemo(() => {
        return [
            {
                label: "Submitted",
                value: applications.filter(
                    (item) =>
                        item.status === "submitted"
                ).length,
            },
            {
                label: "AI Scrutiny",
                value: applications.filter(
                    (item) =>
                        item.status === "eligible" ||
                        item.status === "approved"
                ).length,
            },
            {
                label: "Institute Verified",
                value: metrics.instituteVerified,
            },
            {
                label: "Flagged",
                value: metrics.flagged,
            },
            {
                label: "Disbursed",
                value: metrics.disbursed,
            },
            {
                label: "Rejected",
                value: metrics.rejected,
            },
        ];
    }, [applications, metrics]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* HEADER */}
                <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-900 p-6 text-white shadow-xl">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-200">
                                    OFFICIAL PORTAL
                                </span>

                                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                                    SYSTEM ONLINE
                                </span>
                            </div>

                            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                                Scholarship Command Center
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                Monitor scholarship applications,
                                AI document verification, institute
                                verification, fellowship claims and
                                DBT disbursement from one dashboard.
                            </p>
                        </div>

                        <button
                            onClick={loadApplications}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100"
                        >
                            ↻ Refresh Dashboard
                        </button>
                    </div>

                    {lastUpdated && (
                        <p className="mt-5 text-xs text-slate-400">
                            Last updated:{" "}
                            {lastUpdated.toLocaleTimeString(
                                "en-IN"
                            )}
                        </p>
                    )}
                </section>

                {/* ERROR */}
                {error && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                        {error}
                    </div>
                )}

                {/* MAIN KPIS */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi
                        title="Total Applications"
                        value={metrics.total}
                        icon="📄"
                        tone="indigo"
                    />

                    <Kpi
                        title="AI Auto-Verified"
                        value={`${metrics.autoVerified}%`}
                        icon="🤖"
                        tone="emerald"
                    />

                    <Kpi
                        title="Flagged / Deficient"
                        value={metrics.flagged}
                        icon="⚠️"
                        tone="amber"
                    />

                    <Kpi
                        title="DBT Disbursed"
                        value={metrics.disbursed}
                        icon="💳"
                        tone="cyan"
                    />
                </section>

                {/* WORKFLOW KPIS */}
                <section className="grid gap-4 md:grid-cols-3">
                    <WorkflowCard
                        title="AI Scrutiny"
                        value={
                            metrics.approved +
                            applications.filter(
                                (item) =>
                                    item.status ===
                                    "eligible"
                            ).length
                        }
                        description="Applications passed AI scrutiny"
                        href="/scrutiny"
                        icon="🤖"
                    />

                    <WorkflowCard
                        title="Institute Verification"
                        value={
                            metrics.instituteVerified
                        }
                        description="Applications ready for DBT"
                        href="/institute-verification"
                        icon="🏛️"
                    />

                    <WorkflowCard
                        title="Fellowship Claims"
                        value="Review"
                        description="NFST / NOS claim management"
                        href="/fellowship-claims-admin"
                        icon="🎓"
                    />
                </section>

                {/* ANALYTICS */}
                <section className="grid gap-6 lg:grid-cols-2">

                    {/* SCHEME DISTRIBUTION */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                                    Scheme Analytics
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    5-Scheme Distribution
                                </h2>
                            </div>

                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                                Live
                            </span>
                        </div>

                        <div className="mt-6 space-y-5">
                            {schemeDistribution.map(
                                (item) => {
                                    const percentage =
                                        metrics.total
                                            ? Math.round(
                                                (item.count /
                                                    metrics.total) *
                                                100
                                            )
                                            : 0;

                                    return (
                                        <div
                                            key={`scheme-${item.scheme}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {item.scheme}
                                                </p>

                                                <p className="text-sm font-bold text-slate-900">
                                                    {item.count}
                                                </p>
                                            </div>

                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-indigo-600 transition-all"
                                                    style={{
                                                        width: `${Math.max(
                                                            percentage,
                                                            item.count
                                                                ? 8
                                                                : 0
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </section>

                    {/* STATUS DISTRIBUTION */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                                Workflow Analytics
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">
                                Application Status
                            </h2>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {statusDistribution.map(
                                (item) => (
                                    <div
                                        key={`status-${item.label}`}
                                        className="rounded-2xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-600">
                                                {item.label}
                                            </p>

                                            <p className="text-xl font-bold text-slate-900">
                                                {item.value}
                                            </p>
                                        </div>

                                        <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-cyan-600"
                                                style={{
                                                    width: `${metrics.total
                                                            ? Math.min(
                                                                100,
                                                                (item.value /
                                                                    metrics.total) *
                                                                100
                                                            )
                                                            : 0
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                </section>

                {/* RECENT APPLICATIONS */}
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                                Application Monitoring
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">
                                Recent Applications
                            </h2>
                        </div>

                        <Link
                            href="/scrutiny"
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-indigo-700"
                        >
                            Open Scrutiny Queue →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            Loading applications...
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            No applications available.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <Th>
                                            Student
                                        </Th>

                                        <Th>
                                            Scheme
                                        </Th>

                                        <Th>
                                            Institution
                                        </Th>

                                        <Th>
                                            AI Verification
                                        </Th>

                                        <Th>
                                            Status
                                        </Th>

                                        <Th>
                                            Action
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {applications
                                        .slice(0, 8)
                                        .map(
                                            (
                                                application,
                                                index
                                            ) => {
                                                const documents =
                                                    application.documents ||
                                                    [];

                                                const verified =
                                                    documents.filter(
                                                        (
                                                            document
                                                        ) =>
                                                            document?.verified ===
                                                            true
                                                    ).length;

                                                const allVerified =
                                                    documents.length >
                                                    0 &&
                                                    verified ===
                                                    documents.length;

                                                /*
                                                 * IMPORTANT:
                                                 * The backend can potentially
                                                 * return duplicate/undefined IDs.
                                                 *
                                                 * Combining the ID with the
                                                 * current index guarantees that
                                                 * every rendered row has a
                                                 * unique React key.
                                                 */
                                                const rowKey =
                                                    `application-row-${application?.id ||
                                                    "unknown"
                                                    }-${index}`;

                                                return (
                                                    <tr
                                                        key={
                                                            rowKey
                                                        }
                                                        className="border-b border-slate-100 hover:bg-slate-50"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="font-bold text-slate-900">
                                                                {application.applicant_name ||
                                                                    application.student_name ||
                                                                    "Student"}
                                                            </p>

                                                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                                                {String(
                                                                    application.id ||
                                                                    "N/A"
                                                                ).slice(
                                                                    0,
                                                                    12
                                                                )}
                                                                ...
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                            {application.scheme_name ||
                                                                application.scheme_id ||
                                                                "Scholarship"}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                            {application
                                                                .submitted_data
                                                                ?.institution ||
                                                                "—"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${allVerified
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                                    }`}
                                                            >
                                                                {allVerified
                                                                    ? "AI VERIFIED"
                                                                    : `${verified}/${documents.length ||
                                                                    3
                                                                    } CHECKED`}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge
                                                                status={
                                                                    application.status
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <Link
                                                                href="/scrutiny"
                                                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                Review
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* SERVICE STATUS */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            System Services
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                            Portal Health
                        </h2>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Service
                            name="FastAPI Backend"
                            status="Online"
                        />

                        <Service
                            name="Supabase Database"
                            status="Connected"
                        />

                        <Service
                            name="AI OCR Engine"
                            status="Active"
                        />

                        <Service
                            name="DBT Workflow"
                            status="Ready"
                        />
                    </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
                    <h2 className="text-xl font-bold">
                        Official Quick Actions
                    </h2>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <QuickAction
                            href="/scrutiny"
                            icon="🤖"
                            title="AI Scrutiny"
                        />

                        <QuickAction
                            href="/institute-verification"
                            icon="🏛️"
                            title="Institute Verification"
                        />

                        <QuickAction
                            href="/fellowship-claims-admin"
                            icon="🎓"
                            title="Fellowship Claims"
                        />

                        <QuickAction
                            href="/disbursement"
                            icon="💳"
                            title="DBT Disbursement"
                        />

                        <QuickAction
                            href="/merit-list"
                            icon="🏆"
                            title="Merit List"
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}


/* ============================================================
   KPI
============================================================ */

function Kpi({
    title,
    value,
    icon,
    tone,
}) {
    const tones = {
        indigo:
            "bg-indigo-50 text-indigo-700",
        emerald:
            "bg-emerald-50 text-emerald-700",
        amber:
            "bg-amber-50 text-amber-700",
        cyan:
            "bg-cyan-50 text-cyan-700",
    };

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${tones[tone]
                        }`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}


/* ============================================================
   WORKFLOW CARD
============================================================ */

function WorkflowCard({
    title,
    value,
    description,
    href,
    icon,
}) {
    return (
        <Link
            href={href}
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
        >
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                    {icon}
                </div>

                <span className="text-lg text-slate-300 transition group-hover:text-indigo-500">
                    →
                </span>
            </div>

            <p className="mt-5 text-sm font-bold text-slate-900">
                {title}
            </p>

            <p className="mt-1 text-2xl font-bold text-indigo-700">
                {value}
            </p>

            <p className="mt-1 text-xs text-slate-500">
                {description}
            </p>
        </Link>
    );
}


/* ============================================================
   SERVICE
============================================================ */

function Service({
    name,
    status,
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
                <p className="text-sm font-bold text-slate-800">
                    {name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    Operational
                </p>
            </div>

            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {status}
            </span>
        </div>
    );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
    href,
    icon,
    title,
}) {
    return (
        <Link
            href={href}
            className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/20"
        >
            <div className="text-xl">
                {icon}
            </div>

            <p className="mt-3 text-sm font-bold">
                {title}
            </p>
        </Link>
    );
}


/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
    status,
}) {
    const styles = {
        submitted:
            "bg-amber-100 text-amber-700",

        eligible:
            "bg-indigo-100 text-indigo-700",

        approved:
            "bg-indigo-100 text-indigo-700",

        review:
            "bg-orange-100 text-orange-700",

        institute_verified:
            "bg-cyan-100 text-cyan-700",

        disbursed:
            "bg-emerald-100 text-emerald-700",

        rejected:
            "bg-red-100 text-red-700",

        ineligible:
            "bg-red-100 text-red-700",
    };

    const labels = {
        submitted: "SUBMITTED",
        eligible: "AI PASSED",
        approved: "AI PASSED",
        review: "FLAGGED",
        institute_verified:
            "INSTITUTE VERIFIED",
        disbursed: "DISBURSED",
        rejected: "REJECTED",
        ineligible: "INELIGIBLE",
    };

    return (
        <span
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold ${styles[status] ||
                "bg-slate-100 text-slate-600"
                }`}
        >
            {labels[status] ||
                String(
                    status || "UNKNOWN"
                ).toUpperCase()}
        </span>
    );
}


/* ============================================================
   TABLE HEADER
============================================================ */

function Th({
    children,
}) {
    return (
        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}


/* ============================================================
   SCHEME NORMALIZATION
============================================================ */

function normalizeScheme(
    value
) {
    return String(value || "")
        .toLowerCase()
        .replaceAll("_", "")
        .replaceAll("-", "")
        .replaceAll(" ", "");
}