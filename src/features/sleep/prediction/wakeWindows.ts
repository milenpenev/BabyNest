import type { Activity, SleepActivity } from "../../../entities/activity/model/activity.types";
import type { WakeWindowRecord } from "./sleepPrediction.types";

function getTimeOfDayPeriod(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour <= 11) {
    return "morning";
  }

  if (hour >= 12 && hour <= 17) {
    return "afternoon";
  }

  if (hour >= 18 && hour <= 23) {
    return "evening";
  }

  return "night";
}

function getSleepDurationSeconds(activity: SleepActivity) {
  if (!activity.endedAt) {
    return 0;
  }

  const startedAt = new Date(activity.startedAt).getTime();
  const endedAt = new Date(activity.endedAt).getTime();

  if (Number.isNaN(startedAt) || Number.isNaN(endedAt)) {
    return 0;
  }

  const pausedDurationMilliseconds = (activity.data.pausedDurationSeconds ?? 0) * 1000;
  const fullDurationMilliseconds = Math.max(0, endedAt - startedAt);

  return Math.max(0, Math.floor((fullDurationMilliseconds - pausedDurationMilliseconds) / 1000));
}

export function deriveWakeWindows(
  activities: Activity[],
  babyId: string | null,
): WakeWindowRecord[] {
  const completedSleeps = activities
    .filter(
      (activity): activity is SleepActivity =>
        activity.type === "sleep" &&
        Boolean(activity.endedAt) &&
        (!babyId || activity.babyId === babyId),
    )
    .map((activity) => ({
      activity,
      startedAt: new Date(activity.startedAt),
      endedAt: new Date(activity.endedAt as string),
    }))
    .filter(({ startedAt, endedAt }) => {
      if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
        return false;
      }

      return startedAt.getTime() <= endedAt.getTime();
    })
    .sort((first, second) => first.startedAt.getTime() - second.startedAt.getTime());

  const wakeWindows: WakeWindowRecord[] = [];

  for (let index = 0; index < completedSleeps.length - 1; index += 1) {
    const current = completedSleeps[index];
    const next = completedSleeps[index + 1];

    const previousSleepStartedAt = current.startedAt.getTime();
    const previousSleepEndedAt = current.endedAt.getTime();
    const nextSleepStartedAt = next.startedAt.getTime();

    if (previousSleepStartedAt > previousSleepEndedAt || nextSleepStartedAt < previousSleepEndedAt) {
      continue;
    }

    const wakeWindowSeconds = Math.floor((nextSleepStartedAt - previousSleepEndedAt) / 1000);

    if (wakeWindowSeconds < 10 * 60 || wakeWindowSeconds > 6 * 60 * 60) {
      continue;
    }

    wakeWindows.push({
      startedAt: current.endedAt.toISOString(),
      endedAt: next.startedAt.toISOString(),
      durationSeconds: wakeWindowSeconds,
      previousSleepId: current.activity.id,
      nextSleepId: next.activity.id,
    });
  }

  return wakeWindows.slice(-10);
}

export function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  }

  return sorted[middleIndex];
}

export function weightedAverage(values: number[], weights: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  if (totalWeight <= 0) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const weightedSum = values.reduce((sum, value, index) => sum + value * (weights[index] ?? 1), 0);

  return weightedSum / totalWeight;
}

export function filterOutliers(values: number[]) {
  if (values.length < 3) {
    return values;
  }

  const center = median(values);

  if (center <= 0) {
    return values;
  }

  const filtered = values.filter((value) => value >= center * 0.5 && value <= center * 1.8);

  return filtered.length >= 2 ? filtered : values;
}

export function getSleepPeriod(date: Date) {
  return getTimeOfDayPeriod(date);
}

export function getLatestSleepRecord(activities: Activity[], babyId: string | null) {
  const completed = activities
    .filter(
      (activity): activity is SleepActivity =>
        activity.type === "sleep" &&
        Boolean(activity.endedAt) &&
        (!babyId || activity.babyId === babyId),
    )
    .sort((first, second) => new Date(second.endedAt as string).getTime() - new Date(first.endedAt as string).getTime());

  return completed[0] ?? null;
}

export function getActiveSleepDurationSeconds(
  activity: { startedAt: string; pausedAt: string | null; totalPausedMilliseconds: number } | null,
  now: Date,
) {
  if (!activity) {
    return 0;
  }

  const startMilliseconds = new Date(activity.startedAt).getTime();
  const effectiveEndMilliseconds = activity.pausedAt ? new Date(activity.pausedAt).getTime() : now.getTime();

  if (Number.isNaN(startMilliseconds) || Number.isNaN(effectiveEndMilliseconds)) {
    return 0;
  }

  return Math.max(0, Math.floor((effectiveEndMilliseconds - startMilliseconds - activity.totalPausedMilliseconds) / 1000));
}

export function calculateSleepDurationSeconds(activity: SleepActivity) {
  return getSleepDurationSeconds(activity);
}

export function hasSleepHistory(activities: Activity[], babyId: string | null) {
  return activities.some(
    (activity) =>
      activity.type === "sleep" &&
      Boolean(activity.endedAt) &&
      (!babyId || activity.babyId === babyId),
  );
}
