# NeuroSync — Clinical Decision Support Platform

NeuroSync is an AI-assisted clinical decision-support frontend focused on multiple sclerosis (MS). It helps
neurologists and radiologists review brain MRI lesion segmentation, longitudinal disease activity, AI-supported
predictions, and clinician-supervised cognitive assessments — and turn them into a clinician-approved report.

**NeuroSync does not diagnose MS and does not replace a neurologist.** Every AI output is labeled, evidence-backed,
and requires clinician review before it becomes part of a patient's record. See `50. FINAL QUALITY BAR` in the
original brief for the product's guiding constraints — this build follows them throughout.

This repository is the **complete frontend**, wired to realistic mock data through a clean service layer so the
real MRI model, prediction model, LLM, and evidence-verification backend can be dropped in later without a UI
redesign. See `BACKEND_INTEGRATION.md` for exact integration points.

---

## 1. What's built

- **Login** — clinical sign-in screen, no social login, security notice.
- **Dashboard** — "what needs my attention today": patient counts, recent patients, alerts, recent activity.
- **Patients** — searchable, filterable, sortable patient roster.
- **Patient Profile** — Overview / MRI Analysis / Timeline / Cognitive Assessment / Reports / Clinical Evidence tabs.
- **MRI Analysis workflow** — Patient → Upload → Preprocessing → AI Analysis → Review Results → Generate Report,
  with sequence validation (FLAIR/T1/T2), a simulated processing pipeline, and a full results screen (mock MRI
  viewer with axial/coronal/sagittal, lesion overlay, opacity/slice controls, lesion table with detail modal).
