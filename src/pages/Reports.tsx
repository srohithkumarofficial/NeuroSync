import { useEffect, useState } from "react";
import { Patient, ClinicalReport } from "@/types";
import { patientService } from "@/services/patientService";
import { reportService } from "@/services/reportService";
import { useAuth } from "@/hooks/useAuth";
import { ReportPreview } from "@/components/ReportPreview";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { ToastStack, ToastMessage } from "@/components/Toast";

export function Reports() {
  const { clinician } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<ClinicalReport | null | "error">(null);
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    patientService.listPatients().then((list) => {
      setPatients(list);
      const withReport = list.find((p) => p.lastReportStatus !== "none");
      if (withReport) setSelected(withReport.id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setReport(null);
    reportService.getReport(selected).then((r) => setReport(r ?? null));
  }, [selected]);

  function pushToast(t: Omit<ToastMessage, "id">) {
    setToasts((prev) => [...prev, { ...t, id: `t-${Date.now()}` }]);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const r = await reportService.generateReport(selected);
      setReport(r);
      pushToast({ type: "success", text: "Report generated as AI draft." });
    } catch (e) {
      pushToast({ type: "error", text: e instanceof Error ? e.message : "Report generation failed" });
    } finally {
      setGenerating(false);
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
      ) : report === null ? (
        <LoadingState label="Loading report…" />
      ) : report === "error" ? (
        <ErrorState title="Report generation failed" description="Could not load or generate this report." onRetry={handleGenerate} />
      ) : (
        <div className="grid lg:grid-cols-[1fr_260px] gap-5">
          <ReportPreview report={report} />
          <div className="panel p-4 h-fit space-y-3">
            <p className="text-xs font-medium text-ink-faint uppercase tracking-wide">Actions</p>
            <button onClick={handleGenerate} disabled={generating} className="w-full text-sm font-medium text-clinical border border-clinical/30 bg-clinical-light px-3 py-2 rounded-sm hover:bg-clinical/10 disabled:opacity-50">
              {generating ? "Regenerating…" : "Regenerate draft"}
            </button>
            <button className="w-full text-sm font-medium text-ink-muted border border-border px-3 py-2 rounded-sm hover:bg-surface-sunken">
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
