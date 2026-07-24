import { create } from "zustand";

import { getFamilySubscription } from "../features/premium/services/familySubscriptionService";

export type SubscriptionPlan = "free" | "premium";

interface SubscriptionStore {
  /**
   * effectivePlan е реалният план за семейството
   * на текущо избраното бебе.
   */
  effectivePlan: SubscriptionPlan;

  /**
   * Временен compatibility alias.
   * Ще бъде премахнат, след като всички компоненти
   * преминат към effectivePlan.
   */
  plan: SubscriptionPlan;
  familyId: string | null;
  loading: boolean;
  error: string | null;

  isPremium: () => boolean;

  /**
   * Използва се само от съществуващите dev/test UI контроли.
   */
  setPlan: (plan: SubscriptionPlan) => void;

  refreshForFamily: (familyId: string | null) => Promise<void>;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()((set, get) => ({
  effectivePlan: "free",
  plan: "free",
  familyId: null,
  loading: false,
  error: null,

  isPremium: () => get().effectivePlan === "premium",

  setPlan: (plan) =>
    set({
      effectivePlan: plan,
      plan,
    }),

  refreshForFamily: async (familyId) => {
    if (!familyId) {
      set({
        effectivePlan: "free",
        plan: "free",
        familyId: null,
        loading: false,
        error: null,
      });
      return;
    }

    set({
      familyId,
      loading: true,
      error: null,
    });

    try {
      const plan = await getFamilySubscription(familyId);

      if (get().familyId !== familyId) {
        return;
      }

      set({
        effectivePlan: plan,
        plan,
        loading: false,
        error: null,
      });
    } catch (error) {
      if (get().familyId !== familyId) {
        return;
      }

      set({
        effectivePlan: "free",
        plan: "free",
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load subscription.",
      });
    }
  },

  reset: () =>
    set({
      effectivePlan: "free",
      plan: "free",
      familyId: null,
      loading: false,
      error: null,
    }),
}));
