import { diaper } from "@lucide/lab";
import { BarChart3, BedDouble, BrainCircuit, Icon, Milk } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { buildSleepPrediction } from "../../features/sleep/prediction/sleepPrediction";
import StatisticsCharts from "../../features/statistics/components/StatisticsCharts";
import { buildDailyDiaperChartData, buildDailyFeedingChartData, buildDailySleepChartData } from "../../features/statistics/utils/chartData";
import { buildStatisticsSnapshot, formatDurationLabel } from "../../features/utils/statistics";
import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";
import StatisticsMetricCard from "./StatisticsMetricCard";

export default function StatisticsOverview() {
  const { t, i18n } = useTranslation();
  const activities = useActivityStore((state) => state.activities);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const babies = useBabyStore((state) => state.babies);
  const selectedBaby = babies.find((baby) => baby.id === selectedBabyId) ?? null;
  const selectedActivities = useMemo(() => selectedBabyId ? activities.filter((activity) => activity.babyId === selectedBabyId) : [], [activities, selectedBabyId]);
  const stats = useMemo(() => buildStatisticsSnapshot(selectedActivities, "7d"), [selectedActivities]);
  const locale = i18n.language === "bg" ? "bg-BG" : "en-GB";
  const labelDate = (date: Date) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }).format(date);
  const sleepData = buildDailySleepChartData(stats.dailySeries, labelDate);
  const feedingData = buildDailyFeedingChartData(stats.dailySeries, labelDate);
  const diaperData = buildDailyDiaperChartData(stats.dailySeries, labelDate);
  const prediction = useMemo(() => selectedBaby ? buildSleepPrediction(activities, selectedBaby, null, new Date()) : null, [activities, selectedBaby]);
  const duration = (milliseconds: number) => formatDurationLabel(milliseconds, i18n.language);
  const chartCard = "rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800";

  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
    <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><BarChart3 className="h-5 w-5" /></div><div><h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t("dashboard.statistics")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("dashboard.lastSevenDays")}</p></div></div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <article className={chartCard}><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.totalSleep")}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{duration(stats.totalSleepMilliseconds)}</p></div><BedDouble className="h-5 w-5 text-indigo-600" /></div><StatisticsCharts data={sleepData} series={[{ dataKey: "daySleepMinutes", label: t("statistics.daySleep"), className: "bg-sky-500", formatValue: (value) => duration(value * 60_000) }, { dataKey: "nightSleepMinutes", label: t("statistics.nightSleep"), className: "bg-indigo-600", formatValue: (value) => duration(value * 60_000) }]} hasRecords={stats.totalSleepMilliseconds > 0} emptyLabel={t("dashboard.noSleepSevenDays")} zeroLabel={t("statistics.zeroChartData")} /></article>
      <article className={chartCard}><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.totalFeedings")}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFeedings}</p></div><Milk className="h-5 w-5 text-pink-600" /></div><StatisticsCharts data={feedingData} series={[{ dataKey: "feedingCount", label: t("statistics.totalFeedings"), className: "bg-pink-500" }, { dataKey: "breastfeedingMinutes", label: t("activity.breastfeeding"), className: "bg-violet-500", formatValue: (value) => duration(value * 60_000) }]} hasRecords={stats.totalFeedings > 0} emptyLabel={t("dashboard.noFeedingSevenDays")} zeroLabel={t("statistics.zeroChartData")} /></article>
      <article className={chartCard}><div><p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.bottleAmount")}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.dailySeries.reduce((sum, day) => sum + day.bottleAmountMl, 0)} ml</p></div><StatisticsCharts data={feedingData} series={[{ dataKey: "bottleMl", label: t("statistics.bottleAmountChart"), className: "bg-emerald-500", formatValue: (value) => `${value} ml` }]} hasRecords={stats.bottleCount > 0} emptyLabel={t("dashboard.noFeedingSevenDays")} zeroLabel={t("statistics.zeroChartData")} /></article>
      <article className={chartCard}><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.totalDiapers")}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.totalDiapers}</p></div><Icon iconNode={diaper} className="h-5 w-5 text-amber-600" /></div><StatisticsCharts data={diaperData} series={[{ dataKey: "wet", label: t("statistics.wet"), className: "bg-sky-500" }, { dataKey: "dirty", label: t("statistics.dirty"), className: "bg-amber-600" }, { dataKey: "mixed", label: t("statistics.mixed"), className: "bg-violet-600" }]} hasRecords={stats.totalDiapers > 0} emptyLabel={t("dashboard.noDiaperSevenDays")} zeroLabel={t("statistics.zeroChartData")} /></article>
    </div>

    <div className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><StatisticsMetricCard label={t("sleepSegments.averageDayNap")} value={duration(stats.averageDayNapMilliseconds)} /><StatisticsMetricCard label={t("sleepSegments.dayNaps")} value={stats.dayNapCount} /><StatisticsMetricCard label={t("sleepSegments.longestDayNap")} value={duration(stats.longestDayNapMilliseconds)} /><StatisticsMetricCard label={t("sleepSegments.averageNightlySleep")} value={duration(stats.averageNightlySleepMilliseconds)} /><StatisticsMetricCard label={t("sleepSegments.longestNightSleep")} value={duration(stats.longestNightSleepMilliseconds)} /><StatisticsMetricCard label={t("sleepSegments.nightsRecorded")} value={stats.nightsRecorded} /></div></div>

    <div className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><BrainCircuit className="h-5 w-5 text-violet-600" /><div><h3 className="font-semibold text-slate-900 dark:text-white">{t("sleep.predictionCurrentRecommended")}</h3><p className="text-sm text-slate-500 dark:text-slate-400">{prediction ? duration(prediction.recommendedWakeWindowSeconds * 1000) : t("sleep.predictionInsufficientData")}</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><StatisticsMetricCard label={t("sleep.predictionCountLabel")} value={prediction?.validWakeWindowCount ?? 0} /><StatisticsMetricCard label={t("sleep.predictionAverageWakeWindow")} value={prediction?.averageWakeWindowSeconds ? duration(prediction.averageWakeWindowSeconds * 1000) : "—"} /><StatisticsMetricCard label={t("sleep.predictionConfidence")} value={prediction ? `${Math.round(prediction.confidence)}%` : "—"} /></div></div>
  </section>;
}
