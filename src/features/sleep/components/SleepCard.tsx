import { BedDouble, Pause, Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useActivityStore } from "../../../store/activityStore";
import { useSleepTimer } from "../hooks/useSleepTimer";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function SleepCard() {
  const { t } = useTranslation();
  const addActivity = useActivityStore((state) => state.addActivity);

  const {
    isRunning,
    isPaused,
    durationSeconds,
    startSleep,
    pauseSleep,
    resumeSleep,
    stopSleep,
  } = useSleepTimer();

  function handleStopSleep() {
    const session = stopSleep();

    if (!session) return;

    const now = new Date().toISOString();

    addActivity({
      id: crypto.randomUUID(),
      babyId: "filip",
      type: "sleep",
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt.toISOString(),
      createdAt: now,
      updatedAt: now,
      data: {
        location: "crib",
      },
    });
  }

  const statusText = !isRunning
    ? t("sleep.awake")
    : isPaused
      ? t("sleep.paused")
      : t("sleep.sleeping");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-3">
          <BedDouble className="h-6 w-6 text-indigo-700" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            {t("sleep.title")}
          </h3>

          <p className="text-sm text-slate-500">
            {statusText}
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="font-mono text-5xl font-bold">
          {formatDuration(durationSeconds)}
        </div>
      </div>

      <div className="mt-8">
        {!isRunning ? (
          <button
            type="button"
            onClick={startSleep}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            <Play className="h-5 w-5" />
            {t("sleep.start")}
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={isPaused ? resumeSleep : pauseSleep}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-semibold text-white transition hover:bg-amber-600"
            >
              {isPaused ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}

              {isPaused ? t("sleep.resume") : t("sleep.pause")}
            </button>

            <button
              type="button"
              onClick={handleStopSleep}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700"
            >
              <Square className="h-5 w-5" />
              {t("sleep.stop")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}