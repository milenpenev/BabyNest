import type{MilestoneDefinition,MilestoneDomain}from"../model/milestone.types";
export const MILESTONE_CATALOG_VERSION="CDC-LTSAE-2026.1";const source=["CDC-LTSAE-2026"];
const item=(id:string,domain:MilestoneDomain,targetAgeDays:number,order:number,correctedAgeApplicable=true):MilestoneDefinition=>({id,domain,titleKey:`milestones.items.${id}`,typicalWindow:{earliestAgeDays:Math.max(0,targetAgeDays-45),targetAgeDays,latestAgeDays:targetAgeDays+30},correctedAgeApplicable,sourceIds:source,version:MILESTONE_CATALOG_VERSION,order,guidanceKey:"milestones.guidance"});
export const milestoneCatalog:MilestoneDefinition[]=[
 item("looks-at-face","social-emotional",60,1),item("social-smile","social-emotional",60,2),item("reacts-to-sound","communication",60,3),item("head-up-tummy","gross-motor",60,4),
 item("coos","communication",120,5),item("holds-head-steady","gross-motor",120,6),item("hands-to-mouth","fine-motor",120,7),item("looks-at-hands","cognitive",120,8),
 item("laughs","social-emotional",180,9),item("takes-turns-sounds","communication",180,10),item("reaches-toy","fine-motor",180,11),item("rolls-tummy-back","gross-motor",180,12),
 item("responds-name","communication",270,13),item("babbling","communication",270,14),item("sits-without-support","gross-motor",270,15),item("transfers-objects","fine-motor",270,16),item("peekaboo","cognitive",270,17),
 item("waves-bye","social-emotional",365,18),item("mama-dada","communication",365,19),item("puts-in-container","cognitive",365,20),item("pulls-to-stand","gross-motor",365,21),
 item("first-steps","gross-motor",450,22),item("points-to-ask","communication",450,23),item("stacks-two","fine-motor",450,24),item("cup-sips","feeding",450,25),
 item("walks-alone","gross-motor",540,26),item("three-words","communication",540,27),item("simple-instruction","cognitive",540,28),item("spoon-tries","feeding",540,29),
 item("runs","gross-motor",730,30),item("two-word-phrases","communication",730,31),item("pretend-play","cognitive",730,32),item("points-pictures","fine-motor",730,33),item("cup-without-lid","self-care",730,34),
];
export const milestoneAgeBands=[{id:"0-2",min:0,max:60},{id:"2-4",min:61,max:120},{id:"4-6",min:121,max:180},{id:"6-9",min:181,max:270},{id:"9-12",min:271,max:365},{id:"12-18",min:366,max:540},{id:"18-24",min:541,max:730}]as const;
