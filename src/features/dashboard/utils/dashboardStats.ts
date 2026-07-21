import type { Activity } from "../../../entities/activity/model/activity.types";

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
  return activities
    .filter(
      (activity) =>
        activity.type === "sleep" &&
        activity.endedAt !== undefined &&
        isToday(activity.startedAt),
    )
    .reduce((totalMilliseconds, activity) => {
      const startedAt = new Date(activity.startedAt).getTime();
      const endedAt = new Date(activity.endedAt!).getTime();

      return totalMilliseconds + Math.max(0, endedAt - startedAt);
    }, 0);
}

export function countTodayActivities(
  activities: Activity[],
  types: Activity["type"][],
) {
  return activities.filter(
    (activity) =>
      types.includes(activity.type) && isToday(activity.startedAt),
  ).length;
}

export function formatDuration(milliseconds: number) {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}ч ${String(minutes).padStart(2, "0")}м`;
}