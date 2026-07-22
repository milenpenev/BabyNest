import type{SupportedVaccinationCountryCode}from"../../../../entities/baby/model/baby.types";
import type{VaccinationScheduleDefinition}from"../../model/vaccination.types";
import{atSchedule}from"./at";import{beSchedule}from"./be";import{bgSchedule}from"./bg";import{caSchedules}from"./ca";import{chSchedule}from"./ch";import{deSchedule}from"./de";import{esSchedule}from"./es";import{frSchedule}from"./fr";import{gbSchedule}from"./gb";import{grSchedule}from"./gr";import{itSchedule}from"./it";import{nlSchedule}from"./nl";import{plSchedule}from"./pl";import{roSchedule}from"./ro";import{usSchedule}from"./us";
export const nationalVaccinationSchedules={BG:bgSchedule,DE:deSchedule,FR:frSchedule,IT:itSchedule,ES:esSchedule,GB:gbSchedule,US:usSchedule,NL:nlSchedule,BE:beSchedule,AT:atSchedule,CH:chSchedule,GR:grSchedule,RO:roSchedule,PL:plSchedule}as const;
export const vaccinationScheduleModules:VaccinationScheduleDefinition[]=[...Object.values(nationalVaccinationSchedules),...Object.values(caSchedules)];
export function getScheduleDefinition(countryCode:SupportedVaccinationCountryCode,regionCode?:string):VaccinationScheduleDefinition|null{if(countryCode==="OTHER")return null;if(countryCode==="CA")return caSchedules[regionCode as keyof typeof caSchedules]??null;return nationalVaccinationSchedules[countryCode]??null}
export{caSchedules};
