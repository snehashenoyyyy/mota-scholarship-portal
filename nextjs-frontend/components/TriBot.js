"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LANGUAGES = [
    {
        key: "English",
        greeting: "Namaste! I'm TriBot 👋",
        intro:
            "I can help you with scholarships, documents, application tracking and fellowship claims.",
        actions: {
            eligibility: "Check Eligibility",
            tracking: "Track Application",
            documents: "Resolve Document Issue",
            grievance: "Help & Grievance",
        },
    },
    {
        key: "Hindi",
        greeting: "नमस्ते! मैं TriBot हूँ 👋",
        intro:
            "मैं छात्रवृत्ति, दस्तावेज़, आवेदन की स्थिति और फेलोशिप क्लेम में आपकी मदद कर सकता हूँ।",
        actions: {
            eligibility: "पात्रता जांचें",
            tracking: "आवेदन ट्रैक करें",
            documents: "दस्तावेज़ समस्या हल करें",
            grievance: "सहायता और शिकायत",
        },
    },
    {
        key: "Regional",
        greeting: "Namaskara! I'm TriBot 👋",
        intro:
            "I can guide you through scholarship eligibility, documents, application tracking and claims.",
        actions: {
            eligibility: "Check Eligibility",
            tracking: "Track Application",
            documents: "Resolve Document Issue",
            grievance: "Help & Grievance",
        },
    },
];

const QUICK_QUESTIONS = [
    {
        id: "eligibility",
        text: "Which scholarship can I apply for?",
        href: "/scheme-selection",
        icon: "🎓",
    },
    {
        id: "tracking",
        text: "Where is my application?",
        href: "/status",
        icon: "📍",
    },
    {
        id: "documents",
        text: "My document was flagged",
        href: "/upload",
        icon: "📄",
    },
    {
        id: "claims",
        text: "How do I submit a fellowship claim?",
        href: "/fellowship-claims",
        icon: "💰",
    },
];

