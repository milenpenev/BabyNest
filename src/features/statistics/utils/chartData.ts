import type { DailyStatistics } from "../../utils/statistics";

export interface StatisticsChartPoint {
  dayKey: string;
  label: string;
  [key: string]: string | number;
}

export interface DailySleepChartPoint extends StatisticsChartPoint {
  daySleepMinutes: number;
  nightSleepMinutes: number;
}

export interface DailyFeedingChartPoint extends StatisticsChartPoint {
  breastfeedingMinutes: number;
  bottleMl: number;
  feedingCount: number;
}

export interface DailyDiaperChartPoint extends StatisticsChartPoint {
  wet: number;
  dirty: number;
  mixed: number;
  total: number;
}

export function buildDailySleepChartData(days: DailyStatistics[], formatLabel: (date: Date) => string): DailySleepChartPoint[] {
  return days.map((day) => ({ dayKey: day.dateKey, label: formatLabel(day.date), daySleepMinutes: Math.round(day.daySleepMilliseconds / 6000) / 10, nightSleepMinutes: Math.round(day.nightSleepMilliseconds / 6000) / 10 }));
}

export function buildDailyFeedingChartData(days: DailyStatistics[], formatLabel: (date: Date) => string): DailyFeedingChartPoint[] {
  return days.map((day) => ({ dayKey: day.dateKey, label: formatLabel(day.date), breastfeedingMinutes: Math.round(day.breastfeedingMilliseconds / 6000) / 10, bottleMl: day.bottleAmountMl, feedingCount: day.feedingCount }));
}

export function buildDailyDiaperChartData(days: DailyStatistics[], formatLabel: (date: Date) => string): DailyDiaperChartPoint[] {
  return days.map((day) => ({ dayKey: day.dateKey, label: formatLabel(day.date), wet: day.wetDiapers, dirty: day.dirtyDiapers, mixed: day.mixedDiapers, total: day.diaperCount }));
}

export function assertChartDataKeys(data: StatisticsChartPoint[], requiredKeys: string[]) {
  if (!import.meta.env.DEV) return;
  for (const row of data) {
    for (const key of requiredKeys) {
      if (typeof row[key] !== "number" || !Number.isFinite(row[key])) console.warn(`[BabyNest] Invalid chart value for ${key} in ${row.dayKey}`);
    }
  }
}
