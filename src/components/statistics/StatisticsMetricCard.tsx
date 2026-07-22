import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function StatisticsMetricCard({ label, value, badge, icon: Icon, className = "" }: { label: string; value: ReactNode; badge?: ReactNode; icon?: LucideIcon; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}>
    <div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>{Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-400" /> : null}</div>
    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    {badge ? <div className="mt-2">{badge}</div> : null}
  </div>;
}
