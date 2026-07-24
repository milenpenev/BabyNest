import { Capacitor } from "@capacitor/core";

export type AppPlatform = "ios" | "android" | "web";

export const currentPlatform = Capacitor.getPlatform() as AppPlatform;
export const isNativeApp = Capacitor.isNativePlatform();
export const isWebApp = !isNativeApp;
export const isIOS = currentPlatform === "ios";
export const isAndroid = currentPlatform === "android";
