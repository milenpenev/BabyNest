import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import bg from "./locales/bg/common.json";
import en from "./locales/en/common.json";

const savedLanguage = localStorage.getItem("babynest-language") ?? "bg";

i18n.use(initReactI18next).init({
  resources: {
    bg: {
      translation: bg,
    },
    en: {
      translation: en,
    },
  },

  lng: savedLanguage,
  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("babynest-language", language);
  document.documentElement.lang = language;
});

document.documentElement.lang = savedLanguage;

export default i18n;