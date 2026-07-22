import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  Activity,
  ActivityType,
} from "../entities/activity/model/activity.types";
import { hasFamilyPermission } from "../features/family/permissions/familyPermissions";
import { getCurrentFamilyMember, useFamilyStore } from "./familyStore";

function activityEntity(type: ActivityType) { return type === "growth" ? "growth" as const : "activity" as const; }
function can(permission: "canEditActivities" | "canDeleteActivities") { return hasFamilyPermission(getCurrentFamilyMember(), permission); }
function canMutate(activity: Pick<Activity,"type">, permission: "canEditActivities" | "canDeleteActivities") { return can(permission) && (activity.type !== "growth" || hasFamilyPermission(getCurrentFamilyMember(), "canManageGrowth")); }
function audit(activity: Activity, action: "created" | "updated" | "deleted") { const member = getCurrentFamilyMember(); if (!member) return; useFamilyStore.getState().addAudit({ memberId: member.id, action, entityType: activityEntity(activity.type), entityId: activity.id, descriptionKey: `family.audit.activity.${action}`, metadata: { type: activity.type } }); }

export interface ActiveActivity {
  id: string;
  babyId: string;
  type: ActivityType;
  startedAt: string;
  pausedAt: string | null;
  totalPausedMilliseconds: number;
}

export interface FinishedActiveActivity extends ActiveActivity {
  endedAt: string;
  durationSeconds: number;
  pausedDurationSeconds: number;
}

interface StartActivityInput {
  babyId: string;
  type: ActivityType;
  startedAt?: string;
}

interface ActivityStore {
  activities: Activity[];
  activeActivity: ActiveActivity | null;

  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => boolean;
  removeActivity: (id: string) => void;
  clearActivities: () => void;
  replaceActivities: (activities: Activity[]) => void;

  startActivity: (input: StartActivityInput) => boolean;
  updateActiveActivityStart: (startedAt: string) => boolean;
  pauseActivity: () => void;
  resumeActivity: () => void;
  finishActivity: () => FinishedActiveActivity | null;
  cancelActiveActivity: () => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      activeActivity: null,

      addActivity: (activity) => {
        if (!canMutate(activity, "canEditActivities")) return;
        const member = getCurrentFamilyMember();
        const attributed = { ...activity, createdBy: activity.createdBy ?? member?.id, updatedBy: member?.id } as Activity;
        set((state) => ({ activities: [...state.activities, attributed] }));
        audit(attributed, "created");
      },

      updateActivity: (id, updates) => {
        const existingActivity = get().activities.find(
          (activity) => activity.id === id,
        );

        if (!existingActivity || !canMutate(existingActivity, "canEditActivities")) {
          return false;
        }

        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id
              ? ({
                  ...activity,
                  ...updates,
                  id: activity.id,
                  type: activity.type,
                  babyId: activity.babyId,
                  createdBy: activity.createdBy,
                  updatedBy: getCurrentFamilyMember()?.id,
                  updatedAt: new Date().toISOString(),
                } as Activity)
              : activity,
          ),
        }));

        audit(existingActivity, "updated");

        return true;
      },

      removeActivity: (id) => {
        const existing = get().activities.find((activity) => activity.id === id);
        if (!existing || !canMutate(existing, "canDeleteActivities")) return;
        set((state) => ({ activities: state.activities.filter((activity) => activity.id !== id) }));
        audit(existing, "deleted");
      },

      clearActivities: () =>
        set({
          activities: [],
          activeActivity: null,
        }),
      replaceActivities: (activities) => set({ activities, activeActivity: null }),

      startActivity: ({ babyId, type, startedAt }) => {
        if (get().activeActivity || !can("canEditActivities")) {
          return false;
        }

        const requestedStart = startedAt
          ? new Date(startedAt)
          : new Date();

        if (
          Number.isNaN(requestedStart.getTime()) ||
          requestedStart.getTime() > Date.now()
        ) {
          return false;
        }

        set({
          activeActivity: {
            id: crypto.randomUUID(),
            babyId,
            type,
            startedAt: requestedStart.toISOString(),
            pausedAt: null,
            totalPausedMilliseconds: 0,
          },
        });

        return true;
      },

      updateActiveActivityStart: (startedAt) => {
        const activeActivity = get().activeActivity;
        const requestedStart = new Date(startedAt);

        if (
          !activeActivity ||
          Number.isNaN(requestedStart.getTime()) ||
          requestedStart.getTime() > Date.now()
        ) {
          return false;
        }

        const effectiveEnd = activeActivity.pausedAt
          ? new Date(activeActivity.pausedAt)
          : new Date();

        if (
          requestedStart.getTime() +
            activeActivity.totalPausedMilliseconds >
          effectiveEnd.getTime()
        ) {
          return false;
        }

        set({
          activeActivity: {
            ...activeActivity,
            startedAt: requestedStart.toISOString(),
          },
        });

        return true;
      },

      pauseActivity: () => {
        const activeActivity = get().activeActivity;

        if (!activeActivity || activeActivity.pausedAt) {
          return;
        }

        set({
          activeActivity: {
            ...activeActivity,
            pausedAt: new Date().toISOString(),
          },
        });
      },

      resumeActivity: () => {
        const activeActivity = get().activeActivity;

        if (!activeActivity?.pausedAt) {
          return;
        }

        const resumedAt = new Date();
        const pausedAt = new Date(activeActivity.pausedAt);

        const pausedMilliseconds = Math.max(
          0,
          resumedAt.getTime() - pausedAt.getTime(),
        );

        set({
          activeActivity: {
            ...activeActivity,
            pausedAt: null,
            totalPausedMilliseconds:
              activeActivity.totalPausedMilliseconds +
              pausedMilliseconds,
          },
        });
      },

      finishActivity: () => {
        const activeActivity = get().activeActivity;

        if (!activeActivity) {
          return null;
        }

        const endedAt = new Date();

        const currentPauseMilliseconds = activeActivity.pausedAt
          ? Math.max(
              0,
              endedAt.getTime() -
                new Date(activeActivity.pausedAt).getTime(),
            )
          : 0;

        const totalPausedMilliseconds =
          activeActivity.totalPausedMilliseconds +
          currentPauseMilliseconds;

        const activeMilliseconds = Math.max(
          0,
          endedAt.getTime() -
            new Date(activeActivity.startedAt).getTime() -
            totalPausedMilliseconds,
        );

        const finishedActivity: FinishedActiveActivity = {
          ...activeActivity,
          pausedAt: null,
          totalPausedMilliseconds,
          endedAt: endedAt.toISOString(),
          durationSeconds: Math.floor(activeMilliseconds / 1000),
          pausedDurationSeconds: Math.floor(
            totalPausedMilliseconds / 1000,
          ),
        };

        set({
          activeActivity: null,
        });

        return finishedActivity;
      },

      cancelActiveActivity: () =>
        set({
          activeActivity: null,
        }),
    }),
    {
      name: "babynest-activities",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<ActivityStore> | undefined;
        return { ...state, activities: (state?.activities ?? []).map((activity) => ({ ...activity, createdBy: activity.createdBy ?? "local-owner-member", updatedBy: activity.updatedBy ?? activity.createdBy ?? "local-owner-member" })) };
      },
    },
  ),
);
