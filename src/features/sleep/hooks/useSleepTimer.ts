import { useEffect, useMemo, useState } from "react";
import type { FinishedSleepSession } from "../model/sleep.types";

export function useSleepTimer() {
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [totalPausedMilliseconds, setTotalPausedMilliseconds] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const isRunning = startedAt !== null;
  const isPaused = pausedAt !== null;

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, isPaused]);

  const durationSeconds = useMemo(() => {
    if (!startedAt) return 0;

    const effectiveEnd = pausedAt ?? now;

    const activeMilliseconds =
      effectiveEnd.getTime() -
      startedAt.getTime() -
      totalPausedMilliseconds;

    return Math.max(0, Math.floor(activeMilliseconds / 1000));
  }, [startedAt, pausedAt, now, totalPausedMilliseconds]);

  function startSleep() {
    const currentTime = new Date();

    setStartedAt(currentTime);
    setPausedAt(null);
    setTotalPausedMilliseconds(0);
    setNow(currentTime);
  }

  function pauseSleep() {
    if (!startedAt || pausedAt) return;

    setPausedAt(new Date());
  }

  function resumeSleep() {
    if (!startedAt || !pausedAt) return;

    const resumedAt = new Date();
    const pausedDuration = resumedAt.getTime() - pausedAt.getTime();

    setTotalPausedMilliseconds(
      (currentTotal) => currentTotal + pausedDuration,
    );

    setPausedAt(null);
    setNow(resumedAt);
  }

  function stopSleep(): FinishedSleepSession | null {
    if (!startedAt) return null;

    const endedAt = pausedAt ?? new Date();

    const activeMilliseconds =
      endedAt.getTime() -
      startedAt.getTime() -
      totalPausedMilliseconds;

    const session: FinishedSleepSession = {
      startedAt,
      endedAt,
      durationSeconds: Math.max(
        0,
        Math.floor(activeMilliseconds / 1000),
      ),
    };

    setStartedAt(null);
    setPausedAt(null);
    setTotalPausedMilliseconds(0);
    setNow(new Date());

    return session;
  }

  return {
    isRunning,
    isPaused,
    durationSeconds,
    startedAt,
    startSleep,
    pauseSleep,
    resumeSleep,
    stopSleep,
  };
}