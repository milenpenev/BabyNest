import { useEffect } from "react";

import { useFamilyStore } from "../../../store/familyStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";

export default function FamilySubscriptionRuntime() {
  const activeFamilyId = useFamilyStore((state) => state.family.id);

  const refreshForFamily = useSubscriptionStore(
    (state) => state.refreshForFamily,
  );

  useEffect(() => {
    void refreshForFamily(activeFamilyId || null);
  }, [activeFamilyId, refreshForFamily]);

  return null;
}
