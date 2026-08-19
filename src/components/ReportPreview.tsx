import { ClinicalReport } from "@/types";
import { DataSourceTagBadge, ReportStatusBadge } from "./StatusBadge";

const sectionOrder: { key: keyof ClinicalReport["sections"]; title: string }[] = [
  { key: "patientInfo", title: "Patient Information" },
  { key: "scanInfo", title: "Scan Information" },
  { key: "mriFindings", title: "MRI Findings" },
  { key: "lesionMeasurements", title: "Lesion Measurements" },
  { key: "longitudinalComparison", title: "Longitudinal Comparison" },
  { key: "aiPrediction", title: "AI Prediction" },
  { key: "supportingEvidence", title: "Supporting Evidence" },
  { key: "uncertaintyLimitations", title: "Uncertainty / Limitations" },
  { key: "cognitiveSummary", title: "Cognitive Assessment Summary" },
  { key: "clinicalConsiderations", title: "Clinical Considerations" },
  { key: "clinicianNotes", title: "Clinician Notes" },
];

export function ReportPreview({ report }: { report: ClinicalReport }) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <p className="text-xs text-ink-faint mono-num">{report.id}</p>
          <h2 className="text-base font-semibold text-ink">Clinical Report</h2>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <DataSourceTagBadge tag="ai_generated" />
          <p className="text-xs text-ink-faint">AI-generated draft — clinician review required</p>
        </div>
        {sectionOrder.map(({ key, title }) => (
          <section key={key}>
            <h3 className="text-sm font-semibold text-ink mb-1.5">{title}</h3>
            {report.sections[key] ? (
              <p className="text-sm text-ink-muted leading-relaxed">{report.sections[key]}</p>
            ) : (
              <p className="text-sm text-ink-faint italic">No clinician notes added yet.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
