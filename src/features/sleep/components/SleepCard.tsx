import {
  BedDouble,
  Clock3,
  Pause,
  Play,
  Save,
  Square,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useActivityStore } from "../../../store/activityStore";
import { useBabyStore } from "../../../store/babyStore";
import { hapticsService } from "../../../platform/haptics/hapticsService";
import { useSleepTimer } from "../hooks/useSleepTimer";

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function toLocalDateTimeInput(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 19);
}

function fromLocalDateTimeInput(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function SleepCard() {
  const { t, i18n } = useTranslation();

  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore(
    (state) => state.selectedBabyId,
  );

  const addActivity = useActivityStore(
    (state) => state.addActivity,
  );

  const selectedBaby =
    babies.find((baby) => baby.id === selectedBabyId) ?? babies[0];

  const {
    isRunning,
    isPaused,
    durationSeconds,
    pausedDurationSeconds,
    startedAt,
    startSleep,
    updateStartTime,
    pauseSleep,
    resumeSleep,
    stopSleep,
  } = useSleepTimer();

  const [startTimeValue, setStartTimeValue] = useState(() =>
    toLocalDateTimeInput(new Date()),
  );

  const [startTimeError, setStartTimeError] = useState("");
  const [startTimeEdited, setStartTimeEdited] =
    useState(false);

  useEffect(() => {
    if (startedAt) {
      setStartTimeValue(
        toLocalDateTimeInput(new Date(startedAt)),
      );
    } else {
      setStartTimeValue(toLocalDateTimeInput(new Date()));
    }

    setStartTimeError("");
    setStartTimeEdited(false);
  }, [startedAt]);

  function getSelectedStartDate() {
    const selectedDate = fromLocalDateTimeInput(startTimeValue);

    if (!selectedDate || selectedDate.getTime() > Date.now()) {
      setStartTimeError(t("sleep.invalidStartTime"));
      return null;
    }

    setStartTimeError("");
    return selectedDate;
  }

  function handleStartSleep() {
    if (!selectedBaby) {
      return;
    }

    const selectedDate = startTimeEdited
      ? getSelectedStartDate()
      : new Date();

    if (!selectedDate) {
      return;
    }

    const started = startSleep(
      selectedBaby.id,
      selectedDate.toISOString(),
    );

    if (started === "permission-denied") {
      setStartTimeError(
        i18n.language.startsWith("bg")
          ? "Нямате права да добавяте активности в това семейство."
          : "You do not have permission to add activities in this family.",
      );

      void hapticsService.notification("error");
      return;
    }

    if (started === "already-running") {
      setStartTimeError(
        i18n.language.startsWith("bg")
          ? "Вече има стартирана активност."
          : "Another activity is already running.",
      );

      void hapticsService.notification("error");
      return;
    }

    if (
      started === "invalid-time" ||
      started === "future-time"
    ) {
      setStartTimeError(t("sleep.invalidStartTime"));
      void hapticsService.notification("error");
      return;
    }

    void hapticsService.impact("light");
  }

  function handleUpdateStartTime() {
    const selectedDate = getSelectedStartDate();

    if (!selectedDate) {
      return;
    }

    const updated = updateStartTime(
      selectedDate.toISOString(),
    );

    if (!updated) {
      setStartTimeError(t("sleep.invalidStartTime"));
    }
  }

  function handleStopSleep() {
    const session = stopSleep();

    if (!session || session.type !== "sleep") {
      return;
    }

    const timestamp = new Date().toISOString();

    addActivity({
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

    void hapticsService.notification("success");
  }

  const statusText = !isRunning
    ? t("sleep.awake")
    : isPaused
      ? t("sleep.paused")
      : t("sleep.sleeping");

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <BedDouble className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
            {t("sleep.title")}
          </h2>

          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {statusText}
          </p>
        </div>
      </div>

      <div className="mt-5 text-center">
        <div className="font-mono text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {formatDuration(durationSeconds)}
        </div>

        <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 sm:text-sm">
          <Pause className="h-4 w-4" />
          {t("sleep.pausedDuration")}:{" "}
          {formatDuration(pausedDurationSeconds)}
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="sleep-start-time"
          className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <Clock3 className="h-4 w-4" />

          {isRunning
            ? t("sleep.changeStartTime")
            : t("sleep.startTime")}
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="sleep-start-time"
            type="datetime-local"
            step="1"
            value={startTimeValue}
            max={toLocalDateTimeInput(new Date())}
            onChange={(event) => {
              setStartTimeValue(event.target.value);
              setStartTimeEdited(true);
              setStartTimeError("");
            }}
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
          />

          {isRunning && (
            <button
              type="button"
              onClick={handleUpdateStartTime}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Save className="h-4 w-4" />
              {t("sleep.saveStartTime")}
            </button>
          )}
        </div>

        {startTimeError && (
          <p className="mt-1.5 text-sm font-medium text-rose-600">
            {startTimeError}
          </p>
        )}
      </div>

      <div className="mt-4">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStartSleep}
            disabled={!selectedBaby}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-5 w-5" />
            {t("sleep.start")}
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                if (isPaused) {
                  resumeSleep();
                } else {
                  pauseSleep();
                }

                void hapticsService.impact("light");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-2.5 font-semibold text-white transition hover:bg-amber-600"
            >
              {isPaused ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}

              {isPaused
                ? t("sleep.resume")
                : t("sleep.pause")}
            </button>

            <button
              type="button"
              onClick={handleStopSleep}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-2.5 font-semibold text-white transition hover:bg-rose-700"
            >
              <Square className="h-5 w-5" />
              {t("sleep.stop")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}