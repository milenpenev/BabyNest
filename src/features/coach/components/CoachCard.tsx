import { Brain, ChevronRight, Clock3, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useActivityStore } from "../../../store/activityStore";
import { useBabyStore } from "../../../store/babyStore";
import { useCoachStore } from "../../../store/coachStore";
import { useMilestoneStore } from "../../../store/milestoneStore";
import { useReminderStore } from "../../../store/reminderStore";
import { useMemoryStore } from "../../../store/memoryStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import { useVaccinationStore } from "../../../store/vaccinationStore";
import { evaluateCoachRules } from "../rules/coachRules";

export default function CoachCard() {
  const { t } = useTranslation();
  const babies = useBabyStore((s) => s.babies); const babyId = useBabyStore((s) => s.selectedBabyId);
  const activities = useActivityStore((s) => s.activities); const activeActivity = useActivityStore((s) => s.activeActivity);
  const milestones = useMilestoneStore((s) => s.records); const memories = useMemoryStore((s) => s.memories); const vaccinations = useVaccinationStore((s) => s.records); const reminders = useReminderStore((s) => s.reminders);
  const decisions = useCoachStore((s) => s.decisions); const dismiss = useCoachStore((s) => s.dismiss); const snooze = useCoachStore((s) => s.snooze);
  const premium = useSubscriptionStore((s) => s.plan) === "premium";
  const suggestions = useMemo(() => evaluateCoachRules({ baby: babies.find((item) => item.id === babyId) ?? null, activities, activeActivity, milestones, memories, vaccinations, reminders, now: new Date() }).filter((item) => { const decision = decisions.find((value) => value.fingerprint === item.fingerprint); return !decision?.dismissedAt && (!decision?.snoozedUntil || new Date(decision.snoozedUntil) <= new Date()); }).slice(0, premium ? 3 : 1), [activities, activeActivity, babies, babyId, decisions, memories, milestones, premium, reminders, vaccinations]);
  if (!suggestions.length) return null;
  return <section className="mt-8 overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm dark:border-indigo-900 dark:from-indigo-950/50 dark:to-slate-800 sm:p-6">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white"><Brain className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{t("coach.badge")}</p><h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("coach.title")}</h2></div></div>
    <div className="mt-5 space-y-3">{suggestions.map((item) => { const evidenceValues = item.category === "vaccination" && item.evidenceValues?.name ? { ...item.evidenceValues, name: t(String(item.evidenceValues.name)) } : item.evidenceValues; return <article key={item.id} className="rounded-2xl border border-indigo-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-slate-900 dark:text-white">{t(item.titleKey)}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(item.bodyKey)}</p><p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{t("coach.why")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t(item.evidenceKey, evidenceValues)}</p></div><button onClick={() => dismiss(item.fingerprint)} aria-label={t("coach.dismiss")} className="h-8 rounded-lg p-2 text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div><div className="mt-3 flex flex-wrap items-center gap-2"><Link to={item.actionPath} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{t("coach.openFeature")}<ChevronRight className="h-4 w-4" /></Link><button onClick={() => snooze(item.fingerprint)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"><Clock3 className="h-4 w-4" />{t("coach.snooze")}</button></div></article>; })}</div>
    <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("coach.disclaimer")}</p>
  </section>;
}
