import type { AppDateFormat, AppTimeFormat, AppWeightUnit, AppLengthUnit } from "../../../store/appSettingsStore";

export function formatTimeValue(date: Date | string, timeFormat: AppTimeFormat, language: string) {
  const resolvedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(resolvedDate.getTime())) {
    return "—";
  }

  const locale = language === "bg" ? "bg-BG" : "en-GB";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(timeFormat === "12h" ? { hour12: true } : { hourCycle: "h23" as const }),
  }).format(resolvedDate);
}

export function formatDateValue(date: Date | string, dateFormat: AppDateFormat, language: string) {
  const resolvedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(resolvedDate.getTime())) {
    return "—";
  }

  void language;
  const day = String(resolvedDate.getDate()).padStart(2, "0");
  const month = String(resolvedDate.getMonth() + 1).padStart(2, "0");
  const year = String(resolvedDate.getFullYear()).padStart(4, "0");
  if (dateFormat === "MM/dd/yyyy") return `${month}/${day}/${year}`;
  if (dateFormat === "yyyy-MM-dd") return `${year}-${month}-${day}`;
  return `${day}.${month}.${year}`;
}

export function formatDateTimeValue(date: Date | string, timeFormat: AppTimeFormat, dateFormat: AppDateFormat, language: string) {
  const dateValue = formatDateValue(date, dateFormat, language);
  const timeValue = formatTimeValue(date, timeFormat, language);

  return `${dateValue} ${timeValue}`;
}

export function kgToLb(value: number) {
  return value * 2.2046226218;
}

export function lbToKg(value: number) {
  return value / 2.2046226218;
}

export function cmToIn(value: number) {
  return value / 2.54;
}

export function inToCm(value: number) {
  return value * 2.54;
}

export function formatWeight(value: number | undefined, unit: AppWeightUnit, language: string) {
  if (value === undefined) {
    return "—";
  }

  const displayValue = unit === "lb" ? kgToLb(value) : value;
  const rounded = Number(displayValue.toFixed(unit === "lb" ? 1 : 2));

  return `${rounded} ${unit === "kg" ? (language === "bg" ? "кг" : "kg") : (language === "bg" ? "lb" : "lb")}`;
}

export function formatLength(value: number | undefined, unit: AppLengthUnit, language: string) {
  if (value === undefined) {
    return "—";
  }

  const displayValue = unit === "in" ? cmToIn(value) : value;
  const rounded = Number(displayValue.toFixed(unit === "in" ? 1 : 2));

  return `${rounded} ${unit === "cm" ? (language === "bg" ? "см" : "cm") : (language === "bg" ? "in" : "in")}`;
}
