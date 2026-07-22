import type { SupportedVaccinationCountryCode } from "../../../entities/baby/model/baby.types";

export type VaccinationStatus="upcoming"|"completed"|"postponed"|"skipped";
export type VaccinationCategory="routine"|"optional"|"seasonal"|"risk-based";
export interface VaccinationAgeOffset{days?:number;weeks?:number;months?:number;years?:number}
export interface VaccinationScheduleItemDefinition{scheduleItemId:string;vaccineCode:string;diseaseCodes:string[];doseNumber:number;recommendedAge:VaccinationAgeOffset;recommendedWindow?:{start:VaccinationAgeOffset;end:VaccinationAgeOffset};category:VaccinationCategory;applicability?:{regionCodes?:string[];requiresUserEnablement?:boolean};nameKey:string;recommendedAgeKey:string}
export interface VaccinationScheduleDefinition{countryCode:SupportedVaccinationCountryCode;scheduleVersion:string;sourceId:string;regionModel:"national"|"regional"|"mixed";regionCode?:string;items:VaccinationScheduleItemDefinition[]}
export interface VaccinationRecord{id:string;babyId:string;scheduleCountry:string;scheduleCountryCode?:string;scheduleRegionCode?:string;scheduleVersion:string;scheduleItemId?:string;recordOrigin?:"generated"|"manual"|"imported";vaccineCode:string;diseaseCodes?:string[];category?:VaccinationCategory;vaccineName:string;recommendedAge:string;scheduledDate:string;administeredDate?:string;status:VaccinationStatus;doseNumber:number;manufacturer?:string;batchNumber?:string;doctor?:string;clinic?:string;reaction?:string;notes?:string;createdAt:string;updatedAt:string}
/** @deprecated Kept as an alias while older call sites migrate to the shared contract. */
export type VaccineDefinition=VaccinationScheduleItemDefinition;
