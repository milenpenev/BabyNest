import { requireSupabase } from "../../../lib/supabase/supabaseClient";
import type { SubscriptionPlan } from "../../../store/subscriptionStore";

export async function getFamilySubscription(
  familyId: string,
): Promise<SubscriptionPlan> {
  const normalizedFamilyId = familyId.trim();

  if (!normalizedFamilyId) {
    return "free";
  }

  const supabase = requireSupabase();

  const { data, error } = await supabase.rpc(
    "get_family_subscription",
    {
      p_family_id: normalizedFamilyId,
    },
  );

  if (error) {
    throw error;
  }

  return data === "premium"
    ? "premium"
    : "free";
}
