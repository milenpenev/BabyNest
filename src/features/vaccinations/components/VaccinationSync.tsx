import {useEffect} from "react";
import {useBabyStore} from "../../../store/babyStore";
import {useReminderStore} from "../../../store/reminderStore";
import {useVaccinationStore} from "../../../store/vaccinationStore";

export default function VaccinationSync(){
 const babies=useBabyStore(state=>state.babies);const records=useVaccinationStore(state=>state.records);const synchronize=useVaccinationStore(state=>state.synchronizeBabies);
 useEffect(()=>synchronize(babies),[babies,synchronize]);
 useEffect(()=>{const store=useReminderStore.getState(),now=Date.now(),activeIds=new Set<string>();for(const record of records.filter(item=>item.status==="upcoming"&&item.recordOrigin==="generated"&&item.category!=="risk-based"&&item.category!=="seasonal")){for(const days of [7,1,0]){const id=`vaccination:${record.id}:${days}`;activeIds.add(id);const trigger=new Date(record.scheduledDate).getTime()-days*86400000;if(trigger<=now||store.reminders.some(reminder=>reminder.id===id))continue;const timestamp=new Date().toISOString();store.addReminder({id,babyId:record.babyId,type:"vaccination",title:`${record.vaccineCode} · ${days===0?"due today":`${days} day(s) before`}`,enabled:true,schedule:{kind:"one-time",scheduledAt:new Date(trigger).toISOString()},createdAt:timestamp,updatedAt:timestamp})}}for(const reminder of useReminderStore.getState().reminders){if(reminder.type==="vaccination"&&reminder.id.startsWith("vaccination:")&&!activeIds.has(reminder.id))useReminderStore.getState().deleteReminder(reminder.id)}},[records]);
 return null;
}
