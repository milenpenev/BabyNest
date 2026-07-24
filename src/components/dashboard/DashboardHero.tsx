import {
  Baby,
  BrainCircuit,
  Clock3,
  Crown,
  Droplets,
  Milk,
  MoonStar,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  calculateBabyAge,
  formatBabyAge,
  formatBabyAgeInWeeks,
} from "../../features/baby/utils/babyAge";
import {
  analyzeDiapers,
  analyzeFeeding,
  analyzeHealth,
  analyzeSleep,
  calculateBabyStatus,
  generateDashboardInsight,
  type DashboardTone,
  type DashboardTrend,
} from "../../features/dashboard/utils/dashboardAnalysis";
import { getRoutinePreferences } from "../../features/routine/utils/routineIntervals";
import { formatTimeValue } from "../../features/settings/utils/formatting";
import { buildSleepPrediction } from "../../features/sleep/prediction/sleepPrediction";
import {
  buildStatisticsSnapshot,
  formatDurationLabel,
} from "../../features/utils/statistics";
import { useActivityStore } from "../../store/activityStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { useBabyStore } from "../../store/babyStore";
import { useBreastfeedingTimerStore } from "../../store/breastfeedingTimerStore";
import { useReminderStore } from "../../store/reminderStore";
import { useSubscriptionStore } from "../../store/subscriptionStore";

const toneClasses: Record<DashboardTone, string> = {
  positive:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  attention:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  critical:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  neutral:
    "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

function activeDuration(
  startedAt: string,
  pausedAt: string | null,
  totalPausedMilliseconds: number,
  now: Date,
) {
  const start = new Date(startedAt).getTime();
  const end = pausedAt ? new Date(pausedAt).getTime() : now.getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((end - start - totalPausedMilliseconds) / 1000),
  );
}

function getActiveSleepTodayMilliseconds(
  activeSleep: {
    id: string;
    startedAt: string;
    pausedAt: string | null;
    totalPausedMilliseconds: number;
  } | null,
  now: Date,
  isAlreadyStored: boolean,
) {
  if (!activeSleep || isAlreadyStored) {
    return 0;
  }

  const startedAt = new Date(activeSleep.startedAt);

  if (Number.isNaN(startedAt.getTime())) {
    return 0;
  }

  const endAt = activeSleep.pausedAt ? new Date(activeSleep.pausedAt) : now;

  if (Number.isNaN(endAt.getTime())) {
    return 0;
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const effectiveStart =
    startedAt.getTime() < startOfToday.getTime() ? startOfToday : startedAt;

  if (endAt.getTime() <= effectiveStart.getTime()) {
    return 0;
  }

  const fullElapsedMilliseconds = endAt.getTime() - startedAt.getTime();

  const elapsedTodayMilliseconds = endAt.getTime() - effectiveStart.getTime();

  if (fullElapsedMilliseconds <= 0) {
    return 0;
  }

  /*
   * Разпределяме паузираното време пропорционално, когато
   * активният сън преминава през полунощ.
   */
  const todayRatio = Math.min(
    1,
    elapsedTodayMilliseconds / fullElapsedMilliseconds,
  );

  const pausedTodayMilliseconds =
    activeSleep.totalPausedMilliseconds * todayRatio;

  return Math.max(0, elapsedTodayMilliseconds - pausedTodayMilliseconds);
}

function countdown(target: Date | null, now: Date, language: string) {
  if (!target) {
    return "—";
  }

  const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);

  if (seconds <= 0) {
    const duration = formatDurationLabel(Math.abs(seconds) * 1000, language);

    return language === "bg"
      ? `Просрочено с ${duration}`
      : `Overdue by ${duration}`;
  }

  const duration = formatDurationLabel(seconds * 1000, language);

  return language === "bg" ? `След ${duration}` : `In ${duration}`;
}

