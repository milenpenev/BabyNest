import { Bath, BedDouble, BookHeart, Milk, Pill, Ruler } from "lucide-react";
import { Icon, Baby } from "lucide-react";
import { diaper } from "@lucide/lab";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import BathQuickAdd from "../activity/BathQuickAdd";
import BottleQuickAdd from "../activity/BottleQuickAdd";
import DiaperQuickAdd from "../activity/DiaperQuickAdd";
import GrowthQuickAdd from "../activity/GrowthQuickAdd";
import MedicineQuickAdd from "../activity/MedicineQuickAdd";
import { hapticsService } from "../../platform/haptics/hapticsService";
import MobileBottomSheet from "./MobileBottomSheet";

type FormType = "bottle" | "diaper" | "medicine" | "bath" | "growth";

export default function MobileQuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormType | null>(null);
  const close = () => {
    setForm(null);
    onClose();
  };
  const go = (route: string) => {
    void hapticsService.selection();
    close();
    navigate(route);
  };
  const select = (type: FormType) => {
    void hapticsService.selection();
    setForm(type);
  };
  const options = [
    ["sleep", BedDouble, () => go("/sleep")],
    ["breastfeeding", Baby, () => go("/feeding")],
    ["bottle", Milk, () => select("bottle")],
    ["diaper", null, () => select("diaper")],
    ["medicine", Pill, () => select("medicine")],
    ["bath", Bath, () => select("bath")],
    ["growth", Ruler, () => select("growth")],
    ["memory", BookHeart, () => go("/memories")],
  ] as const;
  const forms: Record<FormType, React.ReactNode> = {
    bottle: <BottleQuickAdd />,
    diaper: <DiaperQuickAdd />,
    medicine: <MedicineQuickAdd />,
    bath: <BathQuickAdd />,
    growth: <GrowthQuickAdd />,
  };

  return (
    <MobileBottomSheet open={open} onClose={close} title={form ? t(`activity.${form}`) : t("mobile.quickAdd")}>
      {form ? (
        <div className="[&>section]:border-0 [&>section]:p-1 [&>section]:shadow-none">{forms[form]}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-2">
          {options.map(([key, OptionIcon, action]) => (
            <button key={key} type="button" onClick={action} className="flex min-h-24 flex-col items-start justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800">
              {OptionIcon ? <OptionIcon className="h-6 w-6 text-indigo-600" /> : <Icon iconNode={diaper} className="h-6 w-6 text-indigo-600" />}
              <span className="font-semibold text-slate-900 dark:text-white">{t(`activity.${key}`)}</span>
            </button>
          ))}
        </div>
      )}
    </MobileBottomSheet>
  );
}
