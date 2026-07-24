import { isNativeApp } from "../platform/platform";
import MobileAppLayout from "./MobileAppLayout";
import WebAppLayout from "./WebAppLayout";

export default function AppLayout() {
  return isNativeApp ? <MobileAppLayout /> : <WebAppLayout />;
}
