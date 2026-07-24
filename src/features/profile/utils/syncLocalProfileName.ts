import { useCurrentUserStore } from "../../../store/currentUserStore";
import { useFamilyStore } from "../../../store/familyStore";

const LOCAL_OWNER_MEMBER_ID = "local-owner-member";

export function syncLocalProfileName(
  authUserId: string,
  displayName: string,
) {
  const normalizedName = displayName.trim();

  if (!authUserId || !normalizedName) {
    return;
  }

  const currentUser =
    useCurrentUserStore.getState().currentUser;

  /*
   * Свързваме локалния потребител с реалния Supabase user ID.
   * Това не променя FamilyMember ID, към който сочат старите активности.
   */
  useCurrentUserStore
    .getState()
    .setCurrentUser({
      ...currentUser,
      displayName: normalizedName,
      authProvider: "supabase",
    });

  useFamilyStore.setState((state) => {
    const matchingMember =
      state.members.find(
        (member) =>
          member.userId === authUserId,
      ) ??
      state.members.find(
        (member) =>
          member.userId === currentUser.id,
      ) ??
      state.members.find(
        (member) =>
          member.id ===
          LOCAL_OWNER_MEMBER_ID,
      ) ??
      state.members.find(
        (member) =>
          member.role === "owner",
      );

    if (!matchingMember) {
      return state;
    }

    return {
      members: state.members.map(
        (member) =>
          member.id === matchingMember.id
            ? {
                ...member,
                userId: authUserId,
                displayName:
                  normalizedName,
              }
            : member,
      ),
    };
  });
}
