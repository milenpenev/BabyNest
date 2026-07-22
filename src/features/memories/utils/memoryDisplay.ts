import type { TFunction } from "i18next";
import type { Memory } from "../model/memory.types";
export function memoryTitle(memory:Memory,t:TFunction){return memory.title.trim()||(memory.titleKey?t(memory.titleKey):t("memories.untitled"))}
export function memoryDescription(memory:Memory,t:TFunction){return memory.description.trim()||t("memories.automaticDescription")}
export function memoryDayKey(value:string){const date=new Date(value);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
