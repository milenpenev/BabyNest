import { isNativeApp } from "./platform";

/**
 * Native builds always use the mobile experience.
 *
 * During local development, the complete mobile layout can be previewed at:
 * http://localhost:5173/?mobilePreview=1
 */
export function isMobileExperience() {
  if (isNativeApp) {
    return true;
  }

  if (!import.meta.env.DEV) {
    return false;
  }

  return (
    new URLSearchParams(window.location.search).get(
      "mobilePreview",
    ) === "1"
  );
}
