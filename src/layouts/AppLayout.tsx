import { isMobileExperience } from "../platform/mobileExperience";
import MobileAppLayout from "./MobileAppLayout";
import WebAppLayout from "./WebAppLayout";

export default function AppLayout() {
  return isMobileExperience()
    ? <MobileAppLayout />
    : <WebAppLayout />;
}
