import ActivityHistory from "../../components/activity/ActivityHistory";
import BreastfeedingCard from "../../components/activity/BreastfeedingCard";
import QuickAddLauncher from "../../components/activity/QuickAddLauncher";
import DashboardHero from "../../components/dashboard/DashboardHero";
import SummaryCards from "../../components/dashboard/SummaryCards";
import PremiumGate from "../../components/premium/PremiumGate";
import StatisticsOverview from "../../components/statistics/StatisticsOverview";
import SleepCard from "../../features/sleep/components/SleepCard";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { useTranslation } from "react-i18next";
import UpcomingReminderCard from "../../features/reminders/components/UpcomingReminderCard";
import MilestoneDashboardCard from "../../features/milestones/components/MilestoneDashboardCard";
import CoachCard from "../../features/coach/components/CoachCard";
import MemoryDashboardCard from "../../features/memories/components/MemoryDashboardCard";

export default function DashboardPage() {
  const { t } = useTranslation();
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );

  const isPremium = plan === "premium";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHero />

        <SummaryCards />
        <UpcomingReminderCard />

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <SleepCard />
          <BreastfeedingCard />
        </div>

        <div className="mt-8">
          <QuickAddLauncher />
        </div>

        <ActivityHistory />
        <MemoryDashboardCard />

        <CoachCard />
        <MilestoneDashboardCard />

        {isPremium ? (
          <StatisticsOverview />
        ) : (
          <div className="mt-8">
            <PremiumGate
              preview={<StatisticsOverview />}
              title={t("premium.dashboardStatisticsTitle")}
              description={t(
              "premium.dashboardStatisticsDescription",
            )}
            >
              <StatisticsOverview />
            </PremiumGate>
          </div>
        )}
      </div>
    </main>
  );
}
