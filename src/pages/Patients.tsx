import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Patient } from "@/types";
import { patientService } from "@/services/patientService";
import { MRIStatusBadge, PredictionBadge, ReportStatusBadge } from "@/components/StatusBadge";
import { LoadingState, EmptyState } from "@/components/States";
import { Search, UserPlus } from "lucide-react";

type FilterKey = "all" | "mri_pending" | "mri_analyzed" | "requires_review" | "stable" | "follow_up_required";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "requires_review", label: "Requires review" },
  { key: "mri_pending", label: "MRI pending" },
  { key: "mri_analyzed", label: "MRI analyzed" },
  { key: "stable", label: "Stable" },
  { key: "follow_up_required", label: "Follow-up required" },
];

export function Patients() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<"name" | "lastVisit">("lastVisit");
  const [showAdd, setShowAdd] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", dateOfBirth: "", sex: "female" as Patient["sex"], assignedClinician: "Dr. Elena Cho" });
  const [addError, setAddError] = useState("");

  useEffect(() => {
    patientService.listPatients().then(setPatients);
  }, []);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const filtered = useMemo(() => {
    if (!patients) return [];
    let list = patients.filter(
      (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())
    );
    if (filter === "mri_pending") list = list.filter((p) => p.mriStatus === "pending_review" || p.mriStatus === "not_started");
    if (filter === "mri_analyzed") list = list.filter((p) => p.mriStatus === "analyzed");
    if (filter === "requires_review") list = list.filter((p) => p.mriStatus === "requires_review");
    if (filter === "stable") list = list.filter((p) => p.flags.includes("stable"));
    if (filter === "follow_up_required") list = list.filter((p) => p.flags.includes("follow_up_required"));

    list = [...list].sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name) : new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
    return list;
  }, [patients, query, filter, sortKey]);

  if (!patients) return <LoadingState label="Loading patients…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Patients</h1>
          <p className="text-sm text-ink-faint mt-0.5">{filtered.length} of {patients.length} patients</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAddError(""); setShowAdd(true); }} className="inline-flex items-center gap-1.5 bg-clinical text-white text-sm font-medium px-3 py-2 rounded-sm hover:bg-clinical-dark"><UserPlus size={15} /> Add patient</button>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-sm px-3 py-1.5 w-72 max-w-full">
          <Search size={15} className="text-ink-faint" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}); }}
            placeholder="Search by name or patient ID"
            aria-label="Search patients"
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm border ${
                filter === f.key ? "bg-clinical text-white border-clinical" : "bg-surface text-ink-muted border-border hover:bg-surface-sunken"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="text-xs text-ink-faint flex items-center gap-2">
          Sort by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as "name" | "lastVisit")} className="border border-border rounded-sm px-2 py-1 text-xs">
            <option value="lastVisit">Last visit</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No patients match this search" description="Try a different name, patient ID, or filter." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead className="bg-surface-muted text-ink-faint text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Patient ID</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Name</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Age / Sex</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Last visit</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">MRI status</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Prediction</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Cognitive</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5">Last report</th>
                <th scope="col" className="text-left font-medium px-4 py-2.5 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface-muted/60">
                  <td className="px-4 py-2.5 mono-num text-ink-muted">{p.id}</td>
                  <td className="px-4 py-2.5 text-ink font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{p.age} · {p.sex === "female" ? "F" : p.sex === "male" ? "M" : "O"}</td>
                  <td className="px-4 py-2.5 mono-num text-ink-muted">{p.lastVisit}</td>
                  <td className="px-4 py-2.5"><MRIStatusBadge status={p.mriStatus} /></td>
                  <td className="px-4 py-2.5"><PredictionBadge label={p.predictionStatus} size="sm" /></td>
                  <td className="px-4 py-2.5 text-ink-muted capitalize">{p.cognitiveStatus.replace("_", " ")}</td>
                  <td className="px-4 py-2.5"><ReportStatusBadge status={p.lastReportStatus} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Link to={`/patients/${p.id}`} className="text-xs font-medium text-clinical hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <div className="fixed inset-0 z-40 bg-ink/20 flex items-center justify-center p-4"><div className="panel bg-surface p-5 w-full max-w-md space-y-4"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-ink">Add patient</h2><button onClick={() => setShowAdd(false)} className="text-sm text-ink-muted">Close</button></div><label className="block text-sm text-ink-muted">Full name<input value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} className="mt-1 w-full border border-border rounded-sm px-3 py-2 text-sm" /></label><label className="block text-sm text-ink-muted">Date of birth<input type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} className="mt-1 w-full border border-border rounded-sm px-3 py-2 text-sm" /></label><label className="block text-sm text-ink-muted">Sex<select value={newPatient.sex} onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value as Patient["sex"] })} className="mt-1 w-full border border-border rounded-sm px-3 py-2 text-sm"><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>{addError && <p className="text-sm text-critical">{addError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setShowAdd(false)} className="text-sm text-ink-muted border border-border px-3 py-2 rounded-sm">Cancel</button><button onClick={async () => { try { const created = await patientService.createPatient(newPatient); setPatients((previous) => previous ? [created, ...previous] : [created]); setShowAdd(false); setNewPatient({ name: "", dateOfBirth: "", sex: "female", assignedClinician: "Dr. Elena Cho" }); } catch (error) { setAddError(error instanceof Error ? error.message : "Could not add patient"); } }} disabled={!newPatient.name || !newPatient.dateOfBirth} className="text-sm text-white bg-clinical px-3 py-2 rounded-sm disabled:opacity-50">Add patient</button></div></div></div>}
    </div>
  );
}
