import type {
  Activity,
  GrowthActivity,
  SleepActivity,
} from "../../entities/activity/model/activity.types";
import { aggregateSleepByReportingNight, intervalsOverlap, localDayKey, longestContinuousNightSleepSeconds, splitSleepActivityByLocalDay } from "../sleep/utils/sleepSegments";
import { getStatisticsRange } from "../statistics/utils/statisticsPeriod";
import { getDiaperPeriodStats } from "../statistics/utils/diaperInsights";

export type StatisticsPeriod = "today" | "7d" | "30d";

export interface DailyStatistics {
  date: Date;
  dateKey: string;
  sleepMilliseconds: number;
  daySleepMilliseconds: number;
  nightSleepMilliseconds: number;
  feedingCount: number;
  bottleAmountMl: number;
  diaperCount: number;
  bottleCount: number;
  breastfeedingCount: number;
  wetDiapers: number;
  dirtyDiapers: number;
  mixedDiapers: number;
  breastfeedingMilliseconds: number;
  bottleMilliseconds: number;
  leftBreastMilliseconds: number;
  rightBreastMilliseconds: number;
}

export interface StatisticsSnapshot {
  period: StatisticsPeriod;
  dailySeries: DailyStatistics[];
  totalSleepMilliseconds: number;
  averageNapDurationMilliseconds: number;
  longestNapMilliseconds: number;
  napCount: number;
  nightSleepMilliseconds: number;
  daySleepMilliseconds: number;
  daySleepPercentage: number;
  nightSleepPercentage: number;
  averageDayNapMilliseconds: number;
  dayNapCount: number;
  longestDayNapMilliseconds: number;
  averageNightlySleepMilliseconds: number;
  longestNightSleepMilliseconds: number;
  nightsRecorded: number;
  totalFeedings: number;
  breastfeedingCount: number;
  bottleCount: number;
  averageFeedingDurationMilliseconds: number;
  averageBottleAmountMl: number;
  leftBreastMilliseconds: number;
  rightBreastMilliseconds: number;
  totalDiapers: number;
  wetDiapers: number;
  dirtyDiapers: number;
  mixedDiapers: number;
  averageDiaperIntervalHours: number;
  averageDiaperIntervalSeconds: number | null;
  longestDiaperIntervalSeconds: number | null;
  latestWeightKg: number | null;
  latestHeightCm: number | null;
  latestHeadCircumferenceCm: number | null;
  averageWakeWindowMinutes: number;
  sleepTrendPercent: number;
  bottleTrendPercent: number;
}

function createLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getActivityDateKey(activity: Activity) {
  return createLocalDateKey(new Date(activity.startedAt));
}

function getDayRange(period: StatisticsPeriod, now: Date) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
  const range: Date[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    range.push(day);
  }

  return range;
}

