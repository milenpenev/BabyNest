import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useBabyStore } from "../../store/babyStore";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import SyncStatusBadge from "../../features/cloud-sync/components/SyncStatusBadge";
import NotificationCenter from "./NotificationCenter";

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const selectedBaby = babies.find((baby) => baby.id === selectedBabyId) ?? babies[0];
  const appearance = useAppSettingsStore((state) => state.appearance);
  const setAppearance = useAppSettingsStore((state) => state.setAppearance);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const isDark = appearance === "dark" || (appearance === "system" && systemDark);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 text-slate-900 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />

            <input
              type="search"
              placeholder={t("header.searchPlaceholder")}
              aria-label={t("header.searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-800 dark:focus:ring-indigo-950"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SyncStatusBadge />
          <LanguageSwitcher />
          <NotificationCenter />

          <button
            type="button"
            onClick={() => setAppearance(isDark ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label={t("header.changeTheme")}
            title={t("header.changeTheme")}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate("/baby-profile")}
            className="ml-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              {selectedBaby?.name?.charAt(0).toUpperCase() ?? "B"}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-4">{selectedBaby?.name ?? t("navigation.babyProfile")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("navigation.babyProfile")}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
