import { AuditEvent } from "@/types";
import { mockAuditTrail } from "@/mock/clinical";
import { mockDelay } from "./apiConfig";

// ----------------------------------------------------------------------------
// auditService — read-only audit trail. Backend should log every clinical
// state transition (upload, model run, LLM call, verification, approval).
// ----------------------------------------------------------------------------

export const auditService = {
  async getTrail(patientId: string): Promise<AuditEvent[]> {
    return mockDelay(mockAuditTrail[patientId] ?? [], 350);
  },
};
