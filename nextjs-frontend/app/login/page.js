"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [role, setRole] = useState("student");
    const [aadhaar, setAadhaar] = useState("");
    const [otp, setOtp] = useState("");
    const [officialId, setOfficialId] = useState("");
    const [password, setPassword] = useState("");
    const [officialRole, setOfficialRole] =
        useState("District Officer");

    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const sendOtp = () => {
        setError("");

        if (!/^\d{12}$/.test(aadhaar)) {
            setError(
                "Enter a valid 12-digit Aadhaar / VID number."
            );
            return;
        }

        setOtpSent(true);
    };

    const studentLogin = () => {
        setError("");

        if (!/^\d{6}$/.test(otp)) {
            setError(
                "Enter the 6-digit OTP."
            );
            return;
        }

        setLoading(true);

        const student = {
            name: "Rahul Munda",
            category: "ST",
            address: "Ranchi, Jharkhand",
            bankStatus: "Seeded",
            aadhaarVerified: true,
            loginType: "student",
        };

        localStorage.setItem(
            "mota_student",
            JSON.stringify(student)
        );

        localStorage.setItem(
            "mota_logged_in",
            "true"
        );

        setTimeout(() => {
            router.push("/dashboard");
        }, 500);
    };

    const officialLogin = () => {
        setError("");

        if (!officialId.trim()) {
            setError("Enter your official ID.");
            return;
        }

        if (!password.trim()) {
            setError("Enter your password.");
            return;
        }

        setLoading(true);

        const official = {
            id: officialId,
            role: officialRole,
            loginType: "official",
        };

        localStorage.setItem(
            "mota_official",
            JSON.stringify(official)
        );

        localStorage.setItem(
            "mota_official_logged_in",
            "true"
        );

        setTimeout(() => {
            router.push("/admin");
        }, 500);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">

                <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">

                    {/* Left */}
                    <section className="hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-cyan-700 p-10 text-white lg:block">
                        <div className="flex h-full flex-col justify-between">

                            <div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-black text-indigo-700">
                                    M
                                </div>

                                <p className="mt-8 text-sm font-semibold text-indigo-100">
                                    Ministry of Tribal Affairs
                                </p>

                                <h1 className="mt-2 text-4xl font-bold leading-tight">
                                    Scholarship &
                                    Fellowship
                                    Management
                                </h1>

                                <p className="mt-5 max-w-md text-sm leading-7 text-indigo-100">
                                    A unified digital platform for
                                    scholarship applications,
                                    AI-assisted document verification,
                                    fellowship claims and DBT
                                    disbursement.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Feature
                                    icon="🔐"
                                    text="Secure e-KYC authentication"
                                />

                                <Feature
                                    icon="🤖"
                                    text="AI-powered document scrutiny"
                                />

                                <Feature
                                    icon="🏛️"
                                    text="Institute verification"
                                />

                                <Feature
                                    icon="💳"
                                    text="Transparent DBT tracking"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Right */}
                    <section className="p-6 sm:p-10">

                        <div className="mx-auto max-w-md">

                            <div className="text-center lg:text-left">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white lg:hidden">
                                    M
                                </div>

                                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-indigo-600">
                                    Welcome
                                </p>

                                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                    Sign in to Portal
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Select your portal and continue.
                                </p>
                            </div>

                            {/* Role */}
                            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                                <button
                                    onClick={() => {
                                        setRole("student");
                                        setError("");
                                    }}
                                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${role === "student"
                                            ? "bg-white text-indigo-700 shadow-sm"
                                            : "text-slate-500"
                                        }`}
                                >
                                    🎓 Student
                                </button>

                                <button
                                    onClick={() => {
                                        setRole("official");
                                        setError("");
                                    }}
                                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${role === "official"
                                            ? "bg-white text-cyan-700 shadow-sm"
                                            : "text-slate-500"
                                        }`}
                                >
                                    🏛️ Official
                                </button>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                    ⚠ {error}
                                </div>
                            )}

                            {/* Student */}
                            {role === "student" && (
                                <div className="mt-7 space-y-5">

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Aadhaar / VID
                                        </label>

                                        <input
                                            value={aadhaar}
                                            onChange={(event) =>
                                                setAadhaar(
                                                    event.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(0, 12)
                                                )
                                            }
                                            placeholder="Enter 12-digit number"
                                            inputMode="numeric"
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />

                                        <p className="mt-2 text-xs text-slate-500">
                                            Demo: any valid 12-digit
                                            number can be used.
                                        </p>
                                    </div>

                                    {!otpSent ? (
                                        <button
                                            onClick={sendOtp}
                                            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                                        >
                                            Send OTP
                                        </button>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                    OTP
                                                </label>

                                                <input
                                                    value={otp}
                                                    onChange={(event) =>
                                                        setOtp(
                                                            event.target.value
                                                                .replace(
                                                                    /\D/g,
                                                                    ""
                                                                )
                                                                .slice(
                                                                    0,
                                                                    6
                                                                )
                                                        )
                                                    }
                                                    placeholder="Enter 6-digit OTP"
                                                    inputMode="numeric"
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-sm tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                />

                                                <p className="mt-2 text-xs text-emerald-600">
                                                    ✓ Demo OTP accepted:
                                                    any 6-digit OTP
                                                </p>
                                            </div>

                                            <button
                                                onClick={
                                                    studentLogin
                                                }
                                                disabled={loading}
                                                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                                            >
                                                {loading
                                                    ? "Signing in..."
                                                    : "Verify & Continue"}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setOtpSent(false);
                                                    setOtp("");
                                                }}
                                                className="w-full text-sm font-semibold text-slate-500 hover:text-indigo-600"
                                            >
                                                Change Aadhaar / VID
                                            </button>
                                        </>
                                    )}

                                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                                        <p className="text-xs font-bold text-indigo-800">
                                            🔐 Secure Authentication
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-indigo-700">
                                            Secured by Aadhaar e-KYC
                                            and DigiLocker workflow.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Official */}
                            {role === "official" && (
                                <div className="mt-7 space-y-5">

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Official ID
                                        </label>

                                        <input
                                            value={officialId}
                                            onChange={(event) =>
                                                setOfficialId(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter official ID"
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Role
                                        </label>

                                        <select
                                            value={officialRole}
                                            onChange={(event) =>
                                                setOfficialRole(
                                                    event.target.value
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                        >
                                            <option>
                                                District Officer
                                            </option>

                                            <option>
                                                State Officer
                                            </option>

                                            <option>
                                                Institute Officer
                                            </option>

                                            <option>
                                                Ministry Officer
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Password
                                        </label>

                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter password"
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                        />
                                    </div>

                                    <button
                                        onClick={officialLogin}
                                        disabled={loading}
                                        className="w-full rounded-xl bg-cyan-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60"
                                    >
                                        {loading
                                            ? "Signing in..."
                                            : "Sign in to Official Portal"}
                                    </button>

                                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                                        <p className="text-xs font-bold text-cyan-800">
                                            🏛️ Official Access
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-cyan-700">
                                            Demo authentication is enabled
                                            for the SIH prototype.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p className="mt-8 text-center text-xs text-slate-400">
                                SIH 2026 • Scholarship & Fellowship
                                Management System
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

function Feature({
    icon,
    text,
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <span className="text-lg">
                {icon}
            </span>

            <span className="text-sm font-semibold text-indigo-50">
                {text}
            </span>
        </div>
    );
}