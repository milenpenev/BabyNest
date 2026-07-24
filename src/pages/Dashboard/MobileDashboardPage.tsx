import { useTranslation } from "react-i18next";

import ActivityHistory from "../../components/activity/ActivityHistory";
import BreastfeedingCard from "../../components/activity/BreastfeedingCard";
import MobileDashboardHero from "../../components/mobile/MobileDashboardHero";
import MobileQuickActions from "../../components/mobile/MobileQuickActions";
import SummaryCards from "../../components/dashboard/SummaryCards";
import PremiumGate from "../../components/premium/PremiumGate";
import StatisticsOverview from "../../components/statistics/StatisticsOverview";

import CoachCard from "../../features/coach/components/CoachCard";
import MemoryDashboardCard from "../../features/memories/components/MemoryDashboardCard";
import MilestoneDashboardCard from "../../features/milestones/components/MilestoneDashboardCard";
import UpcomingReminderCard from "../../features/reminders/components/UpcomingReminderCard";
import SleepCard from "../../features/sleep/components/SleepCard";

import { useSubscriptionStore } from "../../store/subscriptionStore";

/**
 * Native-only Dashboard presentation.
 *
 * Quick Add is intentionally omitted because the mobile bottom navigation
 * already provides the central Quick Add button.
 */
export default function MobileDashboardPage() {
  const { t } = useTranslation();

  const plan = useSubscriptionStore(
    (state) => state.plan,
  );

  const isPremium = plan === "premium";

  return (
    <main className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid w-full max-w-2xl gap-3 px-3 py-3 pb-28">
        <MobileDashboardHero />

        <MobileQuickActions />

        <section>
          <ActivityHistory
            compact
            maxEntries={8}
            showViewAll
          />
        </section>

        <section
          className="grid gap-3"
          aria-label={t("dashboard.tracking")}
        >
          <SleepCard />
          <BreastfeedingCard />
        </section>

        <section>
          <SummaryCards />
        </section>

        <section>
          <UpcomingReminderCard />
        </section>

        <section className="grid gap-3">
          <CoachCard />
          <MemoryDashboardCard />
          <MilestoneDashboardCard />
        </section>

        <section>
          {isPremium ? (
            <StatisticsOverview />
          ) : (
            <PremiumGate
              preview={<StatisticsOverview />}
              title={t(
                "premium.dashboardStatisticsTitle",
              )}
              description={t(
                "premium.dashboardStatisticsDescription",
              )}
            >
              <StatisticsOverview />
            </PremiumGate>
          )}
        </section>
      </div>
    </main>
  );
}
