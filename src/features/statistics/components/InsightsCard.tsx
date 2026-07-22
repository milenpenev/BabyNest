import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { StatisticsSnapshot } from "../../utils/statistics";
import type { LiveDiaperStatus } from "../utils/diaperInsights";
import { formatDurationLabel } from "../../utils/statistics";

export default function InsightsCard({
  stats,
  liveDiaperStatus,
}: {
  stats: StatisticsSnapshot;
  liveDiaperStatus: LiveDiaperStatus;
}) {
  const { t, i18n } = useTranslation();

  const historicalInsights = [
    stats.sleepTrendPercent !== 0
      ? {
          text:
            stats.sleepTrendPercent > 0
              ? t("statistics.insightSleepLonger", {
                  percent: Math.abs(stats.sleepTrendPercent),
                })
              : t("statistics.insightSleepShorter", {
                  percent: Math.abs(stats.sleepTrendPercent),
                }),
        }
      : null,
    stats.averageWakeWindowMinutes > 0
      ? {
          text: t("statistics.insightWakeWindow", {
            minutes: stats.averageWakeWindowMinutes,
          }),
        }
      : null,
    stats.bottleTrendPercent !== 0
      ? {
          text:
            stats.bottleTrendPercent > 0
              ? t("statistics.insightBottleMore", {
                  percent: Math.abs(stats.bottleTrendPercent),
                })
              : t("statistics.insightBottleLess", {
                  percent: Math.abs(stats.bottleTrendPercent),
                }),
        }
      : null,
    stats.averageDiaperIntervalSeconds !== null
      ? { text: t("statistics.insightAverageDiaperInterval", { duration: formatDurationLabel(stats.averageDiaperIntervalSeconds * 1000, i18n.language) }) }
      : null,
  ].filter(Boolean) as Array<{ text: string }>;

  const liveInsights = [
    liveDiaperStatus.secondsSinceLatest !== null && liveDiaperStatus.secondsSinceLatest >= 4 * 60 * 60
      ? {
          text: t("statistics.insightLiveDiaper", {
            duration: formatDurationLabel(liveDiaperStatus.secondsSinceLatest * 1000, i18n.language),
          }),
        }
      : null,
  ].filter(Boolean) as Array<{ text: string }>;

  const insightGroups = [
    { title: t("statistics.liveInsights"), insights: liveInsights },
    { title: t("statistics.historicalInsights"), insights: historicalInsights },
  ].filter((group) => group.insights.length > 0);

  const fallbackInsight = t("statistics.insightBaseline");

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("statistics.smartInsights")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("statistics.smartInsightsDescription")}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {insightGroups.length > 0 ? insightGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {group.title}
            </h3>
            <div className="space-y-3">
              {group.insights.map((insight, index) => (
                <div
                  key={`${insight.text}-${index}`}
                  className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm leading-6 text-slate-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-slate-200"
                >
                  {insight.text}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm leading-6 text-slate-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-slate-200">
            {fallbackInsight}
          </div>
        )}
      </div>
    </section>
  );
}
