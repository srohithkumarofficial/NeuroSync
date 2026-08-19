import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Patient, MRIScanResult, MRIVisit, CognitiveSessionSummary, ClinicalReport, EvidenceItem } from "@/types";
import { patientService } from "@/services/patientService";
import { cognitiveService } from "@/services/cognitiveService";
import { reportService } from "@/services/reportService";
import { evidenceService } from "@/services/evidenceService";
import { PatientHeader } from "@/components/PatientHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { PredictionBadge } from "@/components/StatusBadge";
import { VisitTimeline } from "@/components/Timeline";
import { EvidenceGroup } from "@/components/EvidenceCard";
import { CognitiveScoreCard } from "@/components/CognitiveScoreCard";
import { ReportPreview } from "@/components/ReportPreview";
import { MetricCard } from "@/components/MetricCard";

const tabs = ["Overview", "MRI Analysis", "Timeline", "Cognitive Assessment", "Reports", "Clinical Evidence"] as const;
type Tab = (typeof tabs)[number];

export function PatientProfile() {
  const { patientId = "" } = useParams();
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("Overview");
  const [scan, setScan] = useState<MRIScanResult | null>(null);
  const [visits, setVisits] = useState<MRIVisit[]>([]);
  const [cognitive, setCognitive] = useState<CognitiveSessionSummary[]>([]);
  const [report, setReport] = useState<ClinicalReport | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);

  useEffect(() => {
    patientService.getPatient(patientId).then((p) => setPatient(p ?? null));
    patientService.getTimeline(patientId).then(setVisits);
    cognitiveService.getHistory(patientId).then(setCognitive);
    reportService.getReport(patientId).then((r) => setReport(r ?? null));
    evidenceService.getEvidence(patientId).then(setEvidence);
  }, [patientId]);

  if (patient === undefined) return <LoadingState label="Loading patient record…" />;
  if (patient === null) return <ErrorState title="Patient not found" description={`No record exists for ${patientId}.`} />;

  return (
    <div className="space-y-5">
      <PatientHeader patient={patient} />

      <div className="flex gap-1 border-b border-border overflow-x-auto" role="tablist" aria-label="Patient sections">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t ? "border-clinical text-clinical" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab patient={patient} scan={scan} visits={visits} cognitive={cognitive} />
      )}
      {tab === "MRI Analysis" && (
        scan ? (
          <div className="panel p-5 space-y-3">
            <p className="text-sm text-ink-muted">Full MRI results, viewer, and lesion overlay are available on the dedicated results screen.</p>
            <Link to={`/mri/results/${patient.id}`} className="inline-block text-sm font-medium text-white bg-clinical px-4 py-2 rounded-sm hover:bg-clinical-dark">
              Open MRI Results
            </Link>
          </div>
        ) : (
          <EmptyState title="No MRI analysis available" description="Upload a brain MRI to begin AI-assisted lesion segmentation and analysis." action={
            <Link to="/mri/upload" className="text-sm font-medium text-white bg-clinical px-4 py-2 rounded-sm hover:bg-clinical-dark">Start MRI upload</Link>
          } />
        )
      )}
      {tab === "Timeline" && (
        visits.length > 0 ? <VisitTimeline visits={visits} /> : <EmptyState title="No previous MRI available" description="Upload a previous scan to enable longitudinal comparison." />
      )}
      {tab === "Cognitive Assessment" && (
        cognitive.length > 0 ? (
          <div className="space-y-4">
            <CognitiveScoreCard scores={cognitive[cognitive.length - 1].domainScores} />
            <p className="text-xs text-ink-faint">Most recent session: {cognitive[cognitive.length - 1].date}</p>
          </div>
        ) : (
          <EmptyState title="No cognitive assessment has been completed" description="Start a supervised session to collect cognitive performance data." action={
            <Link to="/cognitive" className="text-sm font-medium text-white bg-clinical px-4 py-2 rounded-sm hover:bg-clinical-dark">Start cognitive session</Link>
          } />
        )
      )}
      {tab === "Reports" && (
        report ? <ReportPreview report={report} /> : <EmptyState title="No report generated yet" description="Generate a draft report once MRI analysis is complete." action={
          <Link to="/reports" className="text-sm font-medium text-white bg-clinical px-4 py-2 rounded-sm hover:bg-clinical-dark">Go to Reports</Link>
        } />
      )}
      {tab === "Clinical Evidence" && (
        evidence.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <EvidenceGroup category="mri" items={evidence.filter((e) => e.category === "mri")} />
            <EvidenceGroup category="clinical" items={evidence.filter((e) => e.category === "clinical")} />
            <EvidenceGroup category="missing" items={evidence.filter((e) => e.category === "missing")} />
            <EvidenceGroup category="conflicting" items={evidence.filter((e) => e.category === "conflicting")} />
          </div>
        ) : (
          <EmptyState title="No evidence available yet" description="Evidence is generated once MRI analysis and clinical history are available." />
        )
      )}
    </div>
  );
}

function OverviewTab({ patient, scan, visits, cognitive }: { patient: Patient; scan: MRIScanResult | null; visits: MRIVisit[]; cognitive: CognitiveSessionSummary[] }) {
  const latestCognitive = cognitive[cognitive.length - 1];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Current status</h3>
          {scan ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <PredictionBadge label={scan.prediction} />
              <div className="flex gap-4">
                <MetricCard label="Lesions" value={scan.lesion_count} />
                <MetricCard label="Volume" value={scan.total_lesion_volume_ml} unit="mL" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">No AI assessment available yet.</p>
          )}
        </div>

        {visits.length >= 2 && (
          <div className="panel p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">Previous MRI comparison</h3>
            <p className="text-sm text-ink-muted">
              Lesion volume changed from {visits[visits.length - 2].lesionVolumeML.toFixed(1)} mL to {visits[visits.length - 1].lesionVolumeML.toFixed(1)} mL
              since the prior visit ({visits[visits.length - 2].scanDate} → {visits[visits.length - 1].scanDate}).
            </p>
          </div>
        )}

        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-ink mb-2">Clinician notes</h3>
          <p className="text-sm text-ink-muted">{visits[visits.length - 1]?.clinicianNote ?? "No clinician notes recorded yet."}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Recent cognitive assessment</h3>
          {latestCognitive ? (
            <ul className="space-y-1.5 text-sm text-ink-muted">
              {Object.entries(latestCognitive.domainScores).map(([k, v]) => (
                <li key={k} className="flex justify-between capitalize"><span>{k.replace("_", " ")}</span><span className="mono-num text-ink font-medium">{v}</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">No sessions completed yet.</p>
          )}
        </div>

        {patient.flags.length > 0 && (
          <div className="panel p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">Alerts</h3>
            <ul className="space-y-1.5 text-sm text-ink-muted list-disc list-inside">
              {patient.flags.map((f) => <li key={f} className="capitalize">{f.replace(/_/g, " ")}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
