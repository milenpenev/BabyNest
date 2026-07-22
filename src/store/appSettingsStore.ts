import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "bg" | "en";
export type AppTimeFormat = "24h" | "12h";
export type AppDateFormat = "dd.MM.yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
export type AppFirstDayOfWeek = "monday" | "sunday";
export type AppWeightUnit = "kg" | "lb";
export type AppLengthUnit = "cm" | "in";
export type AppAppearance = "system" | "light" | "dark";

export interface AppSettings {
  version: number;
  language: AppLanguage;
  timeFormat: AppTimeFormat;
  dateFormat: AppDateFormat;
  firstDayOfWeek: AppFirstDayOfWeek;
  weightUnit: AppWeightUnit;
  lengthUnit: AppLengthUnit;
  appearance: AppAppearance;
  notifications: {
    sleep: boolean;
    feeding: boolean;
    diaper: boolean;
    medicine: boolean;
    vaccination: boolean;
    milestone: boolean;
  };
}

export const defaultSettings: AppSettings = {
  version: 1,
  language: "bg",
  timeFormat: "24h",
  dateFormat: "dd.MM.yyyy",
  firstDayOfWeek: "monday",
  weightUnit: "kg",
  lengthUnit: "cm",
  appearance: "system",
  notifications: {
    sleep: true,
    feeding: true,
    diaper: true,
    medicine: false,
    vaccination: false,
    milestone: false,
  },
};

export function normalizeSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  const isOneOf = <T extends string>(candidate: unknown, options: readonly T[], fallback: T): T =>
    typeof candidate === "string" && options.includes(candidate as T) ? candidate as T : fallback;
  const notifications = value?.notifications;
  return {
    version: 1,
    language: isOneOf(value?.language, ["bg", "en"], defaultSettings.language),
    timeFormat: isOneOf(value?.timeFormat, ["24h", "12h"], defaultSettings.timeFormat),
    dateFormat: isOneOf(value?.dateFormat, ["dd.MM.yyyy", "MM/dd/yyyy", "yyyy-MM-dd"], defaultSettings.dateFormat),
    firstDayOfWeek: isOneOf(value?.firstDayOfWeek, ["monday", "sunday"], defaultSettings.firstDayOfWeek),
    weightUnit: isOneOf(value?.weightUnit, ["kg", "lb"], defaultSettings.weightUnit),
    lengthUnit: isOneOf(value?.lengthUnit, ["cm", "in"], defaultSettings.lengthUnit),
    appearance: isOneOf(value?.appearance, ["system", "light", "dark"], defaultSettings.appearance),
    notifications: {
      sleep: typeof notifications?.sleep === "boolean" ? notifications.sleep : defaultSettings.notifications.sleep,
      feeding: typeof notifications?.feeding === "boolean" ? notifications.feeding : defaultSettings.notifications.feeding,
      diaper: typeof notifications?.diaper === "boolean" ? notifications.diaper : defaultSettings.notifications.diaper,
      medicine: typeof notifications?.medicine === "boolean" ? notifications.medicine : defaultSettings.notifications.medicine,
      vaccination: typeof notifications?.vaccination === "boolean" ? notifications.vaccination : defaultSettings.notifications.vaccination,
      milestone: typeof notifications?.milestone === "boolean" ? notifications.milestone : defaultSettings.notifications.milestone,
    },
  };
}

interface AppSettingsStore extends AppSettings {
  setLanguage: (language: AppLanguage) => void;
  setTimeFormat: (timeFormat: AppTimeFormat) => void;
  setDateFormat: (dateFormat: AppDateFormat) => void;
  setFirstDayOfWeek: (firstDayOfWeek: AppFirstDayOfWeek) => void;
  setWeightUnit: (weightUnit: AppWeightUnit) => void;
  setLengthUnit: (lengthUnit: AppLengthUnit) => void;
  setAppearance: (appearance: AppAppearance) => void;
  setNotification: (key: keyof AppSettings["notifications"], value: boolean) => void;
  replaceSettings: (settings: AppSettings) => void;
  reset: () => void;
}

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setLanguage: (language) => set({ language }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setFirstDayOfWeek: (firstDayOfWeek) => set({ firstDayOfWeek }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setLengthUnit: (lengthUnit) => set({ lengthUnit }),
      setAppearance: (appearance) => set({ appearance }),
      setNotification: (key, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: value,
          },
        })),
      replaceSettings: (settings) => set(normalizeSettings(settings)),
      reset: () =>
        set(() => ({
          ...defaultSettings,
          notifications: {
            ...defaultSettings.notifications,
          },
        })),
    }),
    {
      name: "babynest-settings",
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          return normalizeSettings(persistedState as Partial<AppSettings> | null | undefined);
        }

        return normalizeSettings(persistedState as Partial<AppSettings> | null | undefined);
      },
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<AppSettingsStore>),
        };

        const normalized = normalizeSettings(merged as Partial<AppSettings> | null | undefined);

        return {
          ...normalized,
          setLanguage: currentState.setLanguage,
          setTimeFormat: currentState.setTimeFormat,
          setDateFormat: currentState.setDateFormat,
          setFirstDayOfWeek: currentState.setFirstDayOfWeek,
          setWeightUnit: currentState.setWeightUnit,
          setLengthUnit: currentState.setLengthUnit,
          setAppearance: currentState.setAppearance,
          setNotification: currentState.setNotification,
          replaceSettings: currentState.replaceSettings,
          reset: currentState.reset,
        } as AppSettingsStore;
      },
    },
  ),
);
