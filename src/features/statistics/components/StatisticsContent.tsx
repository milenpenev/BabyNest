import { BarChart3, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

import { useActivityStore } from "../../../store/activityStore";
import { useBabyStore } from "../../../store/babyStore";
import { buildStatisticsSnapshot, type StatisticsPeriod } from "../../utils/statistics";
import StatisticsTabs from "./StatisticsTabs";
import SleepStatisticsCard from "./SleepStatisticsCard";
import FeedingStatisticsCard from "./FeedingStatisticsCard";
import DiaperStatisticsCard from "./DiaperStatisticsCard";
import GrowthSummaryCard from "./GrowthSummaryCard";
import InsightsCard from "./InsightsCard";
import { getStatisticsRange } from "../utils/statisticsPeriod";
import { getLiveDiaperStatus } from "../utils/diaperInsights";
import MilestoneStatisticsCard from "../../milestones/components/MilestoneStatisticsCard";

export default function StatisticsContent() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<StatisticsPeriod>("7d");
  const activities = useActivityStore((state) => state.activities);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const selectedActivities = useMemo(() => selectedBabyId ? activities.filter((activity) => activity.babyId === selectedBabyId) : activities, [activities, selectedBabyId]);
  const now = new Date();
  const range = getStatisticsRange(period, now);
  const stats = buildStatisticsSnapshot(selectedActivities, period, now);
  const liveDiaperStatus = getLiveDiaperStatus(activities, selectedBabyId, range, now);

  return (
    <div>
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-6 text-white shadow-xl shadow-violet-200/60 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur">
              <Crown className="h-4 w-4 text-amber-300" />
              Premium+
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("dashboard.statistics")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
              {t("premium.statisticsDescription")}
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
            <BarChart3 className="h-8 w-8" />
          </div>
        </div>
      </section>

      <div className="mt-6"><StatisticsTabs period={period} onChange={setPeriod} /></div>
      <div className="mt-6 space-y-6">
        <SleepStatisticsCard stats={stats} />
        <div className="grid gap-6 xl:grid-cols-2"><FeedingStatisticsCard stats={stats} /><DiaperStatisticsCard stats={stats} /></div>
        <GrowthSummaryCard activities={selectedActivities} babyId={selectedBabyId} range={range} />
        <MilestoneStatisticsCard />
        <InsightsCard stats={stats} liveDiaperStatus={liveDiaperStatus} />
      </div>
    </div>
  );
}
