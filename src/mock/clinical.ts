import {
  AuditEvent,
  ClinicalReport,
  CognitiveExerciseDef,
  CognitiveSessionSummary,
  EvidenceItem,
  LLMExplanation,
  NotificationItem,
  VerifiedClaim,
} from "@/types";

// DEMO DATA — mirrors what evidenceService / llmService will later return
// from the deterministic evidence engine and the LLM explanation service.

export const mockEvidence: Record<string, EvidenceItem[]> = {
  "NS-10021": [
    { id: "ev1", category: "mri", statement: "Multiple lesions detected (7 total) across periventricular and juxtacortical regions" },
    { id: "ev2", category: "mri", statement: "Lesion distribution compatible with an MS-supporting pattern" },
    { id: "ev3", category: "mri", statement: "2 new and 1 enlarging lesion identified compared with the prior MRI" },
    { id: "ev4", category: "mri", statement: "Total lesion burden increased from 4.2 mL to 4.7 mL since the last visit" },
    { id: "ev5", category: "clinical", statement: "Previous neurological episode recorded in patient history" },
    { id: "ev6", category: "clinical", statement: "Relevant clinical history available for cross-reference" },
    { id: "ev7", category: "missing", statement: "Cerebrospinal fluid analysis not on file" },
    { id: "ev8", category: "conflicting", statement: "MRI findings alone are insufficient for a definitive diagnosis" },
  ],
  "NS-10023": [
    { id: "ev1", category: "mri", statement: "3 stable lesions detected; no new or enlarging lesions identified" },
    { id: "ev2", category: "missing", statement: "No previous MRI available for longitudinal comparison" },
    { id: "ev3", category: "missing", statement: "Clinical history incomplete — prior episode history not recorded" },
    { id: "ev4", category: "conflicting", statement: "Lesion count alone does not meet threshold for a confident prediction" },
  ],
};

export const mockLLMExplanations: Record<string, LLMExplanation> = {
  "MRI-2026-0812-021": {
    id: "llm-021",
    scanId: "MRI-2026-0812-021",
    summary:
      "The current MRI demonstrates seven lesions with an increase in total lesion burden compared with the previous examination (4.2 mL to 4.7 mL). Two new lesions and one enlarging lesion were identified, primarily in periventricular and juxtacortical regions. Taken together with the patient's prior neurological episode, these findings may support further clinical evaluation for an MS-compatible pattern. MRI findings alone are not sufficient for a definitive diagnosis.",
    generatedAt: "2026-08-12T14:35:00Z",
    sourceEvidenceIds: ["ev1", "ev2", "ev3", "ev4", "ev5"],
    status: "generated",
  },
};

export const mockVerifiedClaims: Record<string, VerifiedClaim[]> = {
  "MRI-2026-0812-021": [
    { id: "vc1", statement: "Seven lesions were identified on the current MRI", evidenceSource: "MRI model output: lesion_count = 7", status: "verified" },
    { id: "vc2", statement: "Two new lesions and one enlarging lesion were identified", evidenceSource: "MRI model output: new_lesions = 2, enlarging_lesions = 1", status: "verified" },
    { id: "vc3", statement: "Total lesion burden increased since the previous examination", evidenceSource: "Longitudinal comparison: 4.2 mL → 4.7 mL", status: "verified" },
    { id: "vc4", statement: "Findings may support further clinical evaluation for an MS-compatible pattern", evidenceSource: "Prediction model output: higher_likelihood, confidence 0.82", status: "verified" },
    { id: "vc5", statement: "Patient has definitely been diagnosed with MS", evidenceSource: "No confirmed diagnosis available in patient record", status: "blocked" },
    { id: "vc6", statement: "Recommended treatment: begin disease-modifying therapy immediately", evidenceSource: "No clinician-entered treatment decision available", status: "blocked" },
  ],
};

export const cognitiveExercises: CognitiveExerciseDef[] = [
  { id: "ex-target", domain: "attention", name: "Target Detection", instructions: "Click only when the target number 7 appears.", durationSeconds: 60, type: "target_detection", category: "attention" },
  { id: "ex-symbol", domain: "processing_speed", name: "Processing Speed Reaction", instructions: "Tap the button as soon as the signal changes.", durationSeconds: 60, type: "processing_speed_reaction", category: "processing_speed" },
  { id: "ex-sequence", domain: "memory", name: "Sequence Recall", instructions: "Memorize each word sequence, then reproduce the order.", durationSeconds: 90, type: "sequence_recall", category: "memory" },
  { id: "ex-flex", domain: "cognitive_flexibility", name: "Task Switching", instructions: "Apply the number or letter rule for each trial.", durationSeconds: 75, type: "task_switching", category: "cognitive_flexibility" },
];

