import {
  ChevronRight,
  MoonStar,
  Pause,
  Play,
  Square,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { hapticsService } from "../../platform/haptics/hapticsService";
import { useActivityStore } from "../../store/activityStore";
import { useBreastfeedingTimerStore } from "../../store/breastfeedingTimerStore";

function formatTimer(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000),
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function getSleepElapsedMilliseconds(
  activeActivity: {
    startedAt: string;
    pausedAt: string | null;
    totalPausedMilliseconds: number;
  },
  now: Date,
) {
  const startedAt = new Date(
    activeActivity.startedAt,
  ).getTime();

  if (Number.isNaN(startedAt)) {
    return 0;
  }

  const effectiveEnd = activeActivity.pausedAt
    ? new Date(activeActivity.pausedAt).getTime()
    : now.getTime();

  return Math.max(
    0,
    effectiveEnd -
      startedAt -
      activeActivity.totalPausedMilliseconds,
  );
}

function getBreastfeedingElapsedMilliseconds(
  session: {
    leftDurationMilliseconds: number;
    rightDurationMilliseconds: number;
    isPaused: boolean;
    sideStartedAt: string | null;
  },
  now: Date,
) {
  const savedMilliseconds =
    session.leftDurationMilliseconds +
    session.rightDurationMilliseconds;

  if (
    session.isPaused ||
    !session.sideStartedAt
  ) {
    return savedMilliseconds;
  }

  const sideStartedAt = new Date(
    session.sideStartedAt,
  ).getTime();

  if (Number.isNaN(sideStartedAt)) {
    return savedMilliseconds;
  }

  return (
    savedMilliseconds +
    Math.max(0, now.getTime() - sideStartedAt)
  );
}

export default function MobileActiveTimerBar({
  keyboardOpen,
}: {
  keyboardOpen: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const activeActivity = useActivityStore(
    (state) => state.activeActivity,
  );

  const addActivity = useActivityStore(
    (state) => state.addActivity,
  );

  const finishActivity = useActivityStore(
    (state) => state.finishActivity,
  );

  const pauseActivity = useActivityStore(
    (state) => state.pauseActivity,
  );

  const resumeActivity = useActivityStore(
    (state) => state.resumeActivity,
  );

  const activeBreastfeedingSession =
    useBreastfeedingTimerStore(
      (state) => state.activeSession,
    );

  const [now, setNow] = useState(
    () => new Date(),
  );

  useEffect(() => {
    if (
      !activeActivity &&
      !activeBreastfeedingSession
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    activeActivity,
    activeBreastfeedingSession,
  ]);

  const timer = useMemo(() => {
    if (
      activeActivity?.type === "sleep"
    ) {
      return {
        type: "sleep" as const,
        path: "/sleep",
        title: t("mobileActiveTimer.sleeping"),
        detail: activeActivity.pausedAt
          ? t("mobileActiveTimer.paused")
          : t("mobileActiveTimer.inProgress"),
        elapsedMilliseconds:
          getSleepElapsedMilliseconds(
            activeActivity,
            now,
          ),
        paused: Boolean(
          activeActivity.pausedAt,
        ),
      };
    }

    if (activeBreastfeedingSession) {
      return {
        type: "breastfeeding" as const,
        path: "/feeding",
        title: t(
          "mobileActiveTimer.breastfeeding",
        ),
        detail:
          activeBreastfeedingSession.isPaused
            ? t("mobileActiveTimer.paused")
            : t("mobileActiveTimer.inProgress"),
        elapsedMilliseconds:
          getBreastfeedingElapsedMilliseconds(
            activeBreastfeedingSession,
            now,
          ),
        paused:
          activeBreastfeedingSession.isPaused,
      };
    }

    return null;
  }, [
    activeActivity,
    activeBreastfeedingSession,
    now,
    t,
  ]);

  function handlePauseResumeSleep() {
    if (
      !activeActivity ||
      activeActivity.type !== "sleep"
    ) {
      return;
    }

    if (activeActivity.pausedAt) {
      resumeActivity();
      void hapticsService.impact("light");
      return;
    }

    pauseActivity();
    void hapticsService.impact("light");
  }

  function handleStopSleep() {
    const session = finishActivity();

    if (!session || session.type !== "sleep") {
      return;
    }

    const timestamp = new Date().toISOString();

    const added = addActivity({
      id: session.id,
      babyId: session.babyId,
      type: "sleep",
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: {
        location: "crib",
        pausedDurationSeconds:
          session.pausedDurationSeconds,
      },
    });

    if (added) {
      void hapticsService.notification("success");
    } else {
      void hapticsService.notification("error");
    }
  }

  if (!timer || keyboardOpen) {
    return null;
  }

  const TimerIcon =
    timer.type === "sleep"
      ? MoonStar
      : Timer;

  const StatusIcon = timer.paused
    ? Pause
    : Play;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-indigo-200 bg-white/95 p-2 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-indigo-900 dark:bg-slate-900/95">
      <button
        type="button"
        onClick={() => {
          void hapticsService.selection();
          navigate(timer.path);
        }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-0.5 text-left active:bg-slate-100 dark:active:bg-slate-800"
        aria-label={t(
          "mobileActiveTimer.openTimer",
          {
            timer: timer.title,
          },
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <TimerIcon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {timer.title}
            </span>

            <StatusIcon className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          </span>

          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {timer.detail}
          </span>
        </span>

        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
          {formatTimer(
            timer.elapsedMilliseconds,
          )}
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {timer.type === "sleep" ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePauseResumeSleep}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-700 shadow-sm active:scale-[0.97] dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
            aria-label={
              timer.paused
                ? t("sleep.resume")
                : t("sleep.pause")
            }
          >
            {timer.paused ? (
              <Play className="h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}

            <span className="hidden min-[430px]:inline">
              {timer.paused
                ? t("sleep.resume")
                : t("sleep.pause")}
            </span>
          </button>

          <button
            type="button"
            onClick={handleStopSleep}
            className="flex h-11 items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-sm font-bold text-white shadow-sm active:scale-[0.97] disabled:opacity-50"
            aria-label={t("sleep.stop")}
          >
            <Square className="h-4 w-4 fill-current" />

            <span className="hidden min-[430px]:inline">
              {t("sleep.stop")}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
