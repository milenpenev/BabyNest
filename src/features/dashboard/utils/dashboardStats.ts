import type {
  Activity,
  SleepActivity,
} from "../../../entities/activity/model/activity.types";
import { localDayKey, splitSleepActivityByLocalDay } from "../../sleep/utils/sleepSegments";

function isToday(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function calculateTodaySleep(activities: Activity[]) {
  const todayKey = localDayKey(new Date());
  const todaySleepActivities = activities.filter(
    (activity): activity is SleepActivity =>
      activity.type === "sleep" &&
      activity.endedAt !== undefined,
  );

  return todaySleepActivities.reduce((total, activity) => total + splitSleepActivityByLocalDay(activity)
    .filter((segment) => segment.dayKey === todayKey)
    .reduce((sum, segment) => sum + segment.activeDurationSeconds * 1000, 0), 0);
}

export function countTodayActivities(
  activities: Activity[],
  types: Activity["type"][],
) {
  return activities.filter(
    (activity) =>
      types.includes(activity.type) &&
      isToday(activity.startedAt),
  ).length;
}

export function getLatestDiaperActivity(
  activities: Activity[],
) {
  return [...activities]
    .filter(
      (activity) => activity.type === "diaper",
    )
    .sort(
      (first, second) =>
        new Date(second.startedAt).getTime() -
        new Date(first.startedAt).getTime(),
    )[0];
}

export function formatDuration(
  milliseconds: number,
  language: string,
) {
  const safeMilliseconds = Math.max(
    0,
    milliseconds,
  );

  const totalMinutes = Math.floor(
    safeMilliseconds / 60_000,
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "bg") {
    return `${hours}ч ${String(minutes).padStart(
      2,
      "0",
    )}м`;
  }

  return `${hours}h ${String(minutes).padStart(
    2,
    "0",
  )}m`;
}
