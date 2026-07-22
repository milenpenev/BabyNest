export const supportedLanguages = [
  {
    code: "bg",
    name: "Български",
    shortName: "BG",
    flag: "🇧🇬",
  },
  {
    code: "en",
    name: "English",
    shortName: "EN",
    flag: "🇬🇧",
  },
] as const;

export type SupportedLanguageCode =
  (typeof supportedLanguages)[number]["code"];