import {
  Haptics,
  ImpactStyle,
  NotificationType,
} from "@capacitor/haptics";

import { useAppSettingsStore } from "../../store/appSettingsStore";
import { isNativeApp } from "../platform";

type ImpactFeedback = "light" | "medium";
type NotificationFeedback = "success" | "warning" | "error";

function enabled() {
  return isNativeApp && useAppSettingsStore.getState().hapticsEnabled === true;
}

async function safely(run: () => Promise<void>) {
  if (!enabled()) return;
  try {
    await run();
  } catch {
    // Native feedback is an optional enhancement and must never block an action.
  }
}

export const hapticsService = {
  selection: () => safely(() => Haptics.selectionChanged()),
  impact: (type: ImpactFeedback) =>
    safely(() =>
      Haptics.impact({
        style: type === "medium" ? ImpactStyle.Medium : ImpactStyle.Light,
      }),
    ),
  notification: (type: NotificationFeedback) =>
    safely(() =>
      Haptics.notification({
        type:
          type === "success"
            ? NotificationType.Success
            : type === "warning"
              ? NotificationType.Warning
              : NotificationType.Error,
      }),
    ),
};
