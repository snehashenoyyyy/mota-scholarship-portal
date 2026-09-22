"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const searchParams = useSearchParams();

  const selectedSchemeId =
    searchParams.get("scheme_id") ||
    "8c0b1108-0943-4877-80d0-e6592c4318ec";

  const [form, setForm] = useState({
    applicant_name: "",
    applicant_email: "",
    scheme_id: selectedSchemeId,
    income: "",
    percentage: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post(`${API_URL}/apply`, {
        ...form,
        income: parseFloat(form.income),
        percentage: parseFloat(form.percentage),
      });

      if (res.data?.success) {
        setResult(res.data);
      } else {
        setError(
          res.data?.error || "Application submission failed."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const applicationId = result?.data?.application_id;
  const applicationStatus = result?.data?.status || "submitted";

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-950/10 lg:grid-cols-[2fr_3fr]">

        {/* Sidebar */}
        <aside className="relative flex min-h-[330px] flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 p-8 text-white sm:p-10 lg:min-h-[650px] lg:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10 bg-white/5" />

          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full border border-white/10 bg-violet-400/10" />

          <div className="relative z-10">
            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Award className="h-6 w-6" />
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
              2025–26 program
            </p>

            <h1 className="max-w-sm text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Scholarship Portal
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-indigo-100">
              Take the first step toward meaningful support for
              your education. Your application takes just a few
              minutes, and every detail is handled with care.
            </p>
          </div>

          <div className="relative z-10 mt-12 flex items-center gap-3 text-sm text-indigo-100">
            <ShieldCheck className="h-5 w-5 text-indigo-200" />
            <span>Secure, confidential application</span>
          </div>
        </aside>

        {/* Form section */}
        <section className="bg-white p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                <span>Step 1 of 3</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">
                  Personal details
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Tell us about yourself
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                We&apos;ll use these details to process your
                scholarship application.
              </p>
            </div>

            <div className="hidden rounded-full bg-indigo-50 p-3 text-indigo-600 sm:block">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" />
          </div>

          {/* Selected Scheme */}
          <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Selected Scheme
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              Pre-Matric Scholarship
            </p>

            <p className="mt-1 break-all text-xs text-slate-500">
              Scheme ID: {form.scheme_id}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />

              <div>
                <h3 className="font-semibold text-rose-950">
                  Submission Failed
                </h3>

                <p className="mt-1 text-sm">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {result?.success ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="mb-5 h-14 w-14 text-emerald-500" />

              <h3 className="text-xl font-semibold text-slate-950">
                Application submitted
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Thank you. We&apos;ve received your scholarship
                application.
              </p>

              <div className="mt-6 w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left shadow-sm">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Application ID
                </div>

                <div className="mb-4 break-all rounded-lg border border-slate-200 bg-white px-3 py-3 font-mono text-sm text-slate-950 shadow-sm">
                  {applicationId}
                </div>

                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </div>

                <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold capitalize text-indigo-700">
                  {applicationStatus}
                </div>
              </div>

              <button
                onClick={() => {
                  setResult(null);

                  setForm({
                    ...form,
                    applicant_name: "",
                    applicant_email: "",
                    income: "",
                    percentage: "",
                  });
                }}
                className="mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="applicant_name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="applicant_name"
                  type="text"
                  name="applicant_name"
                  value={form.applicant_name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="applicant_email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="applicant_email"
                  type="email"
                  name="applicant_email"
                  value={form.applicant_email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="income"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Annual income
                  </label>

                  <input
                    id="income"
                    type="number"
                    name="income"
                    value={form.income}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="50000"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="percentage"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Academic percentage
                  </label>

                  <input
                    id="percentage"
                    type="number"
                    step="0.1"
                    name="percentage"
                    value={form.percentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    placeholder="85"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Your data is encrypted
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-75"
                >
                  {loading
                    ? "Submitting..."
                    : "Continue"}

                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}