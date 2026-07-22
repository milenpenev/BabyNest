export type DoctorReportRange = "today" | "7d" | "30d" | "custom";
export type DoctorReportSection = "sleep" | "feeding" | "breastfeeding" | "bottle" | "diapers" | "medications" | "bath" | "notes" | "growth" | "vaccinations" | "milestones" | "memories";
export interface DoctorReportPayload {
  language: string;
  baby: { name: string; birthday: string; age: string };
  period: { start: string; end: string; label: string };
  generatedAt: string;
  labels: { birthDate:string; age:string; reportPeriod:string; generatedAt:string; timeline:string; summary:string; noRecords:string; disclaimer:string };
  sections: Array<{ key: DoctorReportSection | "timeline" | "summary"; title: string; rows: Array<{ label: string; value: string }> }>;
  timeline: Array<{ day: string; entries: string[] }>;
  summary: string[];
}
