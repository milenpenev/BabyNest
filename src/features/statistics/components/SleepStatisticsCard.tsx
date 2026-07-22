import { BedDouble, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { StatisticsSnapshot } from "../../utils/statistics";
import { formatDurationLabel } from "../../utils/statistics";
import StatisticsCharts from "./StatisticsCharts";
import { assertChartDataKeys, buildDailySleepChartData } from "../utils/chartData";

interface MetricTileProps {
  label: string;
  value: string;
}

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default function SleepStatisticsCard({
  stats,
}: {
  stats: StatisticsSnapshot;
}) {
  const { t, i18n } = useTranslation();

  const locale = i18n.language === "bg" ? "bg-BG" : "en-GB";

  const chartData = buildDailySleepChartData(stats.dailySeries, (date) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(date),
  );
  assertChartDataKeys(chartData, ["daySleepMinutes", "nightSleepMinutes"]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
            <BedDouble className="h-4 w-4" />
            {t("statistics.sleep")}
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("dashboard.totalSleep")}
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricTile
          label={t("statistics.totalSleep")}
          value={formatDurationLabel(stats.totalSleepMilliseconds, i18n.language)}
        />
        <MetricTile
          label={t("sleepSegments.daySleep")}
          value={`${formatDurationLabel(stats.daySleepMilliseconds, i18n.language)} · ${stats.daySleepPercentage}%`}
        />
        <MetricTile
          label={t("sleepSegments.nightSleep")}
          value={`${formatDurationLabel(stats.nightSleepMilliseconds, i18n.language)} · ${stats.nightSleepPercentage}%`}
        />
        <MetricTile
          label={t("sleepSegments.averageDayNap")}
          value={formatDurationLabel(stats.averageDayNapMilliseconds, i18n.language)}
        />
        <MetricTile
          label={t("sleepSegments.dayNaps")}
          value={String(stats.dayNapCount)}
        />
        <MetricTile
          label={t("sleepSegments.longestDayNap")}
          value={formatDurationLabel(stats.longestDayNapMilliseconds, i18n.language)}
        />
        <MetricTile label={t("sleepSegments.averageNightlySleep")} value={formatDurationLabel(stats.averageNightlySleepMilliseconds, i18n.language)} />
        <MetricTile label={t("sleepSegments.longestNightSleep")} value={formatDurationLabel(stats.longestNightSleepMilliseconds, i18n.language)} />
        <MetricTile label={t("sleepSegments.nightsRecorded")} value={String(stats.nightsRecorded)} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock3 className="h-4 w-4" />
          {t("statistics.sleepChart")}
        </div>

        <StatisticsCharts
          data={chartData}
          series={[
            { dataKey: "daySleepMinutes", label: t("sleepSegments.daySleep"), className: "bg-sky-500", formatValue: (value) => formatDurationLabel(value * 60_000, i18n.language) },
            { dataKey: "nightSleepMinutes", label: t("sleepSegments.nightSleep"), className: "bg-indigo-700", formatValue: (value) => formatDurationLabel(value * 60_000, i18n.language) },
          ]}
          hasRecords={stats.totalSleepMilliseconds > 0}
          emptyLabel={t("dashboard.noStatisticsData")}
          zeroLabel={t("statistics.zeroChartData")}
        />
      </div>
    </section>
  );
}
