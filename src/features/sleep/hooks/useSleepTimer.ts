import { useEffect, useMemo, useState } from "react";
import type { FinishedSleepSession } from "../model/sleep.types";

export function useSleepTimer() {
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const durationSeconds = useMemo(() => {
    if (!startedAt) return 0;

    return Math.floor(
      (now.getTime() - startedAt.getTime()) / 1000,
    );
  }, [startedAt, now]);

  function startSleep() {
    setStartedAt(new Date());
    setNow(new Date());
  }

  function stopSleep(): FinishedSleepSession | null {
    if (!startedAt) return null;

    const endedAt = new Date();

    const session: FinishedSleepSession = {
      startedAt,
      endedAt,
      durationSeconds: Math.floor(
        (endedAt.getTime() - startedAt.getTime()) / 1000,
      ),
    };

    setStartedAt(null);

    return session;
  }

  return {
    isRunning: startedAt !== null,
    durationSeconds,
    startedAt,
    startSleep,
    stopSleep,
  };
}