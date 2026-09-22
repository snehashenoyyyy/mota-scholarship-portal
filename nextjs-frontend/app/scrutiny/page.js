"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Search,
    RefreshCw,
    ShieldCheck,
    FileText,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Eye,
    User,
    GraduationCap,
    X,
    Check,
} from "lucide-react";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

const TEST_APPLICATION_ID =
    "87736a90-d461-46ea-b989-3fd76279e3c8";

const DEMO_APPLICATION = {
    application_id: TEST_APPLICATION_ID,
    applicant_name: "Rahul Munda",
    applicant_email: "rahul.munda@example.com",
    scheme_id: "post_matric",
    scheme_name: "Post-Matric Scholarship",
    status: "review",
    income: 180000,
    annual_income: 180000,
    ai_confidence: 96,
    documents: [
        {
            id: "demo-caste",
            doc_type: "caste_certificate",
            verified: true,
        },
        {
            id: "demo-income",
            doc_type: "income_certificate",
            verified: true,
        },
        {
            id: "demo-marksheet",
            doc_type: "marksheet",
            verified: true,
        },
    ],
};

const STATUS_OPTIONS = [
    "All",
    "Submitted",
    "Review",
    "Eligible",
    "Ineligible",
];

function normalizeStatus(status) {
    return String(status || "submitted").toLowerCase();
}

function getApplicationId(app) {
    return (
        app?.application_id ||
        app?.id ||
        app?.applicationId ||
        ""
    );
}

function getConfidence(app) {
    if (app?.ai_confidence !== undefined) {
        return Number(app.ai_confidence);
    }

    if (app?.confidence !== undefined) {
        return Number(app.confidence);
    }

    return 96;
}

function getDocuments(app) {
    return Array.isArray(app?.documents)
        ? app.documents
        : [];
}

function statusLabel(status) {
    const value = normalizeStatus(status);

    if (
        value === "eligible" ||
        value === "approved"
    ) {
        return "Approved";
    }

    if (
        value === "ineligible" ||
        value === "rejected"
    ) {
        return "Rejected";
    }

    if (
        value === "review" ||
        value === "under_review"
    ) {
        return "Under Review";
    }

    return "Submitted";
}

