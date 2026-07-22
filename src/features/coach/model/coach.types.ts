export type CoachCategory = "sleep" | "feeding" | "diaper" | "medication" | "vaccination" | "milestone" | "general";
export interface CoachSuggestion { id: string; ruleId: string; category: CoachCategory; priority: number; titleKey: string; bodyKey: string; evidenceKey: string; evidenceValues?: Record<string, string | number>; actionPath: string; fingerprint: string }
