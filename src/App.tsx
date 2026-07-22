import { useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import StatisticsPage from "./features/statistics/pages/StatisticsPage";
import PlansPage from "./pages/plans/PlansPage";
import GrowthPage from "./pages/Growth/GrowthPage";
import BabyProfilePage from "./pages/BabyProfile/BabyProfilePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import SleepPage from "./features/sleep/pages/SleepPage";
import FeedingPage from "./features/feeding/pages/FeedingPage";
import HealthPage from "./features/health/pages/HealthPage";
import RemindersPage from "./features/reminders/pages/RemindersPage";
import DoctorReportPage from "./features/doctor-report/pages/DoctorReportPage";
import VaccinationSync from "./features/vaccinations/components/VaccinationSync";
import VaccinationsPage from "./features/vaccinations/pages/VaccinationsPage";
import VaccinationCountryContext from "./features/vaccinations/components/VaccinationCountryContext";
import MilestonesPage from "./features/milestones/pages/MilestonesPage";
import FamilyPage from "./features/family/pages/FamilyPage";
import MemoriesPage from "./features/memories/pages/MemoriesPage";
import BabyBookPage from "./features/memories/pages/BabyBookPage";
import { useAppSettingsStore } from "./store/appSettingsStore";
import i18n from "./i18n";

export default function App() {
  const appearance = useAppSettingsStore((state) => state.appearance);
  const language = useAppSettingsStore((state) => state.language);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      const isDark = appearance === "dark" || (appearance === "system" && mediaQuery.matches);
      root.classList.toggle("dark", isDark);
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [appearance]);

  useEffect(() => {
    if (i18n.resolvedLanguage !== language) void i18n.changeLanguage(language);
  }, [language]);

  return (<><VaccinationSync />
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />

        <Route
          path="/statistics"
          element={<StatisticsPage />}
        />

        <Route
          path="/sleep"
          element={<SleepPage />}
        />

        <Route
          path="/feeding"
          element={<FeedingPage />}
        />

        <Route path="/growth" element={<GrowthPage />} />

        <Route
          path="/health"
          element={<HealthPage />}
        />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/doctor-report" element={<DoctorReportPage />} />
        <Route path="/vaccinations" element={<><VaccinationCountryContext/><VaccinationsPage /></>} />
        <Route path="/milestones" element={<MilestonesPage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/memories/book" element={<BabyBookPage />} />
        <Route path="/baby-profile" element={<BabyProfilePage />} />
        <Route
          path="/plans"
          element={<PlansPage />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes></>
  );
}
