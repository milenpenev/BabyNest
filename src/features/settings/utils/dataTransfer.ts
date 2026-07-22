import type { Activity } from "../../../entities/activity/model/activity.types";
import type { Baby } from "../../../entities/baby/model/baby.types";
import type { AppSettings } from "../../../store/appSettingsStore";
import { normalizeSettings } from "../../../store/appSettingsStore";
import type { SubscriptionPlan } from "../../../store/subscriptionStore";
import type { VaccinationRecord } from "../../vaccinations/model/vaccination.types";
import type { VaccinationScheduleConflict } from "../../vaccinations/utils/reconcileVaccinationSchedule";
import type { BabyMilestoneRecord } from "../../milestones/model/milestone.types";

export interface BabyNestExport {
  schemaVersion: 1;
  exportedAt: string;
  settings: AppSettings;
  babies: Baby[];
  selectedBabyId: string | null;
  activities: Activity[];
  subscription: { plan: SubscriptionPlan };
  timers: { breastfeedingActiveSession: unknown | null };
  vaccinations?: { records: VaccinationRecord[]; conflicts: VaccinationScheduleConflict[] };
  milestones?: { catalogVersion: string; records: BabyMilestoneRecord[] };
}

const activityTypes = new Set(["sleep", "breastfeeding", "bottle", "diaper", "medicine", "bath", "growth"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoDate(value: unknown) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

function isBaby(value: unknown): value is Baby {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0
    && typeof value.name === "string" && value.name.trim().length > 0
    && isIsoDate(value.birthday)
    && ["boy", "girl", "unspecified"].includes(String(value.gender))
    && isIsoDate(value.createdAt) && isIsoDate(value.updatedAt)
    && (value.gestationalWeek === undefined || (typeof value.gestationalWeek === "number" && value.gestationalWeek >= 22 && value.gestationalWeek <= 42))
    && (value.birthWeightKg === undefined || (typeof value.birthWeightKg === "number" && value.birthWeightKg > 0 && value.birthWeightKg <= 20))
    && (value.birthHeightCm === undefined || (typeof value.birthHeightCm === "number" && value.birthHeightCm > 0 && value.birthHeightCm <= 120))
    && (value.vaccinationProfile === undefined || (isRecord(value.vaccinationProfile) && ["BG","OTHER"].includes(String(value.vaccinationProfile.countryCode)) && typeof value.vaccinationProfile.scheduleVersion === "string" && isIsoDate(value.vaccinationProfile.selectedAt) && ["registration","profile","migration"].includes(String(value.vaccinationProfile.source))));
}

function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0
    && typeof value.babyId === "string" && value.babyId.length > 0
    && typeof value.type === "string" && activityTypes.has(value.type)
    && isIsoDate(value.startedAt) && isIsoDate(value.createdAt) && isIsoDate(value.updatedAt)
    && isRecord(value.data);
}
function isVaccinationRecord(value:unknown):value is VaccinationRecord{return isRecord(value)&&typeof value.id==="string"&&typeof value.babyId==="string"&&typeof value.vaccineCode==="string"&&typeof value.status==="string"&&["upcoming","completed","postponed","skipped"].includes(value.status)&&isIsoDate(value.scheduledDate)}
function isMilestoneRecord(value:unknown):value is BabyMilestoneRecord{return isRecord(value)&&typeof value.id==="string"&&typeof value.babyId==="string"&&typeof value.domain==="string"&&["gross-motor","fine-motor","communication","social-emotional","cognitive","feeding","self-care"].includes(value.domain)&&["not-observed","emerging","observed","not-applicable","parent-concern"].includes(String(value.status))&&["catalog","custom"].includes(String(value.source))&&isIsoDate(value.createdAt)&&isIsoDate(value.updatedAt)&&(value.source!=="custom"||typeof value.customTitle==="string")}

function hasUniqueIds(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function isSettings(value: unknown): value is AppSettings {
  if (!isRecord(value) || !isRecord(value.notifications)) return false;
  const notifications = value.notifications;
  return ["bg", "en"].includes(String(value.language))
    && ["24h", "12h"].includes(String(value.timeFormat))
    && ["dd.MM.yyyy", "MM/dd/yyyy", "yyyy-MM-dd"].includes(String(value.dateFormat))
    && ["monday", "sunday"].includes(String(value.firstDayOfWeek))
    && ["kg", "lb"].includes(String(value.weightUnit))
    && ["cm", "in"].includes(String(value.lengthUnit))
    && ["system", "light", "dark"].includes(String(value.appearance))
    && ["sleep", "feeding", "diaper", "medicine", "vaccination", "milestone"].every((key) => typeof notifications[key] === "boolean");
}

export function parseBabyNestExport(value: unknown): BabyNestExport | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isIsoDate(value.exportedAt)) return null;
  if (!Array.isArray(value.babies) || !value.babies.every(isBaby) || !hasUniqueIds(value.babies)) return null;
  if (!Array.isArray(value.activities) || !value.activities.every(isActivity) || !hasUniqueIds(value.activities)) return null;
  const babyIds = new Set(value.babies.map((baby) => baby.id));
  if (value.activities.some((activity) => !babyIds.has(activity.babyId))) return null;
  if (value.babies.length === 0 && value.activities.length > 0) return null;
  if (value.selectedBabyId !== null && value.selectedBabyId !== undefined && (typeof value.selectedBabyId !== "string" || !babyIds.has(value.selectedBabyId))) return null;
  if (!isSettings(value.settings) || !isRecord(value.subscription) || !["free", "premium"].includes(String(value.subscription.plan))) return null;
  if(value.vaccinations!==undefined&&(!isRecord(value.vaccinations)||!Array.isArray(value.vaccinations.records)||!value.vaccinations.records.every(isVaccinationRecord)))return null;
  if(value.milestones!==undefined&&(!isRecord(value.milestones)||typeof value.milestones.catalogVersion!=="string"||!Array.isArray(value.milestones.records)||!value.milestones.records.every(isMilestoneRecord)||!hasUniqueIds(value.milestones.records)))return null;

  return {
    schemaVersion: 1,
    exportedAt: value.exportedAt as string,
    settings: normalizeSettings(value.settings as Partial<AppSettings>),
    babies: value.babies,
    selectedBabyId: (value.selectedBabyId as string | null | undefined) ?? value.babies[0]?.id ?? null,
    activities: value.activities,
    subscription: { plan: value.subscription.plan as SubscriptionPlan },
    timers: isRecord(value.timers) ? { breastfeedingActiveSession: value.timers.breastfeedingActiveSession ?? null } : { breastfeedingActiveSession: null },
    vaccinations:isRecord(value.vaccinations)?{records:value.vaccinations.records as VaccinationRecord[],conflicts:Array.isArray(value.vaccinations.conflicts)?value.vaccinations.conflicts as VaccinationScheduleConflict[]:[]}:undefined,
    milestones:isRecord(value.milestones)?{catalogVersion:value.milestones.catalogVersion as string,records:value.milestones.records as BabyMilestoneRecord[]}:undefined,
  };
}
