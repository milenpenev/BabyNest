import { useTranslation } from "react-i18next";

import ActivityHistory from "../../components/activity/ActivityHistory";
import BreastfeedingCard from "../../components/activity/BreastfeedingCard";
import QuickAddLauncher from "../../components/activity/QuickAddLauncher";
import DashboardHero from "../../components/dashboard/DashboardHero";
import SummaryCards from "../../components/dashboard/SummaryCards";
import PremiumGate from "../../components/premium/PremiumGate";
import StatisticsOverview from "../../components/statistics/StatisticsOverview";

import CoachCard from "../../features/coach/components/CoachCard";
import MemoryDashboardCard from "../../features/memories/components/MemoryDashboardCard";
import MilestoneDashboardCard from "../../features/milestones/components/MilestoneDashboardCard";
import UpcomingReminderCard from "../../features/reminders/components/UpcomingReminderCard";
import SleepCard from "../../features/sleep/components/SleepCard";

import { useSubscriptionStore } from "../../store/subscriptionStore";
import { isMobileExperience } from "../../platform/mobileExperience";
import MobileDashboardPage from "./MobileDashboardPage";

function DesktopDashboardPage() {
  const { t } = useTranslation();

  const plan = useSubscriptionStore((state) => state.plan);
  const isPremium = plan === "premium";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
        {/* Dashboard header */}
        <section>
          <DashboardHero />
        </section>

        {/* Daily summary */}
        <section className="mt-3 grid items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <SummaryCards />
          </div>

          <div className="min-w-0">
            <UpcomingReminderCard />
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-6">
          <QuickAddLauncher />
        </section>

        {/* Main tracking cards */}
        <section className="mt-6 grid items-stretch gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 [&>*]:w-full [&>*]:flex-1">
            <SleepCard />
          </div>
          <div className="flex min-w-0 [&>*]:w-full [&>*]:flex-1">
            <BreastfeedingCard />
          </div>
        </section>

        {/*
          Independent dashboard columns.

          Each column controls its own vertical flow, which avoids the large
          empty space caused by placing ActivityHistory and CoachCard in the
          same grid row.
        */}
        <section className="mt-2 grid items-start gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.85fr)]">
          {/* Left column */}
          <div className="grid min-w-0 content-start gap-6">
            <ActivityHistory />
            <MilestoneDashboardCard />
          </div>

          {/* Right column */}
          <aside className="grid min-w-0 content-start gap-6">
            <CoachCard />
            <MemoryDashboardCard />
          </aside>
        </section>

        {/* Statistics */}
        <section className="mt-8">
          {isPremium ? (
            <StatisticsOverview />
          ) : (
            <PremiumGate
              preview={<StatisticsOverview />}
              title={t("premium.dashboardStatisticsTitle")}
              description={t("premium.dashboardStatisticsDescription")}
            >
              <StatisticsOverview />
            </PremiumGate>
          )}
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return isMobileExperience()
    ? <MobileDashboardPage />
    : <DesktopDashboardPage />;
}
