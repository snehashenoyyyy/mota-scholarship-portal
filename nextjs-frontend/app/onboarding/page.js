"use client";
import { useState } from "react";
import Link from "next/link";
import { FileCheck2, Landmark, LineChart, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
    {
        icon: FileCheck2,
        title: "AI-Driven Instant Verification",
        desc: "No more back-and-forth delays in document checking.",
    },
    {
        icon: Landmark,
        title: "Direct Benefit Transfer",
        desc: "Funds disbursed instantly to your bank account.",
    },
    {
        icon: LineChart,
        title: "Real-Time Tracking",
        desc: "Follow your application status at every stage.",
    },
];

export default function Onboarding() {
    const [active, setActive] = useState(0);

    const next = () => setActive((a) => (a + 1) % slides.length);
    const prev = () => setActive((a) => (a - 1 + slides.length) % slides.length);

    const Slide = slides[active].icon;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
            {/* Top header */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        MoTA
                    </div>
                    <span className="font-semibold text-slate-900 text-sm sm:text-base">
                        Digital Scholarship &amp; Fellowship Portal
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
                        <option>English</option>
                        <option>हिन्दी</option>
                        <option>Regional</option>
                    </select>
                </div>
            </header>

            {/* Carousel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="max-w-md w-full text-center">
                    <div className="mx-auto mb-8 h-20 w-20 rounded-2xl bg-indigo-100 flex items-center justify-center">
                        <Slide className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-950 mb-3">
                        {slides[active].title}
                    </h1>
                    <p className="text-slate-500 text-base leading-6">{slides[active].desc}</p>

                    <div className="flex items-center justify-center gap-4 mt-10">
                        <button onClick={prev} className="p-2 rounded-full border border-slate-200 hover:bg-slate-50">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="flex gap-2">
                            {slides.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-indigo-600" : "w-2 bg-slate-200"
                                        }`}
                                />
                            ))}
                        </div>
                        <button onClick={next} className="p-2 rounded-full border border-slate-200 hover:bg-slate-50">
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom actions */}
            <div className="px-6 pb-10 max-w-md w-full mx-auto">
                <Link
                    href="/login"
                    className="block w-full text-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
                >
                    Get Started
                </Link>
                <Link
                    href="/"
                    className="block text-center mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    Explore Schemes as Guest
                </Link>
            </div>
        </main>
    );
}