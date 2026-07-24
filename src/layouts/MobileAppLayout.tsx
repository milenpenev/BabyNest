import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import MobileBottomNavigation from "../components/mobile/MobileBottomNavigation";
import MobileHeader from "../components/mobile/MobileHeader";
import NativeRuntime from "../platform/NativeRuntime";
import SharedAppRuntimes from "./SharedAppRuntimes";

export default function MobileAppLayout() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const handleKeyboard = useCallback((open: boolean) => setKeyboardOpen(open), []);
  useEffect(() => {
    document.documentElement.classList.add("native-app-runtime");
    return () => document.documentElement.classList.remove("native-app-runtime");
  }, []);
  return (
    <div className="native-mobile-app min-h-dvh overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SharedAppRuntimes />
      <NativeRuntime onKeyboardChange={handleKeyboard} />
      <MobileHeader />
      <div className="native-mobile-content min-w-0">
        <Outlet />
      </div>
      <MobileBottomNavigation keyboardOpen={keyboardOpen} />
    </div>
  );
}
