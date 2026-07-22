import { useEffect } from "react";
import { useActivityStore } from "../../../store/activityStore";
import { useReminderStore } from "../../../store/reminderStore";
import { useBabyStore } from "../../../store/babyStore";

// nextTriggerAt is a persisted cache. Reminder schedule plus the current
// activity collection remain the source of truth and are reconciled once after
// hydration and after every immutable activity/reminder collection change.
export default function ActivityAwareReminderSync() {
  useEffect(() => {
    const synchronize = () => useReminderStore.getState().synchronizeActivityAwareReminders(useActivityStore.getState().activities, useBabyStore.getState().babies, new Date());
    synchronize();
    const unsubscribeActivities = useActivityStore.subscribe((state, previous) => { if (state.activities !== previous.activities) synchronize(); });
    const unsubscribeReminders = useReminderStore.subscribe((state, previous) => { if (state.reminders !== previous.reminders) synchronize(); });
    const unsubscribeBabies = useBabyStore.subscribe((state, previous) => { if (state.babies !== previous.babies) synchronize(); });
    return () => { unsubscribeActivities(); unsubscribeReminders(); unsubscribeBabies(); };
  }, []);
  return null;
}
