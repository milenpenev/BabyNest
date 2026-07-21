import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Activity } from "../entities/activity/model/activity.types";

interface ActivityStore {
  activities: Activity[];

  addActivity: (activity: Activity) => void;

  removeActivity: (id: string) => void;

  clearActivities: () => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set) => ({
      activities: [],

      addActivity: (activity) =>
        set((state) => ({
          activities: [...state.activities, activity],
        })),

      removeActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter(
            (activity) => activity.id !== id,
          ),
        })),

      clearActivities: () =>
        set({
          activities: [],
        }),
    }),
    {
      name: "babynest-activities",
    },
  ),
);