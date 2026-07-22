export type RoutineSource = "configured" | "adaptive" | "fallback";
export type RoutineConfidence = "none" | "low" | "medium" | "high";
export interface NextRoutineStatus { lastActivityAt: Date | null; intervalMinutes: number; nextAt: Date | null; remainingSeconds: number | null; overdueSeconds: number; source: RoutineSource; sampleSize: number; confidence: RoutineConfidence }
