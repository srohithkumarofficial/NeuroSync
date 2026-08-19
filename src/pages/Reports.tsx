import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Patient, ClinicalReport } from "@/types";
import { patientService } from "@/services/patientService";
import { reportService } from "@/services/reportService";
import { useAuth } from "@/hooks/useAuth";
import { ReportPreview } from "@/components/ReportPreview";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { ToastStack, ToastMessage } from "@/components/Toast";

export function Reports() {
  const { clinician } = useAuth();
  const [params] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<ClinicalReport | null | "error" | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    patientService.listPatients().then((list) => {
      setPatients(list);
      setSelected(params.get("patientId") ?? list.find((p) => p.lastReportStatus !== "none")?.id ?? "");
    });
  }, [params]);

  useEffect(() => {
    if (!selected) return;
    setReport(undefined);
    reportService.getReport(selected).then((r) => { setReport(r ?? null); if (r) setDraftText(r.sections.supportingEvidence); }).catch(() => setReport("error"));
  }, [selected]);

  function pushToast(t: Omit<ToastMessage, "id">) {
    setToasts((prev) => [...prev, { ...t, id: `t-${Date.now()}` }]);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const r = await reportService.generateReport(selected);
      setReport(r);
      setDraftText(r.sections.supportingEvidence);
      setEditing(false);
      pushToast({ type: "success", text: "Report generated as AI draft." });
    } catch (e) {
      pushToast({ type: "error", text: e instanceof Error ? e.message : "Report generation failed" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEdit() {
    if (!report || report === "error") return;
    try {
      const updated = await reportService.editReport(report.id, draftText);
      setReport(updated);
      setEditing(false);
      pushToast({ type: "success", text: "Doctor-edited report saved as a new version." });
    } catch (e) {
      pushToast({ type: "error", text: e instanceof Error ? e.message : "Could not save report edit" });
    }
  }

  async function handleApprove() {
    if (!report || report === "error") return;
    try {
      const updated = await reportService.approveReport(report.id, clinician?.name ?? "Clinician");
      setReport(updated);
      pushToast({ type: "success", text: "Report approved and finalized." });
    } catch (e) {
      pushToast({ type: "error", text: e instanceof Error ? e.message : "Approval failed" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Reports</h1>
          <p className="text-sm text-ink-faint mt-0.5">AI-generated draft reports require clinician review before approval</p>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border border-border rounded-sm px-3 py-2 text-sm" aria-label="Select patient">
          <option value="">Select a patient…</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
        </select>
      </div>

      {!selected ? (
        <EmptyState title="Select a patient" description="Choose a patient above to view or generate their clinical report." />
      ) : report === undefined ? (
        <LoadingState label="Loading report…" />
      ) : report === null ? (
        <EmptyState title="No report generated yet" description="Generate an AI-assisted draft from the persisted MRI analysis." action={<button onClick={handleGenerate} disabled={generating} className="bg-clinical text-white text-sm font-medium px-4 py-2 rounded-sm disabled:opacity-50">{generating ? "Generating AI-assisted report…" : "Generate report"}</button>} />
      ) : report === "error" ? (
        <ErrorState title="Report generation failed" description="Could not load or generate this report." onRetry={handleGenerate} />
      ) : (
        <div className="grid lg:grid-cols-[1fr_260px] gap-5">
          <div className="space-y-3"><div className="border border-warn/30 bg-warn/10 rounded-sm px-4 py-3 text-sm text-ink"><strong>AI-assisted draft — clinician review required.</strong> This report is generated from structured MRI evidence and is not a final diagnosis.</div>{editing ? <div className="panel p-4 space-y-3"><label htmlFor="report-edit" className="block text-sm font-medium text-ink">Doctor-edited report</label><textarea id="report-edit" value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={14} className="w-full border border-border rounded-sm px-3 py-2 text-sm" /><div className="flex justify-end gap-2"><button onClick={() => setEditing(false)} className="text-sm text-ink-muted border border-border px-3 py-2 rounded-sm">Cancel</button><button onClick={handleSaveEdit} className="text-sm text-white bg-clinical px-3 py-2 rounded-sm">Save edit</button></div></div> : <ReportPreview report={report} />}</div>
          <div className="panel p-4 h-fit space-y-3">
            <p className="text-xs font-medium text-ink-faint uppercase tracking-wide">Actions</p>
            <button onClick={handleGenerate} disabled={generating} className="w-full text-sm font-medium text-clinical border border-clinical/30 bg-clinical-light px-3 py-2 rounded-sm hover:bg-clinical/10 disabled:opacity-50">
              {generating ? "Regenerating…" : "Regenerate draft"}
            </button>
            <button onClick={() => { setDraftText(report.sections.supportingEvidence); setEditing(true); }} className="w-full text-sm font-medium text-ink-muted border border-border px-3 py-2 rounded-sm hover:bg-surface-sunken">
              Edit report
            </button>
            <button
              onClick={handleApprove}
              disabled={report.status === "approved"}
              className="w-full text-sm font-medium text-white bg-clinical px-3 py-2 rounded-sm hover:bg-clinical-dark disabled:opacity-50"
            >
              {report.status === "approved" ? "Approved" : "Approve report"}
            </button>
            <button className="w-full text-sm font-medium text-ink-muted border border-border px-3 py-2 rounded-sm hover:bg-surface-sunken">
              Export PDF
            </button>
            {report.approvedBy && (
              <p className="text-xs text-ink-faint pt-2 border-t border-border">Approved by {report.approvedBy}<br />{report.approvedAt && new Date(report.approvedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
