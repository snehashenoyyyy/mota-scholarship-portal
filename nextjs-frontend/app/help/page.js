"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
    {
        question: "How do I check my scholarship eligibility?",
        answer:
            "Open the Scheme Selection page, choose a scholarship or fellowship, enter your profile details and run the eligibility checker.",
    },
    {
        question: "Why was my document flagged?",
        answer:
            "The AI verification engine may flag a document when extracted information does not match the submitted details or when the uploaded document does not appear to be the expected document type.",
    },
    {
        question: "How do I fix a document defect?",
        answer:
            "Open Track Application or Resolve Defect from the dashboard. Upload the corrected document and the AI verification process will run again.",
    },
    {
        question: "How can I track my application?",
        answer:
            "Open the Status page from the navigation bar or dashboard. Your application moves through submission, AI scrutiny, institute verification and DBT disbursement stages.",
    },
    {
        question: "Where can I submit fellowship claims?",
        answer:
            "Students eligible for the NFST or NOS fellowship pathway can open Fellowship Claims from the navigation bar and submit monthly fellowship, contingency or HRA claims.",
    },
    {
        question: "What happens after my application passes scrutiny?",
        answer:
            "The application moves to institute verification. Once institute verification is completed, the application becomes eligible for the DBT disbursement workflow.",
    },
];

const QUICK_ACTIONS = [
    {
        title: "Check Eligibility",
        description: "Find a suitable scholarship or fellowship.",
        icon: "🎓",
        href: "/scheme-selection",
        color: "bg-indigo-50 text-indigo-700",
    },
    {
        title: "Track Application",
        description: "View your current application stage.",
        icon: "📍",
        href: "/status",
        color: "bg-cyan-50 text-cyan-700",
    },
    {
        title: "Resolve Defect",
        description: "Upload a corrected document.",
        icon: "📄",
        href: "/upload",
        color: "bg-rose-50 text-rose-700",
    },
    {
        title: "Fellowship Claims",
        description: "Submit or view your claims.",
        icon: "💰",
        href: "/fellowship-claims",
        color: "bg-emerald-50 text-emerald-700",
    },
];

