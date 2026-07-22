import { useEffect, useState } from "react";

import { useActivityStore } from "../../../store/activityStore";

function calculateDurationSeconds(
  startedAt: string,
  pausedAt: string | null,
  totalPausedMilliseconds: number,
  now: Date,
) {
  const effectiveEnd = pausedAt ? new Date(pausedAt) : now;

  const activeMilliseconds =
    effectiveEnd.getTime() -
    new Date(startedAt).getTime() -
    totalPausedMilliseconds;

  return Math.max(0, Math.floor(activeMilliseconds / 1000));
}

function calculatePausedDurationSeconds(
  pausedAt: string | null,
  totalPausedMilliseconds: number,
  now: Date,
) {
  const currentPauseMilliseconds = pausedAt
    ? Math.max(0, now.getTime() - new Date(pausedAt).getTime())
    : 0;

  return Math.floor(
    (totalPausedMilliseconds + currentPauseMilliseconds) / 1000,
  );
}

export function useSleepTimer() {
  const activeActivity = useActivityStore(
    (state) => state.activeActivity,
  );

  const startActivity = useActivityStore(
    (state) => state.startActivity,
  );

  const updateActiveActivityStart = useActivityStore(
    (state) => state.updateActiveActivityStart,
  );

  const pauseActivity = useActivityStore(
    (state) => state.pauseActivity,
  );

  const resumeActivity = useActivityStore(
    (state) => state.resumeActivity,
  );

  const finishActivity = useActivityStore(
    (state) => state.finishActivity,
  );

  const [now, setNow] = useState(() => new Date());

  const activeSleep =
    activeActivity?.type === "sleep" ? activeActivity : null;

  const isRunning = activeSleep !== null;
  const isPaused = Boolean(activeSleep?.pausedAt);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    setNow(new Date());

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  const durationSeconds = activeSleep
    ? calculateDurationSeconds(
        activeSleep.startedAt,
        activeSleep.pausedAt,
        activeSleep.totalPausedMilliseconds,
        now,
      )
    : 0;

  const pausedDurationSeconds = activeSleep
    ? calculatePausedDurationSeconds(
        activeSleep.pausedAt,
        activeSleep.totalPausedMilliseconds,
        now,
      )
    : 0;

  function startSleep(babyId: string, startedAt?: string) {
    return startActivity({
      babyId,
      type: "sleep",
      startedAt,
    });
  }

  return {
    isRunning,
    isPaused,
    durationSeconds,
    pausedDurationSeconds,
    startedAt: activeSleep?.startedAt ?? null,
    startSleep,
    updateStartTime: updateActiveActivityStart,
    pauseSleep: pauseActivity,
    resumeSleep: resumeActivity,
    stopSleep: finishActivity,
  };
}