import AutomaticMemorySync from "../features/memories/components/AutomaticMemorySync";
import ActivityAwareReminderSync from "../features/reminders/components/ActivityAwareReminderSync";
import ReminderScheduler from "../features/reminders/components/ReminderScheduler";

export default function SharedAppRuntimes() {
  return (
    <>
      <ActivityAwareReminderSync />
      <ReminderScheduler />
      <AutomaticMemorySync />
    </>
  );
}
