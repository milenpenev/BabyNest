import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hasFamilyPermission } from "../features/family/permissions/familyPermissions";
import { getCurrentFamilyMember } from "./familyStore";

const canManagePremium = () => hasFamilyPermission(getCurrentFamilyMember(), "canManagePremium");

export type SubscriptionPlan = "free" | "premium";

interface SubscriptionStore {
  plan: SubscriptionPlan;

  isPremium: () => boolean;
  setPlan: (plan: SubscriptionPlan) => void;
  enablePremium: () => void;
  disablePremium: () => void;
}

export const useSubscriptionStore =
  create<SubscriptionStore>()(
    persist(
      (set, get) => ({
        plan: "free",

        isPremium: () => get().plan === "premium",

        setPlan: (plan) => {
          if (!canManagePremium()) return;
          set({ plan });
        },

        enablePremium: () => {
          if (!canManagePremium()) return;
          set({ plan: "premium" });
        },

        disablePremium: () => {
          if (!canManagePremium()) return;
          set({ plan: "free" });
        },
      }),
      {
        name: "babynest-subscription",
      },
    ),
  );