function HeroMetric({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: DashboardTone;
  icon: React.ReactNode;
}) {
  return (
    <article
      className={["rounded-2xl border p-3.5", toneClasses[tone]].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium opacity-70">{label}</p>

          <p className="mt-1 break-words text-lg font-bold leading-tight">
            {value}
          </p>

          {detail ? (
            <p className="mt-1 text-xs leading-relaxed opacity-70">{detail}</p>
          ) : null}
        </div>

        <span className="shrink-0 opacity-80">{icon}</span>
      </div>
    </article>
  );
}

export default function DashboardHero() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const babies = useBabyStore((state) => state.babies);

  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);

  const activities = useActivityStore((state) => state.activities);

  const activeActivity = useActivityStore((state) => state.activeActivity);

  const breastfeedingSession = useBreastfeedingTimerStore(
    (state) => state.activeSession,
  );

  const reminders = useReminderStore((state) => state.reminders);

  const plan = useSubscriptionStore((state) => state.plan);

  const timeFormat = useAppSettingsStore((state) => state.timeFormat);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const baby = babies.find((item) => item.id === selectedBabyId) ?? null;

  const selectedActivities = useMemo(() => {
    if (!baby) {
      return [];
    }

    return activities.filter((activity) => activity.babyId === baby.id);
  }, [activities, baby]);

  const activeSleep =
    activeActivity?.type === "sleep" && activeActivity.babyId === baby?.id
      ? activeActivity
      : null;

  const activeFeeding =
    breastfeedingSession?.babyId === baby?.id ? breastfeedingSession : null;

  const minuteKey = Math.floor(now.getTime() / 60_000);

  const analysis = useMemo(() => {
    if (!baby) {
      return null;
    }

    const referenceNow = new Date(minuteKey * 60_000);

    const routine = getRoutinePreferences(baby.routinePreferences);

    const today = buildStatisticsSnapshot(
      selectedActivities,
      "today",
      referenceNow,
    );

    const recent = buildStatisticsSnapshot(
      selectedActivities,
      "7d",
      referenceNow,
    );

    const prediction = buildSleepPrediction(
      selectedActivities,
      baby,
      activeSleep,
      referenceNow,
    );

    const latestSleep = selectedActivities
      .filter(
        (activity) =>
          activity.type === "sleep" &&
          activity.endedAt &&
          !Number.isNaN(new Date(activity.endedAt).getTime()) &&
          new Date(activity.endedAt) <= referenceNow,
      )
      .sort(
        (a, b) =>
          new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime(),
      )[0];

    const sleep = analyzeSleep(
      today,
      recent,
      prediction,
      latestSleep?.endedAt ? new Date(latestSleep.endedAt) : null,
      Boolean(activeSleep),
      referenceNow,
    );

    const feeding = analyzeFeeding(
      selectedActivities,
      baby.id,
      today,
      recent,
      referenceNow,
      routine.feedingIntervalMinutes,
      routine.useAdaptiveFeedingInterval,
    );

    const diapers = analyzeDiapers(
      selectedActivities,
      baby.id,
      today,
      recent,
      referenceNow,
      routine.diaperIntervalMinutes,
      routine.useAdaptiveDiaperInterval,
    );

    const health = analyzeHealth(
      selectedActivities,
      reminders,
      baby.id,
      referenceNow,
    );

    const insight = generateDashboardInsight(health, sleep, feeding, diapers);

    const status = calculateBabyStatus([
      sleep.signal,
      feeding.signal,
      diapers.signal,
      health.signal,
    ]);

    return {
      today,
      prediction,
      sleep,
      feeding,
      diapers,
      health,
      insight,
      status,
    };
  }, [selectedActivities, baby, activeSleep, reminders, minuteKey]);

  if (!baby || !analysis) {
    return null;
  }

  const duration = (seconds: number | null) =>
    seconds === null ? "—" : formatDurationLabel(seconds * 1000, i18n.language);

  const trend = (value: DashboardTrend) => t(`dashboard.ai.trend.${value}`);

  const sleepSeconds = activeSleep
    ? activeDuration(
        activeSleep.startedAt,
        activeSleep.pausedAt,
        activeSleep.totalPausedMilliseconds,
        now,
      )
    : analysis.sleep.currentWakeSeconds;

  const activeSleepIsAlreadyStored = activeSleep
    ? selectedActivities.some(
        (activity) =>
          activity.type === "sleep" && activity.id === activeSleep.id,
      )
    : false;

  const activeSleepTodayMilliseconds = getActiveSleepTodayMilliseconds(
    activeSleep,
    now,
    activeSleepIsAlreadyStored,
  );

  const totalSleepTodayMilliseconds =
    analysis.today.totalSleepMilliseconds + activeSleepTodayMilliseconds;

  const displayedNapCount =
    analysis.today.napCount +
    (activeSleep &&
    !activeSleepIsAlreadyStored &&
    activeSleepTodayMilliseconds > 0
      ? 1
      : 0);

  const hour = now.getHours();

  const greetingKey =
    hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const greeting = activeSleep
    ? t("dashboard.ai.greetingSleeping", {
        name: baby.name,
      })
    : analysis.sleep.currentWakeSeconds !== null
      ? t("dashboard.ai.greetingAwake", {
          name: baby.name,
          duration: duration(sleepSeconds),
        })
      : t(`dashboard.ai.greeting.${greetingKey}`);

  const babyAge = calculateBabyAge(baby.birthday, now);

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-4 text-white shadow-lg shadow-indigo-200/50 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            BabyNest
          </span>

          <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
            <Crown className="h-3.5 w-3.5" />

            {plan === "premium" ? "Premium+" : "Free"}
          </span>
        </div>

        <p className="text-xs font-medium text-indigo-100">
          {formatTimeValue(now, timeFormat, i18n.language)}
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,2.2fr)]">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-100">{greeting}</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("dashboard.ai.title", {
              name: baby.name,
            })}
          </h1>

          <p className="mt-1.5 text-xs text-indigo-100 sm:text-sm">
            {formatBabyAge(babyAge, i18n.language)} (
            {formatBabyAgeInWeeks(babyAge, i18n.language)})
          </p>

          <div
            className={[
              "mt-4 rounded-2xl border px-4 py-3",
              toneClasses[analysis.status.tone],
            ].join(" ")}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
              {t("dashboard.ai.todayStatus")}
            </p>

            <p className="mt-1 text-lg font-bold">
              {t(analysis.status.labelKey)}
            </p>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-950/75 px-4 py-3 text-white">
            <div className="flex items-center gap-2 text-violet-300">
              <BrainCircuit className="h-4 w-4" />

              <span className="text-xs font-semibold">
                {t("dashboard.ai.smartInsight")}
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold leading-relaxed">
              {t(analysis.insight.labelKey, analysis.insight.params)}
            </p>

            {plan !== "premium" ? (
              <button
                type="button"
                onClick={() => navigate("/plans")}
                className="mt-3 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
              >
                {t("premium.upgrade")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HeroMetric
            label={t("dashboard.ai.todaySleep")}
            value={formatDurationLabel(
              totalSleepTodayMilliseconds,
              i18n.language,
            )}
            detail={`${trend(analysis.sleep.trend)} · ${displayedNapCount} ${t(
              "statistics.naps",
            )}`}
            tone={analysis.sleep.signal.tone}
            icon={<MoonStar className="h-5 w-5" />}
          />

          <HeroMetric
            label={t("dashboard.ai.todayFeeding")}
            value={String(analysis.feeding.count)}
            detail={`${trend(analysis.feeding.trend)} · ${
              analysis.feeding.bottleAverageMl
            } ml`}
            tone={analysis.feeding.signal.tone}
            icon={<Milk className="h-5 w-5" />}
          />

          <HeroMetric
            label={t("dashboard.ai.todayDiapers")}
            value={String(analysis.diapers.total)}
            detail={`${analysis.diapers.wet}/${analysis.diapers.dirty}/${analysis.diapers.mixed} · ${trend(
              analysis.diapers.trend,
            )}`}
            tone={analysis.diapers.signal.tone}
            icon={<Droplets className="h-5 w-5" />}
          />

          <HeroMetric
            label={
              activeSleep
                ? t("dashboard.ai.currentSleep")
                : t("dashboard.ai.currentWake")
            }
            value={duration(sleepSeconds)}
            detail={activeFeeding ? t("dashboard.ai.feedingActive") : undefined}
            tone={activeSleep ? "positive" : analysis.sleep.signal.tone}
            icon={<Baby className="h-5 w-5" />}
          />

          <HeroMetric
            label={t("dashboard.ai.nextNap")}
            value={
              activeSleep
                ? t("dashboard.ai.sleepingNow")
                : plan === "premium"
                  ? countdown(analysis.sleep.nextNapAt, now, i18n.language)
                  : t("dashboard.ai.premiumMetric")
            }
            detail={
              activeSleep
                ? duration(sleepSeconds)
                : analysis.sleep.nextNapAt && plan === "premium"
                  ? formatTimeValue(
                      analysis.sleep.nextNapAt,
                      timeFormat,
                      i18n.language,
                    )
                  : undefined
            }
            tone={
              activeSleep
                ? "positive"
                : plan === "premium"
                  ? analysis.sleep.signal.tone
                  : "neutral"
            }
            icon={<Clock3 className="h-5 w-5" />}
          />

          <HeroMetric
            label={t("dashboard.ai.nextFeeding")}
            value={countdown(analysis.feeding.nextAt, now, i18n.language)}
            detail={
              analysis.feeding.secondsSinceLatest !== null
                ? t("dashboard.ai.sinceLast", {
                    duration: duration(analysis.feeding.secondsSinceLatest),
                  })
                : t("dashboard.ai.noData")
            }
            tone={analysis.feeding.signal.tone}
            icon={<Milk className="h-5 w-5" />}
          />

          <HeroMetric
            label={t("dashboard.ai.nextDiaper")}
            value={countdown(analysis.diapers.nextAt, now, i18n.language)}
            detail={
              analysis.diapers.secondsSinceLatest !== null
                ? t("dashboard.ai.sinceLast", {
                    duration: duration(analysis.diapers.secondsSinceLatest),
                  })
                : t("dashboard.ai.noData")
            }
            tone={analysis.diapers.signal.tone}
            icon={<Droplets className="h-5 w-5" />}
          />
        </div>
      </div>
    </section>
  );
}
