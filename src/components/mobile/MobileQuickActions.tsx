import { diaper } from "@lucide/lab";
import {
  BedDouble,
  Icon,
  Milk,
  PersonStanding,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { hapticsService } from "../../platform/haptics/hapticsService";

type QuickAction = {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
  iconClassName: string;
  onPress: () => void;
};

export default function MobileQuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function navigateWithFeedback(path: string) {
    void hapticsService.selection();
    navigate(path);
  }

  function openQuickAdd(type: "bottle" | "diaper") {
    void hapticsService.impact("light");

    window.dispatchEvent(
      new CustomEvent(
        "babynest:open-mobile-quick-add",
        {
          detail: { type },
        },
      ),
    );
  }

  const actions: QuickAction[] = [
    {
      key: "sleep",
      labelKey: "activity.sleep",
      icon: <BedDouble className="h-6 w-6" />,
      iconClassName:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
      onPress: () => navigateWithFeedback("/sleep"),
    },
    {
      key: "breastfeeding",
      labelKey: "activity.breastfeeding",
      icon: (
        <PersonStanding className="h-6 w-6" />
      ),
      iconClassName:
        "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
      onPress: () =>
        navigateWithFeedback("/feeding"),
    },
    {
      key: "bottle",
      labelKey: "activity.bottle",
      icon: <Milk className="h-6 w-6" />,
      iconClassName:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      onPress: () => openQuickAdd("bottle"),
    },
    {
      key: "diaper",
      labelKey: "activity.diaper",
      icon: (
        <Icon
          iconNode={diaper}
          className="h-6 w-6"
        />
      ),
      iconClassName:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      onPress: () => openQuickAdd("diaper"),
    },
  ];

  return (
    <section
      aria-labelledby="mobile-quick-actions-title"
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2
          id="mobile-quick-actions-title"
          className="text-sm font-bold text-slate-900 dark:text-white"
        >
          {t("activity.quickAdd")}
        </h2>

        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(
                "babynest:open-mobile-quick-add",
              ),
            )
          }
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400"
        >
          {t("mobile.quickAdd")}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onPress}
            className="flex min-h-[82px] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2 text-center transition active:scale-[0.97] dark:border-slate-700 dark:bg-slate-800"
          >
            <span
              className={[
                "flex h-11 w-11 items-center justify-center rounded-xl",
                action.iconClassName,
              ].join(" ")}
            >
              {action.icon}
            </span>

            <span className="w-full truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {t(action.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
