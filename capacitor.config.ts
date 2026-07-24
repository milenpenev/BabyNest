import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.milenpenev.babynest",
  appName: "BabyNest",
  webDir: "dist",
  backgroundColor: "#f8fafc",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
};

export default config;
