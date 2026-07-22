import type { WakeWindowRecord } from "./sleepPrediction.types";

function getPeriodLabel(period: string, t: (key: string, options?: Record<string, string | number | boolean>) => string) {
  const labels: Record<string, string> = {
    morning: t("sleep.predictionPeriodMorning"),
    afternoon: t("sleep.predictionPeriodAfternoon"),
    evening: t("sleep.predictionPeriodEvening"),
    night: t("sleep.predictionPeriodNight"),
  };

  return labels[period] ?? period;
}

export function buildSleepInsights(
  wakeWindows: WakeWindowRecord[],
  currentPeriod: string,
  t: (key: string, options?: Record<string, string | number | boolean>) => string,
) {
  if (wakeWindows.length === 0) {
    return [t("sleep.insightNeedMoreData")];
  }

  const durations = wakeWindows.map((window) => window.durationSeconds);
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const latest = wakeWindows[wakeWindows.length - 1];
  const samePeriod = wakeWindows.filter((window) => {
    const date = new Date(window.startedAt);
    const hour = date.getHours();

    if (hour >= 5 && hour <= 11) {
      return currentPeriod === "morning";
    }

    if (hour >= 12 && hour <= 17) {
      return currentPeriod === "afternoon";
    }

    if (hour >= 18 && hour <= 23) {
      return currentPeriod === "evening";
    }

    return currentPeriod === "night";
  });

  const insights = [] as string[];

  if (wakeWindows.length >= 5) {
    insights.push(t("sleep.insightConsistentWindows"));
  }

  if (samePeriod.length >= 2) {
    insights.push(t("sleep.insightPeriodPattern", { period: getPeriodLabel(currentPeriod, t) }));
  }

  if (latest && latest.durationSeconds > average) {
    insights.push(t("sleep.insightCurrentLonger"));
  }

  if (wakeWindows.length < 3) {
    insights.push(t("sleep.insightNeedMoreData"));
  }

  return insights.length > 0 ? insights : [t("sleep.insightNeedMoreData")];
}
