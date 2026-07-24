import { Home, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { CloudFamily } from "../services/familyService";

interface FamilySwitcherCardProps {
  families: CloudFamily[];
  activeFamilyId: string;
  onChange: (familyId: string) => Promise<void>;
}

export default function FamilySwitcherCard({
  families,
  activeFamilyId,
  onChange,
}: FamilySwitcherCardProps) {
  const { t } = useTranslation();

  const [switching, setSwitching] = useState(false);

  if (families.length < 2) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {switching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Home className="h-5 w-5" />
          )}
        </span>

        <label className="min-w-0 flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {t("family.activeFamily")}

          <select
            value={activeFamilyId}
            disabled={switching}
            onChange={async (event) => {
              const nextFamilyId = event.target.value;

              if (!nextFamilyId || nextFamilyId === activeFamilyId) {
                return;
              }

              setSwitching(true);

              try {
                await onChange(nextFamilyId);
              } finally {
                setSwitching(false);
              }
            }}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name} · {t(`family.roles.${family.role}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
