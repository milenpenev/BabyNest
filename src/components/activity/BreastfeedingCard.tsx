import {
  Baby,
  Check,
  Pause,
  Play,
  Repeat2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  BreastSide,
  BreastfeedingActivity,
} from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";
import { useBreastfeedingTimerStore } from "../../store/breastfeedingTimerStore";

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds),
  );

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function BreastfeedingCard() {
  const { t } = useTranslation();

  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore(
    (state) => state.selectedBabyId,
  );

  const activities = useActivityStore(
    (state) => state.activities,
  );

  const addActivity = useActivityStore(
    (state) => state.addActivity,
  );

  const activeSession = useBreastfeedingTimerStore(
    (state) => state.activeSession,
  );

  const startSession = useBreastfeedingTimerStore(
    (state) => state.startSession,
  );

  const switchSide = useBreastfeedingTimerStore(
    (state) => state.switchSide,
  );

  const pauseSession = useBreastfeedingTimerStore(
    (state) => state.pauseSession,
  );

  const resumeSession = useBreastfeedingTimerStore(
    (state) => state.resumeSession,
  );

  const finishSession = useBreastfeedingTimerStore(
    (state) => state.finishSession,
  );

  const [now, setNow] = useState(() => new Date());

  const selectedBaby =
    babies.find((baby) => baby.id === selectedBabyId) ??
    babies[0];

  useEffect(() => {
    if (!activeSession || activeSession.isPaused) {
      return;
    }

    setNow(new Date());

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeSession, activeSession?.isPaused]);

  const breastfeedingActivities = useMemo(
    () =>
      activities
        .filter(
          (
            activity,
          ): activity is BreastfeedingActivity =>
            activity.type === "breastfeeding" &&
            activity.babyId === selectedBaby?.id,
        )
        .sort(
          (first, second) =>
            new Date(second.startedAt).getTime() -
            new Date(first.startedAt).getTime(),
        ),
    [activities, selectedBaby?.id],
  );

  const lastFirstSide =
    breastfeedingActivities[0]?.data.firstSide ?? null;

  function getLiveDuration(side: BreastSide): number {
    if (!activeSession) {
      return 0;
    }

    const storedMilliseconds =
      side === "left"
        ? activeSession.leftDurationMilliseconds
        : activeSession.rightDurationMilliseconds;

    if (
      activeSession.isPaused ||
      activeSession.activeSide !== side ||
      !activeSession.sideStartedAt
    ) {
      return Math.floor(storedMilliseconds / 1000);
    }

    const currentMilliseconds = Math.max(
      0,
      now.getTime() -
        new Date(activeSession.sideStartedAt).getTime(),
    );

    return Math.floor(
      (storedMilliseconds + currentMilliseconds) /
        1000,
    );
  }

  const leftSeconds = getLiveDuration("left");
  const rightSeconds = getLiveDuration("right");
  const totalSeconds = leftSeconds + rightSeconds;

  function handleStart(side: BreastSide) {
    if (!selectedBaby) {
      return;
    }

    startSession(selectedBaby.id, side);
  }

  function handleFinish() {
    const session = finishSession();

    if (!session) {
      return;
    }

    const createdAt = new Date().toISOString();

    addActivity({
      id: session.id,
      babyId: session.babyId,
      type: "breastfeeding",
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      createdAt,
      updatedAt: createdAt,
      data: {
        firstSide: session.firstSide,
        leftDurationSeconds:
          session.leftDurationSeconds,
        rightDurationSeconds:
          session.rightDurationSeconds,
      },
    });
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-700">
          <Baby className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("activity.breastfeeding")}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {lastFirstSide
              ? `${t(
                  "activity.lastFeedingStartedWith",
                )}: ${
                  lastFirstSide === "left"
                    ? t("activity.leftBreast")
                    : t("activity.rightBreast")
                }`
              : t("activity.noPreviousFeeding")}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div
          className={[
            "rounded-2xl border p-4",
            activeSession?.activeSide === "left"
              ? "border-pink-300 bg-pink-50"
              : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
          ].join(" ")}
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("activity.leftBreast")}
          </p>

          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {formatDuration(leftSeconds)}
          </p>
        </div>

        <div
          className={[
            "rounded-2xl border p-4",
            activeSession?.activeSide === "right"
              ? "border-pink-300 bg-pink-50"
              : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
          ].join(" ")}
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("activity.rightBreast")}
          </p>

          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {formatDuration(rightSeconds)}
          </p>
        </div>
      </div>

      {activeSession && (
        <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {t("activity.totalFeedingTime")}:{" "}
          {formatDuration(totalSeconds)}
        </div>
      )}

      <div className="mt-auto pt-5">
        {!activeSession ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleStart("left")}
              disabled={!selectedBaby}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {t("activity.startLeft")}
            </button>

            <button
              type="button"
              onClick={() => handleStart("right")}
              disabled={!selectedBaby}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {t("activity.startRight")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!activeSession.isPaused && (
              <button
                type="button"
                onClick={() =>
                  switchSide(
                    activeSession.activeSide === "left"
                      ? "right"
                      : "left",
                  )
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 font-semibold text-white transition hover:bg-violet-700"
              >
                <Repeat2 className="h-4 w-4" />

                {activeSession.activeSide === "left"
                  ? t("activity.switchToRight")
                  : t("activity.switchToLeft")}
              </button>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  activeSession.isPaused
                    ? resumeSession
                    : pauseSession
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 font-semibold text-white transition hover:bg-amber-600"
              >
                {activeSession.isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}

                {activeSession.isPaused
                  ? t("activity.resumeFeeding")
                  : t("activity.pauseFeeding")}
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white transition hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                {t("activity.finishFeeding")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
