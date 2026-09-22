"use client";

import { useMemo, useState } from "react";

const DEMO_CANDIDATES = [
    {
        id: "NFST-001",
        name: "Anita Kerketta",
        state: "Jharkhand",
        category: "ST",
        gender: "Female",
        pvtg: true,
        pwd: false,
        pgMarks: 91.8,
    },
    {
        id: "NFST-002",
        name: "Rahul Munda",
        state: "Jharkhand",
        category: "ST",
        gender: "Male",
        pvtg: false,
        pwd: false,
        pgMarks: 86.5,
    },
    {
        id: "NFST-003",
        name: "Sushila Toppo",
        state: "Odisha",
        category: "ST",
        gender: "Female",
        pvtg: true,
        pwd: false,
        pgMarks: 88.4,
    },
    {
        id: "NFST-004",
        name: "Birsa Nag",
        state: "Chhattisgarh",
        category: "ST",
        gender: "Male",
        pvtg: false,
        pwd: true,
        pgMarks: 84.7,
    },
    {
        id: "NFST-005",
        name: "Meena Oraon",
        state: "Jharkhand",
        category: "ST",
        gender: "Female",
        pvtg: false,
        pwd: false,
        pgMarks: 89.1,
    },
    {
        id: "NFST-006",
        name: "Kiran Minz",
        state: "Odisha",
        category: "ST",
        gender: "Female",
        pvtg: true,
        pwd: true,
        pgMarks: 82.6,
    },
    {
        id: "NFST-007",
        name: "Ajay Kisku",
        state: "West Bengal",
        category: "ST",
        gender: "Male",
        pvtg: false,
        pwd: false,
        pgMarks: 87.2,
    },
    {
        id: "NFST-008",
        name: "Sunita Lakra",
        state: "Jharkhand",
        category: "ST",
        gender: "Female",
        pvtg: false,
        pwd: false,
        pgMarks: 85.9,
    },
];

const SCHEME_CONFIG = {
    NFST: {
        title: "National Fellowship for ST Students",
        subtitle: "Doctoral fellowship merit processing",
        slots: 750,
        field: "PG Marks",
    },
    NOS: {
        title: "National Overseas Scholarship",
        subtitle: "Overseas higher-education merit processing",
        slots: 20,
        field: "Academic Marks",
    },
};

function calculateScore(candidate) {
    let score = Number(candidate.pgMarks || 0) * 0.8;

    if (candidate.gender === "Female") {
        score += 5;
    }

    if (candidate.pvtg) {
        score += 10;
    }

    if (candidate.pwd) {
        score += 5;
    }

    return Number(score.toFixed(2));
}

function buildRankedList(candidates) {
    return [...candidates]
        .map((candidate) => ({
            ...candidate,
            score: calculateScore(candidate),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return b.pgMarks - a.pgMarks;
        })
        .map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
        }));
}

