import { Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateFamilyCardProps {
  onCreate: (familyName: string) => Promise<void>;
}

export default function CreateFamilyCard({ onCreate }: CreateFamilyCardProps) {
  const { t } = useTranslation();

  const [familyName, setFamilyName] = useState("");

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const normalizedName = familyName.trim();

    if (!normalizedName || creating) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await onCreate(normalizedName);
      setFamilyName("");
    } catch (caughtError) {
      console.error("Failed to create family", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("family.genericError"),
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Users className="h-5 w-5" />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("family.createNewFamily")}
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("family.createNewFamilyDescription")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={familyName}
          onChange={(event) => setFamilyName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleCreate();
            }
          }}
          placeholder={t("family.familyNamePlaceholder")}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />

        <button
          type="button"
          disabled={creating || !familyName.trim()}
          onClick={() => void handleCreate()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}

          {t("family.createFamily")}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
