# NeuroSync — Backend Integration Guide

This document specifies exactly where and how to connect the real backend, ML models, LLM, evidence engine,
database, cognitive-assessment backend, and report generation service to the existing frontend. The frontend is
already structured around these contracts — no UI redesign should be required.

General rule: **every network call the frontend makes lives inside `src/services/*.ts`.** Nothing else in
`src/pages` or `src/components` talks to a URL directly. Each service file below has a `// TODO(backend)` comment
at the exact line to replace.

Set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL` in `.env` once these endpoints exist.

---

## 1. MRI model — `src/services/mriService.ts`

### `POST /api/mri/upload`
Uploads raw brain MRI files (NIfTI: `.nii`, `.nii.gz`).

- **Request:** `multipart/form-data` — `patient_id` (string), one or more `files[]`, each tagged with its
  `sequence` (`FLAIR` | `T1` | `T2` | `T1_GAD` | `DIR`).
- **Response:**
  ```json
  { "upload_id": "upload-abc123" }
  ```
- **Errors:** `400` missing required sequence (FLAIR/T1/T2 all required — see `validateSequences()` in
  `mriService.ts`), `413` file too large, `422` invalid/corrupt file.

### `POST /api/mri/analyze`
Runs preprocessing → brain extraction → registration → lesion segmentation → feature extraction → prediction.

- **Request:**
  ```json
  { "patient_id": "NS-10021", "upload_id": "upload-abc123" }
  ```
- **Response:** structured `MRIScanResult` (see `src/types/index.ts`):
  ```json
  {
    "scan_id": "MRI-2026-0812-021",
    "patient_id": "NS-10021",
    "scan_date": "2026-08-12",
    "comparison_scan_date": "2026-05-04",
    "sequences_used": ["FLAIR", "T1", "T2"],
    "lesion_count": 7,
    "total_lesion_volume_ml": 4.7,
    "mean_lesion_volume_ml": 0.67,
    "largest_lesion_ml": 1.12,
    "new_lesions": 2,
    "enlarging_lesions": 1,
    "stable_lesions": 3,
    "resolved_lesions": 1,
    "prediction": "higher_likelihood",
    "confidence": 0.82,
    "lesions": [
      { "id": "L1", "index": 1, "volumeML": 1.12, "location": "Periventricular region", "status": "new" }
    ],
    "modelVersion": "ms-lesion-seg-v1.0",
    "status": "complete"
  }
  ```
  `confidence` must be `null` when `prediction` is `"uncertain"` or `"insufficient_data"` — the UI intentionally
  withholds a numeric score in that case (see `UncertaintyBanner.tsx`).
- **Errors:** `503` model unavailable, `422` analysis failed (surfaced via `ErrorState` in `MRIResults.tsx`).
- **Recommended:** for real-time progress, add a job-status endpoint or WebSocket/SSE stream at the URL configured
  in `VITE_MRI_STATUS_STREAM_URL`, and replace the timer-based simulation in `src/pages/MRIProcessing.tsx` with a
  subscription to it. Step IDs to emit: `upload`, `preprocess`, `extraction`, `registration`, `segmentation`,
  `features`, `prediction`, `report`.

### `GET /api/mri/:scanId`
Fetch a previously computed scan result. Same response shape as `analyze`.

---

## 2. Prediction model — `src/services/predictionService.ts`

### `POST /api/prediction`
- **Request:** `{ "scan_id": "MRI-2026-0812-021" }`
- **Response:** `{ "prediction": "higher_likelihood", "confidence": 0.82 }`
- Allowed `prediction` values: `higher_likelihood`, `lower_likelihood`, `uncertain`, `insufficient_data`.
- The frontend never renders a raw diagnosis string — only these four labels, always paired with "Requires
  clinician review" (see `PredictionBadge` in `StatusBadge.tsx`).

---

## 3. LLM explanation — `src/services/llmService.ts`

### `POST /api/llm/explanation`
The LLM receives the structured `MRIScanResult` + evidence list (see §4) and returns grounded prose only. It
must never be asked to produce lesion counts, volumes, or predictions itself — those come from the ML model.

- **Request:**
  ```json
  { "scan_id": "MRI-2026-0812-021" }
  ```
- **Response:**
  ```json
  {
    "id": "llm-021",
    "scanId": "MRI-2026-0812-021",
    "summary": "The current MRI demonstrates seven lesions with an increase in total lesion burden...",
    "generatedAt": "2026-08-12T14:35:00Z",
    "sourceEvidenceIds": ["ev1", "ev2", "ev3"],
    "status": "generated"
  }
  ```
- **Errors:** `503` → frontend shows "LLM unavailable" (`ErrorState` in `MRIResults.tsx`) without blocking the
  rest of the results page.

---

## 4. Evidence engine / hallucination firewall — `src/services/evidenceService.ts`

### `GET /api/evidence/:patientId`
Returns the deterministic evidence list behind a prediction, categorized as `mri`, `clinical`, `missing`, or
`conflicting` (rendered by `EvidenceGroup` in `EvidenceCard.tsx`).

- **Response:** `EvidenceItem[]`
  ```json
  [{ "id": "ev1", "category": "mri", "statement": "Multiple lesions detected..." }]
  ```

### `POST /api/evidence/verify`
The hallucination firewall. Every sentence the LLM produces must resolve to one of four statuses before it
reaches a clinician.

- **Request:** `{ "scan_id": "MRI-2026-0812-021", "llm_explanation_id": "llm-021" }`
- **Response:** `VerifiedClaim[]`
  ```json
  [
    { "id": "vc1", "statement": "Seven lesions were identified...", "evidenceSource": "MRI model output: lesion_count = 7", "status": "verified" },
    { "id": "vc5", "statement": "Patient has definitely been diagnosed with MS", "evidenceSource": "No confirmed diagnosis available in patient record", "status": "blocked" }
  ]
  ```
- Allowed `status` values: `verified`, `unsupported`, `blocked`, `requires_review`. `blocked` statements should
  never be shown as fact anywhere else in the UI.

---

## 5. Cognitive assessment backend — `src/services/cognitiveService.ts`

### `POST /api/cognitive/session`
Submits results from a completed clinic-supervised session (see `CognitiveExerciseRunner.tsx`).

- **Request:**
  ```json
  {
    "patient_id": "NS-10021",
    "results": [
      { "exerciseId": "ex-reaction", "domain": "attention", "score": 82, "avgReactionTimeMs": 410, "accuracyPct": 92, "completed": true }
    ]
  }
  ```
- **Response:** `CognitiveSessionSummary` — aggregated `domainScores` per domain (`attention`,
  `processing_speed`, `memory`, `cognitive_flexibility`).

### `GET /api/cognitive/:patientId/history`
- **Response:** `CognitiveSessionSummary[]`, chronological, used for the performance-trend chart.

---

## 6. Report generation — `src/services/reportService.ts`

### `POST /api/reports/generate`
- **Request:** `{ "patient_id": "NS-10021" }`
- **Response:** `ClinicalReport` (see `src/types/index.ts` for the full `sections` shape — patientInfo,
  scanInfo, mriFindings, lesionMeasurements, longitudinalComparison, aiPrediction, supportingEvidence,
  uncertaintyLimitations, cognitiveSummary, clinicalConsiderations, clinicianNotes).
- Reports must start in `status: "ai_draft"` — never `"approved"` — and be clearly labeled "AI-generated draft —
  clinician review required" (already enforced in `ReportPreview.tsx`).
- **Errors:** `422` insufficient data to generate a report (no completed MRI analysis on file).

### `POST /api/reports/:id/approve`
- **Request:** `{ "approved_by": "Dr. Elena Cho" }`
- **Response:** updated `ClinicalReport` with `status: "approved"`, `approvedAt`, `approvedBy` set.
- The frontend never auto-transitions a report to `approved` — only this explicit clinician action does.

**PDF export:** the "Export PDF" button in `src/pages/Reports.tsx` is currently a UI stub. Add a
`GET /api/reports/:id/export` endpoint returning a PDF binary/URL and wire it into `reportService.ts` alongside
the calls above.

---

## 7. Patients & longitudinal data — `src/services/patientService.ts`

### `GET /api/patients`
Returns the roster shown in `Dashboard.tsx` and `Patients.tsx`. Response: `Patient[]` (see `src/types/index.ts`).

### `GET /api/patients/:patientId`
Single patient record for `PatientProfile.tsx` and `PatientHeader.tsx`.

### `GET /api/patients/:patientId/timeline`
Returns `MRIVisit[]` — one entry per historical visit, used by `VisitTimeline`, `TrendChart`, and the
Longitudinal Comparison page. Must be internally consistent with `GET /api/mri/:scanId` results for the same
patient (lesion counts/volumes should match across screens).

---

## 8. Auth & notifications (supporting endpoints)

Not explicitly listed in the original spec but already wired with the same mock/replace pattern:

- `src/services/authService.ts` → recommend replacing the mock login with the hospital's SSO/SAML/OIDC provider
  rather than a bespoke `POST /api/auth/login`.
- `src/services/notificationService.ts` → `GET /api/notifications` returning `NotificationItem[]`.
- `src/services/auditService.ts` → `GET /api/audit/:patientId` returning `AuditEvent[]`. Every clinical state
  transition (upload, model run, LLM call, verification, approval) should be logged here for traceability.

---

## 9. Database

The frontend has no direct database access — it only calls the API layer above. The backend owns the schema;
the one hard requirement from the frontend's perspective is that entities returned match the TypeScript types in
`src/types/index.ts` exactly (field names, enums, and nullability), since those types are the single source of
truth the UI is built against. Keep this file and `src/types/index.ts` in sync whenever the contract changes.

## 10. Error format (all endpoints)

The frontend's `ApiError` class (`src/services/apiConfig.ts`) expects errors as:

```json
{ "error": { "code": "MODEL_UNAVAILABLE", "message": "AI model unavailable for this scan", "retryable": true } }
```

`retryable: true` surfaces a "Retry" button via `ErrorState`; `retryable: false` does not (e.g. validation
errors that require a different upload, not a retry of the same request).

## 11. Model integration readiness

The frontend never needs to know the segmentation model's architecture, weights format, or inference framework —
it only consumes the structured `MRIScanResult` JSON described in §1. When the real MS brain-lesion segmentation
model is integrated, only the backend implementation of `POST /api/mri/analyze` changes; the response contract
above must stay the same. Spinal MRI support can be added later by extending `MRISequence` and the response
shape — do not repurpose `sequences_used` for a different anatomical region without a schema version bump.
