import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getUserDisplayName,
  getUserInitials,
  useAuthStore,
} from "../../../store/authStore";
import UserProfileCard from "./UserProfileCard";

export default function ProfileSettingsHub() {
  const { t } = useTranslation();

  const user = useAuthStore(
    (state) => state.user,
  );

  const [isEditing, setIsEditing] =
    useState(false);

  if (!user) {
    return null;
  }

  const displayName =
    getUserDisplayName(user);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() =>
          setIsEditing((current) => !current)
        }
        aria-expanded={isEditing}
        className="group flex w-full items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700 sm:p-5"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-sm">
          {getUserInitials(user)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            {t("profile.account")}
          </p>

          <h2 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">
            {displayName ||
              t("profile.title")}
          </h2>

          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
            {user.email ?? ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-sm font-semibold text-slate-500 transition group-hover:text-indigo-600 dark:text-slate-400 sm:inline">
            {isEditing
              ? t("profile.closeProfileEditor")
              : t("profile.editProfile")}
          </span>

          {isEditing ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {isEditing ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <UserProfileCard />
        </div>
      ) : null}
    </section>
  );
}
