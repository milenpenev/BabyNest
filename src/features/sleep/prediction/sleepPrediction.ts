import type { Activity } from "../../../entities/activity/model/activity.types";
import type { Baby } from "../../../entities/baby/model/baby.types";
import {
  deriveWakeWindows,
  filterOutliers,
  getLatestSleepRecord,
  getSleepPeriod,
  weightedAverage,
} from "./wakeWindows";
import type { SleepPrediction, WakeWindowRecord } from "./sleepPrediction.types";

function getCorrectedAgeWeeks(birthday: string, gestationalWeek?: number) {
  const birthdayDate = new Date(birthday);

  if (Number.isNaN(birthdayDate.getTime())) {
    return 0;
  }

  const chronologicalWeeks = Math.max(0, Math.floor((Date.now() - birthdayDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const prematureWeeks = gestationalWeek ? Math.max(0, 40 - gestationalWeek) : 0;

  return Math.max(0, chronologicalWeeks - prematureWeeks);
}

/**
 * Това е ориентировъчна продуктова оценка, а не медицинска
 * препоръка.
 */
export function getAgeBasedWakeWindowSeconds(correctedAgeWeeks: number) {
  if (correctedAgeWeeks <= 6) return 60 * 60;
  if (correctedAgeWeeks <= 10) return 75 * 60;
  if (correctedAgeWeeks <= 14) return 90 * 60;
  if (correctedAgeWeeks <= 18) return 105 * 60;
  if (correctedAgeWeeks <= 24) return 120 * 60;
  if (correctedAgeWeeks <= 32) return 150 * 60;

  return 180 * 60;
}

function getRecommendedWakeWindowSeconds(
  wakeWindows: WakeWindowRecord[],
  baby: Baby,
): { seconds: number; source: SleepPrediction["source"]; average: number | null; samePeriodCount: number } {
  const ageBasedSeconds = getAgeBasedWakeWindowSeconds(getCorrectedAgeWeeks(baby.birthday, baby.gestationalWeek));
  const validWakeWindows = wakeWindows.filter((window) => window.durationSeconds > 0);

  if (validWakeWindows.length >= 5) {
    const filteredValues = filterOutliers(validWakeWindows.map((window) => window.durationSeconds));
    const values = filteredValues.length >= 2 ? filteredValues : validWakeWindows.map((window) => window.durationSeconds);
    const weights = values.map((_, index) => values.length - index);
    const weightedValue = weightedAverage(values, weights);

    return {
      seconds: Math.min(4 * 60 * 60, Math.max(30 * 60, weightedValue)),
      source: "personal-history",
      average: weightedValue,
      samePeriodCount: 0,
    };
  }

  if (validWakeWindows.length >= 2) {
    const filteredValues = filterOutliers(validWakeWindows.map((window) => window.durationSeconds));
    const values = filteredValues.length >= 2 ? filteredValues : validWakeWindows.map((window) => window.durationSeconds);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const blended = (average * 0.7) + (ageBasedSeconds * 0.3);

    return {
      seconds: Math.min(4 * 60 * 60, Math.max(30 * 60, blended)),
      source: "blended",
      average: blended,
      samePeriodCount: 0,
    };
  }

  return {
    seconds: Math.min(4 * 60 * 60, Math.max(30 * 60, ageBasedSeconds)),
    source: "age-fallback",
    average: ageBasedSeconds,
    samePeriodCount: 0,
  };
}

function calculateConfidence(
  wakeWindows: WakeWindowRecord[],
  samePeriodWindows: WakeWindowRecord[],
  source: SleepPrediction["source"],
  lastRecordAgeHours: number | null,
) {
  const count = wakeWindows.length;

  if (count === 0) {
    return 35;
  }

  const values = wakeWindows.map((window) => window.durationSeconds);
  const variation = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
  const consistencyScore = values.length > 1 ? Math.max(0, 20 - variation / 180) : 0;
  const countScore = count >= 8 ? 22 : count >= 5 ? 16 : count >= 2 ? 10 : 0;
  const samePeriodScore = samePeriodWindows.length >= 3 ? 12 : 0;
  const freshnessScore = lastRecordAgeHours === null ? 0 : lastRecordAgeHours <= 24 ? 8 : lastRecordAgeHours <= 48 ? 4 : 0;
  const stalenessPenalty = lastRecordAgeHours !== null && lastRecordAgeHours > 48 ? 15 : 0;
  const fallbackPenalty = source === "age-fallback" ? 10 : 0;
  const baseScore = count >= 8 ? 70 : count >= 5 ? 60 : count >= 2 ? 45 : 35;

  const confidence = baseScore + countScore + consistencyScore + samePeriodScore + freshnessScore - stalenessPenalty - fallbackPenalty;

  return Math.min(95, Math.max(30, confidence));
}

export function buildSleepPrediction(
  activities: Activity[],
  baby: Baby | null,
  _activeSleep: { startedAt: string; pausedAt: string | null; totalPausedMilliseconds: number } | null,
  now: Date,
): SleepPrediction {
  if (!baby) {
    return {
      recommendedWakeWindowSeconds: 60 * 60,
      nextSleepAt: null,
      countdownSeconds: null,
      confidence: 30,
      source: "age-fallback",
      validWakeWindowCount: 0,
      samePeriodWindowCount: 0,
      averageWakeWindowSeconds: null,
      isOverdue: false,
    };
  }

  const wakeWindows = deriveWakeWindows(activities, baby.id);
  const latestSleep = getLatestSleepRecord(activities, baby.id);
  const latestSleepEndedAt = latestSleep?.endedAt ? new Date(latestSleep.endedAt) : null;
  const lastRecordAgeHours = latestSleepEndedAt ? Math.max(0, (now.getTime() - latestSleepEndedAt.getTime()) / 3_600_000) : null;

  const recommendation = getRecommendedWakeWindowSeconds(wakeWindows, baby);
  const period = getSleepPeriod(now);
  const samePeriodWindows = wakeWindows.filter((window) => getSleepPeriod(new Date(window.startedAt)) === period);
  const selectedSource = samePeriodWindows.length >= 3 ? "time-of-day-history" : recommendation.source;
  const finalSeconds = samePeriodWindows.length >= 3 ? Math.min(4 * 60 * 60, Math.max(30 * 60, weightedAverage(samePeriodWindows.map((window) => window.durationSeconds), samePeriodWindows.map((_, index) => samePeriodWindows.length - index)))) : recommendation.seconds;
  const confidence = calculateConfidence(wakeWindows, samePeriodWindows, selectedSource, lastRecordAgeHours);
  const nextSleepAt = latestSleepEndedAt ? new Date(latestSleepEndedAt.getTime() + finalSeconds * 1000) : null;
  const countdownSeconds = nextSleepAt ? Math.floor((nextSleepAt.getTime() - now.getTime()) / 1000) : null;

  return {
    recommendedWakeWindowSeconds: finalSeconds,
    nextSleepAt,
    countdownSeconds,
    confidence: Math.min(95, Math.max(30, confidence)),
    source: selectedSource,
    validWakeWindowCount: wakeWindows.length,
    samePeriodWindowCount: samePeriodWindows.length,
    averageWakeWindowSeconds: wakeWindows.length > 0 ? wakeWindows.reduce((sum, window) => sum + window.durationSeconds, 0) / wakeWindows.length : null,
    isOverdue: countdownSeconds !== null && countdownSeconds <= 0,
  };
}