export const mockCognitiveHistory: Record<string, CognitiveSessionSummary[]> = {
  "NS-10021": [
    { id: "cs1", patientId: "NS-10021", date: "2025-11-02", domainScores: { attention: 78, processing_speed: 72, memory: 81, cognitive_flexibility: 75 }, results: [] },
    { id: "cs2", patientId: "NS-10021", date: "2026-05-04", domainScores: { attention: 76, processing_speed: 70, memory: 79, cognitive_flexibility: 73 }, results: [] },
    { id: "cs3", patientId: "NS-10021", date: "2026-08-12", domainScores: { attention: 74, processing_speed: 68, memory: 77, cognitive_flexibility: 70 }, results: [] },
  ],
  "NS-10022": [
    { id: "cs4", patientId: "NS-10022", date: "2025-10-20", domainScores: { attention: 85, processing_speed: 80, memory: 88, cognitive_flexibility: 83 }, results: [] },
    { id: "cs5", patientId: "NS-10022", date: "2026-04-18", domainScores: { attention: 86, processing_speed: 81, memory: 87, cognitive_flexibility: 84 }, results: [] },
    { id: "cs6", patientId: "NS-10022", date: "2026-08-10", domainScores: { attention: 87, processing_speed: 82, memory: 89, cognitive_flexibility: 85 }, results: [] },
  ],
};

export const mockNotifications: NotificationItem[] = [
  { id: "n1", patientId: "NS-10021", type: "new_lesion", message: "New/enlarging lesion detected for Margaret Ashford (NS-10021) compared with previous MRI", timestamp: "2026-08-19T08:14:00Z", read: false },
  { id: "n2", patientId: "NS-10021", type: "report_approval", message: "Report awaiting clinician approval for Margaret Ashford (NS-10021)", timestamp: "2026-08-19T08:16:00Z", read: false },
  { id: "n3", patientId: "NS-10026", type: "mri_ready", message: "New MRI analysis available for review — Samuel Whitfield (NS-10026)", timestamp: "2026-08-18T16:40:00Z", read: false },
  { id: "n4", patientId: "NS-10023", type: "evidence_review", message: "Evidence verification requires review for Priya Natarajan (NS-10023)", timestamp: "2026-08-18T11:02:00Z", read: true },
  { id: "n5", patientId: "NS-10022", type: "cognitive_complete", message: "Cognitive assessment completed for Daniel Okafor (NS-10022)", timestamp: "2026-08-17T09:20:00Z", read: true },
  { id: "n6", patientId: "NS-10024", type: "longitudinal_ready", message: "Longitudinal MRI comparison ready for Thomas Berg (NS-10024)", timestamp: "2026-08-16T13:05:00Z", read: true },
];

export const mockAuditTrail: Record<string, AuditEvent[]> = {
  "NS-10021": [
    { id: "a1", timestamp: "2026-08-12T14:32:00Z", actor: "clinician", description: "Brain MRI uploaded (FLAIR, T1, T2)" },
    { id: "a2", timestamp: "2026-08-12T14:34:00Z", actor: "ai_model", description: "Lesion segmentation completed — 7 lesions identified" },
    { id: "a3", timestamp: "2026-08-12T14:35:00Z", actor: "ai_model", description: "Prediction generated — higher_likelihood (confidence 0.82)" },
    { id: "a4", timestamp: "2026-08-12T14:35:30Z", actor: "llm", description: "LLM clinical summary generated from structured evidence" },
    { id: "a5", timestamp: "2026-08-12T14:36:00Z", actor: "system", description: "Evidence verification completed — 4 verified, 2 blocked" },
    { id: "a6", timestamp: "2026-08-12T14:38:00Z", actor: "clinician", description: "Dr. Elena Cho reviewed AI output and added clinical notes" },
    { id: "a7", timestamp: "2026-08-19T08:16:00Z", actor: "system", description: "Report generated as AI draft — pending clinician approval" },
  ],
};

export const mockReports: Record<string, ClinicalReport> = {
  "NS-10021": {
    id: "RPT-10021-03",
    patientId: "NS-10021",
    scanId: "MRI-2026-0812-021",
    status: "clinician_review",
    createdAt: "2026-08-12T14:38:00Z",
    sections: {
      patientInfo: "Margaret Ashford (NS-10021), 34F, DOB 1992-03-14. Assigned clinician: Dr. Elena Cho.",
      scanInfo: "Brain MRI acquired 2026-08-12 (FLAIR, T1, T2). Compared with prior scan from 2026-05-04.",
      mriFindings: "Seven lesions identified, predominantly periventricular and juxtacortical. Distribution compatible with an MS-supporting pattern.",
      lesionMeasurements: "Total lesion volume 4.7 mL (mean 0.67 mL, largest 1.12 mL). 2 new, 1 enlarging, 3 stable, 1 resolved.",
      longitudinalComparison: "Lesion volume increased from 3.8 mL (Visit 1) to 4.2 mL (Visit 2) to 4.7 mL (Visit 3). Increased MRI activity across the observation period.",
      aiPrediction: "Higher likelihood of an MS-supporting imaging pattern (confidence 0.82). Requires clinician review.",
      supportingEvidence: "See Clinical Evidence tab: 4 supporting MRI findings, 2 supporting clinical findings, 1 missing item, 1 conflicting/limiting note.",
      uncertaintyLimitations: "MRI findings alone are insufficient for a definitive diagnosis. Cerebrospinal fluid analysis not currently on file.",
      cognitiveSummary: "Attention 74, Processing speed 68, Memory 77, Cognitive flexibility 70 — mild downward performance trend across three visits.",
      clinicalConsiderations: "Increased MRI activity may warrant clinician review of disease activity and current treatment response.",
      clinicianNotes: "",
    },
  },
};
