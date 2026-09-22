"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DEMO_CLAIMS = [
    {
        id: "CLM-2026-001",
        student_name: "Rahul Munda",
        scheme: "NFST",
        claim_type: "Monthly Fellowship",
        claim_month: "September 2026",
        amount: 37000,
        status: "submitted",
        remarks: "Monthly fellowship claim for September.",
        admin_note: null,
        transaction_id: null,
        created_at: "2026-09-05T10:00:00",
    },
    {
        id: "CLM-2026-002",
        student_name: "Anita Kerketta",
        scheme: "NFST",
        claim_type: "Contingency",
        claim_month: "September 2026",
        amount: 3000,
        status: "review",
        remarks: "Academic contingency expenses.",
        admin_note: "Please verify supporting details.",
        transaction_id: null,
        created_at: "2026-09-04T10:00:00",
    },
    {
        id: "CLM-2026-003",
        student_name: "Sushila Toppo",
        scheme: "NOS",
        claim_type: "HRA",
        claim_month: "August 2026",
        amount: 5000,
        status: "approved",
        remarks: "HRA claim.",
        admin_note: "Claim approved for payment.",
        transaction_id: null,
        created_at: "2026-08-28T10:00:00",
    },
    {
        id: "CLM-2026-004",
        student_name: "Birsa Nag",
        scheme: "NFST",
        claim_type: "Monthly Fellowship",
        claim_month: "August 2026",
        amount: 37000,
        status: "disbursed",
        remarks: "Monthly fellowship claim.",
        admin_note: "Payment successfully processed.",
        transaction_id: "FEL-DBT-84A921",
        created_at: "2026-08-05T10:00:00",
    },
];

function normalizeClaims(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}

function getStatus(status) {
    const normalized = String(status || "").toLowerCase();

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

    if (normalized === "disbursed") {
        return {
            label: "Disbursed",
            className: "bg-emerald-100 text-emerald-700",
            dot: "bg-emerald-500",
        };
    }

    return {
        label: "Submitted",
        className: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
    };
}

function formatAmount(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
}

