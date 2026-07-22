export interface RoutineFormValues {
  feedingIntervalMinutes: string;
  diaperIntervalMinutes: string;
  useAdaptiveFeedingInterval: boolean;
  useAdaptiveDiaperInterval: boolean;
}

export const defaultRoutineFormValues = (): RoutineFormValues => ({
  feedingIntervalMinutes: "180",
  diaperIntervalMinutes: "180",
  useAdaptiveFeedingInterval: false,
  useAdaptiveDiaperInterval: false,
});
