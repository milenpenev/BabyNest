import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BookHeart, Footprints, Heart } from "lucide-react";

import type { Activity, SleepActivity } from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import ActivityDeleteDialog from "./ActivityDeleteDialog";
import ActivityDetailsDrawer from "./ActivityDetailsDrawer";
import ActivityTimeline, { type TimelineEntry } from "./ActivityTimeline";
import { localDayKey, splitSleepActivityByLocalDay } from "../../features/sleep/utils/sleepSegments";
import type { SleepDaySegment } from "../../features/sleep/utils/sleepSegments";
import { useBabyStore } from "../../store/babyStore";
import { useMilestoneStore } from "../../store/milestoneStore";
import { milestoneCatalog } from "../../features/milestones/data/catalog";
import { useFamilyStore } from "../../store/familyStore";
import { useCurrentUserStore } from "../../store/currentUserStore";
import { useMemoryStore } from "../../store/memoryStore";
import { memoryTitle } from "../../features/memories/utils/memoryDisplay";

export default function ActivityHistory() {
  const { t } = useTranslation();

  const activities = useActivityStore(
    (state) => state.activities,
  );

  const removeActivity = useActivityStore(
    (state) => state.removeActivity,
  );
  const activeActivity = useActivityStore((state) => state.activeActivity);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const milestoneRecords = useMilestoneStore((state) => state.records);
  const familyMembers = useFamilyStore((state) => state.members);
  const currentUserId = useCurrentUserStore((state) => state.currentUser.id);
  const currentMember = familyMembers.find((member) => member.userId === currentUserId);
  const memoryRecords = useMemoryStore((state) => state.memories);

  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null);
  const [selectedSleepSegment, setSelectedSleepSegment] = useState<SleepDaySegment | null>(null);

  const [activityToDelete, setActivityToDelete] =
    useState<Activity | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState(() => localDayKey(new Date()));
  const [visualNow, setVisualNow] = useState(() => new Date());
  const [memberFilter, setMemberFilter] = useState("all");

  useEffect(() => {
    if (activeActivity?.type !== "sleep") return;
    const interval = window.setInterval(() => setVisualNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [activeActivity?.id, activeActivity?.type]);

  useEffect(() => {
    const previousSecond = new Date(visualNow.getTime() - 1000);
    const currentKey = localDayKey(visualNow);
    if (localDayKey(previousSecond) !== currentKey && selectedDayKey === localDayKey(previousSecond)) setSelectedDayKey(currentKey);
  }, [selectedDayKey, visualNow]);

  const filteredActivities = activities.filter((activity) => memberFilter === "all" || (memberFilter === "me" ? activity.createdBy === currentMember?.id : activity.createdBy === memberFilter));
  const timelineEntries = filteredActivities.flatMap<TimelineEntry>((activity) => {
    if (activity.type !== "sleep") {
      return localDayKey(new Date(activity.startedAt)) === selectedDayKey ? [{ key: activity.id, activity }] : [];
    }
    return splitSleepActivityByLocalDay(activity)
      .filter((segment) => segment.dayKey === selectedDayKey)
      .map((sleepSegment) => ({ key: sleepSegment.segmentId, activity, sleepSegment }));
  });

  if (activeActivity?.type === "sleep") {
    const now = visualNow;
    const currentPauseMilliseconds = activeActivity.pausedAt
      ? Math.max(0, now.getTime() - new Date(activeActivity.pausedAt).getTime())
      : 0;
    const visualActivity: SleepActivity = {
      id: activeActivity.id,
      babyId: activeActivity.babyId,
      type: "sleep",
      startedAt: activeActivity.startedAt,
      createdAt: activeActivity.startedAt,
      updatedAt: now.toISOString(),
      data: { pausedDurationSeconds: Math.floor((activeActivity.totalPausedMilliseconds + currentPauseMilliseconds) / 1000) },
    };
    timelineEntries.push(...splitSleepActivityByLocalDay(visualActivity, now)
      .filter((segment) => segment.dayKey === selectedDayKey)
      .map((sleepSegment) => ({ key: `active:${sleepSegment.segmentId}`, activity: visualActivity, sleepSegment, isActive: true })));
  }

  const todayActivities = timelineEntries
    .sort(
      (first, second) =>
        new Date(second.sleepSegment?.segmentStartedAt ?? second.activity.startedAt).getTime() -
        new Date(first.sleepSegment?.segmentStartedAt ?? first.activity.startedAt).getTime(),
    );
  const dayMilestones = milestoneRecords
    .filter((record) => record.babyId === selectedBabyId && record.status !== "not-observed" && record.status !== "not-applicable")
    .filter((record) => localDayKey(new Date(record.observedAt ?? record.firstNoticedAt ?? record.updatedAt)) === selectedDayKey)
    .sort((a, b) => new Date(b.observedAt ?? b.firstNoticedAt ?? b.updatedAt).getTime() - new Date(a.observedAt ?? a.firstNoticedAt ?? a.updatedAt).getTime());
  const dayMemories = memoryRecords.filter((memory) => memory.babyId === selectedBabyId && localDayKey(new Date(memory.date)) === selectedDayKey && (memory.visibility === "family" || memory.createdBy === currentMember?.id)).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());

  function confirmDelete() {
    if (!activityToDelete) {
      return;
    }

    removeActivity(activityToDelete.id);

    if (selectedActivity?.id === activityToDelete.id) {
      setSelectedActivity(null);
    }

    setActivityToDelete(null);
  }

  return (
    <>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              {t("activity.timeline")}
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {selectedDayKey === localDayKey(new Date()) ? t("activity.todayHistory") : t("sleepSegments.historyForDay", { date: selectedDayKey })}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("activity.timelineDescription")}
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {todayActivities.length + dayMilestones.length + dayMemories.length}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-3"><label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><span>{t("family.timeline.filter")}</span><select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900"><option value="all">{t("family.timeline.all")}</option><option value="me">{t("family.timeline.me")}</option>{familyMembers.filter((member) => member.id !== currentMember?.id).map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}</select></label><label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><span>{t("sleepSegments.calendarDay")}</span><input type="date" value={selectedDayKey} max={localDayKey(new Date())} onChange={(event) => setSelectedDayKey(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900" /></label></div>

        {dayMilestones.length > 0 && <div className="mt-6 space-y-3">{dayMilestones.map((record) => { const definition = record.milestoneId ? milestoneCatalog.find((item) => item.id === record.milestoneId) : undefined; return <Link key={record.id} to="/milestones" className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/30 dark:hover:bg-violet-950/50"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-700 dark:bg-slate-800 dark:text-violet-300"><Footprints className="h-5 w-5" /></span><span className="min-w-0"><strong className="block truncate text-slate-900 dark:text-white">{record.customTitle ?? (definition ? t(definition.titleKey) : t("milestones.customMilestone"))}</strong><small className="text-slate-500 dark:text-slate-400">{t(`milestones.statuses.${record.status}`)}</small></span></Link>; })}</div>}

        {dayMemories.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{dayMemories.map((memory) => <Link key={memory.id} to="/memories" className="group overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-violet-50 hover:border-rose-300 dark:border-rose-900 dark:from-rose-950/40 dark:to-violet-950/40">{memory.photos[0]?<img src={memory.photos[0].localUrl} alt="" className="h-28 w-full object-cover"/>:null}<span className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 dark:bg-slate-800"><BookHeart className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block truncate text-slate-900 dark:text-white">{memoryTitle(memory,t)}</strong><small className="text-slate-500 dark:text-slate-400">{t("memories.title")}</small></span>{memory.favorite?<Heart className="h-4 w-4 fill-current text-rose-500"/>:null}</span></Link>)}</div>}

        {todayActivities.length === 0 && dayMilestones.length === 0 && dayMemories.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <p className="font-medium text-slate-700">
              {t("activity.empty")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("activity.emptyDescription")}
            </p>
          </div>
        ) : (
          <ActivityTimeline
            entries={todayActivities}
            onSelect={(activity, segment) => { setSelectedActivity(activity); setSelectedSleepSegment(segment ?? null); }}
            onDelete={setActivityToDelete}
          />
        )}
      </section>

      <ActivityDetailsDrawer
        activity={selectedActivity}
        sleepSegment={selectedSleepSegment}
        onClose={() => { setSelectedActivity(null); setSelectedSleepSegment(null); }}
      />

      <ActivityDeleteDialog
        isOpen={activityToDelete !== null}
        onCancel={() => setActivityToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
