import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ReminderScheduler from "../features/reminders/components/ReminderScheduler";
import ActivityAwareReminderSync from "../features/reminders/components/ActivityAwareReminderSync";
import AutomaticMemorySync from "../features/memories/components/AutomaticMemorySync";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ActivityAwareReminderSync />
      <ReminderScheduler />
      <AutomaticMemorySync />
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}
