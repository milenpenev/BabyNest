import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBabyStore } from "../../../store/babyStore";
import { useMilestoneStore } from "../../../store/milestoneStore";

export default function MilestoneStatisticsCard() {
  const { t } = useTranslation();
  const babyId = useBabyStore((state) => state.selectedBabyId);
  const allRecords = useMilestoneStore((state) => state.records);
  const records = useMemo(() => allRecords.filter((record) => record.babyId === babyId), [allRecords, babyId]);
  const observed = records.filter((record) => record.status === "observed").length;
  const emerging = records.filter((record) => record.status === "emerging").length;
  const domains = new Set(records.filter((record) => record.status !== "not-observed").map((record) => record.domain)).size;
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"><h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("milestones.title")}</h2><div className="mt-5 grid grid-cols-3 gap-3"><Metric value={observed} label={t("milestones.statuses.observed")} /><Metric value={emerging} label={t("milestones.statuses.emerging")} /><Metric value={domains} label={t("milestones.domainsRecorded")} /></div><p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("milestones.statisticsDisclaimer")}</p></section>;
}
function Metric({ value, label }: { value: number; label: string }) { return <div className="min-w-0 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900"><strong className="block text-2xl text-slate-900 dark:text-white">{value}</strong><span className="mt-1 block break-words text-xs text-slate-500 dark:text-slate-400">{label}</span></div>; }
