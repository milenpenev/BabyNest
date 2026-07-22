import type { StatisticsPeriod } from "../../utils/statistics";

export interface StatisticsRange {
  start: Date;
  end: Date;
}

export function rangeIncludesNow(rangeStart: Date, rangeEnd: Date, now = new Date()) {
  return rangeStart.getTime() <= now.getTime() && now.getTime() < rangeEnd.getTime();
}

export function getStatisticsRange(period: StatisticsPeriod, now = new Date()): StatisticsRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const numberOfDays = period === "today" ? 1 : period === "7d" ? 7 : 30;
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - numberOfDays);
  return { start, end };
}
