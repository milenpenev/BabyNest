import { useEffect } from "react";
import type { Activity } from "../../../entities/activity/model/activity.types";
import type { BabyMilestoneRecord } from "../../milestones/model/milestone.types";
import type { Memory } from "../model/memory.types";
import { useActivityStore } from "../../../store/activityStore";
import { useBabyStore } from "../../../store/babyStore";
import { useMemoryStore } from "../../../store/memoryStore";
import { useMilestoneStore } from "../../../store/milestoneStore";
import { useVaccinationStore } from "../../../store/vaccinationStore";

function automatic(input: { babyId:string; sourceKey:string; titleKey:string; date:string; createdBy?:string; activityId?:string; milestoneId?:string; growthId?:string; vaccinationId?:string; tags:string[] }): Memory {
  const now = new Date().toISOString();
  return { id:`automatic:${input.babyId}:${input.sourceKey}`, babyId:input.babyId, title:"", titleKey:input.titleKey, description:"", date:input.date, photos:[], videos:[], tags:input.tags, relatedActivityId:input.activityId, relatedMilestoneId:input.milestoneId, relatedGrowthEntry:input.growthId, relatedVaccination:input.vaccinationId, createdBy:input.createdBy??"local-owner-member", createdAt:now, updatedAt:now, favorite:false, visibility:"family", origin:"automatic", automaticSourceKey:`${input.babyId}:${input.sourceKey}` };
}
function firstActivity(activities:Activity[],babyId:string,type:Activity["type"]){return activities.filter(item=>item.babyId===babyId&&item.type===type).sort((a,b)=>a.startedAt.localeCompare(b.startedAt))[0]}
function firstMilestone(records:BabyMilestoneRecord[],babyId:string,predicate:(record:BabyMilestoneRecord)=>boolean){return records.filter(item=>item.babyId===babyId&&item.status==="observed"&&predicate(item)).sort((a,b)=>(a.observedAt??a.updatedAt).localeCompare(b.observedAt??b.updatedAt))[0]}

export default function AutomaticMemorySync() {
  const babies=useBabyStore(s=>s.babies); const activities=useActivityStore(s=>s.activities); const milestones=useMilestoneStore(s=>s.records); const vaccinations=useVaccinationStore(s=>s.records); const upsert=useMemoryStore(s=>s.upsertAutomatic);
  useEffect(()=>{for(const baby of babies){
    for(const [type,key] of [["bottle","firstBottle"],["breastfeeding","firstBreastfeeding"],["bath","firstBath"],["diaper","firstDiaper"]] as const){const item=firstActivity(activities,baby.id,type);if(item)upsert(automatic({babyId:baby.id,sourceKey:key,titleKey:`memories.automatic.${key}`,date:item.startedAt,createdBy:item.createdBy,activityId:item.id,tags:[type]}))}
    const milestoneRules=[{key:"firstSmile",match:(r:BabyMilestoneRecord)=>r.milestoneId==="social-smile"},{key:"firstSteps",match:(r:BabyMilestoneRecord)=>r.milestoneId==="first-steps"},{key:"firstTooth",match:(r:BabyMilestoneRecord)=>{const title=(r.customTitle??"").toLowerCase();return title.includes("tooth")||title.includes("зъб")}},{key:"firstCrawl",match:(r:BabyMilestoneRecord)=>{const title=(r.customTitle??"").toLowerCase();return title.includes("crawl")||title.includes("пълз")}}];
    for(const rule of milestoneRules){const item=firstMilestone(milestones,baby.id,rule.match);if(item)upsert(automatic({babyId:baby.id,sourceKey:rule.key,titleKey:`memories.automatic.${rule.key}`,date:item.observedAt??item.updatedAt,milestoneId:item.id,tags:["milestones"]}))}
    const growth=activities.filter(item=>item.babyId===baby.id&&item.type==="growth");for(const item of growth)upsert(automatic({babyId:baby.id,sourceKey:`growth:${item.id}`,titleKey:"memories.automatic.growth",date:item.startedAt,createdBy:item.createdBy,activityId:item.id,growthId:item.id,tags:["growth"]}));
    const vaccination=vaccinations.filter(item=>item.babyId===baby.id&&item.status==="completed").sort((a,b)=>(a.administeredDate??a.scheduledDate).localeCompare(b.administeredDate??b.scheduledDate))[0];if(vaccination)upsert(automatic({babyId:baby.id,sourceKey:"firstVaccination",titleKey:"memories.automatic.firstVaccination",date:vaccination.administeredDate??vaccination.scheduledDate,vaccinationId:vaccination.id,tags:["vaccinations"]}));
    const firstBirthday=new Date(baby.birthday);firstBirthday.setFullYear(firstBirthday.getFullYear()+1);if(firstBirthday<=new Date())upsert(automatic({babyId:baby.id,sourceKey:"firstBirthday",titleKey:"memories.automatic.firstBirthday",date:firstBirthday.toISOString(),tags:["birthdays"]}));
  }},[activities,babies,milestones,upsert,vaccinations]); return null;
}
