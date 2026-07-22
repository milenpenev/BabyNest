export type ReminderType = "feeding" | "diaper" | "sleep" | "medicine" | "bath" | "vaccination" | "custom";
export type ReminderSchedule = { kind: "interval"; intervalMinutes: number } | { kind: "daily-time"; time: string } | { kind: "one-time"; scheduledAt: string };
export type ReminderReferenceSource = "feeding-activity" | "diaper-activity" | "reminder-created" | "manual";
export type ReminderIntervalSource = "custom" | "baby-routine";
export interface Reminder { id: string; babyId: string; type: ReminderType; title: string; note?: string; enabled: boolean; activityAware?: boolean; intervalSource?: ReminderIntervalSource; schedule: ReminderSchedule; lastTriggeredAt?: string; nextTriggerAt?: string; referenceActivityId?: string; referenceAt?: string; referenceSource?: ReminderReferenceSource; createdAt: string; updatedAt: string }
export interface ReminderEvent { id: string; reminderId: string; babyId: string; triggeredAt: string; status: "shown" | "dismissed" | "missed" }
