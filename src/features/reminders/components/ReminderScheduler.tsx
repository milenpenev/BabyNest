import { useEffect } from "react";
import i18n from "../../../i18n";
import type { ReminderType } from "../../../entities/reminder/reminder.types";
import { useActivityStore } from "../../../store/activityStore";
import { useAppSettingsStore } from "../../../store/appSettingsStore";
import { useReminderStore } from "../../../store/reminderStore";
import { isReminderOverdue } from "../utils/reminderSchedule";
import { buildSleepPrediction } from "../../sleep/prediction/sleepPrediction";
import { useBabyStore } from "../../../store/babyStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import { useNotificationStore } from "../../../store/notificationStore";
import { getCurrentFamilyMember } from "../../../store/familyStore";

const deepLinks = {
  feeding: "/feeding",
  diaper: "/health",
  sleep: "/sleep",
  medicine: "/health",
  bath: "/health",
  vaccination: "/vaccinations",
  custom: "/reminders",
} as const;

function categoryEnabled(
  type: ReminderType,
  notifications: ReturnType<
    typeof useAppSettingsStore.getState
  >["notifications"],
) {
  if (type === "bath" || type === "custom" || type === "vaccination")
    return true;
  return notifications[type];
}
function memberCategoryEnabled(type: ReminderType) {
  const preferences = getCurrentFamilyMember()?.notificationPreferences;
  if (!preferences) return true;
  if (type === "feeding") return preferences.feeding;
  if (type === "medicine") return preferences.medication;
  if (type === "vaccination") return preferences.vaccination;
  if (type === "sleep") return preferences.sleep;
  return true;
}

export default function ReminderScheduler() {
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const activities = useActivityStore.getState().activities;
      const preferences = useAppSettingsStore.getState().notifications;
      if (useSubscriptionStore.getState().effectivePlan === "premium")
        useReminderStore
          .getState()
          .reminders.filter(
            (reminder) =>
              reminder.enabled &&
              reminder.activityAware &&
              reminder.type === "sleep",
          )
          .forEach((reminder) => {
            const baby = useBabyStore
              .getState()
              .babies.find((item) => item.id === reminder.babyId);
            if (!baby) return;
            const predictedAt = buildSleepPrediction(
              activities,
              baby,
              null,
              now,
            ).nextSleepAt;
            if (
              !predictedAt ||
              (reminder.lastTriggeredAt &&
                predictedAt.getTime() <=
                  new Date(reminder.lastTriggeredAt).getTime())
            )
              return;
            useReminderStore
              .getState()
              .setNextTrigger(reminder.id, predictedAt.toISOString());
          });
      const state = useReminderStore.getState();
      state.reminders
        .filter((reminder) => isReminderOverdue(reminder, now))
        .forEach((reminder) => {
          if (!memberCategoryEnabled(reminder.type)) return;
          const scheduledTriggerAt = reminder.nextTriggerAt!;
          const triggerKey = `${reminder.id}:${scheduledTriggerAt}`;
          useNotificationStore
            .getState()
            .addNotification({
              id: crypto.randomUUID(),
              triggerKey,
              babyId: reminder.babyId,
              reminderId: reminder.id,
              type: reminder.type,
              titleKey: `reminders.notificationTitle.${reminder.type}`,
              bodyKey: "reminders.notificationBody",
              translationParams: { title: reminder.title },
              createdAt: now.toISOString(),
              status: "unread",
              deepLink: deepLinks[reminder.type],
            });
          const canShow =
            typeof Notification !== "undefined" &&
            Notification.permission === "granted" &&
            categoryEnabled(reminder.type, preferences);
          let shown = false;
          if (canShow) {
            try {
              const notification = new Notification(
                i18n.t(`reminders.notificationTitle.${reminder.type}`),
                {
                  body: i18n.t("reminders.notificationBody", {
                    title: reminder.title,
                  }),
                  tag: triggerKey,
                },
              );
              notification.onclick = () => {
                window.focus();
                window.location.assign(deepLinks[reminder.type]);
                notification.close();
              };
              shown = true;
            } catch {
              shown = false;
            }
          }
          useReminderStore
            .getState()
            .markTriggered(
              reminder.id,
              shown ? "shown" : "missed",
              now,
              activities,
            );
        });
    };
    tick();
    const interval = window.setInterval(tick, 45_000);
    return () => window.clearInterval(interval);
  }, []);
  return null;
}
