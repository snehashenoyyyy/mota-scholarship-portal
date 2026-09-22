"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import TriBot from "./TriBot";

export default function ConditionalNavbar() {
    const pathname = usePathname();

    const hideNavbar =
        pathname === "/login" ||
        pathname === "/onboarding";

    const adminPaths = [
        "/admin",
        "/scrutiny",
        "/institute-verification",
        "/fellowship-claims-admin",
        "/disbursement",
        "/merit-list",
    ];

    const isAdminPage =
        adminPaths.some(
            (path) =>
                pathname === path ||
                pathname.startsWith(
                    `${path}/`
                )
        );

    if (hideNavbar) {
        return null;
    }

    return (
        <>
            <Navbar />

            {!isAdminPage && (
                <TriBot />
            )}
        </>
    );
}