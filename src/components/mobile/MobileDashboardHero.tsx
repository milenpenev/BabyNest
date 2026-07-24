import {
  Baby,
  Clock3,
  MoonStar,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  calculateBabyAge,
  formatBabyAge,
} from "../../features/baby/utils/babyAge";
import { buildStatisticsSnapshot } from "../../features/utils/statistics";
import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";

function formatDuration(
  milliseconds: number,
  hourLabel: string,
  minuteLabel: string,
) {
  const totalMinutes = Math.max(
    0,
    Math.round(milliseconds / 60_000),
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}${hourLabel} ${minutes}${minuteLabel}`;
  }

  return `${minutes}${minuteLabel}`;
}

export default function MobileDashboardHero() {
  const { t, i18n } = useTranslation();

  const selectedBaby = useBabyStore(
    (state) =>
      state.babies.find(
        (baby) =>
          baby.id === state.selectedBabyId,
      ) ?? state.babies[0] ?? null,
  );

  const activities = useActivityStore(
    (state) => state.activities,
  );

  const activeActivity = useActivityStore(
    (state) => state.activeActivity,
  );

  if (!selectedBaby) {
    return null;
  }

  const now = new Date();

  const babyActivities = activities.filter(
    (activity) =>
      activity.babyId === selectedBaby.id,
  );

  const snapshot = buildStatisticsSnapshot(
    babyActivities,
    "today",
    now,
  );

  const babyAge = calculateBabyAge(
    selectedBaby.birthday,
    now,
  );

  const age = formatBabyAge(
    babyAge,
    i18n.language,
  );

  const currentSleep =
    activeActivity?.type === "sleep" &&
    activeActivity.babyId === selectedBaby.id
      ? Math.max(
          0,
          now.getTime() -
            new Date(
              activeActivity.startedAt,
            ).getTime(),
        )
      : 0;

  const todaySleep =
    snapshot.totalSleepMilliseconds +
    currentSleep;

  const feedingCount =
    snapshot.breastfeedingCount +
    snapshot.bottleCount;

  const diaperCount = snapshot.totalDiapers;

  const greeting =
    now.getHours() < 12
      ? t("dashboard.greeting.morning")
      : now.getHours() < 18
        ? t("dashboard.greeting.afternoon")
        : t("dashboard.greeting.evening");

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-4 text-white shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">
            {greeting}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <Baby className="h-5 w-5 shrink-0" />

            <h1 className="truncate text-xl font-bold">
              {selectedBaby.name}
            </h1>
          </div>

          <p className="mt-1 text-sm text-white/75">
            {age}
          </p>
        </div>

        <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <article className="rounded-xl bg-white/12 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-white/75">
            <MoonStar className="h-4 w-4" />

            <span className="text-[11px] font-medium">
              {t("dashboard.todaySleep")}
            </span>
          </div>

          <p className="mt-1 text-base font-bold">
            {formatDuration(
              todaySleep,
              t("time.hoursShort"),
              t("time.minutesShort"),
            )}
          </p>
        </article>

        <article className="rounded-xl bg-white/12 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-white/75">
            <Clock3 className="h-4 w-4" />

            <span className="text-[11px] font-medium">
              {t("dashboard.feedings")}
            </span>
          </div>

          <p className="mt-1 text-base font-bold">
            {feedingCount}
          </p>
        </article>

        <article className="rounded-xl bg-white/12 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-white/75">
            <Baby className="h-4 w-4" />

            <span className="text-[11px] font-medium">
              {t("dashboard.diapers")}
            </span>
          </div>

          <p className="mt-1 text-base font-bold">
            {diaperCount}
          </p>
        </article>
      </div>

      {activeActivity?.type === "sleep" &&
      activeActivity.babyId === selectedBaby.id ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-950/25 px-3 py-2.5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <MoonStar className="h-4 w-4 shrink-0" />

            <span className="truncate text-sm font-semibold">
              {t("sleep.currentlySleeping")}
            </span>
          </div>

          <span className="shrink-0 text-sm font-bold">
            {formatDuration(
              currentSleep,
              t("time.hoursShort"),
              t("time.minutesShort"),
            )}
          </span>
        </div>
      ) : null}
    </section>
  );
}
