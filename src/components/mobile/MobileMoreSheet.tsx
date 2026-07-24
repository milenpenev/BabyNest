import {
  Baby,
  BedDouble,
  Bell,
  BookHeart,
  ChartNoAxesCombined,
  FileHeart,
  HeartPulse,
  Images,
  Settings,
  ShieldCheck,
  Syringe,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { hapticsService } from "../../platform/haptics/hapticsService";
import MobileBottomSheet from "./MobileBottomSheet";

export default function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = [
    ["/sleep", "navigation.sleep", BedDouble],
    ["/feeding", "navigation.feeding", Baby],
    ["/health", "navigation.health", HeartPulse],
    ["/growth", "navigation.growth", ChartNoAxesCombined],
    ["/vaccinations", "navigation.vaccinations", Syringe],
    ["/milestones", "navigation.milestones", ShieldCheck],
    ["/memories", "navigation.memories", Images],
    ["/settings/notifications", "navigation.notifications", Bell],
    ["/family", "navigation.family", Users],
    ["/doctor-report", "navigation.doctorReport", FileHeart],
    ["/settings", "navigation.settings", Settings],
    ["/plans", "navigation.plans", BookHeart],
  ] as const;
  return (
    <MobileBottomSheet open={open} onClose={onClose} title={t("mobile.more")}>
      <nav className="grid grid-cols-2 gap-3 pb-2">
        {items.map(([route, key, ItemIcon]) => (
          <button
            key={route}
            type="button"
            onClick={() => {
              void hapticsService.selection();
              onClose();
              navigate(route);
            }}
            className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800"
          >
            <ItemIcon className="h-5 w-5 shrink-0 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{t(key)}</span>
          </button>
        ))}
      </nav>
    </MobileBottomSheet>
  );
}
