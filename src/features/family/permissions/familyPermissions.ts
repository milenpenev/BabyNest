import type { FamilyMember, FamilyPermission, FamilyRole } from "../model/family.types";
const all: FamilyPermission[] = ["canEditActivities","canDeleteActivities","canManageBaby","canInviteMembers","canExportReports","canManagePremium","canViewHealth","canManageVaccinations","canManageGrowth","canManageMilestones","canManageMemories"];
export const permissionsByRole: Record<FamilyRole, FamilyPermission[]> = {
  owner: all,
  parent: all.filter((permission) => permission !== "canManagePremium"),
  guardian: ["canEditActivities","canDeleteActivities","canManageBaby","canInviteMembers","canExportReports","canViewHealth","canManageVaccinations","canManageGrowth","canManageMilestones","canManageMemories"],
  grandparent: ["canEditActivities","canViewHealth","canManageGrowth","canManageMilestones","canManageMemories"],
  babysitter: ["canEditActivities","canManageMemories"],
  doctor: ["canExportReports","canViewHealth"],
  viewer: [],
};
export function hasFamilyPermission(member: FamilyMember | null | undefined, permission: FamilyPermission) { return Boolean(member && permissionsByRole[member.role].includes(permission)); }
export function getFamilyPermissions(member: FamilyMember | null | undefined) { return member ? permissionsByRole[member.role] : []; }
