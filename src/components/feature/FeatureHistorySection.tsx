import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Activity, ActivityType } from "../../entities/activity/model/activity.types";
import type { StatisticsRange } from "../../features/statistics/utils/statisticsPeriod";
import { splitSleepActivityByLocalDay } from "../../features/sleep/utils/sleepSegments";
import { useActivityStore } from "../../store/activityStore";
import ActivityDeleteDialog from "../activity/ActivityDeleteDialog";
import ActivityDetailsDrawer from "../activity/ActivityDetailsDrawer";
import ActivityTimeline, { type TimelineEntry } from "../activity/ActivityTimeline";
import type { SleepDaySegment } from "../../features/sleep/utils/sleepSegments";

export default function FeatureHistorySection({ activities, types, range, title }: { activities: Activity[]; types: ActivityType[]; range: StatisticsRange; title: string }) {
  const { t } = useTranslation();
  const removeActivity = useActivityStore((state) => state.removeActivity);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [segment, setSegment] = useState<SleepDaySegment | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const entries = activities.flatMap<TimelineEntry>((activity) => {
    if (!types.includes(activity.type)) return [];
    const started = new Date(activity.startedAt);
    if (Number.isNaN(started.getTime())) return [];
    if (activity.type === "sleep") return splitSleepActivityByLocalDay(activity).filter((item) => new Date(item.segmentEndedAt).getTime() > range.start.getTime() && new Date(item.segmentStartedAt).getTime() < range.end.getTime()).map((sleepSegment) => ({ key: sleepSegment.segmentId, activity, sleepSegment }));
    return started >= range.start && started < range.end ? [{ key: activity.id, activity }] : [];
  }).sort((a, b) => new Date(b.sleepSegment?.segmentStartedAt ?? b.activity.startedAt).getTime() - new Date(a.sleepSegment?.segmentStartedAt ?? a.activity.startedAt).getTime());
  return <><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("featurePages.historyDescription")}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{entries.length}</span></div>{entries.length ? <div className="mt-5"><ActivityTimeline entries={entries} onSelect={(activity, sleepSegment) => { setSelected(activity); setSegment(sleepSegment ?? null); }} onDelete={setDeleting} /></div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">{t("featurePages.noHistory")}</div>}</section><ActivityDetailsDrawer activity={selected} sleepSegment={segment} onClose={() => { setSelected(null); setSegment(null); }} /><ActivityDeleteDialog isOpen={Boolean(deleting)} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) removeActivity(deleting.id); if (selected?.id === deleting?.id) setSelected(null); setDeleting(null); }} /></>;
}
