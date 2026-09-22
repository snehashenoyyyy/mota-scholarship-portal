"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const studentNav = [
    {
        label: "Dashboard",
        href: "/dashboard",
    },
    {
        label: "Schemes",
        href: "/scheme-selection",
    },
    {
        label: "Apply",
        href: "/",
    },
    {
        label: "Upload",
        href: "/upload",
    },
    {
        label: "Status",
        href: "/status",
    },
    {
        label: "Fellowship Claims",
        href: "/fellowship-claims",
    },
    {
        label: "Help",
        href: "/help",
    },
];

const adminNav = [
    {
        label: "Admin",
        href: "/admin",
    },
    {
        label: "Scrutiny",
        href: "/scrutiny",
    },
    {
        label: "Institute Verification",
        href: "/institute-verification",
    },
    {
        label: "Disbursement",
        href: "/disbursement",
    },
    {
        label: "Merit List",
        href: "/merit-list",
    },
];

export default function Navbar() {
    const pathname = usePathname();

    const adminPaths = [
        "/admin",
        "/scrutiny",
        "/institute-verification",
        "/disbursement",
        "/merit-list",
    ];

    const isAdminPage = adminPaths.some(
        (path) =>
            pathname === path ||
            pathname.startsWith(`${path}/`)
    );

    const navigation = isAdminPage ? adminNav : studentNav;

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">

                {/* Logo */}
                <Link
                    href={isAdminPage ? "/admin" : "/dashboard"}
                    className="flex shrink-0 items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
                        M
                    </div>

                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">
                            MoTA Scholarship Portal
                        </p>

                        <p className="text-[10px] text-slate-500">
                            Tribal Scholarship & Fellowship Management
                        </p>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex max-w-[70%] items-center gap-1 overflow-x-auto">
                    {navigation.map((item) => {
                        const active =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${active
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Role badge */}
                <div className="hidden shrink-0 md:block">
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isAdminPage
                                ? "bg-cyan-100 text-cyan-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                    >
                        {isAdminPage
                            ? "Official Portal"
                            : "Student Portal"}
                    </span>
                </div>
            </div>
        </header>
    );
}