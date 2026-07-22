import type { Activity, DiaperActivity, DiaperType } from "../../../entities/activity/model/activity.types";
import type { StatisticsRange } from "./statisticsPeriod";
import { rangeIncludesNow } from "./statisticsPeriod";

export interface LiveDiaperStatus {
  latestDiaperAt: Date | null;
  secondsSinceLatest: number | null;
}

export interface DiaperPeriodStats {
  total: number;
  wet: number;
  dirty: number;
  mixed: number;
  averageIntervalSeconds: number | null;
  longestIntervalSeconds: number | null;
}

function validDiapers(activities: Activity[], babyId?: string | null) {
  return activities.filter((activity): activity is DiaperActivity => {
    if (activity.type !== "diaper" || (babyId && activity.babyId !== babyId)) return false;
    return !Number.isNaN(new Date(activity.startedAt).getTime());
  });
}

export function getLiveDiaperStatus(
  activities: Activity[],
  selectedBabyId: string | null,
  range: StatisticsRange,
  now = new Date(),
): LiveDiaperStatus {
  if (!selectedBabyId || !rangeIncludesNow(range.start, range.end, now)) return { latestDiaperAt: null, secondsSinceLatest: null };
  const latest = validDiapers(activities, selectedBabyId)
    .filter((activity) => new Date(activity.startedAt).getTime() <= now.getTime())
    .sort((first, second) => new Date(second.startedAt).getTime() - new Date(first.startedAt).getTime())[0];
  if (!latest) return { latestDiaperAt: null, secondsSinceLatest: null };
  const latestDiaperAt = new Date(latest.startedAt);
  return { latestDiaperAt, secondsSinceLatest: Math.max(0, Math.floor((now.getTime() - latestDiaperAt.getTime()) / 1000)) };
}

export function getDiaperPeriodStats(activities: Activity[], selectedBabyId: string | null, range: StatisticsRange): DiaperPeriodStats {
  const diapers = validDiapers(activities, selectedBabyId)
    .filter((activity) => {
      const time = new Date(activity.startedAt).getTime();
      return time >= range.start.getTime() && time < range.end.getTime();
    })
    .sort((first, second) => new Date(first.startedAt).getTime() - new Date(second.startedAt).getTime());
  const counts: Record<DiaperType, number> = { wet: 0, dirty: 0, mixed: 0 };
  diapers.forEach((activity) => { counts[activity.data.diaperType] += 1; });
  const intervals = diapers.slice(1).map((activity, index) => Math.max(0, Math.floor((new Date(activity.startedAt).getTime() - new Date(diapers[index].startedAt).getTime()) / 1000)));
  return {
    total: diapers.length,
    wet: counts.wet,
    dirty: counts.dirty,
    mixed: counts.mixed,
    averageIntervalSeconds: intervals.length ? Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length) : null,
    longestIntervalSeconds: intervals.length ? Math.max(...intervals) : null,
  };
}
