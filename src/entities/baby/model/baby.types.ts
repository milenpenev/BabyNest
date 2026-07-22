export type BabyGender = "boy" | "girl" | "unspecified";
export interface BabyRoutinePreferences { feedingIntervalMinutes?: number; diaperIntervalMinutes?: number; useAdaptiveFeedingInterval?: boolean; useAdaptiveDiaperInterval?: boolean }
export type SupportedVaccinationCountryCode="BG"|"DE"|"FR"|"IT"|"ES"|"GB"|"US"|"CA"|"NL"|"BE"|"AT"|"CH"|"GR"|"RO"|"PL"|"OTHER";
export interface VaccinationProfile{countryCode:SupportedVaccinationCountryCode;regionCode?:string;scheduleVersion:string;selectedAt:string;source:"registration"|"profile"|"migration"}

export interface Baby {
  id: string;
  familyId?: string;
  name: string;
  birthday: string;
  gender: BabyGender;
  gestationalWeek?: number;
  birthWeightKg?: number;
  birthHeightCm?: number;
  notes?: string;
  routinePreferences?: BabyRoutinePreferences;
  vaccinationProfile?: VaccinationProfile;
  createdAt: string;
  updatedAt: string;
}