export function buildStatisticsSnapshot(
  activities: Activity[],
  period: StatisticsPeriod,
  now = new Date(),
): StatisticsSnapshot {
  const range = getDayRange(period, now);
  const days = range.map((date) => ({
    date,
    dateKey: createLocalDateKey(date),
    sleepMilliseconds: 0,
    daySleepMilliseconds: 0,
    nightSleepMilliseconds: 0,
    feedingCount: 0,
    bottleAmountMl: 0,
    diaperCount: 0,
    bottleCount: 0,
    breastfeedingCount: 0,
    wetDiapers: 0,
    dirtyDiapers: 0,
    mixedDiapers: 0,
    breastfeedingMilliseconds: 0,
    bottleMilliseconds: 0,
    leftBreastMilliseconds: 0,
    rightBreastMilliseconds: 0,
  }));

  const dayMap = new Map(days.map((day) => [day.dateKey, day]));
  const { start: rangeStart, end: rangeEnd } = getStatisticsRange(period, now);
  const filteredActivities = activities.filter((activity) => {
    const activityStart = new Date(activity.startedAt);
    const activityEnd = activity.type === "sleep" ? new Date(activity.endedAt ?? now) : new Date(activityStart.getTime() + 1);
    return !Number.isNaN(activityStart.getTime()) && !Number.isNaN(activityEnd.getTime()) && intervalsOverlap(activityStart, activityEnd, rangeStart, rangeEnd);
  });

  filteredActivities.forEach((activity) => {
    if (activity.type === "sleep") {
      for (const segment of splitSleepActivityByLocalDay(activity, now)) {
        const segmentDay = dayMap.get(segment.dayKey);
        if (!segmentDay) continue;
        segmentDay.sleepMilliseconds += segment.activeDurationSeconds * 1000;
        segmentDay.daySleepMilliseconds += segment.daySleepSeconds * 1000;
        segmentDay.nightSleepMilliseconds += segment.nightSleepSeconds * 1000;
      }
      return;
    }
    const day = dayMap.get(getActivityDateKey(activity));
    if (!day) {
      return;
    }

    if (activity.type === "breastfeeding") {
      day.feedingCount += 1;
      day.breastfeedingCount += 1;
      day.breastfeedingMilliseconds +=
        (activity.data.leftDurationSeconds + activity.data.rightDurationSeconds) * 1000;
      day.leftBreastMilliseconds += activity.data.leftDurationSeconds * 1000;
      day.rightBreastMilliseconds += activity.data.rightDurationSeconds * 1000;
    }

    if (activity.type === "bottle") {
      day.feedingCount += 1;
      day.bottleCount += 1;
      day.bottleAmountMl += activity.data.amountMl;
      day.bottleMilliseconds += 0;
    }

    if (activity.type === "diaper") {
      day.diaperCount += 1;
      day[activity.data.diaperType === "wet" ? "wetDiapers" : activity.data.diaperType === "dirty" ? "dirtyDiapers" : "mixedDiapers"] += 1;
    }
  });

  const totalSleepMilliseconds = days.reduce((total, day) => total + day.sleepMilliseconds, 0);
  const sleepActivities = filteredActivities
    .filter((activity): activity is SleepActivity => activity.type === "sleep")
  const rangeDayKeys = new Set(days.map((day) => day.dateKey));
  const segmentsInRange = (activity: SleepActivity) => splitSleepActivityByLocalDay(activity).filter((segment) => rangeDayKeys.has(segment.dayKey));
  const napDurations = sleepActivities.map((activity) => segmentsInRange(activity).reduce((sum, segment) => sum + segment.activeDurationSeconds * 1000, 0)).filter((duration) => duration > 0);
  const napCount = napDurations.length;
  const averageNapDurationMilliseconds = napDurations.length > 0 ? Math.round(napDurations.reduce((sum, duration) => sum + duration, 0) / napDurations.length) : 0;
  const longestNapMilliseconds = napDurations.length > 0 ? Math.max(...napDurations) : 0;
  const nightSleepMilliseconds = days.reduce((sum, day) => sum + day.nightSleepMilliseconds, 0);
  const daySleepMilliseconds = days.reduce((sum, day) => sum + day.daySleepMilliseconds, 0);
  const dayNaps = sleepActivities.map((activity) => segmentsInRange(activity).reduce((sum, segment) => sum + segment.daySleepSeconds * 1000, 0)).filter((duration) => duration > 0);
  const firstReportingDate = new Date(rangeStart); firstReportingDate.setDate(firstReportingDate.getDate() - 1);
  const reportingKeys = new Set([localDayKey(firstReportingDate), ...days.map((day) => day.dateKey)]);
  const reportingNights = [...aggregateSleepByReportingNight(sleepActivities).entries()].filter(([key]) => reportingKeys.has(key)).map(([, seconds]) => seconds * 1000);
  const nightIntervals = sleepActivities.map((activity) => longestContinuousNightSleepSeconds(activity) * 1000);

  const totalFeedings = days.reduce((total, day) => total + day.feedingCount, 0);
  const breastfeedingCount = days.reduce((total, day) => total + day.breastfeedingCount, 0);
  const bottleCount = days.reduce((total, day) => total + day.bottleCount, 0);
  const averageFeedingDurationMilliseconds = totalFeedings > 0 ? Math.round(days.reduce((sum, day) => sum + day.breastfeedingMilliseconds + day.bottleMilliseconds, 0) / totalFeedings) : 0;
  const averageBottleAmountMl = bottleCount > 0 ? Math.round(days.reduce((sum, day) => sum + day.bottleAmountMl, 0) / bottleCount) : 0;
  const leftBreastMilliseconds = days.reduce((sum, day) => sum + day.leftBreastMilliseconds, 0);
  const rightBreastMilliseconds = days.reduce((sum, day) => sum + day.rightBreastMilliseconds, 0);

  const totalDiapers = days.reduce((total, day) => total + day.diaperCount, 0);
  const wetDiapers = days.reduce((total, day) => total + day.wetDiapers, 0);
  const dirtyDiapers = days.reduce((total, day) => total + day.dirtyDiapers, 0);
  const mixedDiapers = days.reduce((total, day) => total + day.mixedDiapers, 0);

  const diaperPeriodStats = getDiaperPeriodStats(filteredActivities, null, { start: rangeStart, end: rangeEnd });
  const averageDiaperIntervalHours = diaperPeriodStats.averageIntervalSeconds === null ? -1 : diaperPeriodStats.averageIntervalSeconds / 3600;

  const growthActivities = filteredActivities.filter((activity): activity is GrowthActivity => activity.type === "growth");
  const latestGrowth = growthActivities.length > 0 ? growthActivities[growthActivities.length - 1] : null;

  const sleepTrendPercent = 0;
  const bottleTrendPercent = 0;
  const averageWakeWindowMinutes = totalSleepMilliseconds > 0 ? Math.round((totalSleepMilliseconds / 1000 / 60) / Math.max(1, totalFeedings)) : 0;

  return {
    period,
    dailySeries: days,
    totalSleepMilliseconds,
    averageNapDurationMilliseconds,
    longestNapMilliseconds,
    napCount,
    nightSleepMilliseconds,
    daySleepMilliseconds,
    daySleepPercentage: totalSleepMilliseconds > 0 ? Math.round(daySleepMilliseconds / totalSleepMilliseconds * 100) : 0,
    nightSleepPercentage: totalSleepMilliseconds > 0 ? Math.round(nightSleepMilliseconds / totalSleepMilliseconds * 100) : 0,
    averageDayNapMilliseconds: dayNaps.length ? Math.round(dayNaps.reduce((a, b) => a + b, 0) / dayNaps.length) : 0,
    dayNapCount: dayNaps.length,
    longestDayNapMilliseconds: dayNaps.length ? Math.max(...dayNaps) : 0,
    averageNightlySleepMilliseconds: reportingNights.length ? Math.round(reportingNights.reduce((a, b) => a + b, 0) / reportingNights.length) : 0,
    longestNightSleepMilliseconds: nightIntervals.length ? Math.max(...nightIntervals) : 0,
    nightsRecorded: reportingNights.length,
    totalFeedings,
    breastfeedingCount,
    bottleCount,
    averageFeedingDurationMilliseconds,
    averageBottleAmountMl,
    leftBreastMilliseconds,
    rightBreastMilliseconds,
    totalDiapers,
    wetDiapers,
    dirtyDiapers,
    mixedDiapers,
    averageDiaperIntervalHours,
    averageDiaperIntervalSeconds: diaperPeriodStats.averageIntervalSeconds,
    longestDiaperIntervalSeconds: diaperPeriodStats.longestIntervalSeconds,
    latestWeightKg: latestGrowth?.data.weightKg ?? null,
    latestHeightCm: latestGrowth?.data.heightCm ?? null,
    latestHeadCircumferenceCm: latestGrowth?.data.headCircumferenceCm ?? null,
    averageWakeWindowMinutes,
    sleepTrendPercent,
    bottleTrendPercent,
  };
}

export function formatDurationLabel(milliseconds: number, language: string) {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "bg") {
    return `${hours}ч ${String(minutes).padStart(2, "0")}м`;
  }

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
