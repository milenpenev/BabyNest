import type { ReminderType } from "../reminder/reminder.types";

export interface AppNotification { id: string; triggerKey: string; babyId?: string; reminderId?: string; type: ReminderType | "system"; titleKey?: string; bodyKey?: string; title?: string; body?: string; translationParams?: Record<string, string | number>; createdAt: string; readAt?: string; status: "unread" | "read" | "dismissed"; deepLink?: string }
