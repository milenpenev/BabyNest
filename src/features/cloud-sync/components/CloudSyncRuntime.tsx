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

import { familyService } from "../../family/services/familyService";
async function restoreCloudContext(session: Session | null) {
  console.log("[BabyNest restoreCloudContext] started", {
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
  });

  if (!session || !supabase) {
    unsubscribeRealtime();

    localStorage.removeItem(
      "babynest:active-session-user-id",
    );

    useBreastfeedingTimerStore.setState({
      activeSession: null,
    });

    useBabyStore.getState().replaceBabies([]);

    useActivityStore.setState({
      activities: [],
      activeActivity: null,
    });

    useFamilyStore.setState({
      members: [],
    });

    return;
  }

  try {
    const { data: memberships, error } = await supabase
      .from("family_members")
      .select("family_id,role")
      .eq("profile_id", session.user.id)
      .eq("status", "active")
      .is("deleted_at", null);
    if (error) throw error;

    const config = await babyNestDb.syncState.get("cloud");

    const familyIds = (memberships ?? []).map((item) => item.family_id);

    const sessionOwnerKey =
      "babynest:active-session-user-id";

    const previousSessionUserId =
      localStorage.getItem(sessionOwnerKey);

    const isSameAccount =
      previousSessionUserId === session.user.id;

    const requestedFamilyId =
      useFamilyStore.getState().family.id;

    const rememberedFamilyId =
      localStorage.getItem(
        `babynest:last-family:${session.user.id}`,
      );

    const configuredFamilyId =
      config?.familyId &&
      familyIds.includes(config.familyId)
        ? config.familyId
        : null;

    const ownerFamilyIds = (memberships ?? [])
      .filter((membership) => membership.role === "owner")
      .map((membership) => membership.family_id);

    const familyId =
      (
        isSameAccount &&
        requestedFamilyId &&
        familyIds.includes(requestedFamilyId)
          ? requestedFamilyId
          : rememberedFamilyId &&
              familyIds.includes(rememberedFamilyId)
            ? rememberedFamilyId
            : configuredFamilyId
              ? configuredFamilyId
              : ownerFamilyIds[0] ?? familyIds[0]
      ) ?? null;

    localStorage.setItem(
      sessionOwnerKey,
      session.user.id,
    );

    if (!familyId) {
      useFamilyStore.setState({
        members: [],
      });

      // Оставаме в локален режим.
      // Не трием локалните данни.
      unsubscribeRealtime();
      await refreshSyncCounts();
      return;
    }

    await adoptCloudFamilyId(familyId);

    const { data: cloudBabyRows, error: cloudBabiesError } =
      await supabase
        .from("babies")
        .select(
          "id,family_id,name,birthday,gender,gestational_week,data,created_at,updated_at,deleted_at",
        )
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

    if (cloudBabiesError) {
      throw cloudBabiesError;
    }

    const cloudBabies = (cloudBabyRows ?? []).map((row) => {
      const storedData =
        row.data &&
        typeof row.data === "object" &&
        !Array.isArray(row.data)
          ? row.data
          : {};

      return {
        ...storedData,
        id: row.id,
        familyId: row.family_id,
        name: row.name,
        birthday: row.birthday,
        gender: row.gender,
        gestationalWeek: row.gestational_week,
        createdAt:
          row.created_at ??
          storedData.createdAt ??
          new Date().toISOString(),
        updatedAt:
          row.updated_at ??
          storedData.updatedAt ??
          new Date().toISOString(),
      };
    });

    console.log("[BabyNest direct cloud babies]", {
      familyId,
      babyCount: cloudBabies.length,
      cloudBabies,
    });

    useBabyStore.getState().replaceBabies(
      cloudBabies,
      useBabyStore.getState().selectedBabyId,
    );

    localStorage.setItem(
      `babynest:last-family:${session.user.id}`,
      familyId,
    );

    // BabyNest: globally synchronize cloud family members
    // so activity permission checks work on every page.
    const cloudFamilyMembers =
      await familyService.listMembers(familyId);

    useFamilyStore.setState({
      members: cloudFamilyMembers.map((member) => ({
        id: member.profileId,
        familyId: member.familyId,
        userId: member.profileId,
        displayName: member.displayName,
        email: member.email ?? undefined,
        role: member.role,
        avatarColor: "indigo",
        notificationPreferences: {
          feeding: true,
          medication: true,
          vaccination: true,
          sleep: true,
        },
        joinedAt:
          member.createdAt ?? new Date().toISOString(),
      })),
    });

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
    useBreastfeedingTimerStore.setState({
      activeSession: null,
    });

    // Не изчистваме бебетата предварително.
    // Заменяме ги едва след като данните за новото семейство са заредени.
    useActivityStore.setState({
      activities: [],
      activeActivity: null,
    });

    const [cachedBabies, cachedActivities] = await Promise.all([
      localBabyRepository.list(familyId),
      localActivityRepository.list(familyId),
    ]);

    console.log(
      "[BabyNest cloud baby load]",
      {
        sessionUserId: session.user.id,
        familyId,
        cachedBabies,
        cachedBabyCount: cachedBabies.length,
      },
    );

    // Do not overwrite the authoritative Supabase baby list
    // with the earlier local cache.

    useActivityStore.setState({
      activities: cachedActivities,
    });

    await pullChanges(familyId);

    // pullChanges записва cloud данните в локалните repositories.
    // След синхронизацията трябва отново да заредим Zustand store-овете,
    // иначе UI остава със стария празен cache.
    const syncedActivities =
      await localActivityRepository.list(familyId);

    // Do not overwrite the authoritative Supabase baby list
    // with the post-pull local cache.

    useActivityStore.setState({
      activities: syncedActivities,
      activeActivity:
        useActivityStore.getState().activeActivity,
    });
    // BabyNest authoritative cloud activities:
    // Load the selected family's history directly from Supabase
    // after local pull/cache processing has completed.
    const {
      data: cloudActivityRows,
      error: cloudActivitiesError,
    } = await supabase
      .from("activities")
      .select(
        "id,family_id,baby_id,type,started_at,ended_at,data,note,created_at,updated_at,deleted_at",
      )
      .eq("family_id", familyId)
      .is("deleted_at", null)
      .order("started_at", { ascending: true });

    if (cloudActivitiesError) {
      throw cloudActivitiesError;
    }

    const cloudActivities = (cloudActivityRows ?? []).map(
      (row) => ({
        id: row.id,
        familyId: row.family_id,
        babyId: row.baby_id,
        type: row.type,
        startedAt: row.started_at,
        endedAt: row.ended_at ?? undefined,
        data:
          row.data &&
          typeof row.data === "object" &&
          !Array.isArray(row.data)
            ? row.data
            : {},
        note: row.note ?? undefined,
        createdAt:
          row.created_at ??
          row.started_at ??
          new Date().toISOString(),
        updatedAt:
          row.updated_at ??
          row.created_at ??
          row.started_at ??
          new Date().toISOString(),
      }),
    );

    console.log(
      "[BabyNest authoritative cloud activities]",
      {
        familyId,
        activityCount: cloudActivities.length,
      },
    );

    useActivityStore.setState({
      activities: cloudActivities as ReturnType<
        typeof useActivityStore.getState
      >["activities"],
    });

    await subscribeRealtime(familyId);
    await pushQueue();
    await refreshSyncCounts();
  } catch (error) {
    console.error(
      "[BabyNest restoreCloudContext] failed",
      error,
    );

    useSyncStatusStore.getState().setStatus({
      state: "failed",
    });
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
