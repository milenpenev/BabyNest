export type SyncEntityType="profile"|"family"|"familyMember"|"baby"|"activity";
export type SyncStatus="local-only"|"pending"|"synced"|"conflict"|"failed";
export interface SyncMetadata{syncStatus:SyncStatus;serverVersion?:number;lastSyncedAt?:string;lastSyncError?:string;deletedAt?:string;familyId?:string;updatedAt:string;}
export interface LocalEntity<T>{id:string;value:T;meta:SyncMetadata;}
export interface SyncOperation{id:string;entityType:Exclude<SyncEntityType,"profile">;entityId:string;operation:"create"|"update"|"delete";payload:unknown;baseVersion?:number;createdAt:string;updatedAt:string;attempts:number;nextAttemptAt?:string;status:"pending"|"syncing"|"failed"|"blocked";errorCode?:string;}
export interface SyncCursor{id:string;cursor?:string;lastSuccessfulSyncAt?:string;lastError?:string;enabled?:boolean;familyId?:string;}
export interface SyncConflict{id:string;entityType:string;entityId:string;localVersion:unknown;remoteVersion:unknown;detectedAt:string;status:"unresolved"|"resolved";resolution?:"keep-local"|"keep-remote"|"merged";}
export interface DeviceRecord{id:string;name:string;createdAt:string;lastSeenAt:string;}
