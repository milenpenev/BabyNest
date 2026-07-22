import type { ReactNode } from "react";

export default function MetricCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">{icon}{label}</div><p className="mt-2 break-words text-2xl font-bold text-slate-900 dark:text-white">{value}</p>{hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}</div>;
}
