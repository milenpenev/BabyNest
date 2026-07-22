import type { DoctorReportPayload } from "../model/doctorReport.types";
import { hasFamilyPermission } from "../../family/permissions/familyPermissions";
import { getCurrentFamilyMember } from "../../../store/familyStore";

export async function exportDoctorReport(payload: DoctorReportPayload) {
  if (!hasFamilyPermission(getCurrentFamilyMember(), "canExportReports")) throw new Error("REPORT_EXPORT_NOT_PERMITTED");
  const response = await fetch("/api/doctor-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await response.text());
  const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${payload.baby.name.replace(/[^\p{L}\p{N}_-]+/gu,"_")}_Report_${new Date().toISOString().slice(0,10)}.pdf`; link.click(); URL.revokeObjectURL(url);
}
