import { BedDouble, Clock3, Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import FeaturePageHeader from "../../../components/feature/FeaturePageHeader";
import FeatureHistorySection from "../../../components/feature/FeatureHistorySection";
import MetricCard from "../../../components/feature/MetricCard";
import PremiumGate from "../../../components/premium/PremiumGate";
import { useActivityStore } from "../../../store/activityStore";
import { useBabyStore } from "../../../store/babyStore";
import StatisticsCharts from "../../statistics/components/StatisticsCharts";
import StatisticsTabs from "../../statistics/components/StatisticsTabs";
import { buildDailySleepChartData } from "../../statistics/utils/chartData";
import { getStatisticsRange } from "../../statistics/utils/statisticsPeriod";
import { buildStatisticsSnapshot, formatDurationLabel, type StatisticsPeriod } from "../../utils/statistics";
import SleepCard from "../components/SleepCard";

export default function SleepPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<StatisticsPeriod>("7d");
  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const allActivities = useActivityStore((state) => state.activities);
  const baby = babies.find((item) => item.id === selectedBabyId) ?? null;
  const activities = useMemo(() => selectedBabyId ? allActivities.filter((activity) => activity.babyId === selectedBabyId) : [], [allActivities, selectedBabyId]);
  const now = new Date();
  const range = getStatisticsRange(period, now);
  const stats = buildStatisticsSnapshot(activities, period, now);
  const sleeps = activities.filter((activity) => activity.type === "sleep" && !Number.isNaN(new Date(activity.startedAt).getTime())).sort((first, second) => new Date(second.startedAt).getTime() - new Date(first.startedAt).getTime());
  const latest = sleeps[0];
  const latestWakeMs = latest?.endedAt ? Math.max(0, now.getTime() - new Date(latest.endedAt).getTime()) : 0;
  const formatDuration = (milliseconds: number) => formatDurationLabel(milliseconds, i18n.language);
  const chartData = buildDailySleepChartData(stats.dailySeries, (date) => new Intl.DateTimeFormat(i18n.language === "bg" ? "bg-BG" : "en-GB", { day: "numeric", month: "short" }).format(date));
  const chart = <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6"><h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("sleepPage.chart")}</h2><div className="mt-5"><StatisticsCharts data={chartData} series={[{ dataKey: "daySleepMinutes", label: t("statistics.daySleep"), className: "bg-sky-500", formatValue: (value) => formatDuration(value * 60_000) }, { dataKey: "nightSleepMinutes", label: t("statistics.nightSleep"), className: "bg-indigo-600", formatValue: (value) => formatDuration(value * 60_000) }]} hasRecords={stats.totalSleepMilliseconds > 0} emptyLabel={t("sleepPage.noSleep")} zeroLabel={t("statistics.zeroChartData")} /></div></section>;

  return <main className="space-y-6">
    <FeaturePageHeader icon={BedDouble} title={t("sleepPage.title")} description={t("sleepPage.description")} babyName={baby?.name ?? null} latest={latest ? t("sleepPage.latest", { duration: formatDuration(latestWakeMs) }) : t("sleepPage.noSleep")} />
    <StatisticsTabs period={period} onChange={setPeriod} />
    <SleepCard />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label={t("statistics.totalSleep")} value={formatDuration(stats.totalSleepMilliseconds)} icon={<Clock3 className="h-4 w-4" />} />
      <MetricCard label={t("statistics.daySleep")} value={formatDuration(stats.daySleepMilliseconds)} hint={`${stats.daySleepPercentage}%`} icon={<Sun className="h-4 w-4" />} />
      <MetricCard label={t("statistics.nightSleep")} value={formatDuration(stats.nightSleepMilliseconds)} hint={`${stats.nightSleepPercentage}%`} icon={<Moon className="h-4 w-4" />} />
      <MetricCard label={t("sleepPage.sessions")} value={String(stats.napCount)} hint={t("sleepPage.average", { duration: formatDuration(stats.averageNapDurationMilliseconds) })} />
      <MetricCard label={t("sleepPage.longest")} value={formatDuration(stats.longestNapMilliseconds)} />
      <MetricCard label={t("sleepPage.dayNaps")} value={String(stats.dayNapCount)} hint={t("sleepPage.average", { duration: formatDuration(stats.averageDayNapMilliseconds) })} />
      <MetricCard label={t("sleepPage.recordedNights")} value={String(stats.nightsRecorded)} hint={t("sleepPage.average", { duration: formatDuration(stats.averageNightlySleepMilliseconds) })} />
      <MetricCard label={t("sleepPage.averageWake")} value={stats.averageWakeWindowMinutes ? formatDuration(stats.averageWakeWindowMinutes * 60_000) : "—"} />
      <MetricCard label={t("sleepPage.latestWake")} value={latest?.endedAt ? formatDuration(latestWakeMs) : "—"} />
    </div>
    <PremiumGate title={t("sleepPage.premiumTitle")} description={t("sleepPage.premiumDescription")} preview={chart}>{chart}</PremiumGate>
    <FeatureHistorySection activities={activities} types={["sleep"]} range={range} title={t("sleepPage.history")} />
  </main>;
}
