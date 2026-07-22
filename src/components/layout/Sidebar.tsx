import {
  Baby,
  BarChart3,
  BellRing,
  BedDouble,
  ChartNoAxesCombined,
  Crown,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  Milk,
  Settings,
  FileHeart,
  Syringe,
  Footprints,
  Users,
  BookHeart,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { useSubscriptionStore } from "../../store/subscriptionStore";
import { useReminderStore } from "../../store/reminderStore";
import { useBabyStore } from "../../store/babyStore";
import { isReminderOverdue } from "../../features/reminders/utils/reminderSchedule";

const navigationItems = [
  {
    key: "dashboard",
    labelKey: "navigation.dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    key: "sleep",
    labelKey: "navigation.sleep",
    icon: BedDouble,
    path: "/sleep",
  },
  {
    key: "feeding",
    labelKey: "navigation.feeding",
    icon: Milk,
    path: "/feeding",
  },
  {
    key: "growth",
    labelKey: "navigation.growth",
    icon: BarChart3,
    path: "/growth",
  },
  {
    key: "health",
    labelKey: "navigation.health",
    icon: HeartPulse,
    path: "/health",
  },
  {
    key: "statistics",
    labelKey: "navigation.statistics",
    icon: ChartNoAxesCombined,
    path: "/statistics",
    premium: true,
  },
  {
    key: "reminders",
    labelKey: "navigation.reminders",
    icon: BellRing,
    path: "/reminders",
  },
  {
    key: "vaccinations",
    labelKey: "navigation.vaccinations",
    icon: Syringe,
    path: "/vaccinations",
  },
  {
    key: "milestones",
    labelKey: "navigation.milestones",
    icon: Footprints,
    path: "/milestones",
  },
  {
    key: "doctor-report",
    labelKey: "navigation.doctorReport",
    icon: FileHeart,
    path: "/doctor-report",
    premium: true,
  },
  {
    key: "memories",
    labelKey: "navigation.memories",
    icon: BookHeart,
    path: "/memories",
  },
  {
    key: "family",
    labelKey: "navigation.family",
    icon: Users,
    path: "/family",
    premium: true,
  },
  {
    key: "baby-profile",
    labelKey: "navigation.babyProfile",
    icon: Baby,
    path: "/baby-profile",
  },
  {
    key: "settings",
    labelKey: "navigation.settings",
    icon: Settings,
    path: "/settings",
  },
];

export default function Sidebar() {
  const { t } = useTranslation();

  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const reminders = useReminderStore((state) => state.reminders);
  const overdueCount = reminders.filter((reminder) => reminder.babyId === selectedBabyId && isReminderOverdue(reminder)).length;

  return (
    <aside className="min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Baby className="h-5 w-5" />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight">
              BabyNest
            </p>

            <p className="text-xs text-slate-500">
              Family assistant
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigationItems.map(
            ({
              key,
              labelKey,
              icon: Icon,
              path,
              premium,
            }) => (
              <NavLink
                key={key}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  [
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="min-w-0 flex-1 text-left">
                  {t(labelKey)}
                </span>

                {key === "reminders" && overdueCount > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">{overdueCount}</span> : null}

                {premium &&
                  (plan === "premium" ? (
                    <Crown
                      className="h-4 w-4 shrink-0 text-amber-500"
                      aria-label="Premium+"
                    />
                  ) : (
                    <LockKeyhole
                      className="h-4 w-4 shrink-0 text-slate-400"
                      aria-label={t(
                        "premium.premiumFeature",
                      )}
                    />
                  ))}
              </NavLink>
            ),
          )}
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-300" />

              <p className="text-sm font-semibold">
                Premium+
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-indigo-100">
              {plan === "premium"
                ? t("premium.smartInsightsDescription")
                : t("premium.statisticsDescription")}
            </p>

            <div className="mt-3 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
              {plan === "premium" ? "Premium" : "Free"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
