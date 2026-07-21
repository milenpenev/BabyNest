import { useTranslation } from "react-i18next";
import {
  Baby,
  BarChart3,
  BedDouble,
  HeartPulse,
  LayoutDashboard,
  Milk,
  Settings,
} from "lucide-react";

const navigationItems = [
  { key: "dashboard", icon: LayoutDashboard, active: true },
  { key: "sleep", icon: BedDouble, active: false },
  { key: "feeding", icon: Milk, active: false },
  { key: "growth", icon: BarChart3, active: false },
  { key: "health", icon: HeartPulse, active: false },
  { key: "settings", icon: Settings, active: false },
] as const;

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Baby className="h-5 w-5" />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight">BabyNest</p>
            <p className="text-xs text-slate-500">
              {t("navigation.familyAssistant")}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigationItems.map(({ key, icon: Icon, active }) => (
            <button
              key={key}
              type="button"
              className={[
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              {t(`navigation.${key}`)}
            </button>
          ))}
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
            <p className="text-sm font-semibold">Premium+</p>

            <p className="mt-1 text-xs leading-5 text-indigo-100">
              {t("navigation.premiumDescription")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}