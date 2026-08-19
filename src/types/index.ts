// ============================================================================
// NeuroSync — Shared Type Definitions
// These types define the contract between the frontend and the future
// backend/model/LLM services. Keep this file in sync with BACKEND_INTEGRATION.md
// ============================================================================

export type Sex = "female" | "male" | "other";

export interface Clinician {
  id: string;
  name: string;
  role: "Neurologist" | "Radiologist" | "Clinician" | "Staff";
  hospital: string;
}

export interface Patient {
  id: string; // e.g. NS-10021
  name: string;
  age: number;
  sex: Sex;
  dateOfBirth: string; // ISO date
  lastVisit: string; // ISO date
  assignedClinician: string;
  mriStatus: "not_started" | "pending_review" | "analyzed" | "requires_review";
  predictionStatus: PredictionLabel | "not_available";
  cognitiveStatus: "not_started" | "scheduled" | "completed";
  lastReportStatus: "none" | "draft" | "awaiting_approval" | "approved";
  flags: PatientFlag[];
}

export type PatientFlag =
  | "new_lesion_activity"
  | "follow_up_required"
  | "stable"
  | "insufficient_data";

export type PredictionLabel =
  | "higher_likelihood"
  | "lower_likelihood"
  | "uncertain"
  | "insufficient_data";

// ---------------------------------------------------------------------------
// MRI
// ---------------------------------------------------------------------------

export type MRISequence = "FLAIR" | "T1" | "T2" | "T1_GAD" | "DIR";

export interface MRIUploadFile {
  id: string;
  fileName: string;
  sequence: MRISequence;
  sizeMB: number;
  status: "validating" | "valid" | "invalid" | "uploading" | "uploaded";
  error?: string;
  file?: File;
}

/** Direct response from the external nnU-Net inference service. */
export interface MRIInferenceResult {
  patientId: string;
  lesion_count: number;
  lesion_voxels: number;
  lesion_volume_ml: number;
  shape: [number, number, number];
  prediction_file: string;
}

export type ProcessingStepStatus = "pending" | "in_progress" | "complete" | "error";

export interface ProcessingStep {
  id: string;
  label: string;
  status: ProcessingStepStatus;
  detail?: string;
}

export interface Lesion {
  id: string;
  index: number;
  volumeML: number;
  location: string;
  status: "new" | "enlarging" | "stable" | "resolved";
}

// Mirrors the future ML model's structured JSON output exactly.
export interface MRIScanResult {
  scan_id: string;
  patient_id: string;
  scan_date: string;
  comparison_scan_date?: string;
  sequences_used: MRISequence[];
  lesion_count: number;
  total_lesion_volume_ml: number;
  mean_lesion_volume_ml: number;
  largest_lesion_ml: number;
  new_lesions: number;
  enlarging_lesions: number;
  stable_lesions: number;
  resolved_lesions: number;
  prediction: PredictionLabel;
  confidence: number | null; // null when insufficient_data
  lesions: Lesion[];
  modelVersion: string;
  status: "queued" | "processing" | "complete" | "failed";
}

export interface MRIVisit {
  visitNumber: number;
  scanDate: string;
  lesionCount: number;
  lesionVolumeML: number;
  newLesions: number;
  enlargingLesions: number;
  cognitiveScore: number | null;
  clinicianNote: string;
}

// ---------------------------------------------------------------------------
// Evidence / LLM / Verification
// ---------------------------------------------------------------------------

export type EvidenceCategory = "mri" | "clinical" | "missing" | "conflicting";

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  statement: string;
}

export interface LLMExplanation {
  id: string;
  scanId: string;
  summary: string;
  generatedAt: string;
  sourceEvidenceIds: string[];
  status: "generated" | "unavailable";
}

export type VerificationStatus = "verified" | "unsupported" | "blocked" | "requires_review";

export interface VerifiedClaim {
  id: string;
  statement: string;
  evidenceSource: string;
  status: VerificationStatus;
}

// ---------------------------------------------------------------------------
// Cognitive Assessment
// ---------------------------------------------------------------------------

export type CognitiveDomain = "attention" | "processing_speed" | "memory" | "cognitive_flexibility";

export interface CognitiveExerciseDef {
  id: string;
  domain: CognitiveDomain;
  name: string;
  instructions: string;
  durationSeconds: number;
}

export interface CognitiveResult {
  exerciseId: string;
  domain: CognitiveDomain;
  score: number; // 0-100
  avgReactionTimeMs: number;
  accuracyPct: number;
  completed: boolean;
}

export interface CognitiveSessionSummary {
  id: string;
  patientId: string;
  date: string;
  domainScores: Record<CognitiveDomain, number>;
  results: CognitiveResult[];
}

// ---------------------------------------------------------------------------
// Reports & Audit
// ---------------------------------------------------------------------------

export type ReportStatus = "ai_draft" | "clinician_review" | "clinician_edited" | "approved";

export interface ClinicalReport {
  id: string;
  patientId: string;
  scanId: string;
  status: ReportStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  sections: {
    patientInfo: string;
    scanInfo: string;
    mriFindings: string;
    lesionMeasurements: string;
    longitudinalComparison: string;
    aiPrediction: string;
    supportingEvidence: string;
    uncertaintyLimitations: string;
    cognitiveSummary: string;
    clinicalConsiderations: string;
    clinicianNotes: string;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: "system" | "ai_model" | "llm" | "clinician";
  description: string;
}

export interface NotificationItem {
  id: string;
  patientId?: string;
  type: "mri_ready" | "new_lesion" | "longitudinal_ready" | "report_approval" | "cognitive_complete" | "evidence_review";
  message: string;
  timestamp: string;
  read: boolean;
}

export type DataSourceTag = "ai_generated" | "model_output" | "clinician_note" | "patient_result" | "verified";
