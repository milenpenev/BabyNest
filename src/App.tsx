import { Suspense, lazy, useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import VaccinationSync from "./features/vaccinations/components/VaccinationSync";
import VaccinationCountryContext from "./features/vaccinations/components/VaccinationCountryContext";
import { useAppSettingsStore } from "./store/appSettingsStore";
import i18n from "./i18n";
import AuthRuntime from "./features/auth/components/AuthRuntime";
import NativeAuthLinkRuntime from "./features/auth/components/NativeAuthLinkRuntime";
import CloudSyncRuntime from "./features/cloud-sync/components/CloudSyncRuntime";
import RequireAuth from "./features/auth/components/RequireAuth";
import FamilySubscriptionRuntime from "./features/premium/components/FamilySubscriptionRuntime";



const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));
const StatisticsPage = lazy(() => import("./features/statistics/pages/StatisticsPage"));
const PlansPage = lazy(() => import("./pages/plans/PlansPage"));
const GrowthPage = lazy(() => import("./pages/Growth/GrowthPage"));
const BabyProfilePage = lazy(() => import("./pages/BabyProfile/BabyProfilePage"));
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage"));
const NotificationSettingsPage = lazy(() => import("./pages/Settings/NotificationSettingsPage"));
const SleepPage = lazy(() => import("./features/sleep/pages/SleepPage"));
const FeedingPage = lazy(() => import("./features/feeding/pages/FeedingPage"));
const HealthPage = lazy(() => import("./features/health/pages/HealthPage"));
const DoctorReportPage = lazy(() => import("./features/doctor-report/pages/DoctorReportPage"));
const VaccinationsPage = lazy(() => import("./features/vaccinations/pages/VaccinationsPage"));
const MilestonesPage = lazy(() => import("./features/milestones/pages/MilestonesPage"));
const FamilyPage = lazy(() => import("./features/family/pages/FamilyPage"));
const MemoriesPage = lazy(() => import("./features/memories/pages/MemoriesPage"));
const BabyBookPage = lazy(() => import("./features/memories/pages/BabyBookPage"));
const AuthPage = lazy(() => import("./features/auth/pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("./features/auth/pages/AuthCallbackPage"));
const TimelinePage = lazy(() => import("./pages/Timeline/TimelinePage"));


export default function App() {
  const appearance = useAppSettingsStore((state) => state.appearance);
  const language = useAppSettingsStore((state) => state.language);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      const isDark =
        appearance === "dark" ||
        (appearance === "system" && mediaQuery.matches);
      root.classList.toggle("dark", isDark);
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [appearance]);

  useEffect(() => {
    if (i18n.resolvedLanguage !== language) void i18n.changeLanguage(language);
  }, [language]);

  return (
    <>
      <VaccinationSync />
      <AuthRuntime />
      <FamilySubscriptionRuntime />
      <NativeAuthLinkRuntime />
      <CloudSyncRuntime />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        }
      >
      <Routes>
        <Route path="/auth/login" element={<AuthPage mode="login" />} />
        <Route path="/auth/register" element={<AuthPage mode="register" />} />
        <Route
          path="/auth/forgot-password"
          element={<AuthPage mode="forgot" />}
        />
        <Route
          path="/auth/reset-password"
          element={<AuthPage mode="reset" />}
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/timeline" element={<TimelinePage />} />

          <Route path="/statistics" element={<StatisticsPage />} />

          <Route path="/sleep" element={<SleepPage />} />

          <Route path="/feeding" element={<FeedingPage />} />

          <Route path="/growth" element={<GrowthPage />} />

          <Route path="/health" element={<HealthPage />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="/reminders" element={<Navigate to="/settings/notifications" replace />} />
          <Route path="/settings/notifications/reminders" element={<Navigate to="/settings/notifications" replace />} />
          <Route path="/doctor-report" element={<DoctorReportPage />} />
          <Route
            path="/vaccinations"
            element={
              <>
                <VaccinationCountryContext />
                <VaccinationsPage />
              </>
            }
          />
          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/memories/book" element={<BabyBookPage />} />
          <Route path="/baby-profile" element={<BabyProfilePage />} />
          <Route path="/plans" element={<PlansPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
</Suspense>
    </>
  );
}
