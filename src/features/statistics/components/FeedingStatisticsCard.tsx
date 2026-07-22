import { Milk, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { StatisticsSnapshot } from "../../utils/statistics";
import { formatDurationLabel } from "../../utils/statistics";
import StatisticsCharts from "./StatisticsCharts";
import { assertChartDataKeys, buildDailyFeedingChartData } from "../utils/chartData";

interface MetricTileProps {
  label: string;
  value: string;
}

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="break-words text-xs font-medium uppercase tracking-wide text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default function FeedingStatisticsCard({
  stats,
}: {
  stats: StatisticsSnapshot;
}) {
  const { t, i18n } = useTranslation();

  const locale = i18n.language === "bg" ? "bg-BG" : "en-GB";

  const chartData = buildDailyFeedingChartData(stats.dailySeries, (date) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(date),
  );
  assertChartDataKeys(chartData, ["feedingCount", "breastfeedingMinutes", "bottleMl"]);

  const breastRatio = stats.totalFeedings
    ? Math.round((stats.breastfeedingCount / stats.totalFeedings) * 100)
    : 0;
  const bottleRatio = stats.totalFeedings
    ? Math.round((stats.bottleCount / stats.totalFeedings) * 100)
    : 0;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            <Milk className="h-4 w-4" />
            {t("statistics.feeding")}
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("dashboard.totalFeedings")}
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label={t("statistics.totalFeedings")}
          value={String(stats.totalFeedings)}
        />
        <MetricTile
          label={t("statistics.breastVsBottle")}
          value={`${breastRatio}% / ${bottleRatio}%`}
        />
        <MetricTile
          label={t("statistics.averageFeedingDuration")}
          value={formatDurationLabel(stats.averageFeedingDurationMilliseconds, i18n.language)}
        />
        <MetricTile
          label={t("statistics.averageBottleAmount")}
          value={`${Math.round(stats.averageBottleAmountMl)} ml`}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4" />
            {t("statistics.feedingsChart")}
          </div>
          <StatisticsCharts
            data={chartData}
            series={[{ dataKey: "feedingCount", label: t("statistics.totalFeedings"), className: "bg-emerald-500" }]}
            hasRecords={stats.totalFeedings > 0}
            emptyLabel={t("dashboard.noStatisticsData")}
            zeroLabel={t("statistics.zeroChartData")}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Milk className="h-4 w-4" />
            {t("statistics.bottleAmountChart")}
          </div>
          <StatisticsCharts
            data={chartData}
            series={[{ dataKey: "bottleMl", label: t("statistics.bottleAmountChart"), className: "bg-sky-500", formatValue: (value) => `${value} ml` }]}
            hasRecords={stats.bottleCount > 0}
            emptyLabel={t("dashboard.noStatisticsData")}
            zeroLabel={t("statistics.zeroChartData")}
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-violet-50/70 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-violet-950/40 dark:text-slate-200">
        <p className="font-semibold">
          {t("statistics.leftVsRight")}
        </p>
        <p className="mt-1">
          {t("statistics.leftBreast")}: {formatDurationLabel(stats.leftBreastMilliseconds, i18n.language)} · {t("statistics.rightBreast")}: {formatDurationLabel(stats.rightBreastMilliseconds, i18n.language)}
        </p>
      </div>
    </section>
  );
}
