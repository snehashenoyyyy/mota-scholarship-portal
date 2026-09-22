"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileText,
    IndianRupee,
    RefreshCw,
    Search,
    ShieldCheck,
    User,
    X,
} from "lucide-react";


const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";


/*
|--------------------------------------------------------------------------
| FIXED DEMO APPLICATION
|--------------------------------------------------------------------------
|
| This is Rahul Munda's known SIH demo application.
|
*/

const RAHUL_APPLICATION_ID =
    "87736a90-d461-46ea-b989-3fd76279e3c8";


const RAHUL_DEMO_APPLICATION = {
    id: RAHUL_APPLICATION_ID,

    application_id:
        RAHUL_APPLICATION_ID,

    applicant_name:
        "Rahul Munda",

    applicant_email:
        "rahul.munda@example.com",

    scheme_id:
        "post_matric",

    scheme_name:
        "Post-Matric Scholarship",

    /*
     * The current backend disbursement endpoint
     * accepts "approved".
     */
    status:
        "approved",

    income:
        180000,

    annual_income:
        180000,

    institution:
        "Government College, Ranchi",

    course:
        "B.Tech AI/ML",

    marks:
        88.2,

    documents: [
        {
            id:
                "rahul-caste",

            doc_type:
                "caste_certificate",

            verified:
                true,
        },

        {
            id:
                "rahul-income",

            doc_type:
                "income_certificate",

            verified:
                true,
        },

        {
            id:
                "rahul-marksheet",

            doc_type:
                "marksheet",

            verified:
                true,
        },
    ],
};


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getApplicationId(
    application
) {
    return (
        application?.application_id ||
        application?.id ||
        application?.applicationId ||
        ""
    );
}


function getApplicantName(
    application
) {
    return (
        application?.applicant_name ||
        application?.student_name ||
        application?.name ||
        "Student"
    );
}


function getSchemeName(
    application
) {
    return (
        application?.scheme_name ||
        application?.scheme_id ||
        "Scholarship"
    );
}


function normalizeStatus(
    status
) {
    return String(
        status || "submitted"
    ).toLowerCase();
}


function getDocuments(
    application
) {
    return Array.isArray(
        application?.documents
    )
        ? application.documents
        : [];
}


function formatCurrency(
    value
) {
    const amount =
        Number(value || 0);

    return `₹${amount.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2,
        }
    )}`;
}


function formatDate(
    value
) {
    if (!value) {
        return "—";
    }

    try {
        return new Date(
            value
        ).toLocaleDateString(
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


function getErrorMessage(
    error
) {
    const detail =
        error?.response?.data?.detail;

    if (
        typeof detail ===
        "string"
    ) {
        return detail;
    }

    if (
        Array.isArray(detail)
    ) {
        return detail
            .map((item) => {
                if (
                    typeof item ===
                    "string"
                ) {
                    return item;
                }

                return (
                    item?.msg ||
                    JSON.stringify(item)
                );
            })
            .join(" • ");
    }

    const backendError =
        error?.response?.data?.error;

    if (
        typeof backendError ===
        "string"
    ) {
        return backendError;
    }

    return (
        error?.message ||
        "Unable to complete the request."
    );
}


/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}) {
    const normalized =
        normalizeStatus(
            status
        );


    if (
        normalized ===
        "disbursed" ||
        normalized ===
        "paid"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">

                <CheckCircle2 className="h-3.5 w-3.5" />

                DISBURSED

            </span>
        );
    }


    if (
        normalized ===
        "institute_verified"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 ring-1 ring-inset ring-cyan-600/20">

                <ShieldCheck className="h-3.5 w-3.5" />

                INSTITUTE VERIFIED

            </span>
        );
    }


    if (
        normalized ===
        "approved" ||
        normalized ===
        "eligible"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">

                <ShieldCheck className="h-3.5 w-3.5" />

                APPROVED / DBT READY

            </span>
        );
    }


    if (
        normalized ===
        "review" ||
        normalized ===
        "under_review"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">

                <Clock3 className="h-3.5 w-3.5" />

                REVIEW

            </span>
        );
    }


    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">

            {String(
                status ||
                "UNKNOWN"
            ).toUpperCase()}

        </span>
    );
}


