import { useTranslation } from "react-i18next";

import { supportedLanguages } from "../../i18n/languages";
import { useAppSettingsStore } from "../../store/appSettingsStore";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const setLanguage = useAppSettingsStore((state) => state.setLanguage);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
      aria-label="Language selector"
    >
      {supportedLanguages.map((language) => {
        const isActive = currentLanguage === language.code;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => { setLanguage(language.code); void i18n.changeLanguage(language.code); }}
            className={[
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white",
            ].join(" ")}
            aria-pressed={isActive}
            title={language.name}
          >
            <span aria-hidden="true">{language.flag}</span>
            <span>{language.shortName}</span>
          </button>
        );
      })}
    </div>
  );
}
