import { Suspense } from "react";
import ApplyClient from "./apply-client";

function ApplyLoading() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-4 w-72 animate-pulse rounded bg-slate-100" />
                    <div className="mt-8 h-40 animate-pulse rounded-xl bg-slate-100" />
                </div>
            </div>
        </main>
    );
}

export default function ApplyPage() {
    return (
        <Suspense fallback={<ApplyLoading />}>
            <ApplyClient />
        </Suspense>
    );
}
