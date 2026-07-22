import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Plus, Save, Trash2, X } from "lucide-react";

import type { Baby, BabyGender, SupportedVaccinationCountryCode } from "../../entities/baby/model/baby.types";
import { calculateCorrectedAge } from "../../features/baby/utils/correctedAge";
import { useBabyStore } from "../../store/babyStore";
import { useActivityStore } from "../../store/activityStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { formatDateValue, formatLength, formatWeight } from "../../features/settings/utils/formatting";
import RoutinePreferencesForm, { RoutineQuestionnaireFields } from "../../features/routine/components/RoutinePreferencesForm";
import { defaultRoutineFormValues } from "../../features/routine/model/routineForm";
import { isValidRoutineInterval } from "../../features/routine/utils/routineIntervals";
import VaccinationCountrySettings, { VaccinationCountrySelect, VaccinationRegionSelect, VaccinationSelectionPreview } from "../../features/vaccinations/components/VaccinationCountrySettings";
import { getScheduleDefinition } from "../../features/vaccinations/data/schedules";

const genderOptions: Array<{ value: BabyGender; labelKey: string }> = [
  { value: "unspecified", labelKey: "babyProfile.genderUnspecified" },
  { value: "girl", labelKey: "babyProfile.genderGirl" },
  { value: "boy", labelKey: "babyProfile.genderBoy" },
];

function toDateInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toIsoDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }

  return new Date(year, month - 1, day).toISOString();
}

