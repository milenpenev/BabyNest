import type { Activity } from "../../entities/activity/model/activity.types";
import type { SleepDaySegment } from "../../features/sleep/utils/sleepSegments";
import { isNativeApp } from "../../platform/platform";
import ActivityDetailsDrawer from "./ActivityDetailsDrawer";
import MobileActivityDetailsSheet from "./MobileActivityDetailsSheet";

export default function ActivityDetailsPresenter(props: {
  activity: Activity | null;
  sleepSegment?: SleepDaySegment | null;
  onClose: () => void;
}) {
  return isNativeApp ? <MobileActivityDetailsSheet {...props} /> : <ActivityDetailsDrawer {...props} />;
}
