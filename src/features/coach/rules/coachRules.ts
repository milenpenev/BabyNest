import type { Activity } from "../../../entities/activity/model/activity.types";
import type { Baby } from "../../../entities/baby/model/baby.types";
import type { ActiveActivity } from "../../../store/activityStore";
import type { BabyMilestoneRecord } from "../../milestones/model/milestone.types";
import type { VaccinationRecord } from "../../vaccinations/model/vaccination.types";
import type { Reminder } from "../../../entities/reminder/reminder.types";
import type { Memory } from "../../memories/model/memory.types";
import { getRoutinePreferences } from "../../routine/utils/routineIntervals";
import { calculateNextDiaperStatus, calculateNextFeedingStatus } from "../../routine/utils/nextRoutineStatus";
import { buildSleepPrediction } from "../../sleep/prediction/sleepPrediction";
import type { CoachSuggestion } from "../model/coach.types";

const suggestion = (babyId: string, ruleId: string, category: CoachSuggestion["category"], priority: number, titleKey: string, bodyKey: string, evidenceKey: string, actionPath: string, evidenceValues?: Record<string, string | number>, evidenceIdentity = "current"): CoachSuggestion => ({ id: `${babyId}:${ruleId}`, ruleId, category, priority, titleKey, bodyKey, evidenceKey, actionPath, evidenceValues, fingerprint: `${babyId}:${ruleId}:${evidenceIdentity}` });

export function evaluateCoachRules(input: { baby: Baby | null; activities: Activity[]; activeActivity: ActiveActivity | null; milestones: BabyMilestoneRecord[]; memories: Memory[]; vaccinations: VaccinationRecord[]; reminders: Reminder[]; now: Date }) {
  const { baby, activities, activeActivity, milestones, memories, vaccinations, reminders, now } = input;
  if (!baby) return [];
  const ownActivities = activities.filter((item) => item.babyId === baby.id);
  const results: CoachSuggestion[] = [];
  const medication = reminders.filter((item) => item.babyId === baby.id && item.enabled && item.type === "medicine" && item.nextTriggerAt).sort((a, b) => (a.nextTriggerAt ?? "").localeCompare(b.nextTriggerAt ?? ""))[0];
  if (medication?.nextTriggerAt && new Date(medication.nextTriggerAt).getTime() - now.getTime() <= 30 * 60_000) results.push(suggestion(baby.id, "medication-due", "medication", 100, "coach.rules.medicationTitle", "coach.rules.medicationBody", "coach.rules.medicationEvidence", "/reminders", { title: medication.title }, `${medication.id}:${medication.nextTriggerAt}`));
  const concern = milestones.find((item) => item.babyId === baby.id && item.status === "parent-concern");
  if (concern) results.push(suggestion(baby.id, "parent-concern", "milestone", 95, "coach.rules.concernTitle", "coach.rules.concernBody", "coach.rules.concernEvidence", "/milestones", undefined, concern.updatedAt));
  const vaccine = vaccinations.filter((item) => item.babyId === baby.id && item.status === "upcoming" && new Date(item.scheduledDate) <= now).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
  if (vaccine) results.push(suggestion(baby.id, "vaccination-review", "vaccination", 90, "coach.rules.vaccineTitle", "coach.rules.vaccineBody", "coach.rules.vaccineEvidence", "/vaccinations", { name: vaccine.vaccineName }, vaccine.id));
  if (activeActivity?.babyId === baby.id && activeActivity.type === "sleep") results.push(suggestion(baby.id, "active-sleep", "sleep", 85, "coach.rules.sleepingTitle", "coach.rules.sleepingBody", "coach.rules.sleepingEvidence", "/sleep", undefined, activeActivity.id));
  else {
    const prediction = buildSleepPrediction(ownActivities, baby, null, now);
    if (prediction.countdownSeconds !== null && prediction.countdownSeconds <= 30 * 60) results.push(suggestion(baby.id, "nap-window", "sleep", 70, "coach.rules.napTitle", "coach.rules.napBody", "coach.rules.napEvidence", "/sleep", { minutes: Math.max(0, Math.ceil(prediction.countdownSeconds / 60)), samples: prediction.validWakeWindowCount }, prediction.nextSleepAt?.toISOString() ?? "none"));
  }
  const preferences = getRoutinePreferences(baby.routinePreferences);
  const feeding = calculateNextFeedingStatus({ activities: ownActivities, babyId: baby.id, now, configuredIntervalMinutes: preferences.feedingIntervalMinutes, useAdaptiveInterval: preferences.useAdaptiveFeedingInterval });
  if (feeding.remainingSeconds !== null && feeding.remainingSeconds <= 15 * 60) results.push(suggestion(baby.id, "feeding-window", "feeding", 60, "coach.rules.feedingTitle", "coach.rules.feedingBody", "coach.rules.feedingEvidence", "/feeding", { minutes: Math.max(0, Math.ceil(feeding.remainingSeconds / 60)) }, feeding.nextAt?.toISOString() ?? "none"));
  const diaper = calculateNextDiaperStatus({ activities: ownActivities, babyId: baby.id, now, configuredIntervalMinutes: preferences.diaperIntervalMinutes, useAdaptiveInterval: preferences.useAdaptiveDiaperInterval });
  if (diaper.remainingSeconds !== null && diaper.remainingSeconds <= 15 * 60) results.push(suggestion(baby.id, "diaper-window", "diaper", 55, "coach.rules.diaperTitle", "coach.rules.diaperBody", "coach.rules.diaperEvidence", "/diaper", { minutes: Math.max(0, Math.ceil(diaper.remainingSeconds / 60)) }, diaper.nextAt?.toISOString() ?? "none"));
  const recentMilestone = milestones.filter((item) => item.babyId === baby.id && item.status === "observed").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (recentMilestone) results.push(suggestion(baby.id, "milestone-positive", "milestone", 30, "coach.rules.milestoneTitle", "coach.rules.milestoneBody", "coach.rules.milestoneEvidence", "/milestones", undefined, recentMilestone.id));
  const recentMemory = memories.filter((item) => item.babyId === baby.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
  if (recentMemory) results.push(suggestion(baby.id,"memory-positive","general",25,"coach.rules.memoryTitle","coach.rules.memoryBody","coach.rules.memoryEvidence","/memories",undefined,recentMemory.id));
  const emerging = milestones.filter((item) => item.babyId === baby.id && item.status === "emerging").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (emerging) results.push(suggestion(baby.id, "milestone-emerging", "milestone", 35, "coach.rules.emergingTitle", "coach.rules.emergingBody", "coach.rules.emergingEvidence", "/milestones", undefined, emerging.id));
  const latestGrowth = ownActivities.filter((item) => item.type === "growth").sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (latestGrowth) results.push(suggestion(baby.id, "growth-recorded", "general", 40, "coach.rules.growthTitle", "coach.rules.growthBody", "coach.rules.growthEvidence", "/growth", { date: new Date(latestGrowth.startedAt).toLocaleDateString() }, latestGrowth.id));
  if (results.length === 0) results.push(suggestion(baby.id, "general", "general", 10, "coach.rules.generalTitle", "coach.rules.generalBody", "coach.rules.generalEvidence", "/dashboard", { count: ownActivities.length }, String(ownActivities.length)));
  return results.sort((a, b) => b.priority - a.priority);
}
