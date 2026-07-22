export type SleepPredictionSource =
  | "age-fallback"
  | "blended"
  | "personal-history"
  | "time-of-day-history";

export interface WakeWindowRecord {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  previousSleepId: string | null;
  nextSleepId: string | null;
}

export interface SleepPrediction {
  recommendedWakeWindowSeconds: number;
  nextSleepAt: Date | null;
  countdownSeconds: number | null;
  confidence: number;
  source: SleepPredictionSource;
  validWakeWindowCount: number;
  samePeriodWindowCount: number;
  averageWakeWindowSeconds: number | null;
  isOverdue: boolean;
}
