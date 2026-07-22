import { diaper } from "@lucide/lab";
import {
  Bath,
  Icon,
  Milk,
  Pill,
  Plus,
  Ruler,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import BathQuickAdd from "./BathQuickAdd";
import BottleQuickAdd from "./BottleQuickAdd";
import DiaperQuickAdd from "./DiaperQuickAdd";
import MedicineQuickAdd from "./MedicineQuickAdd";
import GrowthQuickAdd from "./GrowthQuickAdd";

export type QuickAddType =
  | "bottle"
  | "diaper"
  | "medicine"
  | "bath"
  | "growth";

interface QuickAddOption {
  type: QuickAddType;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  iconClass: string;
  hoverClass: string;
}

export default function QuickAddLauncher({ allowedTypes }: { allowedTypes?: QuickAddType[] }) {
  const { t } = useTranslation();

  const [selectedType, setSelectedType] =
    useState<QuickAddType | null>(null);

  useEffect(() => {
    if (!selectedType) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedType(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [selectedType]);

  const allOptions: QuickAddOption[] = [
    {
      type: "bottle",
      labelKey: "activity.addBottle",
      descriptionKey: "activity.bottle",
      icon: <Milk className="h-6 w-6" />,
      iconClass:
        "bg-emerald-100 text-emerald-700",
      hoverClass:
        "hover:border-emerald-200 hover:bg-emerald-50/50",
    },
    {
      type: "diaper",
      labelKey: "activity.addDiaper",
      descriptionKey: "activity.diaperType",
      icon: (
        <Icon
          iconNode={diaper}
          className="h-6 w-6"
        />
      ),
      iconClass: "bg-amber-100 text-amber-700",
      hoverClass:
        "hover:border-amber-200 hover:bg-amber-50/50",
    },
    {
      type: "medicine",
      labelKey: "activity.addMedicine",
      descriptionKey: "activity.medicine",
      icon: <Pill className="h-6 w-6" />,
      iconClass: "bg-rose-100 text-rose-700",
      hoverClass:
        "hover:border-rose-200 hover:bg-rose-50/50",
    },
    {
      type: "bath",
      labelKey: "activity.addBath",
      descriptionKey: "activity.bathType",
      icon: <Bath className="h-6 w-6" />,
      iconClass: "bg-sky-100 text-sky-700",
      hoverClass:
        "hover:border-sky-200 hover:bg-sky-50/50",
    },
    {
  type: "growth",
  labelKey: "activity.addGrowth",
  descriptionKey: "activity.growth",
  icon: <Ruler className="h-6 w-6" />,
  iconClass: "bg-violet-100 text-violet-700",
  hoverClass:
    "hover:border-violet-200 hover:bg-violet-50/50",
  },
  ];
  const options = allOptions.filter((option) => !allowedTypes || allowedTypes.includes(option.type));

  function renderSelectedForm() {
    switch (selectedType) {
      case "bottle":
        return <BottleQuickAdd />;

      case "diaper":
        return <DiaperQuickAdd />;

      case "medicine":
        return <MedicineQuickAdd />;

      case "bath":
        return <BathQuickAdd />;

      case "growth":
        return <GrowthQuickAdd />;

      default:
        return null;
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Plus className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("activity.quickAdd")}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("activity.quickAddDescription")}
            </p>
          </div>
        </div>

        <div
          className={[
            "mt-5 grid gap-3",
            options.length === 1
              ? "grid-cols-1"
              : options.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
          ].join(" ")}
        >
          {options.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() =>
                setSelectedType(option.type)
              }
              className={[
                "group flex min-h-24 min-w-0 w-full items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition dark:border-slate-700 dark:bg-slate-900",
                option.hoverClass,
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105",
                  option.iconClass,
                ].join(" ")}
              >
                {option.icon}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {t(option.labelKey)}
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(option.descriptionKey)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedType(null);
            }
          }}
        >
          <div
            className="relative my-auto w-full max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("activity.quickAdd")}
          >
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label={t("activity.closeQuickAdd")}
              title={t("activity.closeQuickAdd")}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="[&>section]:mt-0 [&>section]:max-h-[calc(100vh-2rem)] [&>section]:overflow-y-auto">
              {renderSelectedForm()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
