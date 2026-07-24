import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";
import { Network } from "@capacitor/network";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { pushQueue, refreshSyncCounts } from "../data/sync/cloudSyncService";
import { useAppSettingsStore } from "../store/appSettingsStore";
import { useSyncStatusStore } from "../store/syncStatusStore";
import { isIOS, isNativeApp } from "./platform";

export default function NativeRuntime({ onKeyboardChange }: { onKeyboardChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const appearance = useAppSettingsStore((state) => state.appearance);

  useEffect(() => {
    if (!isNativeApp) return;
    const dark = document.documentElement.classList.contains("dark");
    void StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark });
    if (!isIOS) void StatusBar.setBackgroundColor({ color: dark ? "#0f172a" : "#ffffff" });
  }, [appearance]);

  useEffect(() => {
    if (!isNativeApp) return;
    const handles: Array<{ remove: () => Promise<void> }> = [];
    void Promise.all([
      Keyboard.addListener("keyboardWillShow", () => onKeyboardChange(true)),
      Keyboard.addListener("keyboardWillHide", () => onKeyboardChange(false)),
      CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          window.dispatchEvent(new Event("babynest:resume"));
          void pushQueue();
          void refreshSyncCounts();
        } else {
          window.dispatchEvent(new Event("babynest:background"));
        }
      }),
      Network.addListener("networkStatusChange", ({ connected }) => {
        useSyncStatusStore.getState().setStatus({ state: connected ? "pending" : "offline" });
        if (connected) void pushQueue();
      }),
      CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        try {
          const parsed = new URL(url);
          const route = parsed.searchParams.get("route");
          if (route?.startsWith("/")) navigate(route);
        } catch {
          // Ignore malformed external links.
        }
      }),
    ]).then((created) => handles.push(...created));
    void Network.getStatus().then(({ connected }) => {
      if (!connected) useSyncStatusStore.getState().setStatus({ state: "offline" });
    });
    return () => {
      for (const handle of handles) void handle.remove();
      onKeyboardChange(false);
    };
  }, [navigate, onKeyboardChange]);

  return null;
}
