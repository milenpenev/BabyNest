import type { Activity } from "../../../entities/activity/model/activity.types";
import type { Reminder, ReminderReferenceSource, ReminderSchedule, ReminderType } from "../../../entities/reminder/reminder.types";

export function isValidSchedule(schedule: ReminderSchedule) {
  if (schedule.kind === "interval") return Number.isFinite(schedule.intervalMinutes) && schedule.intervalMinutes > 0;
  if (schedule.kind === "daily-time") return /^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time);
  return !Number.isNaN(new Date(schedule.scheduledAt).getTime());
}

export interface ReminderReference { activityId: string | null; referenceAt: string; source: ReminderReferenceSource }

// A completed breastfeeding session is anchored at endedAt; bottles and diaper
// changes are point-in-time records anchored at startedAt. Active, invalid and
// future records are deliberately excluded from live reminder scheduling.
export function getLatestRelevantActivity(activities: Activity[], babyId: string, type: ReminderType, now = new Date()): ReminderReference | null {
  if (type !== "feeding" && type !== "diaper") return null;
  return activities.flatMap((activity): ReminderReference[] => {
    if (activity.babyId !== babyId) return [];
    let timestamp: string | undefined;
    if (type === "feeding" && activity.type === "breastfeeding") timestamp = activity.endedAt;
    if (type === "feeding" && activity.type === "bottle") timestamp = activity.startedAt;
    if (type === "diaper" && activity.type === "diaper") timestamp = activity.startedAt;
    if (!timestamp) return [];
    const time = new Date(timestamp).getTime();
    if (!Number.isFinite(time) || time > now.getTime()) return [];
    return [{ activityId: activity.id, referenceAt: new Date(time).toISOString(), source: type === "feeding" ? "feeding-activity" : "diaper-activity" }];
  }).sort((first, second) => new Date(second.referenceAt).getTime() - new Date(first.referenceAt).getTime())[0] ?? null;
}

export function getReminderReferenceTimestamp(reminder: Reminder, activities: Activity[], now = new Date()): ReminderReference {
  if (reminder.activityAware) {
    const activity = getLatestRelevantActivity(activities, reminder.babyId, reminder.type, now);
    if (activity) return activity;
  }
  return { activityId: null, referenceAt: reminder.createdAt, source: reminder.activityAware ? "reminder-created" : "manual" };
}

export interface ActivityAwareReminderResult { nextTriggerAt: string; referenceActivityId?: string; referenceAt: string; referenceSource: ReminderReferenceSource }
export function calculateActivityAwareReminderState(reminder: Reminder, activities: Activity[], now = new Date(), routineIntervalMinutes?: number): ActivityAwareReminderResult | null {
  if (!reminder.enabled || !reminder.activityAware || reminder.schedule.kind !== "interval" || (reminder.type !== "feeding" && reminder.type !== "diaper")) return null;
  const reference = getReminderReferenceTimestamp(reminder, activities, now);
  const referenceActivityId = reference.activityId ?? undefined;
  const referenceChanged = reminder.referenceActivityId !== referenceActivityId || reminder.referenceAt !== reference.referenceAt || reminder.referenceSource !== reference.source;
  const referenceTime = new Date(reference.referenceAt).getTime();
  if (!Number.isFinite(referenceTime)) return null;
  // A trigger belongs to the previous reference when a new/edited activity is
  // detected. Only reuse lastTriggeredAt while reconciling the same reference.
  const triggeredTime = !referenceChanged && reminder.lastTriggeredAt ? new Date(reminder.lastTriggeredAt).getTime() : Number.NaN;
  const anchor = Number.isFinite(triggeredTime) && triggeredTime >= referenceTime ? triggeredTime : referenceTime;
  const intervalMinutes = reminder.intervalSource === "baby-routine" && routineIntervalMinutes ? routineIntervalMinutes : reminder.schedule.intervalMinutes;
  return { nextTriggerAt: new Date(anchor + intervalMinutes * 60_000).toISOString(), referenceActivityId, referenceAt: reference.referenceAt, referenceSource: reference.source };
}

export function calculateNextTrigger(reminder: Reminder, now = new Date(), activities: Activity[] = [], afterTrigger = false): string | undefined {
  if (!isValidSchedule(reminder.schedule)) return undefined;
  if (reminder.schedule.kind === "one-time") return reminder.lastTriggeredAt ? undefined : new Date(reminder.schedule.scheduledAt).toISOString();
  if (reminder.schedule.kind === "daily-time") {
    const [hours, minutes] = reminder.schedule.time.split(":").map(Number);
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (afterTrigger || next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }
  const reference = getReminderReferenceTimestamp(reminder, activities, now);
  const anchorCandidates = [reference.referenceAt, reminder.lastTriggeredAt].filter(Boolean).map((value) => new Date(value!).getTime()).filter(Number.isFinite);
  const anchor = new Date(Math.max(...anchorCandidates));
  if (Number.isNaN(anchor.getTime())) return undefined;
  const intervalMs = reminder.schedule.intervalMinutes * 60_000;
  let next = anchor.getTime() + intervalMs;
  if (afterTrigger) while (next <= now.getTime()) next += intervalMs;
  return new Date(next).toISOString();
}

export function isReminderOverdue(reminder: Reminder, now = new Date()) { const next = reminder.nextTriggerAt ? new Date(reminder.nextTriggerAt) : null; return Boolean(reminder.enabled && next && !Number.isNaN(next.getTime()) && next.getTime() <= now.getTime()); }