export default function BabyProfilePage() {
  const { t, i18n } = useTranslation();
  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const selectBaby = useBabyStore((state) => state.selectBaby);
  const updateBaby = useBabyStore((state) => state.updateBaby);
  const addBaby = useBabyStore((state) => state.addBaby);
  const removeBaby = useBabyStore((state) => state.removeBaby);
  const activities = useActivityStore((state) => state.activities);
  const settings = useAppSettingsStore((state) => state);

  const selectedBaby = babies.find((baby) => baby.id === selectedBabyId) ?? babies[0] ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formState, setFormState] = useState({
    name: selectedBaby?.name ?? "",
    birthday: selectedBaby?.birthday ? toDateInputValue(selectedBaby.birthday) : "",
    gestationalWeek: selectedBaby?.gestationalWeek?.toString() ?? "",
    gender: selectedBaby?.gender ?? "unspecified",
    birthWeightKg: selectedBaby?.birthWeightKg?.toString() ?? "",
    birthHeightCm: selectedBaby?.birthHeightCm?.toString() ?? "",
    notes: selectedBaby?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addForm, setAddForm] = useState({
    name: "",
    birthday: "",
    gestationalWeek: "",
    gender: "unspecified" as BabyGender,
    birthWeightKg: "",
    birthHeightCm: "",
    vaccinationCountryCode: "BG" as SupportedVaccinationCountryCode,
    vaccinationRegionCode: "",
    ...defaultRoutineFormValues(),
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsEditing(false);
    setErrors({});
    setFormState({
      name: selectedBaby?.name ?? "",
      birthday: selectedBaby?.birthday ? toDateInputValue(selectedBaby.birthday) : "",
      gestationalWeek: selectedBaby?.gestationalWeek?.toString() ?? "",
      gender: selectedBaby?.gender ?? "unspecified",
      birthWeightKg: selectedBaby?.birthWeightKg?.toString() ?? "",
      birthHeightCm: selectedBaby?.birthHeightCm?.toString() ?? "",
      notes: selectedBaby?.notes ?? "",
    });
  }, [selectedBaby, selectedBabyId]);

  const correctedAge = useMemo(() => {
    if (!selectedBaby) {
      return null;
    }

    return calculateCorrectedAge(selectedBaby.birthday, selectedBaby.gestationalWeek);
  }, [selectedBaby]);

  const hasActivities = selectedBaby ? activities.some((activity) => activity.babyId === selectedBaby.id) : false;

  const validate = (values: typeof formState) => {
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) {
      nextErrors.name = t("babyProfile.validationNameRequired");
    }

    if (!values.birthday) {
      nextErrors.birthday = t("babyProfile.validationBirthdayRequired");
    } else {
      const birthdayDate = new Date(values.birthday);
      if (Number.isNaN(birthdayDate.getTime()) || birthdayDate.getTime() > Date.now()) {
        nextErrors.birthday = t("babyProfile.validationBirthdayFuture");
      }
    }

    if (values.gestationalWeek) {
      const gestationalValue = Number(values.gestationalWeek);
      if (!Number.isFinite(gestationalValue) || gestationalValue < 22 || gestationalValue > 42) {
        nextErrors.gestationalWeek = t("babyProfile.validationGestationalRange");
      }
    }

    if (values.birthWeightKg) {
      const weight = Number(values.birthWeightKg);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 20) {
        nextErrors.birthWeightKg = t("babyProfile.validationWeightRange");
      }
    }

    if (values.birthHeightCm) {
      const height = Number(values.birthHeightCm);
      if (!Number.isFinite(height) || height <= 0 || height > 120) {
        nextErrors.birthHeightCm = t("babyProfile.validationHeightRange");
      }
    }
    return nextErrors;
  };

  const validateAdd = (values: typeof addForm) => {
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) {
      nextErrors.name = t("babyProfile.validationNameRequired");
    }

    if (!values.birthday) {
      nextErrors.birthday = t("babyProfile.validationBirthdayRequired");
    } else {
      const birthdayDate = new Date(values.birthday);
      if (Number.isNaN(birthdayDate.getTime()) || birthdayDate.getTime() > Date.now()) {
        nextErrors.birthday = t("babyProfile.validationBirthdayFuture");
      }
    }

    if (values.gestationalWeek) {
      const gestationalValue = Number(values.gestationalWeek);
      if (!Number.isFinite(gestationalValue) || gestationalValue < 22 || gestationalValue > 42) {
        nextErrors.gestationalWeek = t("babyProfile.validationGestationalRange");
      }
    }

    if (values.birthWeightKg) {
      const weight = Number(values.birthWeightKg);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 20) {
        nextErrors.birthWeightKg = t("babyProfile.validationWeightRange");
      }
    }

    if (values.birthHeightCm) {
      const height = Number(values.birthHeightCm);
      if (!Number.isFinite(height) || height <= 0 || height > 120) {
        nextErrors.birthHeightCm = t("babyProfile.validationHeightRange");
      }
    }
    if (!isValidRoutineInterval(Number(values.feedingIntervalMinutes))) nextErrors.feedingIntervalMinutes = t("routine.validationInterval");
    if (!isValidRoutineInterval(Number(values.diaperIntervalMinutes))) nextErrors.diaperIntervalMinutes = t("routine.validationInterval");
    if (values.vaccinationCountryCode === "CA" && !values.vaccinationRegionCode) nextErrors.vaccinationRegionCode = t("vaccinations.regionRequired");

    return nextErrors;
  };

  const handleSave = () => {
    if (!selectedBaby) {
      return;
    }

    const nextErrors = validate(formState);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const isoBirthday = toIsoDate(formState.birthday);

    updateBaby(selectedBaby.id, {
      name: formState.name.trim(),
      birthday: isoBirthday,
      gender: formState.gender as BabyGender,
      gestationalWeek: formState.gestationalWeek ? Number(formState.gestationalWeek) : undefined,
      birthWeightKg: formState.birthWeightKg ? Number(formState.birthWeightKg) : undefined,
      birthHeightCm: formState.birthHeightCm ? Number(formState.birthHeightCm) : undefined,
      notes: formState.notes.trim() || undefined,
    });

    setIsEditing(false);
  };

  const handleAddBaby = () => {
    const nextErrors = validateAdd(addForm);
    setAddErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const baby: Baby = {
      id: crypto.randomUUID(),
      name: addForm.name.trim(),
      birthday: toIsoDate(addForm.birthday),
      gender: addForm.gender,
      gestationalWeek: addForm.gestationalWeek ? Number(addForm.gestationalWeek) : undefined,
      birthWeightKg: addForm.birthWeightKg ? Number(addForm.birthWeightKg) : undefined,
      birthHeightCm: addForm.birthHeightCm ? Number(addForm.birthHeightCm) : undefined,
      routinePreferences: { feedingIntervalMinutes:Number(addForm.feedingIntervalMinutes),diaperIntervalMinutes:Number(addForm.diaperIntervalMinutes),useAdaptiveFeedingInterval:addForm.useAdaptiveFeedingInterval,useAdaptiveDiaperInterval:addForm.useAdaptiveDiaperInterval },
      vaccinationProfile: {countryCode:addForm.vaccinationCountryCode,regionCode:addForm.vaccinationRegionCode||undefined,scheduleVersion:getScheduleDefinition(addForm.vaccinationCountryCode,addForm.vaccinationRegionCode)?.scheduleVersion??"MANUAL",selectedAt:new Date().toISOString(),source:"registration"},
      notes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addBaby(baby);
    selectBaby(baby.id);
    setAddForm({ name: "", birthday: "", gestationalWeek: "", gender: "unspecified", birthWeightKg: "", birthHeightCm: "",vaccinationCountryCode:"BG",vaccinationRegionCode:"",...defaultRoutineFormValues() });
    setAddErrors({});
    setShowAddModal(false);
  };

  const handleDeleteBaby = () => {
    if (!selectedBaby) {
      return;
    }

    if (babies.length <= 1) {
      return;
    }

    if (hasActivities) {
      return;
    }

    removeBaby(selectedBaby.id);
    setShowDeleteConfirm(false);
  };

  if (!selectedBaby) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{t("babyProfile.title")}</h1>
          <p className="mt-3 text-sm text-slate-500">{t("babyProfile.empty")}</p>
          <button type="button" onClick={() => setShowAddModal(true)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{t("babyProfile.addBaby")}</button>
        </div>
        {showAddModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-800">
              <h2 className="text-xl font-semibold">{t("babyProfile.addBabyModal")}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(["name", "birthday", "gestationalWeek", "birthWeightKg", "birthHeightCm"] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-2 block text-sm font-semibold">{t(`babyProfile.${field === "birthWeightKg" ? "birthWeight" : field === "birthHeightCm" ? "birthHeight" : field}`)}</label>
                    <input type={field === "birthday" ? "date" : field === "name" ? "text" : "number"} value={addForm[field]} onChange={(event) => setAddForm((state) => ({ ...state, [field]: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3" />
                    {addErrors[field] ? <p className="mt-1 text-sm text-rose-600">{addErrors[field]}</p> : null}
                  </div>
                ))}
                <div><label className="mb-2 block text-sm font-semibold">{t("babyProfile.sex")}</label><select value={addForm.gender} onChange={(event) => setAddForm((state) => ({ ...state, gender: event.target.value as BabyGender }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3">{genderOptions.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey)}</option>)}</select></div>
              </div>
              <div className="mt-5"><RoutineQuestionnaireFields values={addForm} onChange={(routine) => setAddForm((state) => ({ ...state, ...routine }))} errors={addErrors} /></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2"><VaccinationCountrySelect value={addForm.vaccinationCountryCode} onChange={vaccinationCountryCode=>setAddForm(state=>({...state,vaccinationCountryCode,vaccinationRegionCode:""}))}/><VaccinationRegionSelect countryCode={addForm.vaccinationCountryCode} value={addForm.vaccinationRegionCode} onChange={vaccinationRegionCode=>setAddForm(state=>({...state,vaccinationRegionCode}))}/></div>
              <div className="mt-3"><VaccinationSelectionPreview countryCode={addForm.vaccinationCountryCode} regionCode={addForm.vaccinationRegionCode}/></div>
              {addErrors.vaccinationRegionCode?<p className="mt-2 text-sm text-rose-600">{addErrors.vaccinationRegionCode}</p>:null}
              <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowAddModal(false)}>{t("babyProfile.cancel")}</button><button type="button" onClick={handleAddBaby} className="rounded-full bg-indigo-600 px-4 py-2 text-white">{t("babyProfile.addBaby")}</button></div>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-6 text-white shadow-xl shadow-indigo-200/60 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-100">{t("babyProfile.title")}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{selectedBaby.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">{t("babyProfile.description")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {babies.length > 1 ? (
              <select value={selectedBaby.id} onChange={(event) => selectBaby(event.target.value)} className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none">
                {babies.map((baby) => (
                  <option key={baby.id} value={baby.id} className="text-slate-900">
                    {baby.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur"> <Plus className="h-4 w-4" /> {t("babyProfile.addBaby")}</button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600">{t("babyProfile.profile")}</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">{t("babyProfile.profileTitle")}</h2>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button type="button" onClick={() => { setIsEditing(true); setErrors({}); setFormState({ name: selectedBaby.name, birthday: selectedBaby.birthday ? toDateInputValue(selectedBaby.birthday) : "", gestationalWeek: selectedBaby.gestationalWeek?.toString() ?? "", gender: selectedBaby.gender ?? "unspecified", birthWeightKg: selectedBaby.birthWeightKg?.toString() ?? "", birthHeightCm: selectedBaby.birthHeightCm?.toString() ?? "", notes: selectedBaby.notes ?? "" }); }} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">{t("babyProfile.edit")}</button>
              ) : null}
              {babies.length > 1 ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600">{t("babyProfile.deleteBaby")}</button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-3xl font-bold text-white">{selectedBaby.name.charAt(0).toUpperCase()}</div>
              <p className="mt-4 text-sm font-semibold text-slate-700">{selectedBaby.name}</p>
              <p className="mt-1 text-sm text-slate-500">{t("babyProfile.avatarPlaceholder")}</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.name")}</label>
                  <input value={formState.name} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, name: event.target.value })); setErrors((state) => ({ ...state, name: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80" />
                  {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.birthday")}</label>
                  <input type="date" value={formState.birthday} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, birthday: event.target.value })); setErrors((state) => ({ ...state, birthday: "" })); }} max={new Date().toISOString().split("T")[0]} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80" />
                  {errors.birthday ? <p className="mt-2 text-sm text-rose-600">{errors.birthday}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.gestationalWeek")}</label>
                  <input type="number" min="22" max="42" value={formState.gestationalWeek} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, gestationalWeek: event.target.value })); setErrors((state) => ({ ...state, gestationalWeek: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80" />
                  {errors.gestationalWeek ? <p className="mt-2 text-sm text-rose-600">{errors.gestationalWeek}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.sex")}</label>
                  <select value={formState.gender} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, gender: event.target.value as BabyGender })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80">
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.birthWeight")}</label>
                  <input type="number" min="0" step="0.01" value={formState.birthWeightKg} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, birthWeightKg: event.target.value })); setErrors((state) => ({ ...state, birthWeightKg: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80" />
                  {errors.birthWeightKg ? <p className="mt-2 text-sm text-rose-600">{errors.birthWeightKg}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.birthHeight")}</label>
                  <input type="number" min="0" step="0.1" value={formState.birthHeightCm} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, birthHeightCm: event.target.value })); setErrors((state) => ({ ...state, birthHeightCm: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80" />
                  {errors.birthHeightCm ? <p className="mt-2 text-sm text-rose-600">{errors.birthHeightCm}</p> : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.notes")}</label>
                <textarea value={formState.notes} disabled={!isEditing} onChange={(event) => { setFormState((state) => ({ ...state, notes: event.target.value })); }} className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-default disabled:opacity-80" />
              </div>

              {isEditing ? (
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"> <Save className="h-4 w-4" /> {t("babyProfile.save")}</button>
                  <button type="button" onClick={() => { setIsEditing(false); setErrors({}); }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"> <X className="h-4 w-4" /> {t("babyProfile.cancel")}</button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><CalendarDays className="h-4 w-4" />{t("babyProfile.ageOverview")}</div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t("babyProfile.chronologicalAge")}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{correctedAge ? `${correctedAge.chronologicalWeeks} ${t("babyProfile.weeks")}` : t("babyProfile.ageUnavailable")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t("babyProfile.correctedAge")}</p>
                {selectedBaby.gestationalWeek ? (
                  <p className="mt-1 text-xl font-semibold text-slate-900">{correctedAge ? `${correctedAge.correctedWeeks} ${t("babyProfile.weeks")}` : t("babyProfile.ageUnavailable")}</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">{t("babyProfile.correctedAgeUnavailable")}</p>
                )}
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t("babyProfile.gestationalWeek")}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{selectedBaby.gestationalWeek ? `${selectedBaby.gestationalWeek} ${t("babyProfile.weeks")}` : t("babyProfile.notProvided")}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">{t("babyProfile.quickFacts")}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{t("babyProfile.quickSummary")}</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">{t("babyProfile.birthday")}: {selectedBaby.birthday ? formatDateValue(selectedBaby.birthday, settings.dateFormat, i18n.language) : t("babyProfile.notProvided")}</div>
              <div className="rounded-2xl bg-slate-50 p-3">{t("babyProfile.sex")}: {selectedBaby.gender ? t(`babyProfile.gender${selectedBaby.gender === "boy" ? "Boy" : selectedBaby.gender === "girl" ? "Girl" : "Unspecified"}`) : t("babyProfile.notProvided")}</div>
              <div className="rounded-2xl bg-slate-50 p-3">{t("babyProfile.birthWeight")}: {selectedBaby.birthWeightKg ? formatWeight(selectedBaby.birthWeightKg, settings.weightUnit, i18n.language) : t("babyProfile.notProvided")}</div>
              <div className="rounded-2xl bg-slate-50 p-3">{t("babyProfile.birthHeight")}: {selectedBaby.birthHeightCm ? formatLength(selectedBaby.birthHeightCm, settings.lengthUnit, i18n.language) : t("babyProfile.notProvided")}</div>
            </div>
          </section>
        </aside>
      </div>

      <RoutinePreferencesForm />
      <VaccinationCountrySettings />

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">{t("babyProfile.addBaby")}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{t("babyProfile.addBabyModal")}</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.name")}</label>
                <input value={addForm.name} onChange={(event) => { setAddForm((state) => ({ ...state, name: event.target.value })); setAddErrors((state) => ({ ...state, name: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                {addErrors.name ? <p className="mt-2 text-sm text-rose-600">{addErrors.name}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.birthday")}</label>
                <input type="date" value={addForm.birthday} onChange={(event) => { setAddForm((state) => ({ ...state, birthday: event.target.value })); setAddErrors((state) => ({ ...state, birthday: "" })); }} max={new Date().toISOString().split("T")[0]} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                {addErrors.birthday ? <p className="mt-2 text-sm text-rose-600">{addErrors.birthday}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.gestationalWeek")}</label>
                <input type="number" min="22" max="42" value={addForm.gestationalWeek} onChange={(event) => { setAddForm((state) => ({ ...state, gestationalWeek: event.target.value })); setAddErrors((state) => ({ ...state, gestationalWeek: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                {addErrors.gestationalWeek ? <p className="mt-2 text-sm text-rose-600">{addErrors.gestationalWeek}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.sex")}</label>
                <select value={addForm.gender} onChange={(event) => { setAddForm((state) => ({ ...state, gender: event.target.value as BabyGender })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.birthWeight")}</label>
                <input type="number" min="0" step="0.01" value={addForm.birthWeightKg} onChange={(event) => { setAddForm((state) => ({ ...state, birthWeightKg: event.target.value })); setAddErrors((state) => ({ ...state, birthWeightKg: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                {addErrors.birthWeightKg ? <p className="mt-2 text-sm text-rose-600">{addErrors.birthWeightKg}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("babyProfile.birthHeight")}</label>
                <input type="number" min="0" step="0.1" value={addForm.birthHeightCm} onChange={(event) => { setAddForm((state) => ({ ...state, birthHeightCm: event.target.value })); setAddErrors((state) => ({ ...state, birthHeightCm: "" })); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
                {addErrors.birthHeightCm ? <p className="mt-2 text-sm text-rose-600">{addErrors.birthHeightCm}</p> : null}
              </div>
            </div>

            <div className="mt-5"><RoutineQuestionnaireFields values={addForm} onChange={(routine) => setAddForm((state) => ({ ...state, ...routine }))} errors={addErrors} /></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><VaccinationCountrySelect id="vaccination-country-secondary" value={addForm.vaccinationCountryCode} onChange={vaccinationCountryCode=>setAddForm(state=>({...state,vaccinationCountryCode,vaccinationRegionCode:""}))}/><VaccinationRegionSelect countryCode={addForm.vaccinationCountryCode} value={addForm.vaccinationRegionCode} onChange={vaccinationRegionCode=>setAddForm(state=>({...state,vaccinationRegionCode}))} id="vaccination-region-secondary"/></div>
            <div className="mt-3"><VaccinationSelectionPreview countryCode={addForm.vaccinationCountryCode} regionCode={addForm.vaccinationRegionCode}/></div>
            {addErrors.vaccinationRegionCode?<p className="mt-2 text-sm text-rose-600">{addErrors.vaccinationRegionCode}</p>:null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t("babyProfile.cancel")}</button>
              <button type="button" onClick={handleAddBaby} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"> <Plus className="h-4 w-4" /> {t("babyProfile.addBaby")}</button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><Trash2 className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-rose-600">{t("babyProfile.deleteBaby")}</p>
                <h3 className="text-lg font-semibold text-slate-900">{t("babyProfile.deleteTitle")}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{hasActivities ? t("babyProfile.deleteRestricted") : t("babyProfile.deleteMessage")}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t("babyProfile.cancel")}</button>
              <button type="button" onClick={handleDeleteBaby} disabled={hasActivities} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{t("babyProfile.deleteBaby")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
