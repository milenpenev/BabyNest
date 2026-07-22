import type { Activity, GrowthActivity } from "../../../entities/activity/model/activity.types";
import type { AppLengthUnit, AppWeightUnit } from "../../../store/appSettingsStore";
import { cmToIn, kgToLb } from "../../settings/utils/formatting";

export type GrowthPeriod="1m"|"3m"|"6m"|"all";
export type GrowthMetric="weightKg"|"heightCm"|"headCircumferenceCm";
export interface GrowthChartPoint{activityId:string;timestamp:number;dateKey:string;label:string;value:number}
export interface GrowthMetricSummary{latest:GrowthActivity|null;previous:GrowthActivity|null;value:number|null;change:number|null}
export interface GrowthInsight{title:string;value:string;tone:"violet"|"emerald"|"amber"}

function time(activity:GrowthActivity){return new Date(activity.startedAt).getTime()}
export function getGrowthActivities(activities:Activity[],babyId:string|null){if(!babyId)return[];return activities.filter((activity):activity is GrowthActivity=>activity.type==="growth"&&activity.babyId===babyId&&Number.isFinite(time(activity))).sort((a,b)=>time(b)-time(a)||b.id.localeCompare(a.id))}
export function getGrowthPeriodStart(period:GrowthPeriod,now=new Date()){if(period==="all")return null;const start=new Date(now);start.setHours(0,0,0,0);start.setMonth(start.getMonth()-(period==="1m"?1:period==="3m"?3:6));return start}
export function filterGrowthByPeriod(activities:GrowthActivity[],period:GrowthPeriod,now=new Date()){const start=getGrowthPeriodStart(period,now);return activities.filter(activity=>time(activity)<=now.getTime()&&(!start||time(activity)>=start.getTime()))}
export function getMetricSummary(activities:GrowthActivity[],metric:GrowthMetric):GrowthMetricSummary{const records=activities.filter(activity=>{const value=activity.data[metric];return typeof value==="number"&&Number.isFinite(value)&&value>0});const latest=records[0]??null,previous=records[1]??null;const value=latest?.data[metric]??null;return{latest,previous,value,change:value!==null&&previous?value-previous.data[metric]!:null}}
function convertedValue(value:number,metric:GrowthMetric,weightUnit:AppWeightUnit,lengthUnit:AppLengthUnit){return metric==="weightKg"?(weightUnit==="lb"?kgToLb(value):value):(lengthUnit==="in"?cmToIn(value):value)}
export function buildGrowthChartData(activities:GrowthActivity[],metric:GrowthMetric,language:string,weightUnit:AppWeightUnit,lengthUnit:AppLengthUnit):GrowthChartPoint[]{return activities.flatMap(activity=>{const value=activity.data[metric],timestamp=time(activity);if(typeof value!=="number"||!Number.isFinite(value)||value<=0||!Number.isFinite(timestamp))return[];return[{activityId:activity.id,timestamp,dateKey:`${activity.id}-${timestamp}`,label:new Date(timestamp).toLocaleDateString(language,{day:"2-digit",month:"short"}),value:convertedValue(value,metric,weightUnit,lengthUnit)}]}).sort((a,b)=>a.timestamp-b.timestamp||a.activityId.localeCompare(b.activityId))}
export const buildWeightChartData=(a:GrowthActivity[],l:string,w:AppWeightUnit,n:AppLengthUnit)=>buildGrowthChartData(a,"weightKg",l,w,n);
export const buildHeightChartData=(a:GrowthActivity[],l:string,w:AppWeightUnit,n:AppLengthUnit)=>buildGrowthChartData(a,"heightCm",l,w,n);
export const buildHeadCircumferenceChartData=(a:GrowthActivity[],l:string,w:AppWeightUnit,n:AppLengthUnit)=>buildGrowthChartData(a,"headCircumferenceCm",l,w,n);
export function calculatePaddedDomain(values:number[]):[number,number]{const valid=values.filter(Number.isFinite);if(!valid.length)return[0,1];const min=Math.min(...valid),max=Math.max(...valid);const span=max-min;const padding=span>0?span*.15:Math.max(Math.abs(min)*.05,.5);return[Number((min-padding).toFixed(3)),Number((max+padding).toFixed(3))]}
export function formatMetricChange(change:number|null,metric:GrowthMetric,weightUnit:AppWeightUnit,lengthUnit:AppLengthUnit){if(change===null)return null;const converted=convertedValue(change,metric,weightUnit,lengthUnit);const precision=metric==="weightKg"?(weightUnit==="kg"?3:2):(lengthUnit==="cm"?1:2);return`${converted>0?"+":""}${converted.toFixed(precision)} ${metric==="weightKg"?weightUnit:lengthUnit}`}

// These insights describe recorded data and are not medical assessments.
export function buildGrowthInsights(activities:GrowthActivity[],t:(key:string,values?:Record<string,string|number>)=>string,weightUnit:AppWeightUnit="kg",lengthUnit:AppLengthUnit="cm"):GrowthInsight[]{if(!activities.length)return[];const insights:GrowthInsight[]=[];for(const [metric,key] of [["weightKg","weightTrend"],["heightCm","heightTrend"],["headCircumferenceCm","headTrend"]] as const){const summary=getMetricSummary(activities,metric);const change=formatMetricChange(summary.change,metric,weightUnit,lengthUnit);if(change)insights.push({title:t(`growth.${key}`),value:change,tone:summary.change===0?"violet":summary.change!>0?"emerald":"amber"});else if(summary.latest)insights.push({title:t(`growth.${key}`),value:t("growth.oneMeasurement"),tone:"violet"})}return insights}
