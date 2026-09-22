"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STEPS = [
    {
        key: "submitted",
        title: "Submitted",
        description: "Application submitted successfully",
    },
    {
        key: "scrutiny",
        title: "AI Scrutiny Passed",
        description: "Documents checked by AI OCR",
    },
    {
        key: "institute",
        title: "Institute Verification",
        description: "Waiting for institute verification",
    },
    {
        key: "disbursed",
        title: "DBT Payment Disbursed",
        description: "Scholarship payment released",
    },
];

function StatusContent() {
    const searchParams = useSearchParams();

    const [applicationId, setApplicationId] = useState("");
    const [student, setStudent] = useState(null);
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadApplication = async (id, showRefresh = false) => {
        if (!id) return;

        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await fetch(
                `${API_URL}/applications/${id}`
            );

            const result = await response.json();

            if (!response.ok || result?.success === false) {
                throw new Error(
                    result?.detail ||
                    result?.error ||
                    "Unable to load application"
                );
            }

            setApplication(result?.data || result);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to load application");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const savedStudent = localStorage.getItem("mota_student");

        if (savedStudent) {
            try {
                setStudent(JSON.parse(savedStudent));
            } catch {
                setStudent(null);
            }
        }

        const queryId = searchParams.get("id");
        const savedId =
            queryId ||
            localStorage.getItem("mota_application_id");

        if (savedId) {
            setApplicationId(savedId);
            loadApplication(savedId);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const status = application?.status || "submitted";

    const documents = application?.documents || [];

    const reVerifiedDocument = useMemo(() => {
        return documents.find(
            (document) =>
                document?.extracted_data?.re_verified === true
        );
    }, [documents]);

    const hasDocumentDefect = useMemo(() => {
        return documents.some((document) => {
            const extracted = document?.extracted_data || {};

            return (
                document?.verified === false ||
                extracted?.mismatch === true
            );
        });
    }, [documents]);

    const savedDefect =
        typeof window !== "undefined"
            ? localStorage.getItem("mota_defect")
            : null;

    const hasDefect =
        status === "review" &&
        (hasDocumentDefect || Boolean(savedDefect));

    const stageIndex = useMemo(() => {
        if (status === "disbursed") return 3;

        if (status === "institute_verified") return 2;

        if (
            status === "approved" ||
            status === "eligible" ||
            status === "review"
        ) {
            return 1;
        }

        return 0;
    }, [status]);

    const statusText = {
        submitted: "Application Submitted",
        eligible: "AI Scrutiny Passed",
        approved: "AI Scrutiny Passed",
        review: "Action Required",
        institute_verified: "Institute Verified",
        disbursed: "DBT Payment Disbursed",
        rejected: "Application Rejected",
        ineligible: "Application Not Eligible",
    };

    const currentStatus =
        statusText[status] || "Application Under Processing";

    const instituteVerified =
        status === "institute_verified" ||
        status === "disbursed";

    const disbursed = status === "disbursed";

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-10">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                        <p className="font-semibold text-slate-900">
                            Loading application status...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (!applicationId) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-10">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
                        <div className="mb-3 text-4xl">📄</div>
                        <h1 className="text-xl font-bold text-slate-900">
                            No application found
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Submit an application first to view its tracking
                            status.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6">

                {/* Header */}
                <section className="rounded-3xl bg-gradient-to-r from-indigo-700 to-indigo-600 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-100">
                                Scholarship Application Tracking
                            </p>

                            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                                Track Your Application
                            </h1>

                            <p className="mt-2 text-sm text-indigo-100">
                                Application ID:{" "}
                                <span className="font-mono font-semibold">
                                    {applicationId}
                                </span>
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                loadApplication(applicationId, true)
                            }
                            disabled={refreshing}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60"
                        >
                            {refreshing ? "Refreshing..." : "↻ Refresh Status"}
                        </button>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <p className="font-semibold text-red-800">
                            Unable to load live status
                        </p>
                        <p className="mt-1 text-sm text-red-700">
                            {error}
                        </p>
                    </section>
                )}

                {/* Defect */}
                {hasDefect && (
                    <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl">
                                        ⚠️
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                                            Action Required
                                        </p>

                                        <h2 className="text-xl font-bold text-red-900">
                                            Document Defect Detected
                                        </h2>
                                    </div>
                                </div>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-red-800">
                                    Our AI document verification system found
                                    an issue with one or more submitted
                                    documents. Upload a corrected document to
                                    continue verification.
                                </p>
                            </div>

                            <a
                                href={`/upload?id=${applicationId}`}
                                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700"
                            >
                                Fix Defect →
                            </a>
                        </div>
                    </section>
                )}

                {/* Re-verification */}
                {reVerifiedDocument && !hasDefect && (
                    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl">
                                ✓
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                    AI Verification Complete
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-emerald-900">
                                    Corrected Document Successfully
                                    Re-verified
                                </h2>

                                <p className="mt-2 text-sm text-emerald-800">
                                    Your corrected document passed AI OCR
                                    verification and has been returned to the
                                    official review workflow.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Institute verified */}
                {instituteVerified && !disbursed && (
                    <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-xl">
                                🏛️
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                                    Institute Verification Complete
                                </p>

                                <h2 className="text-xl font-bold text-cyan-900">
                                    Application is Ready for DBT
                                </h2>

                                <p className="mt-1 text-sm text-cyan-800">
                                    Your institution has verified the
                                    application. The next stage is scholarship
                                    payment through DBT.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* DBT */}
                {disbursed && (
                    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                                    💳
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                        Payment Successful
                                    </p>

                                    <h2 className="text-2xl font-bold text-emerald-900">
                                        DBT Payment Disbursed
                                    </h2>

                                    <p className="mt-1 text-sm text-emerald-800">
                                        Scholarship payment has been released
                                        to the registered bank account.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
                                <p className="text-xs font-semibold text-slate-500">
                                    Payment Status
                                </p>
                                <p className="mt-1 font-bold text-emerald-700">
                                    DISBURSED
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Application summary */}
                <section className="grid gap-5 lg:grid-cols-3">

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Current Status
                                </p>

                                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                    {currentStatus}
                                </h2>
                            </div>

                            <span
                                className={`rounded-full px-4 py-2 text-xs font-bold ${hasDefect
                                        ? "bg-red-100 text-red-700"
                                        : disbursed
                                            ? "bg-emerald-100 text-emerald-700"
                                            : instituteVerified
                                                ? "bg-cyan-100 text-cyan-700"
                                                : "bg-indigo-100 text-indigo-700"
                                    }`}
                            >
                                {status.toUpperCase()}
                            </span>
                        </div>

                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            <Info
                                label="Student"
                                value={
                                    student?.name ||
                                    application?.applicant_name ||
                                    "Rahul Munda"
                                }
                            />

                            <Info
                                label="Category"
                                value={
                                    student?.category ||
                                    "Scheduled Tribe (ST)"
                                }
                            />

                            <Info
                                label="Scheme"
                                value={
                                    application?.scheme_name ||
                                    application?.scheme_id ||
                                    "Scholarship Scheme"
                                }
                            />

                            <Info
                                label="Institution"
                                value={
                                    application?.submitted_data?.institution ||
                                    "Institution details submitted"
                                }
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Applicant
                        </p>

                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                                {(student?.name || "R")[0]}
                            </div>

                            <div>
                                <p className="font-bold text-slate-900">
                                    {student?.name || "Rahul Munda"}
                                </p>

                                <p className="text-sm text-slate-500">
                                    {student?.address ||
                                        "Ranchi, Jharkhand"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Bank Status
                            </p>

                            <p className="mt-1 font-bold text-emerald-700">
                                {student?.bankStatus || "Seeded / Verified"}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-8">
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                            Application Journey
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                            Track Every Stage
                        </h2>
                    </div>

                    <div className="relative">
                        <div className="absolute left-5 top-5 hidden h-1 w-[calc(100%-40px)] bg-slate-200 md:block" />

                        <div
                            className="absolute left-5 top-5 hidden h-1 bg-indigo-600 transition-all md:block"
                            style={{
                                width:
                                    stageIndex === 0
                                        ? "0%"
                                        : `calc(${stageIndex} * 33.33% - ${stageIndex > 0 ? 5 : 0
                                        }px)`,
                            }}
                        />

                        <div className="relative grid gap-7 md:grid-cols-4">
                            {STEPS.map((step, index) => {
                                const completed =
                                    index < stageIndex ||
                                    (index === stageIndex &&
                                        status === "disbursed");

                                const active =
                                    index === stageIndex &&
                                    status !== "disbursed";

                                return (
                                    <div
                                        key={step.key}
                                        className="flex items-start gap-4 md:block"
                                    >
                                        <div
                                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white text-sm font-bold shadow ${completed
                                                    ? "bg-indigo-600 text-white"
                                                    : active
                                                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                                        : "bg-slate-200 text-slate-500"
                                                }`}
                                        >
                                            {completed ? "✓" : index + 1}
                                        </div>

                                        <div className="pt-1 md:mt-4">
                                            <p
                                                className={`font-bold ${completed || active
                                                        ? "text-slate-900"
                                                        : "text-slate-500"
                                                    }`}
                                            >
                                                {step.title}
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Documents */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                                AI Document Verification
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">
                                Submitted Documents
                            </h2>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {documents.length} document
                            {documents.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        {documents.length > 0 ? (
                            documents.map((document, index) => {
                                const extracted =
                                    document?.extracted_data || {};

                                const verified =
                                    document?.verified === true &&
                                    extracted?.mismatch !== true;

                                return (
                                    <div
                                        key={
                                            document?.id ||
                                            `${document?.doc_type}-${index}`
                                        }
                                        className="rounded-2xl border border-slate-200 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-bold text-slate-800">
                                                {formatDocumentType(
                                                    document?.doc_type
                                                )}
                                            </p>

                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] font-bold ${verified
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {verified
                                                    ? "VERIFIED"
                                                    : "FLAGGED"}
                                            </span>
                                        </div>

                                        {extracted?.re_verified && (
                                            <p className="mt-3 text-xs font-semibold text-emerald-700">
                                                ✓ AI Re-verified
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 md:col-span-3">
                                Document verification details will appear
                                here after upload.
                            </div>
                        )}
                    </div>
                </section>

                {/* Actions */}
                <section className="flex flex-col gap-3 sm:flex-row">
                    <a
                        href={`/upload?id=${applicationId}`}
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                    >
                        Upload / Correct Documents
                    </a>

                    <a
                        href="/dashboard"
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Back to Dashboard
                    </a>
                </section>

            </div>
        </main>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
}

function formatDocumentType(type) {
    if (!type) return "Document";

    return type
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StatusPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-slate-50 px-4 py-10">
                    <div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-center shadow-sm">
                        Loading...
                    </div>
                </main>
            }
        >
            <StatusContent />
        </Suspense>
    );
}