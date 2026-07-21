import { BedDouble, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useActivityStore } from "../../store/activityStore";

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatDuration(
  startedAt: string,
  endedAt: string | undefined,
  language: string,
  activeLabel: string,
) {
  if (!endedAt) return activeLabel;

  const milliseconds =
    new Date(endedAt).getTime() - new Date(startedAt).getTime();

  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "bg") {
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
  }

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function ActivityHistory() {
  const { t, i18n } = useTranslation();
  const activities = useActivityStore((state) => state.activities);
  const removeActivity = useActivityStore((state) => state.removeActivity);

  const todayActivities = activities
    .filter((activity) => isToday(activity.startedAt))
    .sort(
      (first, second) =>
        new Date(second.startedAt).getTime() -
        new Date(first.startedAt).getTime(),
    );

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      t("activity.deleteConfirmation"),
    );

    if (!confirmed) return;

    removeActivity(id);
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            {t("activity.todayActivities")}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {t("activity.todayHistory")}
          </h2>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {todayActivities.length}
        </div>
      </div>

      {todayActivities.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <p className="font-medium text-slate-700">
            {t("activity.empty")}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t("activity.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {todayActivities.map((activity) => (
            <article
              key={activity.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <BedDouble className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-semibold text-slate-900">{t("activity.sleep")}</p>

                  <span className="text-sm text-slate-500">
                    {formatTime(activity.startedAt)}
                    {activity.endedAt
                      ? ` – ${formatTime(activity.endedAt)}`
                      : ""}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {t("activity.duration")}:{" "}
                  <span className="font-medium text-slate-700">
                    {formatDuration(
                    activity.startedAt,
                    activity.endedAt,
                    i18n.language,
                    t("activity.active"),
                  )}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(activity.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={t("activity.delete")}
                title={t("activity.delete")}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}