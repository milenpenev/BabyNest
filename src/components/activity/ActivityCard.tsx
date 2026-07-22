import { BedDouble, ChevronRight, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Activity } from "../../entities/activity/model/activity.types";

interface ActivityCardProps {
  activity: Activity;
  onSelect: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

function formatTime(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function calculateActiveDurationSeconds(activity: Activity) {
  if (!activity.endedAt) {
    return null;
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(
      (new Date(activity.endedAt).getTime() -
        new Date(activity.startedAt).getTime()) /
        1000,
    ),
  );

  const pausedSeconds =
    activity.type === "sleep"
      ? (activity.data.pausedDurationSeconds ?? 0)
      : 0;

  return Math.max(0, totalSeconds - pausedSeconds);
}

function formatDuration(
  activity: Activity,
  language: string,
  activeLabel: string,
) {
  const durationSeconds =
    calculateActiveDurationSeconds(activity);

  if (durationSeconds === null) {
    return activeLabel;
  }

  const totalMinutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "bg") {
    return hours > 0
      ? `${hours}ч ${minutes}м`
      : `${minutes}м`;
  }

  return hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;
}

export default function ActivityCard({
  activity,
  onSelect,
  onDelete,
}: ActivityCardProps) {
  const { t, i18n } = useTranslation();

  const locale =
    i18n.language === "bg" ? "bg-BG" : "en-GB";

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30 sm:p-4">
      <button
        type="button"
        onClick={() => onSelect(activity)}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
        aria-label={t("activity.openDetails")}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <BedDouble className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-semibold text-slate-900">
              {t("activity.sleep")}
            </p>

            <span className="text-sm text-slate-500">
              {formatTime(activity.startedAt, locale)}
              {activity.endedAt
                ? ` – ${formatTime(activity.endedAt, locale)}`
                : ""}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.duration")}:{" "}
            <span className="font-medium text-slate-700">
              {formatDuration(
                activity,
                i18n.language,
                t("activity.active"),
              )}
            </span>
          </p>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </button>

      <button
        type="button"
        onClick={() => onDelete(activity.id)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
        aria-label={t("activity.deleteActivity")}
        title={t("activity.delete")}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </article>
  );
}