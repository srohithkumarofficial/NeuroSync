import { useEffect, useState } from "react";
import { Patient, MRIVisit } from "@/types";
import { patientService } from "@/services/patientService";
import { LoadingState, EmptyState } from "@/components/States";
import { VisitTimeline } from "@/components/Timeline";
import { TrendChart } from "@/components/TrendChart";

export function LongitudinalComparison() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState("");
  const [visits, setVisits] = useState<MRIVisit[] | null>(null);

  useEffect(() => {
    patientService.listPatients().then((list) => {
      setPatients(list);
      const withHistory = list.find((p) => p.mriStatus !== "not_started");
      if (withHistory) setSelected(withHistory.id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setVisits(null);
    patientService.getTimeline(selected).then(setVisits);
  }, [selected]);

  const chartData = visits?.map((v) => ({ label: `Visit ${v.visitNumber}`, volume: v.lesionVolumeML, count: v.lesionCount })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Longitudinal Comparison</h1>
          <p className="text-sm text-ink-faint mt-0.5">Track lesion activity and cognitive performance across visits</p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border border-border rounded-sm px-3 py-2 text-sm"
          aria-label="Select patient"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>

      {visits === null ? (
        <LoadingState label="Comparing previous scans…" />
      ) : visits.length === 0 ? (
        <EmptyState title="No previous MRI available" description="Upload a previous scan to enable longitudinal comparison." />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="panel p-5">
              <h3 className="text-sm font-semibold text-ink mb-2">Lesion volume (mL)</h3>
              <TrendChart data={chartData} series={[{ key: "volume", name: "Volume", color: "#2C5F8A" }]} />
            </div>
            <div className="panel p-5">
              <h3 className="text-sm font-semibold text-ink mb-2">Lesion count</h3>
              <TrendChart data={chartData} series={[{ key: "count", name: "Count", color: "#1F7A5C" }]} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">Visit-by-visit detail</h3>
            <VisitTimeline visits={visits} />
          </div>

          <div className="panel p-4 text-sm text-ink-muted">
            {interpretTrend(visits)}
          </div>
        </>
      )}
    </div>
  );
}

function interpretTrend(visits: MRIVisit[]) {
  if (visits.length < 2) return "Insufficient visits for trend interpretation.";
  const first = visits[0].lesionVolumeML;
  const last = visits[visits.length - 1].lesionVolumeML;
  if (last > first * 1.05) return "Increased MRI lesion activity observed across the tracked period. Requires clinical review.";
  if (last < first * 0.95) return "Reduced visible lesion burden observed across the tracked period.";
  return "Stable MRI activity observed across the tracked period.";
}