/*
|--------------------------------------------------------------------------
| KPI CARD
|--------------------------------------------------------------------------
*/

function KpiCard({
    title,
    value,
    subtitle,
    icon,
    iconClass,
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between gap-4">

                <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-950">
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    )}

                </div>


                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| INFO CARD
|--------------------------------------------------------------------------
*/

function InfoCard({
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
                {value || "—"}
            </p>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function DisbursementPage() {

    const [
        applications,
        setApplications,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState(null);


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        selectedApplication,
        setSelectedApplication,
    ] = useState(null);


    const [
        selectedDetails,
        setSelectedDetails,
    ] = useState(null);


    const [
        detailsLoading,
        setDetailsLoading,
    ] = useState(false);


    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);


    const [
        actionMessage,
        setActionMessage,
    ] = useState(null);


    const [
        amount,
        setAmount,
    ] = useState("25000");


    const [
        paymentNote,
        setPaymentNote,
    ] = useState("");


    const [
        transactions,
        setTransactions,
    ] = useState([]);


    /*
    |--------------------------------------------------------------------------
    | LOAD QUEUE
    |--------------------------------------------------------------------------
    */

    const loadApplications =
        async (
            showRefresh = false
        ) => {

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);


            /*
             * ALWAYS create a fresh Rahul
             * demo record first.
             *
             * This guarantees Rahul appears
             * even if /applications returns
             * unrelated test records.
             */

            let queue = [
                {
                    ...RAHUL_DEMO_APPLICATION,
                },
            ];


            try {

                /*
                 * Fetch normal application list.
                 */

                const response =
                    await axios.get(
                        `${API_URL}/applications`,
                        {
                            timeout: 15000,
                        }
                    );


                const responseData =
                    response.data;


                const data =
                    Array.isArray(
                        responseData
                    )
                        ? responseData
                        : Array.isArray(
                            responseData?.data
                        )
                            ? responseData.data
                            : [];


                /*
                 * Add applications that are
                 * actually ready for DBT.
                 */

                const readyApplications =
                    data.filter(
                        (application) => {

                            const status =
                                normalizeStatus(
                                    application?.status
                                );


                            return (
                                status ===
                                "approved" ||
                                status ===
                                "eligible" ||
                                status ===
                                "institute_verified"
                            );
                        }
                    );


                /*
                 * Add them behind Rahul.
                 */

                queue = [
                    ...queue,
                    ...readyApplications,
                ];


                /*
                 * Remove duplicate application IDs.
                 */

                const seen =
                    new Set();


                queue =
                    queue.filter(
                        (
                            application
                        ) => {

                            const id =
                                getApplicationId(
                                    application
                                );


                            if (!id) {
                                return true;
                            }


                            if (
                                seen.has(id)
                            ) {
                                return false;
                            }


                            seen.add(id);

                            return true;
                        }
                    );


                setApplications(
                    queue
                );

            } catch (err) {

                console.error(
                    "DBT queue error:",
                    err
                );


                /*
                 * Rahul still remains
                 * visible even if backend
                 * list fails.
                 */

                setApplications([
                    {
                        ...RAHUL_DEMO_APPLICATION,
                    },
                ]);


                setError(
                    "Backend application list could not be loaded. Rahul Munda is being shown as the SIH demo DBT application."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);
            }
        };


    useEffect(() => {
        loadApplications();
    }, []);


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const filteredApplications =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();


            return applications.filter(
                (
                    application
                ) => {

                    if (!query) {
                        return true;
                    }


                    const name =
                        getApplicantName(
                            application
                        ).toLowerCase();


                    const scheme =
                        getSchemeName(
                            application
                        ).toLowerCase();


                    const id =
                        String(
                            getApplicationId(
                                application
                            )
                        ).toLowerCase();


                    const email =
                        String(
                            application?.applicant_email ||
                            ""
                        ).toLowerCase();


                    return (
                        name.includes(
                            query
                        ) ||
                        scheme.includes(
                            query
                        ) ||
                        id.includes(
                            query
                        ) ||
                        email.includes(
                            query
                        )
                    );
                }
            );

        }, [
            applications,
            search,
        ]);


    /*
    |--------------------------------------------------------------------------
    | METRICS
    |--------------------------------------------------------------------------
    */

    const metrics =
        useMemo(() => {

            const ready =
                applications.length;


            const estimatedAmount =
                applications.reduce(
                    (
                        sum,
                        application
                    ) =>
                        sum +
                        Number(
                            application?.amount ||
                            application?.scholarship_amount ||
                            25000
                        ),
                    0
                );


            return {
                ready,
                estimatedAmount,
            };

        }, [
            applications,
        ]);


    /*
    |--------------------------------------------------------------------------
    | OPEN APPLICATION
    |--------------------------------------------------------------------------
    */

    const openApplication =
        async (
            application
        ) => {

            setSelectedApplication(
                application
            );

            setSelectedDetails(null);

            setActionMessage(null);


            const applicationId =
                getApplicationId(
                    application
                );


            /*
             * Rahul's demo data is already
             * complete, so show it immediately.
             */

            setSelectedDetails(
                application
            );


            if (!applicationId) {
                return;
            }


            setDetailsLoading(true);


            try {

                const response =
                    await axios.get(
                        `${API_URL}/applications/${applicationId}`,
                        {
                            timeout: 15000,
                        }
                    );


                const payload =
                    response.data;


                if (
                    payload?.success ===
                    false
                ) {
                    throw new Error(
                        payload.error ||
                        "Unable to load application."
                    );
                }


                const details =
                    payload?.data ||
                    payload;


                /*
                 * Preserve Rahul's demo
                 * fields if backend detail
                 * doesn't return them.
                 */

                setSelectedDetails({
                    ...application,
                    ...details,
                    application_id:
                        applicationId,
                    id:
                        applicationId,
                });

            } catch (err) {

                console.error(
                    "Application detail error:",
                    err
                );

                /*
                 * Keep demo/application
                 * data visible.
                 */

                setSelectedDetails(
                    application
                );

            } finally {

                setDetailsLoading(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | CLOSE
    |--------------------------------------------------------------------------
    */

    const closeDrawer = () => {

        if (actionLoading) {
            return;
        }

        setSelectedApplication(
            null
        );

        setSelectedDetails(
            null
        );

        setActionMessage(
            null
        );

        setAmount(
            "25000"
        );

        setPaymentNote(
            ""
        );
    };


    /*
    |--------------------------------------------------------------------------
    | DBT
    |--------------------------------------------------------------------------
    */

    const handleDisburse =
        async () => {

            if (
                !selectedApplication
            ) {
                return;
            }


            const applicationId =
                getApplicationId(
                    selectedApplication
                );


            if (!applicationId) {

                setActionMessage({
                    type: "error",
                    text:
                        "Application ID is missing.",
                });

                return;
            }


            const numericAmount =
                Number(amount);


            if (
                !numericAmount ||
                numericAmount <= 0
            ) {

                setActionMessage({
                    type: "error",
                    text:
                        "Please enter a valid payment amount.",
                });

                return;
            }


            setActionLoading(
                true
            );

            setActionMessage(
                null
            );


            try {

                const response =
                    await axios.post(
                        `${API_URL}/applications/${applicationId}/disburse`,
                        {
                            amount:
                                numericAmount,

                            payment_note:
                                paymentNote.trim() ||
                                `Demo DBT disbursement initiated for ${formatCurrency(
                                    numericAmount
                                )}.`,
                        },
                        {
                            timeout: 15000,
                        }
                    );


                const payload =
                    response.data;


                if (
                    payload?.success ===
                    false
                ) {
                    throw new Error(
                        payload.error ||
                        "DBT payment failed."
                    );
                }


                const result =
                    payload?.data ||
                    payload;


                const transactionId =
                    result?.transaction_id ||
                    `DBT-${Date.now()}`;


                const transaction = {

                    id:
                        transactionId,

                    application_id:
                        applicationId,

                    applicant_name:
                        getApplicantName(
                            selectedApplication
                        ),

                    amount:
                        numericAmount,

                    status:
                        "disbursed",

                    created_at:
                        new Date().toISOString(),
                };


                setTransactions(
                    (
                        previous
                    ) => [
                            transaction,
                            ...previous,
                        ]
                );


                /*
                 * Remove from pending queue.
                 */

                setApplications(
                    (
                        previous
                    ) =>
                        previous.filter(
                            (
                                application
                            ) =>
                                getApplicationId(
                                    application
                                ) !==
                                applicationId
                        )
                );


                /*
                 * Update drawer.
                 */

                setSelectedApplication(
                    (
                        previous
                    ) => ({
                        ...previous,
                        status:
                            "disbursed",
                    })
                );


                setSelectedDetails(
                    (
                        previous
                    ) => ({
                        ...(previous ||
                            {}),
                        status:
                            "disbursed",
                    })
                );


                setActionMessage({
                    type:
                        "success",

                    text:
                        `DBT payment of ${formatCurrency(
                            numericAmount
                        )} initiated successfully. Transaction ID: ${transactionId}`,
                });


            } catch (err) {

                console.error(
                    "DBT error:",
                    err
                );


                setActionMessage({
                    type:
                        "error",

                    text:
                        getErrorMessage(
                            err
                        ),
                });

            } finally {

                setActionLoading(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | SELECTED DATA
    |--------------------------------------------------------------------------
    */

    const details =
        selectedDetails ||
        selectedApplication;


    const documents =
        getDocuments(
            details
        );


    const verifiedDocuments =
        documents.filter(
            (
                document
            ) =>
                document?.verified ===
                true
        ).length;


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">

            <div className="mx-auto max-w-7xl">

                {/* HEADER */}

                <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div>

                        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">

                            <span>
                                Official Portal
                            </span>

                            <span className="text-slate-300">
                                /
                            </span>

                            <span className="text-slate-500">
                                DBT Disbursement
                            </span>

                        </div>


                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                            Scholarship Disbursement
                        </h1>


                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Release scholarship payments
                            after application verification
                            and institute approval.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            loadApplications(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-cyan-200 hover:text-cyan-600 disabled:opacity-60"
                    >

                        <RefreshCw
                            className={`h-4 w-4 ${refreshing
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        Refresh Queue

                    </button>

                </header>


                {/* KPIs */}

                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <KpiCard
                        title="Ready for DBT"
                        value={
                            metrics.ready
                        }
                        subtitle="Verified applications"
                        icon={
                            <ShieldCheck className="h-5 w-5" />
                        }
                        iconClass="bg-cyan-50 text-cyan-600"
                    />


                    <KpiCard
                        title="Estimated Amount"
                        value={formatCurrency(
                            metrics.estimatedAmount
                        )}
                        subtitle="Current queue"
                        icon={
                            <IndianRupee className="h-5 w-5" />
                        }
                        iconClass="bg-emerald-50 text-emerald-600"
                    />


                    <KpiCard
                        title="Payment Gateway"
                        value="DBT"
                        subtitle="Direct Benefit Transfer"
                        icon={
                            <CreditCard className="h-5 w-5" />
                        }
                        iconClass="bg-indigo-50 text-indigo-600"
                    />


                    <KpiCard
                        title="Transactions"
                        value={
                            transactions.length
                        }
                        subtitle="This session"
                        icon={
                            <CheckCircle2 className="h-5 w-5" />
                        }
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                </section>


                {/* ERROR */}

                {error && (

                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">

                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* SEARCH + QUEUE */}

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 sm:p-6">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-950">
                                    DBT Disbursement Queue
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Applications ready for scholarship payment.
                                </p>

                            </div>


                            <div className="relative w-full lg:max-w-md">

                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search Rahul Munda, scheme or application ID..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                />

                            </div>

                        </div>

                    </div>


                    {/* LOADING */}

                    {loading ? (

                        <div className="flex min-h-[300px] items-center justify-center">

                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">

                                <RefreshCw className="h-5 w-5 animate-spin text-cyan-600" />

                                Loading DBT queue...

                            </div>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1000px] text-left text-sm">

                                <thead className="border-b border-slate-200 bg-slate-50">

                                    <tr className="text-xs uppercase tracking-wider text-slate-500">

                                        <th className="px-6 py-4 font-bold">
                                            Student
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Scheme
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Institution
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Documents
                                        </th>

                                        <th className="px-6 py-4 font-bold">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right font-bold">
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredApplications.map(
                                        (
                                            application,
                                            index
                                        ) => {

                                            const applicationId =
                                                getApplicationId(
                                                    application
                                                );


                                            const applicationDocuments =
                                                getDocuments(
                                                    application
                                                );


                                            const verified =
                                                applicationDocuments.filter(
                                                    (
                                                        document
                                                    ) =>
                                                        document?.verified ===
                                                        true
                                                ).length;


                                            /*
                                             * Guaranteed unique
                                             * row key.
                                             */

                                            const rowKey =
                                                `dbt-row-${applicationId || "application"}-${index}`;


                                            return (
                                                <tr
                                                    key={
                                                        rowKey
                                                    }
                                                    className="border-b border-slate-100 transition hover:bg-slate-50"
                                                >

                                                    {/* STUDENT */}

                                                    <td className="px-6 py-5">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">

                                                                <User className="h-5 w-5" />

                                                            </div>


                                                            <div>

                                                                <p className="font-bold text-slate-900">
                                                                    {getApplicantName(
                                                                        application
                                                                    )}
                                                                </p>

                                                                <p className="mt-1 font-mono text-[10px] text-slate-400">

                                                                    {String(
                                                                        applicationId
                                                                    ).slice(
                                                                        0,
                                                                        14
                                                                    )}

                                                                    ...

                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* SCHEME */}

                                                    <td className="px-6 py-5">

                                                        <p className="font-semibold text-slate-700">
                                                            {getSchemeName(
                                                                application
                                                            )}
                                                        </p>

                                                    </td>


                                                    {/* INSTITUTION */}

                                                    <td className="px-6 py-5">

                                                        <p className="max-w-[230px] text-sm text-slate-600">

                                                            {
                                                                application?.institution ||
                                                                application?.submitted_data?.institution ||
                                                                "Government College, Ranchi"
                                                            }

                                                        </p>

                                                    </td>


                                                    {/* DOCUMENTS */}

                                                    <td className="px-6 py-5">

                                                        <div className="flex items-center gap-2">

                                                            <ShieldCheck className="h-4 w-4 text-emerald-500" />

                                                            <span className="font-semibold text-slate-700">

                                                                {verified}/
                                                                {applicationDocuments.length ||
                                                                    3}

                                                            </span>

                                                            <span className="text-xs text-slate-400">
                                                                verified
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td className="px-6 py-5">

                                                        <StatusBadge
                                                            status={
                                                                application?.status
                                                            }
                                                        />

                                                    </td>


                                                    {/* ACTION */}

                                                    <td className="px-6 py-5 text-right">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openApplication(
                                                                    application
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700"
                                                        >

                                                            <IndianRupee className="h-4 w-4" />

                                                            Open DBT

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


                {/* RECENT TRANSACTIONS */}

                {transactions.length >
                    0 && (

                        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 p-5">

                                <h2 className="text-lg font-bold text-slate-950">
                                    Recent DBT Transactions
                                </h2>

                            </div>


                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[700px] text-left text-sm">

                                    <thead className="bg-slate-50">

                                        <tr className="text-xs uppercase tracking-wider text-slate-500">

                                            <th className="px-6 py-4 font-bold">
                                                Student
                                            </th>

                                            <th className="px-6 py-4 font-bold">
                                                Transaction ID
                                            </th>

                                            <th className="px-6 py-4 font-bold">
                                                Amount
                                            </th>

                                            <th className="px-6 py-4 font-bold">
                                                Date
                                            </th>

                                            <th className="px-6 py-4 font-bold">
                                                Status
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {transactions.map(
                                            (
                                                transaction,
                                                index
                                            ) => (

                                                <tr
                                                    key={`transaction-${transaction?.id || transaction?.application_id || "item"}-${index}`}
                                                    className="border-t border-slate-100"
                                                >

                                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                                        {
                                                            transaction?.applicant_name ||
                                                            "Student"
                                                        }
                                                    </td>


                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        {
                                                            transaction?.id
                                                        }
                                                    </td>


                                                    <td className="px-6 py-4 font-bold text-slate-800">
                                                        {formatCurrency(
                                                            transaction?.amount
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4 text-slate-500">
                                                        {formatDate(
                                                            transaction?.created_at
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

                                                            <CheckCircle2 className="h-3.5 w-3.5" />

                                                            DISBURSED

                                                        </span>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>

                    )}

            </div>


            {/* =====================================================
                DRAWER
            ===================================================== */}

            {selectedApplication && (

                <div className="fixed inset-0 z-50 flex justify-end">

                    <button
                        type="button"
                        aria-label="Close DBT drawer"
                        onClick={
                            closeDrawer
                        }
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />


                    <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">

                        {/* HEADER */}

                        <div className="border-b border-slate-200 p-6">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
                                        DBT Payment Review
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-950">
                                        {getApplicantName(
                                            selectedApplication
                                        )}
                                    </h2>

                                    <p className="mt-1 font-mono text-xs text-slate-400">
                                        {
                                            getApplicationId(
                                                selectedApplication
                                            )
                                        }
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        closeDrawer
                                    }
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >

                                    <X className="h-5 w-5" />

                                </button>

                            </div>

                        </div>


                        {/* BODY */}

                        <div className="flex-1 overflow-y-auto p-6">

                            {detailsLoading ? (

                                <div className="flex min-h-[300px] items-center justify-center">

                                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">

                                        <RefreshCw className="h-5 w-5 animate-spin text-cyan-600" />

                                        Loading application details...

                                    </div>

                                </div>

                            ) : (

                                <div className="space-y-6">

                                    {/* STATUS */}

                                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">

                                        <div className="flex items-center justify-between gap-3">

                                            <div>

                                                <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                                                    Current Status
                                                </p>

                                                <div className="mt-2">

                                                    <StatusBadge
                                                        status={
                                                            details?.status ||
                                                            selectedApplication?.status
                                                        }
                                                    />

                                                </div>

                                            </div>


                                            <ShieldCheck className="h-8 w-8 text-cyan-500" />

                                        </div>

                                    </div>


                                    {/* DETAILS */}

                                    <section>

                                        <h3 className="mb-3 text-sm font-bold text-slate-900">
                                            Student Details
                                        </h3>


                                        <div className="grid gap-3 sm:grid-cols-2">

                                            <InfoCard
                                                label="Student"
                                                value={getApplicantName(
                                                    selectedApplication
                                                )}
                                            />


                                            <InfoCard
                                                label="Scheme"
                                                value={getSchemeName(
                                                    selectedApplication
                                                )}
                                            />


                                            <InfoCard
                                                label="Annual Income"
                                                value={formatCurrency(
                                                    selectedApplication?.income ||
                                                    selectedApplication?.annual_income ||
                                                    180000
                                                )}
                                            />


                                            <InfoCard
                                                label="Marks"
                                                value={
                                                    selectedApplication?.marks
                                                        ? `${selectedApplication.marks}%`
                                                        : "88.2%"
                                                }
                                            />

                                        </div>

                                    </section>


                                    {/* DOCUMENTS */}

                                    <section>

                                        <div className="mb-3 flex items-center justify-between">

                                            <h3 className="text-sm font-bold text-slate-900">
                                                Document Verification
                                            </h3>


                                            <span className="text-xs font-bold text-emerald-600">

                                                {documents.length
                                                    ? `${documents.filter(
                                                        (
                                                            document
                                                        ) =>
                                                            document?.verified ===
                                                            true
                                                    ).length}/${documents.length}`
                                                    : "3/3"}

                                                {" "}
                                                verified

                                            </span>

                                        </div>


                                        <div className="space-y-2">

                                            {documents.map(
                                                (
                                                    document,
                                                    index
                                                ) => (

                                                    <div
                                                        key={`drawer-doc-${document?.id || document?.doc_type || "document"}-${index}`}
                                                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                                    >

                                                        <div className="flex items-center gap-3">

                                                            <FileText className="h-4 w-4 text-slate-400" />

                                                            <span className="text-sm font-semibold capitalize text-slate-700">

                                                                {String(
                                                                    document?.doc_type ||
                                                                    "Document"
                                                                ).replaceAll(
                                                                    "_",
                                                                    " "
                                                                )}

                                                            </span>

                                                        </div>


                                                        {document?.verified ===
                                                            true ? (

                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">

                                                                <CheckCircle2 className="h-4 w-4" />

                                                                Verified

                                                            </span>

                                                        ) : (

                                                            <span className="text-xs font-bold text-amber-600">
                                                                Review
                                                            </span>

                                                        )}

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </section>


                                    {/* PAYMENT */}

                                    <section className="rounded-2xl border border-slate-200">

                                        <div className="border-b border-slate-200 p-5">

                                            <h3 className="font-bold text-slate-900">
                                                DBT Payment
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Enter the scholarship amount to release.
                                            </p>

                                        </div>


                                        <div className="space-y-4 p-5">

                                            <div>

                                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Amount
                                                </label>


                                                <div className="relative">

                                                    <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />


                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            amount
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setAmount(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                                    />

                                                </div>

                                            </div>


                                            <div>

                                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Payment Note
                                                </label>


                                                <textarea
                                                    value={
                                                        paymentNote
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setPaymentNote(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    rows={3}
                                                    placeholder="Optional payment note..."
                                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                                />

                                            </div>

                                        </div>

                                    </section>


                                    {/* ACTION MESSAGE */}

                                    {actionMessage && (

                                        <div
                                            className={`rounded-2xl border p-4 ${actionMessage.type ===
                                                    "success"
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                    : "border-rose-200 bg-rose-50 text-rose-800"
                                                }`}
                                        >

                                            <div className="flex items-start gap-3">

                                                {actionMessage.type ===
                                                    "success" ? (

                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                                                ) : (

                                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                                                )}


                                                <p className="text-sm font-semibold leading-6">
                                                    {
                                                        actionMessage.text
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>


                        {/* FOOTER */}

                        <div className="border-t border-slate-200 bg-white p-5">

                            <button
                                type="button"
                                onClick={
                                    handleDisburse
                                }
                                disabled={
                                    actionLoading ||
                                    detailsLoading
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {actionLoading ? (

                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Processing DBT...
                                    </>

                                ) : (

                                    <>
                                        <IndianRupee className="h-4 w-4" />
                                        Initiate DBT Payment
                                    </>

                                )}

                            </button>


                            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                                SIH demonstration workflow —
                                no real money is transferred.
                            </p>

                        </div>

                    </aside>

                </div>

            )}

        </main>
    );
}