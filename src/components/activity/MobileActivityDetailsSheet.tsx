import type { Activity } from "../../entities/activity/model/activity.types";
import type { SleepDaySegment } from "../../features/sleep/utils/sleepSegments";
import ActivityDetailsDrawer from "./ActivityDetailsDrawer";

export default function MobileActivityDetailsSheet(props: {
  activity: Activity | null;
  sleepSegment?: SleepDaySegment | null;
  onClose: () => void;
}) {
  if (!props.activity) return null;
  return <div className="native-activity-details"><ActivityDetailsDrawer {...props} /></div>;
}
