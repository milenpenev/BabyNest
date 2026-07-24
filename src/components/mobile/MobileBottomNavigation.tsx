import { ChartNoAxesCombined, Clock3, Home, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { hapticsService } from "../../platform/haptics/hapticsService";
import MobileMoreSheet from "./MobileMoreSheet";
import MobileQuickAddSheet from "./MobileQuickAddSheet";

export default function MobileBottomNavigation({ keyboardOpen }: { keyboardOpen: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [quickAdd, setQuickAdd] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    function handleOpenQuickAdd() {
      setMore(false);
      setQuickAdd(true);
    }

    window.addEventListener(
      "babynest:open-mobile-quick-add",
      handleOpenQuickAdd,
    );

    return () => {
      window.removeEventListener(
        "babynest:open-mobile-quick-add",
        handleOpenQuickAdd,
      );
    };
  }, []);

  if (keyboardOpen) return null;

  const tabs = [
    ["/", "home", Home],
    ["/timeline", "timeline", Clock3],
    ["quick-add", "quickAdd", Plus],
    ["/statistics", "insights", ChartNoAxesCombined],
    ["more", "more", Menu],
  ] as const;

  const activate = (target: string) => {
    void hapticsService.selection();
    if (target === "quick-add") {
      void hapticsService.impact("light");
      setQuickAdd(true);
    } else if (target === "more") {
      setMore(true);
    } else {
      navigate(target);
    }
  };

  return (
    <>
      <nav className="native-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pt-1 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95" aria-label={t("mobile.navigation")}>
        {tabs.map(([target, key, TabIcon]) => {
          const active = target === "/" ? location.pathname === "/" : target.startsWith("/") && location.pathname.startsWith(target);
          const central = target === "quick-add";
          return (
            <button key={target} type="button" onClick={() => activate(target)} aria-current={active ? "page" : undefined} aria-label={t(`mobile.${key}`)} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? "text-indigo-600" : "text-slate-500 dark:text-slate-400"}`}>
              <span className={central ? "-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-50 bg-indigo-600 text-white shadow-lg dark:border-slate-950" : "flex h-7 items-center"}>
                <TabIcon className={central ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <span>{t(`mobile.${key}`)}</span>
            </button>
          );
        })}
      </nav>
      <MobileQuickAddSheet open={quickAdd} onClose={() => setQuickAdd(false)} />
      <MobileMoreSheet open={more} onClose={() => setMore(false)} />
    </>
  );
}