export default function TriBot() {
    const [open, setOpen] = useState(false);
    const [language, setLanguage] = useState("English");
    const [student, setStudent] = useState(null);
    const [applicationId, setApplicationId] = useState(null);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const inputRef = useRef(null);

    const currentLanguage =
        LANGUAGES.find(
            (item) => item.key === language
        ) || LANGUAGES[0];

    useEffect(() => {
        const storedStudent =
            localStorage.getItem("mota_student");

        const storedApplication =
            localStorage.getItem("mota_application_id");

        if (storedStudent) {
            try {
                setStudent(JSON.parse(storedStudent));
            } catch {
                setStudent(null);
            }
        }

        if (storedApplication) {
            setApplicationId(storedApplication);
        }
    }, []);

    useEffect(() => {
        if (!open) return;

        setMessages((current) => {
            if (current.length > 0) {
                return current;
            }

            return [
                {
                    id: Date.now(),
                    sender: "bot",
                    text: currentLanguage.greeting,
                },
                {
                    id: Date.now() + 1,
                    sender: "bot",
                    text: currentLanguage.intro,
                },
            ];
        });
    }, [open]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    function changeLanguage(nextLanguage) {
        setLanguage(nextLanguage);
        setShowLanguageMenu(false);

        const selected =
            LANGUAGES.find(
                (item) => item.key === nextLanguage
            ) || LANGUAGES[0];

        setMessages((current) => [
            ...current,
            {
                id: Date.now(),
                sender: "bot",
                text:
                    nextLanguage === "Hindi"
                        ? "भाषा बदल दी गई है। मैं आपकी सहायता के लिए तैयार हूँ।"
                        : selected.greeting,
            },
        ]);
    }

    function getBotResponse(question) {
        const query = question.toLowerCase();

        if (
            query.includes("eligib") ||
            query.includes("scholarship") ||
            query.includes("scheme") ||
            query.includes("eligible")
        ) {
            return {
                text:
                    "You can use the Eligibility Checker to compare your profile against the configured scholarship and fellowship rules.",
                href: "/scheme-selection",
                action: "Open Eligibility Checker",
            };
        }

        if (
            query.includes("document") ||
            query.includes("upload") ||
            query.includes("flag") ||
            query.includes("defect")
        ) {
            return {
                text:
                    "If a document is flagged, open the Upload page and submit the corrected document. The AI OCR verification will run again.",
                href: "/upload",
                action: "Resolve Document Issue",
            };
        }

        if (
            query.includes("status") ||
            query.includes("track") ||
            query.includes("application")
        ) {
            return {
                text:
                    "You can track your application through submission, AI scrutiny, institute verification and DBT disbursement.",
                href: applicationId
                    ? `/status?id=${applicationId}`
                    : "/status",
                action: "Track Application",
            };
        }

        if (
            query.includes("fellowship") ||
            query.includes("claim") ||
            query.includes("nfs") ||
            query.includes("nos")
        ) {
            return {
                text:
                    "NFST and NOS students can use Fellowship Claims to submit monthly fellowship, contingency or HRA claims.",
                href: "/fellowship-claims",
                action: "Open Fellowship Claims",
            };
        }

        if (
            query.includes("help") ||
            query.includes("grievance") ||
            query.includes("complaint")
        ) {
            return {
                text:
                    "You can use the Help Centre to view FAQs and submit a grievance for application, document, eligibility, fellowship or payment issues.",
                href: "/help",
                action: "Open Help Centre",
            };
        }

        return {
            text:
                "I can help with eligibility, applications, document verification, fellowship claims and grievances. Try asking about one of these areas.",
            href: "/help",
            action: "Open Help Centre",
        };
    }

    function sendMessage(text = input) {
        const trimmed = text.trim();

        if (!trimmed) return;

        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: trimmed,
        };

        const response = getBotResponse(trimmed);

        const botMessage = {
            id: Date.now() + 1,
            sender: "bot",
            text: response.text,
            href: response.href,
            action: response.action,
        };

        setMessages((current) => [
            ...current,
            userMessage,
            botMessage,
        ]);

        setInput("");
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    const firstName =
        student?.name?.split(" ")[0] || "Student";

    return (
        <>
            {/* Floating button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open TriBot assistant"
                    className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                        🤖
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-indigo-600 bg-emerald-400" />
                    </span>

                    <span className="hidden text-left sm:block">
                        <span className="block text-xs font-bold">
                            Ask TriBot
                        </span>
                        <span className="block text-[10px] text-indigo-100">
                            Scholarship Assistant
                        </span>
                    </span>
                </button>
            )}

            {/* Assistant panel */}
            {open && (
                <div className="fixed bottom-4 right-4 z-50 flex h-[min(680px,calc(100vh-32px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-700 to-violet-600 p-4 text-white">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl">
                                    🤖
                                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-indigo-700 bg-emerald-400" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold">
                                        TriBot
                                    </p>

                                    <p className="text-[10px] text-indigo-100">
                                        {student
                                            ? `Hello ${firstName} • Online`
                                            : "Scholarship & Fellowship Assistant"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Language */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowLanguageMenu(
                                                (current) =>
                                                    !current
                                            )
                                        }
                                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
                                    >
                                        🌐 {language}
                                    </button>

                                    {showLanguageMenu && (
                                        <div className="absolute right-0 top-11 z-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">
                                            {LANGUAGES.map(
                                                (item) => (
                                                    <button
                                                        key={
                                                            item.key
                                                        }
                                                        onClick={() =>
                                                            changeLanguage(
                                                                item.key
                                                            )
                                                        }
                                                        className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 ${language ===
                                                                item.key
                                                                ? "bg-indigo-50 text-indigo-700"
                                                                : ""
                                                            }`}
                                                    >
                                                        {
                                                            item.key
                                                        }
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setOpen(false)}
                                    aria-label="Close TriBot"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg hover:bg-white/20"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white/10 p-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                                <span className="text-[10px] font-semibold text-indigo-100">
                                    Multilingual student support
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                        <div className="space-y-3">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[85%] ${message.sender ===
                                                "user"
                                                ? "items-end"
                                                : "items-start"
                                            }`}
                                    >
                                        <div
                                            className={`rounded-2xl px-4 py-3 text-xs leading-5 ${message.sender ===
                                                    "user"
                                                    ? "rounded-br-md bg-indigo-600 text-white"
                                                    : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                                                }`}
                                        >
                                            {message.text}
                                        </div>

                                        {message.sender ===
                                            "bot" &&
                                            message.href && (
                                                <Link
                                                    href={
                                                        message.href
                                                    }
                                                    onClick={() =>
                                                        setOpen(
                                                            false
                                                        )
                                                    }
                                                    className="mt-2 inline-flex rounded-xl bg-indigo-50 px-3 py-2 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    {
                                                        message.action
                                                    }{" "}
                                                    →
                                                </Link>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick questions */}
                        <div className="mt-5">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Quick questions
                            </p>

                            <div className="grid gap-2">
                                {QUICK_QUESTIONS.map(
                                    (question) => (
                                        <button
                                            key={question.id}
                                            onClick={() =>
                                                sendMessage(
                                                    question.text
                                                )
                                            }
                                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                                        >
                                            <span className="text-sm">
                                                {question.icon}
                                            </span>

                                            <span className="text-[11px] font-semibold text-slate-700">
                                                {
                                                    question.text
                                                }
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-slate-200 bg-white p-3">
                        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(event) =>
                                    setInput(
                                        event.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                rows={1}
                                placeholder={
                                    language === "Hindi"
                                        ? "अपना सवाल लिखें..."
                                        : "Ask TriBot anything..."
                                }
                                className="max-h-20 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400"
                            />

                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                ↑
                            </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between px-1">
                            <p className="text-[9px] text-slate-400">
                                Press Enter to send
                            </p>

                            <p className="text-[9px] text-slate-400">
                                AI-assisted prototype
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}