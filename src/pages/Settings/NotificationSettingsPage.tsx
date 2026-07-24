import { Bell, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import NotificationCenter from "../../components/layout/NotificationCenter";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import RemindersPage from "../../features/reminders/pages/RemindersPage";

const notificationKeys = [
  { key: "sleep", labelKey: "settings.notificationsSleep" },
  { key: "feeding", labelKey: "settings.notificationsFeeding" },
  { key: "diaper", labelKey: "settings.notificationsDiaper" },
  { key: "medicine", labelKey: "settings.notificationsMedicine" },
  { key: "vaccination", labelKey: "settings.notificationsVaccination" },
  { key: "milestone", labelKey: "settings.notificationsMilestone" },
] as const;

export default function NotificationSettingsPage() {
  const { t } = useTranslation();
  const notifications = useAppSettingsStore((state) => state.notifications);
  const setNotification = useAppSettingsStore((state) => state.setNotification);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-900 p-6 text-white sm:p-8">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-100"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("settings.title")}
        </Link>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <Bell className="h-8 w-8" />
            <h1 className="mt-3 text-3xl font-bold">
              {t("settings.notifications")}
            </h1>
            <p className="mt-2 text-sm text-indigo-100">
              {t("settings.notificationsHint")}
            </p>
          </div>
          <NotificationCenter />
        </div>
      </section>

      <nav
        className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800"
        aria-label={t("settings.title")}
      >
        <Link
          to="/settings"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
        >
          {t("settings.title")}
        </Link>
        <span className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {t("settings.notifications")}
        </span>
      </nav>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {notificationKeys.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span>{t(item.labelKey)}</span>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(event) =>
                  setNotification(item.key, event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          ))}
        </div>
      </section>
      <RemindersPage />
    </div>
  );
}
