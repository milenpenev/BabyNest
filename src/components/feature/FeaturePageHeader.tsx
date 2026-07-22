import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  babyName: string | null;
  latest: string;
  action?: ReactNode;
}

export default function FeaturePageHeader({ icon: Icon, title, description, babyName, latest, action }: Props) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white shadow-lg shadow-indigo-200/40 dark:border-indigo-900 dark:shadow-none sm:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon className="h-6 w-6" /></span><div><p className="text-sm text-indigo-100">{babyName ?? "—"}</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1></div></div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">{description}</p>
          <p className="mt-3 text-sm font-medium text-white/90">{latest}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}
