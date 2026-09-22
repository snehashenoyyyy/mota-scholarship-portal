"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const CLAIM_TYPES = [
    {
        value: "Monthly Fellowship",
        icon: "📅",
        description: "Submit your monthly fellowship claim.",
    },
    {
        value: "Contingency",
        icon: "📚",
        description: "Claim eligible academic contingency expenses.",
    },
    {
        value: "HRA",
        icon: "🏠",
        description: "Submit your applicable HRA claim.",
    },
];

const DEMO_CLAIMS = [
    {
        id: "CLM-2026-001",
        student_name: "Rahul Munda",
        scheme: "NFST",
        claim_type: "Monthly Fellowship",
        claim_month: "September 2026",
        amount: 37000,
        status: "approved",
        admin_note: "Claim verified and approved.",
        transaction_id: null,
        created_at: "2026-09-05T10:00:00",
    },
    {
        id: "CLM-2026-002",
        student_name: "Rahul Munda",
        scheme: "NFST",
        claim_type: "HRA",
        claim_month: "August 2026",
        amount: 5000,
        status: "disbursed",
        admin_note: "Payment processed through DBT.",
        transaction_id: "FEL-DBT-84A921",
        created_at: "2026-08-04T10:00:00",
    },
];

function normalizeClaims(data) {
    const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
            : [];

    return list;
}

function statusConfig(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "disbursed") {
        return {
            label: "Disbursed",
            className: "bg-emerald-100 text-emerald-700",
            dot: "bg-emerald-500",
        };
    }

    if (normalized === "approved") {
        return {
            label: "Approved",
            className: "bg-indigo-100 text-indigo-700",
            dot: "bg-indigo-500",
        };
    }

    if (normalized === "review") {
        return {
            label: "Under Review",
            className: "bg-amber-100 text-amber-700",
            dot: "bg-amber-500",
        };
    }

    if (normalized === "rejected") {
        return {
            label: "Rejected",
            className: "bg-rose-100 text-rose-700",
            dot: "bg-rose-500",
        };
    }

    return {
        label: "Submitted",
        className: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
    };
}

function formatDate(value) {
    if (!value) return "—";

    try {
        return new Date(value).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    } catch {
        return "—";
    }
}

function formatAmount(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
}

