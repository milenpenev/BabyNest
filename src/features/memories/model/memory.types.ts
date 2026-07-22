export type MemoryVisibility = "family" | "private";
export type MemoryOrigin = "manual" | "automatic";
export interface MemoryMedia { id: string; kind: "photo" | "video"; localUrl: string; name: string; mimeType: string; createdAt: string; cloudUrl?: string; }
export interface Memory { id: string; babyId: string; title: string; titleKey?: string; description: string; date: string; photos: MemoryMedia[]; videos: MemoryMedia[]; tags: string[]; relatedActivityId?: string; relatedMilestoneId?: string; relatedGrowthEntry?: string; relatedVaccination?: string; createdBy: string; createdAt: string; updatedAt: string; favorite: boolean; visibility: MemoryVisibility; origin: MemoryOrigin; automaticSourceKey?: string; }
export interface MemoryAlbum { id: string; name: string; nameKey?: string; kind: "automatic" | "custom"; tags: string[]; createdAt: string; }
