import { headCircumferenceForAgeBoys } from "./data/headCircumferenceForAgeBoys";
import { headCircumferenceForAgeGirls } from "./data/headCircumferenceForAgeGirls";
import { lengthForAgeBoys } from "./data/lengthForAgeBoys";
import { lengthForAgeGirls } from "./data/lengthForAgeGirls";
import { weightForAgeBoys } from "./data/weightForAgeBoys";
import { weightForAgeGirls } from "./data/weightForAgeGirls";
import type {
  BiologicalSex,
  WhoGrowthMetric,
  WhoGrowthResult,
  WhoLmsRow,
} from "./types/whoGrowth.types";
import { calculateGrowthAgeDays } from "./utils/growthAge";
import { interpolateLmsRow } from "./utils/interpolateLms";
import { calculateLmsZScore } from "./utils/lms";
import { zScoreToPercentile } from "./utils/normalDistribution";

interface BasePercentileInput {
  sex: BiologicalSex;
  birthDate: string | Date;
  measuredAt: string | Date;
  gestationalAgeWeeks?: number | null;
  useCorrectedAge?: boolean;
}

export interface CalculateWeightForAgeInput
  extends BasePercentileInput {
  weightKg: number;
}

export interface CalculateLengthForAgeInput
  extends BasePercentileInput {
  lengthCm: number;
}

export interface CalculateHeadCircumferenceForAgeInput
  extends BasePercentileInput {
  headCircumferenceCm: number;
}

interface CalculatePercentileInput
  extends BasePercentileInput {
  metric: WhoGrowthMetric;
  value: number;
}

function getDataset(
  metric: WhoGrowthMetric,
  sex: BiologicalSex,
): WhoLmsRow[] {
  if (metric === "weightForAge") {
    return sex === "male"
      ? weightForAgeBoys
      : weightForAgeGirls;
  }

  if (metric === "lengthForAge") {
    return sex === "male"
      ? lengthForAgeBoys
      : lengthForAgeGirls;
  }

  return sex === "male"
    ? headCircumferenceForAgeBoys
    : headCircumferenceForAgeGirls;
}

function calculatePercentile({
  metric,
  value,
  sex,
  birthDate,
  measuredAt,
  gestationalAgeWeeks,
  useCorrectedAge = true,
}: CalculatePercentileInput): WhoGrowthResult {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      "WHO growth measurement must be a positive number",
    );
  }

  const age = calculateGrowthAgeDays({
    birthDate,
    measuredAt,
    gestationalAgeWeeks,
    useCorrectedAge,
  });

  const dataset = getDataset(metric, sex);

  if (dataset.length === 0) {
    throw new Error(
      `WHO dataset has not been loaded for ${metric}`,
    );
  }

  const firstAge = dataset[0].ageDays;
  const lastAge =
    dataset[dataset.length - 1].ageDays;

  if (
    age.correctedAgeDays < firstAge ||
    age.correctedAgeDays > lastAge
  ) {
    throw new Error(
      `Age ${age.correctedAgeDays} days is outside the WHO dataset range`,
    );
  }

  const row = interpolateLmsRow(
    dataset,
    age.correctedAgeDays,
  );

  const zScore = calculateLmsZScore(
    value,
    row,
  );

  return {
    metric,
    sex,
    chronologicalAgeDays:
      age.chronologicalAgeDays,
    correctedAgeDays:
      age.correctedAgeDays,
    value,
    zScore,
    percentile:
      zScoreToPercentile(zScore),
    usedCorrectedAge:
      age.usedCorrectedAge,
  };
}

export function calculateWeightForAgePercentile({
  weightKg,
  ...input
}: CalculateWeightForAgeInput): WhoGrowthResult {
  return calculatePercentile({
    ...input,
    metric: "weightForAge",
    value: weightKg,
  });
}

export function calculateLengthForAgePercentile({
  lengthCm,
  ...input
}: CalculateLengthForAgeInput): WhoGrowthResult {
  return calculatePercentile({
    ...input,
    metric: "lengthForAge",
    value: lengthCm,
  });
}

export function calculateHeadCircumferenceForAgePercentile({
  headCircumferenceCm,
  ...input
}: CalculateHeadCircumferenceForAgeInput): WhoGrowthResult {
  return calculatePercentile({
    ...input,
    metric: "headCircumferenceForAge",
    value: headCircumferenceCm,
  });
}