- **Longitudinal Comparison** — trend charts for lesion volume/count across visits, visit-by-visit detail, and
  plain-language trend interpretation ("Increased MRI lesion activity" / "Stable MRI activity" / "Reduced visible
  lesion burden" — never "recovered" or "cured").
- **Clinical Evidence** — evidence cards (MRI / clinical / missing / conflicting) and an **evidence verification /
  hallucination firewall** that marks every LLM statement VERIFIED, UNSUPPORTED, BLOCKED, or REQUIRES REVIEW.
- **Cognitive Assessment** — clinician starts a domain-selected, clinic-supervised session; a large-button,
  low-distraction exercise runner collects reaction time / accuracy / score; results feed a performance-trend chart.
  There is no separate patient-facing app — sessions run on a clinic device.
- **Reports** — AI-draft report preview with every section, "AI-generated draft — clinician review required"
  labeling, regenerate / edit / approve / export actions, and an approval workflow that stamps who approved it.
- **Notifications** — filterable notification center.
- **Settings** — profile, hospital/clinic, notification preferences, security, AI settings, and model/connection
  status (segmentation model, LLM, evidence engine — each shown as Connected/Offline, no secrets exposed).
- **Help / System Information** — plain-language description of intended use and limitations.

Every navigation item, button, form, filter, and chart in the demo scenario (see brief section 34) works end to end
against mock data.

## 2. Technology stack

- React 18 + TypeScript
- Vite
- Tailwind CSS (custom clinical design tokens — see `tailwind.config.js`)
- React Router v6
- Recharts (trend charts)
- lucide-react (icons)

No component library was added — Tailwind + hand-built components were enough to keep the visual language
consistent and avoid a "generic AI dashboard" look.

## 3. Project structure

```
NeuroSync/
├── src/
│   ├── components/     # Reusable UI: Sidebar, Topbar, StatusBadge, MetricCard, EvidenceCard,
│   │                   # MRIViewer, LesionTable, Timeline, TrendChart, PredictionCard,
│   │                   # UncertaintyBanner, LLMExplanationCard, NotificationPanel, AuditTimeline,
│   │                   # CognitiveExercise, CognitiveScoreCard, ReportPreview, Modal, Toast, States
│   ├── pages/           # One file per top-level screen (Login, Dashboard, Patients, ...)
│   ├── layouts/         # AppLayout (persistent sidebar + topbar shell)
│   ├── services/        # mriService, patientService, predictionService, cognitiveService,
│   │                     # reportService, llmService, evidenceService, authService,
│   │                     # notificationService, auditService — see BACKEND_INTEGRATION.md
│   ├── hooks/            # useAuth
│   ├── types/            # Shared TypeScript contracts (mirrors future backend JSON)
│   ├── mock/              # Mock patients, MRI scans, evidence, cognitive data, notifications, audit
│   └── utils/
├── public/
├── README.md
├── BACKEND_INTEGRATION.md
├── package.json
└── .env.example
```

## 4. Install & run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). Sign in with the clinician credentials configured in
`backend/.env` (see `backend/README.md` for the required `DEFAULT_CLINICIAN_EMAIL` and
`DEFAULT_CLINICIAN_PASSWORD` values).

To type-check and build a production bundle:

```bash
npm run build
npm run preview
```

### Cognitive backend

The repository now also includes the FastAPI + MongoDB backend in [`backend/`](backend/README.md). It powers
user/session handling, cognitive exercise retrieval and evaluation, attempt storage, progress aggregation,
adaptive recommendations, and the deterministic safety layer. Speech remains intentionally unimplemented.

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
# set DEFAULT_CLINICIAN_EMAIL and DEFAULT_CLINICIAN_PASSWORD in backend/.env
python -m backend.seed.seed_data
uvicorn backend.main:app --reload --port 8000
```

Run those commands from the repository root. If your terminal is already in `backend`, use
`python -m uvicorn backend.main:app --reload --app-dir .. --port 8000`; `uvicorn main:app` will fail because the
backend imports use the `backend` package.

Set `VITE_USE_MOCK_API=false` in the frontend `.env` to connect its login and cognitive-assessment service to
`http://localhost:8000`. The existing MRI/patient mock services remain mock-backed because the requested backend
scope excludes the MRI model pipeline.

## 5. How mock data works

Every screen reads from `src/services/*.ts`, never directly from `src/mock/*.ts`. Each service function:

1. Has a `// TODO(backend): replace with fetch(...)` comment showing the real call.
2. Currently returns mock data through `mockDelay()` (simulates network latency so loading states are exercised
   the same way they will be against a real backend).
3. Throws a typed `ApiError` for the failure paths already wired into the UI (model unavailable, LLM unavailable,
   report generation failed, etc.).

Toggle `VITE_USE_MOCK_API=false` in `.env` once real endpoints exist — see `BACKEND_INTEGRATION.md` for exactly
what each service needs to call.

Mock patients (`src/mock/patients.ts`) use fictional IDs (`NS-10021` …) and internally consistent longitudinal
data (`src/mock/mriScans.ts`) — e.g. Patient NS-10021's lesion volume progresses 3.8 mL → 4.2 mL → 4.7 mL across
three visits, matching what's shown in the Timeline, Longitudinal Comparison, and Report screens.

## 6. Connecting the real backend later

See **`BACKEND_INTEGRATION.md`** for the full endpoint-by-endpoint contract. In short:

- **MRI model** → `mriService.ts` (`POST /api/mri/upload`, `POST /api/mri/analyze`, `GET /api/mri/:scanId`)
- **Prediction model** → `predictionService.ts` (`POST /api/prediction`)
- **LLM explanation** → `llmService.ts` (`POST /api/llm/explanation`)
- **Evidence / hallucination firewall** → `evidenceService.ts` (`POST /api/evidence/verify`)
- **Cognitive module** → `cognitiveService.ts` (`POST /api/cognitive/session`, `GET /api/cognitive/:patientId/history`)
- **Report generation** → `reportService.ts` (`POST /api/reports/generate`, `POST /api/reports/:id/approve`)
- **Patients / timeline** → `patientService.ts` (`GET /api/patients`, `GET /api/patients/:patientId`,
  `GET /api/patients/:patientId/timeline`)

The MRI processing screen (`src/pages/MRIProcessing.tsx`) currently simulates step progress on a timer; it's
built to be replaced with a WebSocket/SSE subscription or short-interval polling — see the `VITE_MRI_STATUS_STREAM_URL`
variable in `.env.example`.

## 7. Environment variables

Copy `.env.example` to `.env` and fill in real values when connecting the backend:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the NeuroSync backend |
| `VITE_USE_MOCK_API` | `true` while using mock services, `false` once real endpoints exist |
| `VITE_MRI_STATUS_STREAM_URL` | WebSocket/SSE endpoint for live MRI processing status |
| `VITE_ENABLE_SPINAL_MRI` | Feature flag reserved for future spinal MRI support (kept off — brain MRI only in this build) |
| `DEFAULT_CLINICIAN_EMAIL` | Seeded clinical login email used by the FastAPI prototype auth flow |
| `DEFAULT_CLINICIAN_PASSWORD` | Strong password stored as a PBKDF2 hash; keep it out of source control |

## 8. Deployment

This is a static Vite app — `npm run build` produces a `dist/` folder that can be served by any static host or
behind the hospital's existing reverse proxy. No server-side rendering is required. Set the environment variables
above at build time (Vite inlines `import.meta.env.VITE_*` values at build).

## 9. Scope & limitations (by design)

- Brain MRI only — spinal MRI is intentionally not implemented (see brief section 2); `VITE_ENABLE_SPINAL_MRI`
  is a placeholder for future work, not a hidden feature.
- No medication recommendations anywhere in the UI — see "Clinical Management Considerations" copy in the report
  and evidence screens.
- No standalone patient-facing app — cognitive sessions are run on a clinic device under clinician supervision.
- The MRI viewer renders a generated placeholder graphic, clearly labeled as a mock render, not a real scan.
- All mock patients and scan data are fictional and contain no real PHI.
