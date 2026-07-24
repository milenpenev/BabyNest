import { useEffect } from "react";
import { supabase } from "../../../lib/supabase/supabaseClient";
import {
  pushQueue,
  pullChanges,
  refreshSyncCounts,
  subscribeRealtime,
  unsubscribeRealtime,
} from "../../../data/sync/cloudSyncService";
import { babyNestDb } from "../../../lib/local-db/babyNestDb";
import type { Session } from "@supabase/supabase-js";
import { useSyncStatusStore } from "../../../store/syncStatusStore";
import { useBabyStore } from "../../../store/babyStore";
import { useFamilyStore } from "../../../store/familyStore";
import { useActivityStore } from "../../../store/activityStore";
import { useBreastfeedingTimerStore } from "../../../store/breastfeedingTimerStore";

import {
  localActivityRepository,
  localBabyRepository,
} from "../../../data/local/repositories";

import { adoptCloudFamilyId } from "../services/adoptCloudFamilyId";

async function restoreCloudContext(session: Session | null) {
  if (!session || !supabase) {
    unsubscribeRealtime();
    return;
  }

  try {
    const { data: memberships, error } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("profile_id", session.user.id)
      .eq("status", "active")
      .is("deleted_at", null);
    if (error) throw error;

    const config = await babyNestDb.syncState.get("cloud");

    const familyIds = (memberships ?? []).map((item) => item.family_id);

    const requestedFamilyId = useFamilyStore.getState().family.id;

    const familyId =
      requestedFamilyId && familyIds.includes(requestedFamilyId)
        ? requestedFamilyId
        : (
            config?.familyId && familyIds.includes(config.familyId)
              ? config.familyId
              : familyIds[0]
          ) ?? null;

    if (!familyId) {
      // Оставаме в локален режим.
      // Не трием локалните данни.
      unsubscribeRealtime();
      await refreshSyncCounts();
      return;
    }

    await adoptCloudFamilyId(familyId);

    await babyNestDb.syncState.put({
      ...config,
      id: "cloud",
      enabled: true,
      familyId,
    });
    const activeSleep = useActivityStore.getState().activeActivity;
    if (activeSleep?.type === "sleep") {
      await localActivityRepository.create({
        id: activeSleep.id,
        babyId: activeSleep.babyId,
        familyId,
        type: "sleep",
        startedAt: activeSleep.startedAt,
        createdAt: activeSleep.startedAt,
        updatedAt: new Date().toISOString(),
        data: {
          pausedAt: activeSleep.pausedAt,
          totalPausedMilliseconds: activeSleep.totalPausedMilliseconds,
          pausedDurationSeconds: Math.floor(
            activeSleep.totalPausedMilliseconds / 1000,
          ),
        },
      } as Parameters<typeof localActivityRepository.create>[0]);
    }
    const activeFeeding = useBreastfeedingTimerStore.getState().activeSession;
    if (activeFeeding) {
      await localActivityRepository.create({
        id: activeFeeding.id,
        babyId: activeFeeding.babyId,
        familyId,
        type: "breastfeeding",
        startedAt: activeFeeding.startedAt,
        createdAt: activeFeeding.startedAt,
        updatedAt: new Date().toISOString(),
        data: {
          firstSide: activeFeeding.firstSide,
          leftDurationSeconds: Math.floor(
            activeFeeding.leftDurationMilliseconds / 1000,
          ),
          rightDurationSeconds: Math.floor(
            activeFeeding.rightDurationMilliseconds / 1000,
          ),
          timerState: activeFeeding,
        },
      } as Parameters<typeof localActivityRepository.create>[0]);
    }
    useBabyStore.getState().replaceBabies([]);

    useActivityStore.setState({
      activities: [],
      activeActivity: null,
    });

    const [cachedBabies, cachedActivities] = await Promise.all([
      localBabyRepository.list(familyId),
      localActivityRepository.list(familyId),
    ]);

    useBabyStore.getState().replaceBabies(cachedBabies);

    useActivityStore.setState({
      activities: cachedActivities,
    });

    await pullChanges(familyId);
    await subscribeRealtime(familyId);
    await pushQueue();
    await refreshSyncCounts();
  } catch {
    useSyncStatusStore.getState().setStatus({ state: "failed" });
  }
}

export default function CloudSyncRuntime() {
  const activeFamilyId = useFamilyStore((state) => state.family.id);

  useEffect(() => {
    const online = () => {
      void pushQueue();
    };
    const offline = () => {
      void refreshSyncCounts();
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("babynest:sync-request", online);
    const interval = window.setInterval(() => void pushQueue(), 30_000);
    void refreshSyncCounts();
    const auth = supabase?.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void restoreCloudContext(session), 0);
    });
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("babynest:sync-request", online);
      window.clearInterval(interval);
      auth?.data.subscription.unsubscribe();
      unsubscribeRealtime();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;

    void supabase?.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        return restoreCloudContext(data.session);
      }

      return undefined;
    });

    return () => {
      cancelled = true;
    };
  }, [activeFamilyId]);

  return null;
}