export default function HelpPage() {
    const [activeFaq, setActiveFaq] = useState(null);
    const [language, setLanguage] = useState("English");
    const [grievance, setGrievance] = useState({
        subject: "",
        category: "Application",
        description: "",
    });
    const [submitted, setSubmitted] = useState(false);

    function handleGrievanceSubmit(event) {
        event.preventDefault();

        if (
            !grievance.subject.trim() ||
            !grievance.description.trim()
        ) {
            return;
        }

        const grievanceId =
            `GRV-${Date.now().toString().slice(-8)}`;

        localStorage.setItem(
            "mota_last_grievance",
            JSON.stringify({
                ...grievance,
                id: grievanceId,
                status: "Submitted",
                created_at: new Date().toISOString(),
            })
        );

        setSubmitted(true);

        setGrievance({
            subject: "",
            category: "Application",
            description: "",
        });
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-700 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                                Student Support Centre
                            </div>

                            <h1 className="text-2xl font-bold sm:text-3xl">
                                How can we help you?
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                                Get help with eligibility, applications,
                                documents, fellowship claims and grievances.
                            </p>
                        </div>

                        {/* Language */}
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-indigo-100">
                                Assistant Language
                            </p>

                            <select
                                value={language}
                                onChange={(event) =>
                                    setLanguage(event.target.value)
                                }
                                className="mt-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none"
                            >
                                <option className="text-slate-900">
                                    English
                                </option>
                                <option className="text-slate-900">
                                    Hindi
                                </option>
                                <option className="text-slate-900">
                                    Regional
                                </option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Quick actions */}
                <section className="mt-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            Quick Help
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Go directly to the service you need.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {QUICK_ACTIONS.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${action.color}`}
                                    >
                                        {action.icon}
                                    </div>

                                    <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">
                                        →
                                    </span>
                                </div>

                                <h3 className="mt-4 text-sm font-bold text-slate-900">
                                    {action.title}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {action.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* AI Assistant */}
                <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                    {/* Assistant */}
                    <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
                        <div className="border-b border-indigo-100 bg-indigo-50 p-5 sm:p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-sm">
                                    🤖
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-indigo-950">
                                        TriBot AI Assistant
                                    </h2>

                                    <p className="mt-1 text-xs text-indigo-700">
                                        Scholarship & fellowship support
                                    </p>
                                </div>

                                <span className="ml-auto hidden rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700 sm:block">
                                    ONLINE
                                </span>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="rounded-2xl bg-slate-50 p-5">
                                <div className="flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm">
                                        🤖
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            Namaste! I'm TriBot 👋
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            I can guide you through eligibility,
                                            document issues, application
                                            tracking and fellowship claims.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                Try one of these
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <Link
                                    href="/scheme-selection"
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                    🎓 Am I eligible for a scholarship?
                                </Link>

                                <Link
                                    href="/status"
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                    📍 Where is my application?
                                </Link>

                                <Link
                                    href="/upload"
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                    📄 Why was my document flagged?
                                </Link>

                                <Link
                                    href="/fellowship-claims"
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                    💰 How do I submit a claim?
                                </Link>
                            </div>

                            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                <p className="text-[11px] leading-5 text-amber-800">
                                    <strong>Prototype note:</strong> TriBot is
                                    currently a guided demo assistant. The
                                    production version can connect to a
                                    multilingual AI knowledge service.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Support status */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-bold text-slate-900">
                            Support Services
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Available assistance inside the portal.
                        </p>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                    🎓
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">
                                        Eligibility Assistance
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Scheme and eligibility guidance
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                    Available
                                </span>
                            </div>

                            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                    🤖
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">
                                        AI Document Support
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        OCR and document issue guidance
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                    Available
                                </span>
                            </div>

                            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                    📍
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">
                                        Application Tracking
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Real-time application stage
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                    Available
                                </span>
                            </div>

                            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                    📝
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">
                                        Grievance Redressal
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Submit and track support issues
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                    Available
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Common questions about using the scholarship portal.
                        </p>
                    </div>

                    <div className="mt-5 space-y-2">
                        {FAQS.map((faq, index) => {
                            const open = activeFaq === index;

                            return (
                                <div
                                    key={faq.question}
                                    className={`overflow-hidden rounded-2xl border transition ${open
                                            ? "border-indigo-200 bg-indigo-50/50"
                                            : "border-slate-200 bg-white"
                                        }`}
                                >
                                    <button
                                        onClick={() =>
                                            setActiveFaq(
                                                open ? null : index
                                            )
                                        }
                                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                                    >
                                        <span className="text-sm font-semibold text-slate-800">
                                            {faq.question}
                                        </span>

                                        <span
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${open
                                                    ? "bg-indigo-100 text-indigo-700"
                                                    : "bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            {open ? "−" : "+"}
                                        </span>
                                    </button>

                                    {open && (
                                        <div className="border-t border-indigo-100 px-4 pb-4 pt-3">
                                            <p className="text-xs leading-6 text-slate-600">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Grievance */}
                <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">

                    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                            📝
                        </div>

                        <h2 className="mt-5 text-xl font-bold">
                            Need additional assistance?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Submit a grievance if you are unable to resolve an
                            issue through the available portal services.
                        </p>

                        <div className="mt-6 space-y-3">
                            <div className="flex gap-3">
                                <span className="text-emerald-400">✓</span>
                                <p className="text-xs text-slate-300">
                                    Application-related complaints
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <span className="text-emerald-400">✓</span>
                                <p className="text-xs text-slate-300">
                                    Document verification issues
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <span className="text-emerald-400">✓</span>
                                <p className="text-xs text-slate-300">
                                    Scholarship or fellowship support
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <span className="text-emerald-400">✓</span>
                                <p className="text-xs text-slate-300">
                                    Payment and DBT-related issues
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Submit a Grievance
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Tell us what went wrong.
                                </p>
                            </div>

                            <span className="hidden rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold text-indigo-700 sm:block">
                                SUPPORT
                            </span>
                        </div>

                        {submitted ? (
                            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                                    ✓
                                </div>

                                <h3 className="mt-4 text-base font-bold text-emerald-900">
                                    Grievance Submitted
                                </h3>

                                <p className="mt-2 text-xs leading-5 text-emerald-700">
                                    Your grievance has been recorded in this
                                    demo portal. You can use the generated
                                    reference for presentation purposes.
                                </p>

                                <button
                                    onClick={() =>
                                        setSubmitted(false)
                                    }
                                    className="mt-5 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                                >
                                    Submit Another
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleGrievanceSubmit}
                                className="mt-6 space-y-4"
                            >
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">
                                        Issue Category
                                    </label>

                                    <select
                                        value={grievance.category}
                                        onChange={(event) =>
                                            setGrievance({
                                                ...grievance,
                                                category:
                                                    event.target.value,
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    >
                                        <option>
                                            Application
                                        </option>
                                        <option>
                                            Document Verification
                                        </option>
                                        <option>
                                            Eligibility
                                        </option>
                                        <option>
                                            Fellowship
                                        </option>
                                        <option>
                                            DBT / Payment
                                        </option>
                                        <option>
                                            Other
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600">
                                        Subject
                                    </label>

                                    <input
                                        value={grievance.subject}
                                        onChange={(event) =>
                                            setGrievance({
                                                ...grievance,
                                                subject:
                                                    event.target.value,
                                            })
                                        }
                                        placeholder="Briefly describe your issue"
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600">
                                        Description
                                    </label>

                                    <textarea
                                        value={grievance.description}
                                        onChange={(event) =>
                                            setGrievance({
                                                ...grievance,
                                                description:
                                                    event.target.value,
                                            })
                                        }
                                        rows={5}
                                        placeholder="Explain the issue in detail..."
                                        className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                                >
                                    Submit Grievance
                                </button>
                            </form>
                        )}
                    </div>
                </section>

                {/* Accessibility / trust */}
                <section className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-lg">🔊</p>
                        <p className="mt-2 text-xs font-bold text-slate-800">
                            Text-to-Speech Ready
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                            Designed for accessible student assistance.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-lg">🌐</p>
                        <p className="mt-2 text-xs font-bold text-slate-800">
                            Multilingual Support
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                            English, Hindi and regional-language pathway.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-lg">🔐</p>
                        <p className="mt-2 text-xs font-bold text-slate-800">
                            Secure Portal
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                            Student services are accessed through the portal
                            authentication flow.
                        </p>
                    </div>
                </section>

                {/* Demo note */}
                <section className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs leading-5 text-amber-800">
                        <strong>SIH prototype note:</strong> The grievance
                        submission shown here is currently stored as a local
                        demo record. It can later be connected to the backend
                        grievance workflow and official escalation system.
                    </p>
                </section>
            </div>
        </main>
    );
}