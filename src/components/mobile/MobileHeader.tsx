import { ChevronDown, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import SyncStatusBadge from "../../features/cloud-sync/components/SyncStatusBadge";
import { useBabyStore } from "../../store/babyStore";
import NotificationCenter from "../layout/NotificationCenter";

export default function MobileHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const baby = babies.find((item) => item.id === selectedBabyId) ?? babies[0];

  return (
    <header className="native-mobile-header sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-3 pb-2 pt-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex h-12 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/baby-profile")}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1 text-left"
          aria-label={t("mobile.selectedBaby")}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            {baby?.name?.charAt(0).toUpperCase() ?? "B"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
              {baby?.name ?? t("navigation.babyProfile")}
            </span>
            <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              {t("mobile.selectedBaby")} <ChevronDown className="ml-1 h-3 w-3" />
            </span>
          </span>
        </button>
        <SyncStatusBadge />
        <NotificationCenter />
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
          aria-label={t("navigation.settings")}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
