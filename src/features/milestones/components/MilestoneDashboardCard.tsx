import { ArrowRight, Footprints } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useBabyStore } from "../../../store/babyStore";
import { useMilestoneStore } from "../../../store/milestoneStore";
import { milestoneCatalog } from "../data/catalog";

export default function MilestoneDashboardCard() {
  const { t } = useTranslation();
  const babyId = useBabyStore((state) => state.selectedBabyId);
  const records = useMilestoneStore((state) => state.records)
    .filter((record) => record.babyId === babyId && ["observed", "emerging"].includes(record.status))
    .sort((a, b) => new Date(b.observedAt ?? b.firstNoticedAt ?? b.updatedAt).getTime() - new Date(a.observedAt ?? a.firstNoticedAt ?? a.updatedAt).getTime());
  const recent = records[0];
  const recordedCount = records.length;
  const definition = recent?.milestoneId ? milestoneCatalog.find((item) => item.id === recent.milestoneId) : undefined;
  const title = recent?.customTitle ?? (definition ? t(definition.titleKey) : "");

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"><Footprints className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t("milestones.heroBadge")}</p><h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{t("milestones.observedSummary", { count: recordedCount })}</h2>{recent && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{title} · {t(`milestones.statuses.${recent.status}`)}</p>}</div>
        </div>
        <Link to="/milestones" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-900/30">{t("milestones.open")}<ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
