export type BiologicalSex = "male" | "female";

export type WhoGrowthMetric =
  | "weightForAge"
  | "lengthForAge"
  | "headCircumferenceForAge";

export interface WhoLmsRow {
  /**
   * Completed age in days.
   */
  ageDays: number;

  /**
   * Box-Cox power.
   */
  l: number;

  /**
   * Median value.
   */
  m: number;

  /**
   * Generalized coefficient of variation.
   */
  s: number;
}

export interface WhoGrowthResult {
  metric: WhoGrowthMetric;
  sex: BiologicalSex;
  chronologicalAgeDays: number;
  correctedAgeDays: number;
  value: number;
  zScore: number;
  percentile: number;
  usedCorrectedAge: boolean;
}

export interface CorrectedAgeOptions {
  birthDate: string | Date;
  measuredAt: string | Date;
  gestationalAgeWeeks?: number | null;
  useCorrectedAge?: boolean;
}