export default function FellowshipClaimsPage() {
    const [student, setStudent] = useState(null);
    const [claims, setClaims] = useState([]);

    const [scheme, setScheme] = useState("NFST");
    const [claimType, setClaimType] = useState(
        "Monthly Fellowship"
    );
    const [claimMonth, setClaimMonth] = useState("");
    const [amount, setAmount] = useState("");
    const [remarks, setRemarks] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadStudent();
        loadClaims();
    }, []);

    function loadStudent() {
        try {
            const stored =
                localStorage.getItem("mota_student");

            if (stored) {
                setStudent(JSON.parse(stored));
            } else {
                setStudent({
                    name: "Rahul Munda",
                    category: "ST",
                    address: "Ranchi, Jharkhand",
                    bankStatus: "Seeded",
                    aadhaarVerified: true,
                });
            }
        } catch {
            setStudent({
                name: "Rahul Munda",
                category: "ST",
                address: "Ranchi, Jharkhand",
                bankStatus: "Seeded",
                aadhaarVerified: true,
            });
        }
    }

    async function loadClaims() {
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/fellowship-claims`
            );

            if (!response.ok) {
                throw new Error("Unable to load claims");
            }

            const data = await response.json();
            const normalized = normalizeClaims(data);

            setClaims(
                normalized.length > 0
                    ? normalized
                    : DEMO_CLAIMS
            );
        } catch {
            setClaims(DEMO_CLAIMS);
        } finally {
            setLoading(false);
        }
    }

    const studentClaims = useMemo(() => {
        if (!student?.name) return claims;

        const studentName = student.name
            .trim()
            .toLowerCase();

        const matching = claims.filter(
            (claim) =>
                String(claim.student_name || "")
                    .trim()
                    .toLowerCase() === studentName
        );

        return matching.length > 0
            ? matching
            : claims;
    }, [claims, student]);

    const stats = useMemo(() => {
        const approved = studentClaims.filter(
            (claim) =>
                ["approved", "disbursed"].includes(
                    String(claim.status).toLowerCase()
                )
        );

        const disbursed = studentClaims.filter(
            (claim) =>
                String(claim.status).toLowerCase() ===
                "disbursed"
        );

        const pending = studentClaims.filter(
            (claim) =>
                ["submitted", "review"].includes(
                    String(claim.status).toLowerCase()
                )
        );

        return {
            total: studentClaims.length,
            approved: approved.length,
            pending: pending.length,
            disbursed: disbursed.reduce(
                (sum, claim) =>
                    sum + Number(claim.amount || 0),
                0
            ),
        };
    }, [studentClaims]);

    const selectedClaimType = CLAIM_TYPES.find(
        (item) => item.value === claimType
    );

    function handleSchemeChange(value) {
        setScheme(value);

        setMessage(null);

        if (value === "NOS") {
            setAmount("");
        }
    }

    function handleClaimTypeChange(value) {
        setClaimType(value);
        setMessage(null);
    }

    function validateForm() {
        if (!claimMonth) {
            return "Please select the claim month.";
        }

        if (!amount || Number(amount) <= 0) {
            return "Please enter a valid claim amount.";
        }

        if (!student?.name) {
            return "Student profile could not be loaded.";
        }

        return null;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setMessage({
                type: "error",
                text: validationError,
            });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        const payload = {
            student_name: student.name,
            scheme,
            claim_type: claimType,
            claim_month: claimMonth,
            amount: Number(amount),
            remarks: remarks.trim() || null,
        };

        try {
            const applicationId =
                localStorage.getItem(
                    "mota_application_id"
                );

            if (applicationId) {
                payload.application_id =
                    applicationId;
            }

            const response = await fetch(
                `${API_URL}/fellowship-claims`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.error ||
                    "Unable to submit fellowship claim."
                );
            }

            const createdClaim =
                data?.data || data;

            if (createdClaim?.id) {
                setClaims((current) => [
                    createdClaim,
                    ...current,
                ]);
            }

            setMessage({
                type: "success",
                text:
                    "Fellowship claim submitted successfully. It is now available for official review.",
            });

            setAmount("");
            setRemarks("");
            setClaimMonth("");
        } catch (error) {
            /*
             * Keep the SIH demo usable even when the backend
             * is temporarily unavailable.
             */
            const demoClaim = {
                id: `CLM-DEMO-${Date.now()}`,
                student_name: student.name,
                scheme,
                claim_type: claimType,
                claim_month: claimMonth,
                amount: Number(amount),
                remarks: remarks.trim(),
                status: "submitted",
                admin_note: null,
                transaction_id: null,
                created_at: new Date().toISOString(),
            };

            setClaims((current) => [
                demoClaim,
                ...current,
            ]);

            setMessage({
                type: "success",
                text:
                    "Claim added to the demo submission queue. In production, it will be sent to the official backend for verification.",
            });

            setAmount("");
            setRemarks("");
            setClaimMonth("");
        } finally {
            setSubmitting(false);
        }
    }

    const firstName =
        student?.name?.split(" ")[0] || "Student";

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Hero */}
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-violet-900 to-purple-800 p-6 text-white shadow-lg sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                                <span className="h-2 w-2 rounded-full bg-violet-300" />
                                NFST / NOS Fellowship Services
                            </div>

                            <h1 className="text-2xl font-bold sm:text-3xl">
                                Fellowship Claims
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                                Submit monthly fellowship, contingency and
                                HRA claims and track every claim from
                                submission to DBT payment.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-indigo-200">
                                Welcome back
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {firstName}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                                    ST VERIFIED
                                </span>

                                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-100">
                                    {scheme}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Progress */}
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        {[
                            {
                                number: "01",
                                title: "Submit Claim",
                                text: "Enter claim details",
                                active: true,
                            },
                            {
                                number: "02",
                                title: "Official Review",
                                text: "Claim verification",
                            },
                            {
                                number: "03",
                                title: "DBT Payment",
                                text: "Payment disbursed",
                            },
                        ].map((step, index) => (
                            <div
                                key={step.number}
                                className="flex flex-1 items-center gap-3"
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${step.active
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-400"
                                        }`}
                                >
                                    {step.number}
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-800">
                                        {step.title}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        {step.text}
                                    </p>
                                </div>

                                {index < 2 && (
                                    <div className="hidden h-px flex-1 bg-slate-200 md:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Stats */}
                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Total Claims
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {stats.total}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            Submitted through portal
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Pending Review
                        </p>

                        <p className="mt-2 text-2xl font-bold text-amber-600">
                            {stats.pending}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            Awaiting official action
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Approved
                        </p>

                        <p className="mt-2 text-2xl font-bold text-indigo-600">
                            {stats.approved}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            Approved or disbursed
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            DBT Received
                        </p>

                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                            ₹{formatAmount(stats.disbursed)}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            Total disbursed amount
                        </p>
                    </div>
                </section>

                {/* Main content */}
                <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">

                    {/* Claim form */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-xl">
                                    💰
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Submit New Claim
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Enter the details for your fellowship
                                        claim.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-5 sm:p-6"
                        >
                            {/* Scheme */}
                            <div>
                                <label className="text-xs font-bold text-slate-700">
                                    Fellowship Scheme
                                </label>

                                <div className="mt-2 grid grid-cols-2 gap-3">
                                    {["NFST", "NOS"].map(
                                        (item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() =>
                                                    handleSchemeChange(
                                                        item
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left transition ${scheme ===
                                                        item
                                                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                                                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {item}
                                                    </span>

                                                    <span
                                                        className={`h-4 w-4 rounded-full border-2 ${scheme ===
                                                                item
                                                                ? "border-indigo-600 bg-indigo-600"
                                                                : "border-slate-300"
                                                            }`}
                                                    />
                                                </div>

                                                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                                    {item ===
                                                        "NFST"
                                                        ? "National Fellowship for ST students"
                                                        : "National Overseas Scholarship"}
                                                </p>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Claim type */}
                            <div>
                                <label className="text-xs font-bold text-slate-700">
                                    Claim Type
                                </label>

                                <div className="mt-2 grid gap-2">
                                    {CLAIM_TYPES.map(
                                        (item) => (
                                            <button
                                                key={
                                                    item.value
                                                }
                                                type="button"
                                                onClick={() =>
                                                    handleClaimTypeChange(
                                                        item.value
                                                    )
                                                }
                                                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${claimType ===
                                                        item.value
                                                        ? "border-indigo-400 bg-indigo-50"
                                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                                                    {
                                                        item.icon
                                                    }
                                                </span>

                                                <span className="flex-1">
                                                    <span className="block text-xs font-bold text-slate-800">
                                                        {
                                                            item.value
                                                        }
                                                    </span>

                                                    <span className="mt-0.5 block text-[10px] text-slate-500">
                                                        {
                                                            item.description
                                                        }
                                                    </span>
                                                </span>

                                                <span
                                                    className={`h-4 w-4 rounded-full border-2 ${claimType ===
                                                            item.value
                                                            ? "border-indigo-600 bg-indigo-600"
                                                            : "border-slate-300"
                                                        }`}
                                                />
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Month and amount */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-700">
                                        Claim Month
                                    </label>

                                    <input
                                        type="month"
                                        value={claimMonth}
                                        onChange={(event) =>
                                            setClaimMonth(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700">
                                        Claim Amount
                                    </label>

                                    <div className="relative mt-2">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                            ₹
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            value={amount}
                                            onChange={(event) =>
                                                setAmount(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Enter amount"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="text-xs font-bold text-slate-700">
                                    Remarks{" "}
                                    <span className="font-normal text-slate-400">
                                        (optional)
                                    </span>
                                </label>

                                <textarea
                                    value={remarks}
                                    onChange={(event) =>
                                        setRemarks(
                                            event.target.value
                                        )
                                    }
                                    rows={4}
                                    placeholder="Add any relevant information for the official reviewer..."
                                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            {/* Info */}
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                <div className="flex gap-3">
                                    <span className="text-base">
                                        ℹ️
                                    </span>

                                    <div>
                                        <p className="text-xs font-bold text-amber-900">
                                            Before submitting
                                        </p>

                                        <p className="mt-1 text-[10px] leading-5 text-amber-800">
                                            Make sure your claim month and
                                            amount are correct. Submitted
                                            claims are sent to the official
                                            review queue.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            {message && (
                                <div
                                    className={`rounded-2xl p-4 ${message.type ===
                                            "success"
                                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border border-rose-200 bg-rose-50 text-rose-700"
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <span>
                                            {message.type ===
                                                "success"
                                                ? "✓"
                                                : "!"}
                                        </span>

                                        <p className="text-xs font-semibold leading-5">
                                            {
                                                message.text
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Submitting Claim...
                                    </>
                                ) : (
                                    <>
                                        Submit Fellowship Claim
                                        <span>→</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Profile / information */}
                    <div className="space-y-6">

                        {/* Profile */}
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-bold text-indigo-700">
                                    {student?.name
                                        ?.split(" ")
                                        .map(
                                            (part) =>
                                                part[0]
                                        )
                                        .slice(0, 2)
                                        .join("") ||
                                        "RM"}
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        {student?.name ||
                                            "Rahul Munda"}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                        ST • Aadhaar e-KYC verified
                                    </p>
                                </div>

                                <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                                    VERIFIED
                                </span>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                        Category
                                    </p>

                                    <p className="mt-1 text-xs font-bold text-slate-800">
                                        {student?.category ||
                                            "ST"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                        Bank Status
                                    </p>

                                    <p className="mt-1 text-xs font-bold text-emerald-700">
                                        {student?.bankStatus ||
                                            "Seeded"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Claim guidance */}
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <h2 className="text-sm font-bold text-slate-900">
                                Claim Process
                            </h2>

                            <div className="mt-5 space-y-4">
                                {[
                                    {
                                        number: "1",
                                        title: "Submit claim",
                                        text: "Enter the claim type, month and amount.",
                                    },
                                    {
                                        number: "2",
                                        title: "Official review",
                                        text: "The claim is checked by the authorized official.",
                                    },
                                    {
                                        number: "3",
                                        title: "Approval",
                                        text: "Approved claims move to the payment stage.",
                                    },
                                    {
                                        number: "4",
                                        title: "DBT disbursement",
                                        text: "Payment transaction is generated after approval.",
                                    },
                                ].map((step) => (
                                    <div
                                        key={step.number}
                                        className="flex gap-3"
                                    >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                            {
                                                step.number
                                            }
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-800">
                                                {
                                                    step.title
                                                }
                                            </p>

                                            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                                                {
                                                    step.text
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Current selection */}
                        <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">
                                    {
                                        selectedClaimType?.icon ||
                                        "💰"
                                    }
                                </span>

                                <div>
                                    <p className="text-xs font-bold text-indigo-900">
                                        Current claim type
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-indigo-700">
                                        {claimType}
                                    </p>

                                    <p className="mt-1 text-[10px] leading-4 text-indigo-600">
                                        {
                                            selectedClaimType?.description
                                        }
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>

                {/* Claim history */}
                <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5 sm:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Claim History
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Track submitted, approved and disbursed
                                    fellowship claims.
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                                {studentClaims.length} claim
                                {studentClaims.length !==
                                    1
                                    ? "s"
                                    : ""}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                            <p className="mt-3 text-xs text-slate-500">
                                Loading claim history...
                            </p>
                        </div>
                    ) : studentClaims.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                                📋
                            </div>

                            <h3 className="mt-4 text-sm font-bold text-slate-900">
                                No claims yet
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Your submitted fellowship claims will appear
                                here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px]">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-left">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Claim
                                        </th>

                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Scheme
                                        </th>

                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Month
                                        </th>

                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Amount
                                        </th>

                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Submitted
                                        </th>

                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Transaction
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {studentClaims.map(
                                        (claim) => {
                                            const status =
                                                statusConfig(
                                                    claim.status
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        claim.id
                                                    }
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-5">
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {
                                                                claim.claim_type
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            {
                                                                claim.id
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                                                            {
                                                                claim.scheme
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            {
                                                                claim.claim_month
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <p className="text-sm font-bold text-slate-900">
                                                            ₹
                                                            {formatAmount(
                                                                claim.amount
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <p className="text-xs text-slate-600">
                                                            {formatDate(
                                                                claim.created_at
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span
                                                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold ${status.className}`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                            />

                                                            {
                                                                status.label
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        {claim.transaction_id ? (
                                                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                                {
                                                                    claim.transaction_id
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">
                                                                Pending
                                                            </span>
                                                        )}
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

                {/* Demo transparency */}
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-sm">🧪</span>

                        <div>
                            <p className="text-xs font-bold text-slate-700">
                                SIH demonstration note
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                Fellowship amounts, claim records and demo
                                transactions shown in this prototype are
                                illustrative. Production deployment should
                                connect these values to the authorized
                                scholarship and fellowship rules and payment
                                systems.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}