export default function MeritListPage() {
    const [scheme, setScheme] = useState("NFST");
    const [generated, setGenerated] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState("");
    const [stateFilter, setStateFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [weights, setWeights] = useState({
        academic: 80,
        female: 5,
        pvtg: 10,
        pwd: 5,
    });

    const config = SCHEME_CONFIG[scheme];

    const states = useMemo(
        () => [
            "All",
            ...Array.from(
                new Set(
                    DEMO_CANDIDATES.map(
                        (candidate) => candidate.state
                    )
                )
            ),
        ],
        []
    );

    const rankedCandidates = useMemo(() => {
        return buildRankedList(
            DEMO_CANDIDATES.map((candidate) => {
                let score =
                    Number(candidate.pgMarks || 0) *
                    (weights.academic / 100);

                if (candidate.gender === "Female") {
                    score += weights.female;
                }

                if (candidate.pvtg) {
                    score += weights.pvtg;
                }

                if (candidate.pwd) {
                    score += weights.pwd;
                }

                return {
                    ...candidate,
                    score: Number(score.toFixed(2)),
                };
            })
        );
    }, [weights]);

    const filteredCandidates = useMemo(() => {
        const query = search.trim().toLowerCase();

        return rankedCandidates.filter((candidate) => {
            const matchesSearch =
                !query ||
                candidate.name.toLowerCase().includes(query) ||
                candidate.id.toLowerCase().includes(query) ||
                candidate.state.toLowerCase().includes(query);

            const matchesState =
                stateFilter === "All" ||
                candidate.state === stateFilter;

            const matchesCategory =
                categoryFilter === "All" ||
                candidate.category === categoryFilter;

            return (
                matchesSearch &&
                matchesState &&
                matchesCategory
            );
        });
    }, [
        rankedCandidates,
        search,
        stateFilter,
        categoryFilter,
    ]);

    const stats = useMemo(() => {
        const total = rankedCandidates.length;

        const average =
            total > 0
                ? (
                    rankedCandidates.reduce(
                        (sum, candidate) =>
                            sum + candidate.pgMarks,
                        0
                    ) / total
                ).toFixed(1)
                : "0.0";

        const pvtg = rankedCandidates.filter(
            (candidate) => candidate.pvtg
        ).length;

        const female = rankedCandidates.filter(
            (candidate) => candidate.gender === "Female"
        ).length;

        return {
            total,
            average,
            pvtg,
            female,
        };
    }, [rankedCandidates]);

    async function generateMeritList() {
        setGenerating(true);
        setGenerated(false);

        await new Promise((resolve) =>
            setTimeout(resolve, 1200)
        );

        setGenerating(false);
        setGenerated(true);
    }

    function exportList() {
        const rows = [
            [
                "Rank",
                "Candidate ID",
                "Candidate Name",
                "State",
                "Category",
                "Gender",
                "PVTG",
                "PWD",
                "Academic Marks",
                "Calculated Score",
            ],
            ...rankedCandidates.map((candidate) => [
                candidate.rank,
                candidate.id,
                candidate.name,
                candidate.state,
                candidate.category,
                candidate.gender,
                candidate.pvtg ? "Yes" : "No",
                candidate.pwd ? "Yes" : "No",
                candidate.pgMarks,
                candidate.score,
            ]),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((value) =>
                        `"${String(value).replaceAll('"', '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `${scheme.toLowerCase()}-merit-list.csv`;
        anchor.click();

        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 p-6 text-white shadow-lg sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                                <span className="h-2 w-2 rounded-full bg-purple-400" />
                                Official Portal
                            </div>

                            <h1 className="text-2xl font-bold sm:text-3xl">
                                AI Merit List Generator
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                Generate a transparent, configurable demo
                                ranking for NFST or NOS applications using
                                academic performance and configurable
                                preference factors.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-slate-400">
                                Selected Scheme
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {scheme}
                            </p>

                            <p className="text-xs text-slate-400">
                                {config.slots} configured slots
                            </p>
                        </div>
                    </div>
                </section>

                {/* Scheme selector */}
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Merit List Configuration
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select a fellowship pathway and configure the
                                demo ranking model.
                            </p>
                        </div>

                        <div className="flex rounded-xl bg-slate-100 p-1">
                            {["NFST", "NOS"].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        setScheme(item);
                                        setGenerated(false);
                                    }}
                                    className={`rounded-lg px-6 py-2.5 text-sm font-bold transition ${scheme === item
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Scheme
                            </p>

                            <h3 className="mt-1 text-base font-bold text-slate-900">
                                {config.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {config.subtitle}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600">
                                    {config.slots} configured slots
                                </span>

                                <span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600">
                                    {config.field}
                                </span>

                                <span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600">
                                    AI Ranking
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                    ⚙
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-indigo-900">
                                        Configurable ranking model
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-indigo-700">
                                        Adjust the demo weights below to show
                                        how a transparent scoring model can be
                                        configured.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weights */}
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold text-slate-700">
                                Academic Weight
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={weights.academic}
                                    onChange={(event) =>
                                        setWeights({
                                            ...weights,
                                            academic:
                                                Number(
                                                    event.target.value
                                                ),
                                        })
                                    }
                                    className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                                />

                                <span className="text-xs text-slate-400">
                                    points factor
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold text-slate-700">
                                Female Preference
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={weights.female}
                                    onChange={(event) =>
                                        setWeights({
                                            ...weights,
                                            female:
                                                Number(
                                                    event.target.value
                                                ),
                                        })
                                    }
                                    className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                                />

                                <span className="text-xs text-slate-400">
                                    bonus points
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold text-slate-700">
                                PVTG Preference
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={weights.pvtg}
                                    onChange={(event) =>
                                        setWeights({
                                            ...weights,
                                            pvtg:
                                                Number(
                                                    event.target.value
                                                ),
                                        })
                                    }
                                    className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                                />

                                <span className="text-xs text-slate-400">
                                    bonus points
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold text-slate-700">
                                PWD Preference
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={weights.pwd}
                                    onChange={(event) =>
                                        setWeights({
                                            ...weights,
                                            pwd:
                                                Number(
                                                    event.target.value
                                                ),
                                        })
                                    }
                                    className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                                />

                                <span className="text-xs text-slate-400">
                                    bonus points
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-400">
                            Generate the ranking after changing the
                            configuration.
                        </p>

                        <button
                            onClick={generateMeritList}
                            disabled={generating}
                            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {generating
                                ? "Generating AI Merit List..."
                                : "Generate AI Merit List"}
                        </button>
                    </div>
                </section>

                {/* Stats */}
                {generated && (
                    <>
                        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Candidates
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {stats.total}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Average Marks
                                </p>

                                <p className="mt-2 text-2xl font-bold text-indigo-600">
                                    {stats.average}%
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Female Candidates
                                </p>

                                <p className="mt-2 text-2xl font-bold text-purple-600">
                                    {stats.female}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    PVTG Candidates
                                </p>

                                <p className="mt-2 text-2xl font-bold text-emerald-600">
                                    {stats.pvtg}
                                </p>
                            </div>
                        </section>

                        {/* Table */}
                        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 p-5 sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Generated Merit List
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Ranked candidates based on the
                                            configured demo scoring model.
                                        </p>
                                    </div>

                                    <button
                                        onClick={exportList}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        ↓ Export CSV
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <div className="relative sm:col-span-2">
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
                                            placeholder="Search candidate, ID or state..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>

                                    <select
                                        value={stateFilter}
                                        onChange={(event) =>
                                            setStateFilter(
                                                event.target.value
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                                    >
                                        {states.map((state) => (
                                            <option key={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[950px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50 text-left">
                                            <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Rank
                                            </th>

                                            <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Candidate
                                            </th>

                                            <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                State
                                            </th>

                                            <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Academic Marks
                                            </th>

                                            <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Preference Factors
                                            </th>

                                            <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Score
                                            </th>

                                            <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredCandidates.map(
                                            (candidate) => (
                                                <tr
                                                    key={candidate.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-5">
                                                        <div
                                                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${candidate.rank ===
                                                                    1
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : candidate.rank ===
                                                                        2
                                                                        ? "bg-slate-200 text-slate-700"
                                                                        : candidate.rank ===
                                                                            3
                                                                            ? "bg-orange-100 text-orange-700"
                                                                            : "bg-slate-100 text-slate-500"
                                                                }`}
                                                        >
                                                            {candidate.rank}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700">
                                                                {candidate.name
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
                                                                    .join("")}
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">
                                                                    {
                                                                        candidate.name
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                                    {
                                                                        candidate.id
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-5">
                                                        <span className="text-xs font-semibold text-slate-700">
                                                            {
                                                                candidate.state
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-5">
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {
                                                                candidate.pgMarks
                                                            }
                                                            %
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-5">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {candidate.gender ===
                                                                "Female" && (
                                                                    <span className="rounded-full bg-purple-100 px-2 py-1 text-[9px] font-bold text-purple-700">
                                                                        Female
                                                                    </span>
                                                                )}

                                                            {candidate.pvtg && (
                                                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                                                                    PVTG
                                                                </span>
                                                            )}

                                                            {candidate.pwd && (
                                                                <span className="rounded-full bg-cyan-100 px-2 py-1 text-[9px] font-bold text-cyan-700">
                                                                    PWD
                                                                </span>
                                                            )}

                                                            {!candidate.pvtg &&
                                                                !candidate.pwd &&
                                                                candidate.gender !==
                                                                "Female" && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        None
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-5">
                                                        <span className="text-sm font-bold text-indigo-700">
                                                            {
                                                                candidate.score
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-5 text-right">
                                                        <span
                                                            className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${candidate.rank <=
                                                                    3
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-slate-100 text-slate-600"
                                                                }`}
                                                        >
                                                            {candidate.rank <=
                                                                3
                                                                ? "SHORTLISTED"
                                                                : "RANKED"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredCandidates.length === 0 && (
                                <div className="p-10 text-center">
                                    <p className="text-sm font-semibold text-slate-700">
                                        No candidates found
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Try changing the search or filter.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Transparency */}
                        <section className="mt-6 grid gap-6 lg:grid-cols-2">

                            <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                        🧮
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-bold text-indigo-900">
                                            How the demo score is calculated
                                        </h2>

                                        <div className="mt-4 space-y-2 text-xs text-indigo-800">
                                            <p>
                                                Academic marks ×{" "}
                                                {weights.academic}%
                                            </p>

                                            <p>
                                                Female preference: +{" "}
                                                {weights.female}
                                            </p>

                                            <p>
                                                PVTG preference: +{" "}
                                                {weights.pvtg}
                                            </p>

                                            <p>
                                                PWD preference: +{" "}
                                                {weights.pwd}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                        ⚠
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-bold text-amber-900">
                                            Important transparency note
                                        </h2>

                                        <p className="mt-2 text-xs leading-5 text-amber-800">
                                            The weighting shown in this SIH
                                            prototype is a configurable demo
                                            model and should not be presented
                                            as the actual NFST or NOS selection
                                            policy of the Ministry of Tribal
                                            Affairs.
                                        </p>

                                        <p className="mt-3 text-xs leading-5 text-amber-800">
                                            In a production deployment, the
                                            ranking configuration would be
                                            based on the applicable official
                                            scheme guidelines.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Footer note */}
                        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        Merit list generated successfully
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {filteredCandidates.length} of{" "}
                                        {rankedCandidates.length} candidates
                                        currently displayed.
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                                    AI PROCESSING COMPLETE
                                </span>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}