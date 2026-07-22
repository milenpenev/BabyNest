import type { Family, FamilyAuditEntry, FamilyInvitation, FamilyMember } from "../model/family.types";
export interface FamilySnapshot { family: Family; members: FamilyMember[]; invitations: FamilyInvitation[]; audit: FamilyAuditEntry[]; }
export interface FamilyRepository { load(familyId: string): Promise<FamilySnapshot | null>; save(snapshot: FamilySnapshot): Promise<void>; subscribe?(familyId: string, listener: (snapshot: FamilySnapshot) => void): () => void; }
/** Extension point for Firebase, Supabase or Appwrite adapters. The current Zustand persistence is the offline adapter. */
export interface FamilySyncAdapter { push(snapshot: FamilySnapshot): Promise<void>; pull(familyId: string): Promise<FamilySnapshot | null>; resolveConflict(local: FamilySnapshot, remote: FamilySnapshot): FamilySnapshot; }
