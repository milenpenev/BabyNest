import {
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { profileService } from "../services/profileService";
import {
  getUserDisplayName,
  getUserInitials,
  useAuthStore,
} from "../../../store/authStore";

export default function UserProfileCard() {
  const { t } = useTranslation();

  const user = useAuthStore(
    (state) => state.user,
  );

  const updateUser = useAuthStore(
    (state) => state.updateUser,
  );

  const [displayName, setDisplayName] =
    useState(() =>
      getUserDisplayName(user),
    );

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    setDisplayName(
      getUserDisplayName(user),
    );
  }, [user]);

  if (!user) {
    return null;
  }

  async function saveProfile(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const normalizedName =
      displayName.trim();

    if (!normalizedName) {
      setError(
        t("profile.nameRequired"),
      );
      return;
    }

    setBusy(true);
    setError("");
    setSaved(false);

    try {
      const result =
        await profileService.updateCurrentProfile({
          displayName: normalizedName,
        });

      if (result.error) {
        throw result.error;
      }

      if (result.authUser) {
        updateUser(result.authUser);
      }

      setSaved(true);
    } catch (error) {
      console.error(
        "Failed to update profile",
        error,
      );

      setError(
        t("profile.updateError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
          {getUserInitials(user)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-indigo-600" />

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("profile.title")}
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("profile.description")}
          </p>
        </div>
      </div>

      <form
        onSubmit={saveProfile}
        className="mt-6 space-y-4"
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("profile.name")}
          </span>

          <div className="relative mt-2">
            <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(
                  event.target.value,
                );
                setSaved(false);
                setError("");
              }}
              required
              maxLength={80}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("profile.email")}
          </span>

          <div className="relative mt-2">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

            <input
              value={user.email ?? ""}
              readOnly
              className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-3 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            />
          </div>
        </label>

        {error ? (
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {t("profile.updated")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={
            busy ||
            !displayName.trim()
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {t("profile.save")}
        </button>
      </form>
    </section>
  );
}
