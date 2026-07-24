import { babyNestDb } from "../../../lib/local-db/babyNestDb";
import { useActivityStore } from "../../../store/activityStore";
import { useFamilyStore } from "../../../store/familyStore";

const LEGACY_LOCAL_FAMILY_ID = "local-family";

export async function adoptCloudFamilyId(
  cloudFamilyId: string,
) {
  const normalizedCloudFamilyId =
    cloudFamilyId.trim();

  if (!normalizedCloudFamilyId) {
    return;
  }

  const currentFamilyId =
    useFamilyStore.getState().family.id;

  const activityRows =
    await babyNestDb.activities.toArray();

  const babyRows =
    await babyNestDb.babies.toArray();

  const migratedActivityRows =
    activityRows.map((row) => {
      const rowFamilyId =
        row.meta.familyId ??
        row.value.familyId;

      if (
        rowFamilyId !==
          LEGACY_LOCAL_FAMILY_ID &&
        rowFamilyId !== currentFamilyId
      ) {
        return row;
      }

      return {
        ...row,
        value: {
          ...row.value,
          familyId: normalizedCloudFamilyId,
        },
        meta: {
          ...row.meta,
          familyId: normalizedCloudFamilyId,
          updatedAt: new Date().toISOString(),
        },
      };
    });

  const migratedBabyRows =
    babyRows.map((row) => {
      const rowFamilyId =
        row.meta.familyId ??
        row.value.familyId;

      if (
        rowFamilyId !==
          LEGACY_LOCAL_FAMILY_ID &&
        rowFamilyId !== currentFamilyId
      ) {
        return row;
      }

      return {
        ...row,
        value: {
          ...row.value,
          familyId: normalizedCloudFamilyId,
        },
        meta: {
          ...row.meta,
          familyId: normalizedCloudFamilyId,
          updatedAt: new Date().toISOString(),
        },
      };
    });

  if (migratedActivityRows.length > 0) {
    await babyNestDb.activities.bulkPut(
      migratedActivityRows,
    );
  }

  if (migratedBabyRows.length > 0) {
    await babyNestDb.babies.bulkPut(
      migratedBabyRows,
    );
  }

  useActivityStore.setState((state) => ({
    activities: state.activities.map(
      (activity) =>
        activity.familyId ===
          LEGACY_LOCAL_FAMILY_ID ||
        activity.familyId === currentFamilyId
          ? {
              ...activity,
              familyId:
                normalizedCloudFamilyId,
            }
          : activity,
    ),
  }));


  useFamilyStore
    .getState()
    .setActiveFamilyId(
      normalizedCloudFamilyId,
    );
}