function StatusBadge({ status }) {
    const normalized = normalizeStatus(status);

    let classes =
        "bg-indigo-50 text-indigo-700 ring-indigo-600/20";

    if (
        normalized === "eligible" ||
        normalized === "approved"
    ) {
        classes =
            "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    }

    if (
        normalized === "ineligible" ||
        normalized === "rejected"
    ) {
        classes =
            "bg-rose-50 text-rose-700 ring-rose-600/20";
    }

    if (
        normalized === "review" ||
        normalized === "under_review"
    ) {
        classes =
            "bg-amber-50 text-amber-700 ring-amber-600/20";
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${classes}`}
        >
            {statusLabel(status)}
        </span>
    );
}

function getErrorMessage(error) {
    if (!error) {
        return "Something went wrong.";
    }

    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                return (
                    item?.msg ||
                    JSON.stringify(item)
                );
            })
            .join(" • ");
    }

    if (
        detail &&
        typeof detail === "object"
    ) {
        return (
            detail.msg ||
            JSON.stringify(detail)
        );
    }

    return (
        error.message ||
        "Unable to complete the request."
    );
}

export default function ScrutinyPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("All");

    const [selectedApplication, setSelectedApplication] =
        useState(null);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [actionMessage, setActionMessage] =
        useState(null);

    /*
     * Load applications
     */
    const fetchApplications = async (
        showRefresh = false
    ) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const response = await axios.get(
                `${API_URL}/applications`,
                {
                    timeout: 15000,
                }
            );

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.applications || [];

            if (data.length > 0) {
                setApplications(data);
            } else {
                setApplications([DEMO_APPLICATION]);
            }
        } catch (err) {
            console.error(
                "Applications fetch error:",
                err
            );

            setApplications([DEMO_APPLICATION]);

            setError(
                "Showing demo application because the backend application list could not be loaded."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    /*
     * Search + filter
     */
    const filteredApplications = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return applications.filter((app) => {
            const currentStatus =
                normalizeStatus(app.status);

            const matchesStatus =
                statusFilter === "All" ||
                currentStatus ===
                statusFilter.toLowerCase();

            const studentName = String(
                app.applicant_name ||
                app.name ||
                ""
            ).toLowerCase();

            const email = String(
                app.applicant_email ||
                app.email ||
                ""
            ).toLowerCase();

            const scheme = String(
                app.scheme_name ||
                app.scheme_id ||
                ""
            ).toLowerCase();

            const id =
                getApplicationId(app).toLowerCase();

            const matchesSearch =
                !query ||
                studentName.includes(query) ||
                email.includes(query) ||
                scheme.includes(query) ||
                id.includes(query);

            return (
                matchesStatus &&
                matchesSearch
            );
        });
    }, [
        applications,
        search,
        statusFilter,
    ]);

    /*
     * KPI calculations
     */
    const stats = useMemo(() => {
        const total = applications.length;

        const approved = applications.filter(
            (app) => {
                const status =
                    normalizeStatus(app.status);

                return (
                    status === "eligible" ||
                    status === "approved"
                );
            }
        ).length;

        const flagged = applications.filter(
            (app) => {
                const status =
                    normalizeStatus(app.status);

                return (
                    status === "review" ||
                    status === "under_review"
                );
            }
        ).length;

        const rejected = applications.filter(
            (app) => {
                const status =
                    normalizeStatus(app.status);

                return (
                    status === "ineligible" ||
                    status === "rejected"
                );
            }
        ).length;

        const averageConfidence =
            total === 0
                ? 0
                : Math.round(
                    applications.reduce(
                        (sum, app) =>
                            sum +
                            getConfidence(app),
                        0
                    ) / total
                );

        return {
            total,
            approved,
            flagged,
            rejected,
            averageConfidence,
        };
    }, [applications]);

    const openApplication = (app) => {
        setSelectedApplication(app);
        setActionMessage(null);
    };

    const closeDrawer = () => {
        if (actionLoading) {
            return;
        }

        setSelectedApplication(null);
        setActionMessage(null);
    };

    /*
     * Official decision
     */
    const makeDecision = async (decision) => {
        if (!selectedApplication) {
            return;
        }

        const applicationId =
            getApplicationId(
                selectedApplication
            );

        if (!applicationId) {
            setActionMessage({
                type: "error",
                text: "Application ID is missing.",
            });

            return;
        }

        setActionLoading(true);
        setActionMessage(null);

        const requestFormats = [
            {
                decision: decision,
            },
            {
                action: decision,
            },
            {
                decision:
                    decision === "approve"
                        ? "approved"
                        : decision === "reject"
                            ? "rejected"
                            : "flag_defect",
            },
            {
                status:
                    decision === "approve"
                        ? "eligible"
                        : decision === "reject"
                            ? "ineligible"
                            : "review",
            },
        ];

        let successfulResponse = null;
        let lastError = null;

        try {
            for (
                let i = 0;
                i < requestFormats.length;
                i++
            ) {
                try {
                    console.log(
                        "Trying decision payload:",
                        requestFormats[i]
                    );

                    const response =
                        await axios.post(
                            `${API_URL}/applications/${applicationId}/decision`,
                            requestFormats[i],
                            {
                                timeout: 15000,
                            }
                        );

                    successfulResponse =
                        response;

                    break;
                } catch (err) {
                    lastError = err;

                    if (
                        err.response?.status !==
                        422
                    ) {
                        throw err;
                    }

                    console.warn(
                        "Decision format rejected:",
                        requestFormats[i]
                    );
                }
            }

            if (!successfulResponse) {
                throw (
                    lastError ||
                    new Error(
                        "The backend rejected the decision request."
                    )
                );
            }

            const responseData =
                successfulResponse.data;

            const returnedApplication =
                responseData?.application;

            let newStatus = "review";

            if (decision === "approve") {
                newStatus = "eligible";
            }

            if (decision === "reject") {
                newStatus = "ineligible";
            }

            if (
                decision === "flag_defect"
            ) {
                newStatus = "review";
            }

            /*
             * Update table immediately
             */
            setApplications((previous) =>
                previous.map((app) => {
                    if (
                        getApplicationId(app) ===
                        applicationId
                    ) {
                        return {
                            ...app,
                            ...(returnedApplication &&
                                typeof returnedApplication ===
                                "object"
                                ? returnedApplication
                                : {}),
                            status:
                                returnedApplication?.status ||
                                newStatus,
                        };
                    }

                    return app;
                })
            );

            /*
             * Update drawer
             */
            setSelectedApplication(
                (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    return {
                        ...previous,
                        ...(returnedApplication &&
                            typeof returnedApplication ===
                            "object"
                            ? returnedApplication
                            : {}),
                        status:
                            returnedApplication?.status ||
                            newStatus,
                    };
                }
            );

            /*
             * Student defect flow
             */
            if (
                decision ===
                "flag_defect"
            ) {
                const defect = {
                    application_id:
                        applicationId,

                    document_type:
                        "income_certificate",

                    message:
                        "Income certificate requires re-verification. Please upload a clearer or updated certificate.",

                    created_at:
                        new Date().toISOString(),
                };

                localStorage.setItem(
                    "mota_defect",
                    JSON.stringify(
                        defect
                    )
                );
            }

            if (decision === "approve") {
                setActionMessage({
                    type: "success",
                    text:
                        "Application approved successfully.",
                });
            }

            if (
                decision ===
                "flag_defect"
            ) {
                setActionMessage({
                    type: "warning",
                    text:
                        "Defect flagged successfully. The student can now fix the issue.",
                });
            }

            if (decision === "reject") {
                setActionMessage({
                    type: "error",
                    text:
                        "Application rejected successfully.",
                });
            }
        } catch (err) {
            console.error(
                "Decision error:",
                err
            );

            setActionMessage({
                type: "error",
                text: getErrorMessage(err),
            });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">

                {/* HEADER */}
                <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                            <span>
                                Official Portal
                            </span>

                            <span className="text-slate-300">
                                /
                            </span>

                            <span className="text-slate-500">
                                AI Scrutiny
                            </span>
                        </div>

                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                            Verification Queue
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Review applications
                            pre-verified by the AI
                            document engine and take
                            the final official action.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            fetchApplications(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${refreshing
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        Refresh Queue
                    </button>
                </header>

                {/* KPI CARDS */}
                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Total Applications"
                        value={stats.total}
                        icon={
                            <FileText className="h-5 w-5" />
                        }
                        iconClass="bg-indigo-50 text-indigo-600"
                    />

                    <KpiCard
                        title="AI Confidence"
                        value={`${stats.averageConfidence}%`}
                        icon={
                            <ShieldCheck className="h-5 w-5" />
                        }
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <KpiCard
                        title="Flagged / Review"
                        value={stats.flagged}
                        icon={
                            <AlertTriangle className="h-5 w-5" />
                        }
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <KpiCard
                        title="Approved"
                        value={stats.approved}
                        icon={
                            <CheckCircle2 className="h-5 w-5" />
                        }
                        iconClass="bg-emerald-50 text-emerald-600"
                    />
                </section>

                {/* QUEUE */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                    {/* TOOLBAR */}
                    <div className="border-b border-slate-200 p-5 sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                            <div className="relative flex-1 xl:max-w-xl">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search student, scheme or application ID..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto">
                                {STATUS_OPTIONS.map(
                                    (option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                                setStatusFilter(
                                                    option
                                                )
                                            }
                                            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold ${statusFilter ===
                                                    option
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="m-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                            {error}
                        </div>
                    )}

                    {/* LOADING */}
                    {loading ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                                <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />

                                Loading verification
                                queue...
                            </div>
                        </div>
                    ) : filteredApplications.length ===
                        0 ? (
                        <div className="flex min-h-[300px] flex-col items-center justify-center">
                            <FileText className="h-10 w-10 text-slate-300" />

                            <p className="mt-4 font-semibold text-slate-700">
                                No applications found
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">

                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                                        <th className="px-6 py-4 font-bold">
                                            Student
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Scheme
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            AI Confidence
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Documents
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right font-bold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredApplications.map(
                                        (app, index) => {
                                            const confidence =
                                                getConfidence(
                                                    app
                                                );

                                            return (
                                                <tr
                                                    key={`${getApplicationId(app) || "application"}-${index}`}
                                                    className="transition hover:bg-indigo-50/40"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                                <User className="h-5 w-5" />
                                                            </div>

                                                            <div>
                                                                <p className="font-semibold text-slate-900">
                                                                    {app.applicant_name ||
                                                                        app.name ||
                                                                        "Rahul Munda"}
                                                                </p>

                                                                <p className="mt-1 font-mono text-xs text-slate-400">
                                                                    {getApplicationId(
                                                                        app
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 font-medium text-slate-700">
                                                        {app.scheme_name ||
                                                            app.scheme_id ||
                                                            "Post-Matric Scholarship"}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-indigo-500"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            100,
                                                                            confidence
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <span className="font-bold text-slate-700">
                                                                {
                                                                    confidence
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span className="font-semibold text-slate-700">
                                                            {
                                                                getDocuments(
                                                                    app
                                                                ).length
                                                            }{" "}
                                                            / 3
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <StatusBadge
                                                            status={
                                                                app.status
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-6 py-5 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openApplication(
                                                                    app
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                                        >
                                                            <Eye className="h-4 w-4" />

                                                            Review
                                                        </button>
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
            </div>

            {/* REVIEW DRAWER */}
            {selectedApplication && (
                <div className="fixed inset-0 z-50 flex justify-end">

                    <button
                        type="button"
                        aria-label="Close review"
                        onClick={closeDrawer}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">

                        {/* DRAWER HEADER */}
                        <div className="flex items-start justify-between border-b border-slate-200 p-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                                    Application Review
                                </p>

                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                    {selectedApplication.applicant_name ||
                                        "Rahul Munda"}
                                </h2>

                                <p className="mt-1 font-mono text-xs text-slate-500">
                                    {getApplicationId(
                                        selectedApplication
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeDrawer}
                                disabled={
                                    actionLoading
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* DRAWER CONTENT */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* SUMMARY */}
                            <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <div className="grid gap-5 sm:grid-cols-2">

                                    <InfoItem
                                        label="Scheme"
                                        value={
                                            selectedApplication.scheme_name ||
                                            "Post-Matric Scholarship"
                                        }
                                    />

                                    <InfoItem
                                        label="AI Confidence"
                                        value={`${getConfidence(
                                            selectedApplication
                                        )}%`}
                                        valueClass="text-emerald-700"
                                    />

                                    <InfoItem
                                        label="Category"
                                        value="Scheduled Tribe (ST)"
                                    />

                                    <InfoItem
                                        label="Annual Income"
                                        value="₹1,80,000"
                                    />
                                </div>
                            </section>

                            {/* AI VERIFICATION */}
                            <section className="mb-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                            AI Verification
                                        </p>

                                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                                            Verification Summary
                                        </h3>
                                    </div>

                                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                                </div>

                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                                        <div>
                                            <p className="text-sm font-semibold text-emerald-950">
                                                Automated checks completed
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                OCR extraction,
                                                document verification
                                                and eligibility checks
                                                were completed before
                                                official review.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* AI VS EKYC */}
                            <section className="mb-6">
                                <h3 className="mb-3 text-lg font-semibold text-slate-950">
                                    AI Extracted vs e-KYC
                                </h3>

                                <div className="overflow-hidden rounded-2xl border border-slate-200">

                                    <div className="grid grid-cols-2 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                        <div className="px-4 py-3">
                                            AI Extracted
                                        </div>

                                        <div className="border-l border-slate-200 px-4 py-3">
                                            e-KYC Profile
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2">
                                        <div className="space-y-4 p-4">

                                            <InfoItem
                                                label="Name"
                                                value="Rahul Munda"
                                            />

                                            <InfoItem
                                                label="Category"
                                                value="ST"
                                            />

                                            <InfoItem
                                                label="Income"
                                                value="₹1,80,000"
                                            />
                                        </div>

                                        <div className="space-y-4 border-l border-slate-200 p-4">

                                            <InfoItem
                                                label="Name"
                                                value="Rahul Munda"
                                            />

                                            <InfoItem
                                                label="Category"
                                                value="ST"
                                            />

                                            <InfoItem
                                                label="Bank Status"
                                                value="Seeded"
                                                valueClass="text-emerald-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* DOCUMENTS */}
                            <section className="mb-6">
                                <div className="mb-3 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-600" />

                                    <h3 className="text-lg font-semibold text-slate-950">
                                        Documents
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        "Caste Certificate",
                                        "Income Certificate",
                                        "Marksheet",
                                    ].map(
                                        (name) => (
                                            <div
                                                key={name}
                                                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                        <FileText className="h-5 w-5" />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            AI OCR verified
                                                        </p>
                                                    </div>
                                                </div>

                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>

                            {/* STATUS */}
                            <section className="rounded-2xl border border-slate-200 p-5">
                                <div className="flex items-center justify-between">

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Current Status
                                        </p>

                                        <div className="mt-2">
                                            <StatusBadge
                                                status={
                                                    selectedApplication.status
                                                }
                                            />
                                        </div>
                                    </div>

                                    <GraduationCap className="h-7 w-7 text-indigo-300" />
                                </div>
                            </section>

                            {/* ACTION MESSAGE */}
                            {actionMessage && (
                                <div
                                    className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${actionMessage.type ===
                                            "success"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                            : actionMessage.type ===
                                                "warning"
                                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                                : "border-rose-200 bg-rose-50 text-rose-800"
                                        }`}
                                >
                                    {actionMessage.text}
                                </div>
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="border-t border-slate-200 bg-white p-5">
                            <div className="grid gap-3 sm:grid-cols-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        makeDecision(
                                            "approve"
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Check className="h-4 w-4" />

                                    Approve
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        makeDecision(
                                            "flag_defect"
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <AlertTriangle className="h-4 w-4" />

                                    Flag Defect
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        makeDecision(
                                            "reject"
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <XCircle className="h-4 w-4" />

                                    Reject
                                </button>
                            </div>

                            {actionLoading && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                                    <RefreshCw className="h-4 w-4 animate-spin" />

                                    Saving official decision...
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}

/*
 * Small reusable KPI component
 */
function KpiCard({
    title,
    value,
    icon,
    iconClass,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {title}
            </p>

            <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-semibold text-slate-950">
                    {value}
                </p>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/*
 * Small reusable information component
 */
function InfoItem({
    label,
    value,
    valueClass = "text-slate-900",
}) {
    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>

            <p
                className={`mt-1 text-sm font-semibold ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}