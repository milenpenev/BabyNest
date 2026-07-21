export interface RunningSleepSession {
  startedAt: Date;
}

export interface FinishedSleepSession {
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
}