function formatDate(value) {
    if (!value) return "—";

    try {
        return new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

export default function FellowshipClaimsAdminPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [selectedClaim, setSelectedClaim] = useState(null);

    const [adminNote, setAdminNote] = useState("");
    const [paymentNote, setPaymentNote] = useState("");

    const [actionLoading, setActionLoading] = useState(false);

    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadClaims();
    }, []);

    async function loadClaims() {
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/fellowship-claims`
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to load fellowship claims"
                );
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

    const stats = useMemo(() => {
        const submitted = claims.filter(
            (claim) =>
                String(claim.status).toLowerCase() ===
                "submitted"
        ).length;

        const review = claims.filter(
            (claim) =>
                String(claim.status).toLowerCase() ===
                "review"
        ).length;

        const approved = claims.filter(
            (claim) =>
                String(claim.status).toLowerCase() ===
                "approved"
        ).length;

        const disbursed = claims.filter(
            (claim) =>
                String(claim.status).toLowerCase() ===
                "disbursed"
        );

        const disbursedAmount = disbursed.reduce(
            (sum, claim) =>
                sum + Number(claim.amount || 0),
            0
        );

        return {
            total: claims.length,
            submitted,
            review,
            approved,
            disbursed: disbursed.length,
            disbursedAmount,
        };
    }, [claims]);

    const filteredClaims = useMemo(() => {
        const query = search.trim().toLowerCase();

        return claims.filter((claim) => {
            const status = String(
                claim.status || ""
            ).toLowerCase();

            const matchesFilter =
                filter === "all" ||
                status === filter;

            const matchesSearch =
                !query ||
                String(claim.student_name || "")
                    .toLowerCase()
                    .includes(query) ||
                String(claim.id || "")
                    .toLowerCase()
                    .includes(query) ||
                String(claim.scheme || "")
                    .toLowerCase()
                    .includes(query) ||
                String(claim.claim_type || "")
                    .toLowerCase()
                    .includes(query);

            return matchesFilter && matchesSearch;
        });
    }, [claims, filter, search]);

    function openClaim(claim) {
        setSelectedClaim(claim);
        setAdminNote(claim.admin_note || "");
        setPaymentNote("");
        setMessage(null);
    }

    function closeDrawer() {
        if (actionLoading) return;

        setSelectedClaim(null);
        setAdminNote("");
        setPaymentNote("");
        setMessage(null);
    }

    async function makeDecision(decision) {
        if (!selectedClaim) return;

        setActionLoading(true);
        setMessage(null);

        try {
            const response = await fetch(
                `${API_URL}/fellowship-claims/${selectedClaim.id}/decision`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        decision,
                        admin_note:
                            adminNote.trim() || null,
                    }),
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.error ||
                    "Unable to save claim decision."
                );
            }

            const updatedClaim =
                data?.data || data;

            const nextStatus =
                decision === "approved"
                    ? "approved"
                    : decision === "rejected"
                        ? "rejected"
                        : "review";

            const finalAdminNote =
                updatedClaim?.admin_note ??
                (adminNote.trim() || null);

            setClaims((current) =>
                current.map((claim) =>
                    claim.id === selectedClaim.id
                        ? {
                            ...claim,
                            ...(updatedClaim &&
                                typeof updatedClaim === "object"
                                ? updatedClaim
                                : {}),
                            status:
                                updatedClaim?.status ||
                                nextStatus,
                            admin_note:
                                finalAdminNote,
                        }
                        : claim
                )
            );

            setSelectedClaim((current) =>
                current
                    ? {
                        ...current,
                        ...(updatedClaim &&
                            typeof updatedClaim === "object"
                            ? updatedClaim
                            : {}),
                        status:
                            updatedClaim?.status ||
                            nextStatus,
                        admin_note:
                            finalAdminNote,
                    }
                    : current
            );

            setMessage({
                type: "success",
                text:
                    decision === "approved"
                        ? "Claim approved. It can now proceed to DBT disbursement."
                        : decision === "rejected"
                            ? "Claim rejected and decision recorded."
                            : "Claim moved to official review.",
            });
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.message ||
                    "Unable to save claim decision.",
            });
        } finally {
            setActionLoading(false);
        }
    }

    async function disburseClaim() {
        if (!selectedClaim) return;

        if (
            String(selectedClaim.status || "").toLowerCase() !==
            "approved"
        ) {
            setMessage({
                type: "error",
                text:
                    "Only approved claims can be disbursed.",
            });
            return;
        }

        setActionLoading(true);
        setMessage(null);

        try {
            const response = await fetch(
                `${API_URL}/fellowship-claims/${selectedClaim.id}/disburse`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        payment_note:
                            paymentNote.trim() || null,
                    }),
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.error ||
                    "Unable to process DBT payment."
                );
            }

            const updatedClaim =
                data?.data || data;

            const transactionId =
                updatedClaim?.transaction_id ||
                data?.transaction_id ||
                `FEL-DBT-${Math.random()
                    .toString(36)
                    .slice(2, 8)
                    .toUpperCase()}`;

            setClaims((current) =>
                current.map((claim) =>
                    claim.id === selectedClaim.id
                        ? {
                            ...claim,
                            ...(updatedClaim &&
                                typeof updatedClaim === "object"
                                ? updatedClaim
                                : {}),
                            status: "disbursed",
                            transaction_id:
                                transactionId,
                        }
                        : claim
                )
            );

            setSelectedClaim((current) =>
                current
                    ? {
                        ...current,
                        ...(updatedClaim &&
                            typeof updatedClaim === "object"
                            ? updatedClaim
                            : {}),
                        status: "disbursed",
                        transaction_id:
                            transactionId,
                    }
                    : current
            );

            setMessage({
                type: "success",
                text: `DBT payment processed successfully. Transaction ID: ${transactionId}`,
            });

            setPaymentNote("");
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.message ||
                    "Unable to process DBT payment.",
            });
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* HERO */}
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-lg sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                                <span className="h-2 w-2 rounded-full bg-violet-300" />
                                Official Fellowship Administration
                            </div>

                            <h1 className="text-2xl font-bold sm:text-3xl">
                                Fellowship Claim Review
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                Review NFST and NOS fellowship claims,
                                record official decisions and process
                                approved claims through the DBT workflow.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-slate-400">
                                Administrative Workflow
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-lg">
                                    3
                                </span>

                                <span className="text-sm font-bold">
                                    Fellowship Claims
                                </span>
                            </div>

                            <p className="mt-1 text-[10px] text-slate-400">
                                Review → Approve → DBT
                            </p>
                        </div>
                    </div>
                </section>

                {/* WORKFLOW */}
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        {[
                            {
                                number: "01",
                                title: "Student Claim",
                                text: "Submitted",
                                done: true,
                            },
                            {
                                number: "02",
                                title: "Official Review",
                                text: "Verify claim",
                                current: true,
                            },
                            {
                                number: "03",
                                title: "Approval",
                                text: "Authorize payment",
                            },
                            {
                                number: "04",
                                title: "DBT",
                                text: "Disbursement",
                            },
                        ].map((step, index) => (
                            <div
                                key={step.number}
                                className="flex flex-1 items-center gap-3"
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${step.done
                                            ? "bg-emerald-100 text-emerald-700"
                                            : step.current
                                                ? "bg-indigo-600 text-white"
                                                : "bg-slate-100 text-slate-400"
                                        }`}
                                >
                                    {step.done
                                        ? "✓"
                                        : step.number}
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-800">
                                        {step.title}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        {step.text}
                                    </p>
                                </div>

                                {index < 3 && (
                                    <div className="hidden h-px flex-1 bg-slate-200 md:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* KPIs */}
                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Total Claims
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {stats.total}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Submitted
                        </p>

                        <p className="mt-2 text-2xl font-bold text-amber-600">
                            {stats.submitted}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Under Review
                        </p>

                        <p className="mt-2 text-2xl font-bold text-orange-600">
                            {stats.review}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Approved
                        </p>

                        <p className="mt-2 text-2xl font-bold text-indigo-600">
                            {stats.approved}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            DBT Disbursed
                        </p>

                        <p className="mt-2 text-xl font-bold text-emerald-600">
                            ₹
                            {formatAmount(
                                stats.disbursedAmount
                            )}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            {stats.disbursed} transactions
                        </p>
                    </div>
                </section>

                {/* QUEUE */}
                <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5 sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Fellowship Claim Queue
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Review student-submitted fellowship
                                    claims and payment status.
                                </p>
                            </div>

                            <div className="relative w-full lg:w-80">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔍
                                </span>

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search student, claim ID or scheme..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                            {[
                                ["all", "All"],
                                ["submitted", "Submitted"],
                                ["review", "Review"],
                                ["approved", "Approved"],
                                ["disbursed", "Disbursed"],
                                ["rejected", "Rejected"],
                            ].map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() =>
                                        setFilter(key)
                                    }
                                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${filter === key
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                            <p className="mt-3 text-xs text-slate-500">
                                Loading fellowship claims...
                            </p>
                        </div>
                    ) : filteredClaims.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                                📋
                            </div>

                            <h3 className="mt-4 text-sm font-bold text-slate-900">
                                No claims found
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Try another filter or search term.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px]">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-left">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Student
                                        </th>

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
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredClaims.map(
                                        (claim) => {
                                            const status =
                                                getStatus(
                                                    claim.status
                                                );

                                            return (
                                                <tr
                                                    key={claim.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700">
                                                                {String(
                                                                    claim.student_name ||
                                                                    "Student"
                                                                )
                                                                    .split(
                                                                        " "
                                                                    )
                                                                    .map(
                                                                        (
                                                                            part
                                                                        ) =>
                                                                            part[0]
                                                                    )
                                                                    .slice(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .join(
                                                                        ""
                                                                    )}
                                                            </div>

                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900">
                                                                    {
                                                                        claim.student_name
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-[10px] text-slate-400">
                                                                    {
                                                                        claim.id
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <p className="text-xs font-bold text-slate-800">
                                                            {
                                                                claim.claim_type
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            Submitted{" "}
                                                            {formatDate(
                                                                claim.created_at
                                                            )}
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

                                                    <td className="px-6 py-5 text-right">
                                                        <button
                                                            onClick={() =>
                                                                openClaim(
                                                                    claim
                                                                )
                                                            }
                                                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                        >
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

                {/* Governance note */}
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-sm">
                            🛡️
                        </span>

                        <div>
                            <p className="text-xs font-bold text-slate-700">
                                Official audit trail
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                Each claim decision and DBT transaction is
                                recorded against the fellowship claim. This
                                interface is a Smart India Hackathon prototype;
                                production payment processing should connect
                                to authorized government systems.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* REVIEW DRAWER */}
            {selectedClaim && (
                <div className="fixed inset-0 z-50">
                    <button
                        onClick={closeDrawer}
                        aria-label="Close claim review"
                        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                    />

                    <aside className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-xl">

                        {/* Drawer header */}
                        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Fellowship Claim Review
                                    </p>

                                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                                        {
                                            selectedClaim.student_name
                                        }
                                    </h2>
                                </div>

                                <button
                                    onClick={
                                        closeDrawer
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 p-5 sm:p-6">

                            {/* Status */}
                            <section
                                className={`rounded-2xl border p-4 ${selectedClaim.status ===
                                        "disbursed"
                                        ? "border-emerald-200 bg-emerald-50"
                                        : selectedClaim.status ===
                                            "approved"
                                            ? "border-indigo-200 bg-indigo-50"
                                            : selectedClaim.status ===
                                                "rejected"
                                                ? "border-rose-200 bg-rose-50"
                                                : "border-amber-200 bg-amber-50"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-lg">
                                        {selectedClaim.status ===
                                            "disbursed"
                                            ? "✓"
                                            : selectedClaim.status ===
                                                "approved"
                                                ? "✓"
                                                : selectedClaim.status ===
                                                    "rejected"
                                                    ? "!"
                                                    : "⏳"}
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {
                                                getStatus(
                                                    selectedClaim.status
                                                ).label
                                            }
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-600">
                                            {selectedClaim.status ===
                                                "disbursed"
                                                ? "Payment has been processed through the fellowship DBT workflow."
                                                : selectedClaim.status ===
                                                    "approved"
                                                    ? "Claim has been approved and is ready for DBT disbursement."
                                                    : selectedClaim.status ===
                                                        "rejected"
                                                        ? "This claim has been rejected."
                                                        : "This claim requires official verification before payment."}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Claim details */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Claim Details
                                </h3>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {[
                                        [
                                            "Claim ID",
                                            selectedClaim.id,
                                        ],
                                        [
                                            "Scheme",
                                            selectedClaim.scheme,
                                        ],
                                        [
                                            "Claim Type",
                                            selectedClaim.claim_type,
                                        ],
                                        [
                                            "Claim Month",
                                            selectedClaim.claim_month,
                                        ],
                                        [
                                            "Amount",
                                            `₹${formatAmount(
                                                selectedClaim.amount
                                            )}`,
                                        ],
                                        [
                                            "Submitted",
                                            formatDate(
                                                selectedClaim.created_at
                                            ),
                                        ],
                                    ].map(
                                        ([label, value]) => (
                                            <div
                                                key={label}
                                                className="rounded-xl bg-slate-50 p-3"
                                            >
                                                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                                                    {label}
                                                </p>

                                                <p className="mt-1 break-words text-xs font-bold text-slate-800">
                                                    {value}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>

                            {/* Student */}
                            <section className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700">
                                        {String(
                                            selectedClaim.student_name ||
                                            "Student"
                                        )
                                            .split(" ")
                                            .map(
                                                (part) =>
                                                    part[0]
                                            )
                                            .slice(0, 2)
                                            .join("")}
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {
                                                selectedClaim.student_name
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            ST fellowship claimant
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Remarks */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Student Remarks
                                </h3>

                                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs leading-5 text-slate-600">
                                        {selectedClaim.remarks ||
                                            "No remarks provided by the student."}
                                    </p>
                                </div>
                            </section>

                            {/* Existing transaction */}
                            {selectedClaim.transaction_id && (
                                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                            ₹
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-emerald-900">
                                                DBT Transaction
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-emerald-700">
                                                {
                                                    selectedClaim.transaction_id
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Official decision */}
                            {selectedClaim.status !==
                                "disbursed" &&
                                selectedClaim.status !==
                                "rejected" && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Official Decision
                                        </h3>

                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                            Record an internal note for the
                                            claim audit trail.
                                        </p>

                                        <textarea
                                            value={adminNote}
                                            onChange={(
                                                event
                                            ) =>
                                                setAdminNote(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            rows={4}
                                            placeholder="Example: Claim details verified against fellowship records."
                                            className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                        />

                                        {message && (
                                            <div
                                                className={`mt-3 rounded-xl px-3 py-3 text-xs font-semibold ${message.type ===
                                                        "success"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-rose-100 text-rose-700"
                                                    }`}
                                            >
                                                {message.text}
                                            </div>
                                        )}

                                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                            <button
                                                disabled={
                                                    actionLoading
                                                }
                                                onClick={() =>
                                                    makeDecision(
                                                        "approved"
                                                    )
                                                }
                                                className="rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                ✓ Approve
                                            </button>

                                            <button
                                                disabled={
                                                    actionLoading
                                                }
                                                onClick={() =>
                                                    makeDecision(
                                                        "review"
                                                    )
                                                }
                                                className="rounded-xl bg-amber-500 px-3 py-3 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                                            >
                                                ⟳ Review
                                            </button>

                                            <button
                                                disabled={
                                                    actionLoading
                                                }
                                                onClick={() =>
                                                    makeDecision(
                                                        "rejected"
                                                    )
                                                }
                                                className="rounded-xl bg-rose-600 px-3 py-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                                            >
                                                × Reject
                                            </button>
                                        </div>
                                    </section>
                                )}

                            {/* DBT */}
                            {selectedClaim.status ===
                                "approved" && (
                                    <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                                💳
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-cyan-900">
                                                    DBT Disbursement
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-cyan-800">
                                                    This claim has been approved.
                                                    Process the fellowship payment
                                                    to generate a transaction ID.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-xl bg-white/70 p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    Payment Amount
                                                </span>

                                                <span className="text-base font-bold text-slate-900">
                                                    ₹
                                                    {formatAmount(
                                                        selectedClaim.amount
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <input
                                            value={paymentNote}
                                            onChange={(event) =>
                                                setPaymentNote(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Payment note (optional)"
                                            className="mt-3 w-full rounded-xl border border-cyan-200 bg-white px-3 py-3 text-xs outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                        />

                                        <button
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={
                                                disburseClaim
                                            }
                                            className="mt-3 w-full rounded-xl bg-cyan-600 px-4 py-3 text-xs font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {actionLoading
                                                ? "Processing Payment..."
                                                : "Process DBT Payment →"}
                                        </button>
                                    </section>
                                )}

                            {/* Terminal message */}
                            {message &&
                                (selectedClaim.status ===
                                    "disbursed" ||
                                    selectedClaim.status ===
                                    "rejected") && (
                                    <div
                                        className={`rounded-xl px-4 py-3 text-xs font-semibold ${message.type ===
                                                "success"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-700"
                                            }`}
                                    >
                                        {message.text}
                                    </div>
                                )}

                            {actionLoading && (
                                <p className="text-center text-[10px] text-slate-400">
                                    Saving official action...
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}