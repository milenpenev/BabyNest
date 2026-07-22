import { Baby, Droplets, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { StatisticsSnapshot } from "../../utils/statistics";
import StatisticsCharts from "./StatisticsCharts";
import { assertChartDataKeys, buildDailyDiaperChartData } from "../utils/chartData";
import { formatDurationLabel } from "../../utils/statistics";

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

export default function DiaperStatisticsCard({
  stats,
}: {
  stats: StatisticsSnapshot;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "bg" ? "bg-BG" : "en-GB";
  const chartData = buildDailyDiaperChartData(stats.dailySeries, (date) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date));
  assertChartDataKeys(chartData, ["wet", "dirty", "mixed", "total"]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
            <Baby className="h-4 w-4" />
            {t("statistics.diapers")}
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("statistics.totalDiapers")}
          </h2>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("statistics.diaperChart")}</p>
        <StatisticsCharts
          data={chartData}
          series={[
            { dataKey: "wet", label: t("statistics.wet"), className: "bg-sky-500" },
            { dataKey: "dirty", label: t("statistics.dirty"), className: "bg-amber-600" },
            { dataKey: "mixed", label: t("statistics.mixed"), className: "bg-violet-600" },
          ]}
          hasRecords={stats.totalDiapers > 0}
          emptyLabel={t("statistics.noDiaperData")}
          zeroLabel={t("statistics.zeroChartData")}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label={t("statistics.totalDiapers")}
          value={String(stats.totalDiapers)}
        />
        <MetricTile
          label={t("statistics.wet")}
          value={String(stats.wetDiapers)}
        />
        <MetricTile
          label={t("statistics.dirty")}
          value={String(stats.dirtyDiapers)}
        />
        <MetricTile
          label={t("statistics.mixed")}
          value={String(stats.mixedDiapers)}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-amber-50/70 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-amber-950/30 dark:text-slate-200">
        <div className="flex items-center gap-2 font-semibold">
          <Droplets className="h-4 w-4" />
          {t("statistics.averageInterval")}
        </div>
        <p className="mt-2">
          {stats.averageDiaperIntervalSeconds !== null
            ? formatDurationLabel(stats.averageDiaperIntervalSeconds * 1000, i18n.language)
            : t("statistics.noDiaperData")}
        </p>
        {stats.longestDiaperIntervalSeconds !== null ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statistics.longestDiaperInterval")}: {formatDurationLabel(stats.longestDiaperIntervalSeconds * 1000, i18n.language)}</p> : null}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
        <Sparkles className="h-4 w-4 text-amber-600" />
        {t("statistics.diaperHint")}
      </div>
    </section>
  );
}
