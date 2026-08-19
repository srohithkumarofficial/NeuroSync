import { useEffect, useState } from "react";
import { Patient, CognitiveExerciseDef, CognitiveResult, CognitiveDomain, CognitiveSessionSummary } from "@/types";
import { patientService } from "@/services/patientService";
import { cognitiveService } from "@/services/cognitiveService";
import { CognitiveExerciseRunner } from "@/components/CognitiveExercise";
import { CognitiveScoreCard } from "@/components/CognitiveScoreCard";
import { LoadingState, EmptyState } from "@/components/States";
import { TrendChart } from "@/components/TrendChart";
import { Brain, ArrowLeft } from "lucide-react";

const domainLabels: Record<CognitiveDomain, string> = {
  attention: "Attention",
  processing_speed: "Processing speed",
  memory: "Memory",
  cognitive_flexibility: "Cognitive flexibility",
};
const domainOrder: CognitiveDomain[] = ["attention", "processing_speed", "memory", "cognitive_flexibility"];

type Mode = "select" | "running" | "complete";

export function CognitiveAssessment() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<CognitiveDomain[]>(["attention"]);
  const [mode, setMode] = useState<Mode>("select");
  const [exerciseQueue, setExerciseQueue] = useState<CognitiveExerciseDef[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [results, setResults] = useState<CognitiveResult[]>([]);
  const [history, setHistory] = useState<CognitiveSessionSummary[]>([]);
  const [summary, setSummary] = useState<CognitiveSessionSummary | null>(null);
  const [exercises, setExercises] = useState<CognitiveExerciseDef[]>([]);

  useEffect(() => {
    patientService.listPatients().then(setPatients);
    cognitiveService.getExercises().then(setExercises);
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    cognitiveService.getHistory(selectedPatient).then(setHistory);
  }, [selectedPatient]);

  function toggleDomain(d: CognitiveDomain) {
    setSelectedDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function startSession() {
    const queue = domainOrder
      .filter((domain) => selectedDomains.includes(domain))
      .map((domain) => exercises.find((exercise) => exercise.domain === domain))
      .filter((exercise): exercise is CognitiveExerciseDef => Boolean(exercise));
    if (queue.length === 0) return;
    setExerciseQueue(queue);
    setExerciseIndex(0);
    setResults([]);
    setMode("running");
  }

  async function handleExerciseComplete(result: CognitiveResult) {
    const next = [...results, result];
    setResults(next);
    if (exerciseIndex + 1 < exerciseQueue.length) {
      setExerciseIndex((i) => i + 1);
    } else {
      const s = await cognitiveService.submitSession(selectedPatient, next);
      setSummary(s);
      setMode("complete");
    }
  }

  if (mode === "running") {
    const exercise = exerciseQueue[exerciseIndex];
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-center text-xs text-ink-faint mb-2">Exercise {exerciseIndex + 1} of {exerciseQueue.length} Â· Supervised session</p>
        <CognitiveExerciseRunner exercise={exercise} onComplete={handleExerciseComplete} />
      </div>
    );
  }

  if (mode === "complete" && summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center">
          <Brain size={28} className="mx-auto text-stable mb-2" />
          <h1 className="text-lg font-semibold text-ink">Session complete</h1>
          <p className="text-sm text-ink-faint mt-1">Results have been associated with the patient's clinical record.</p>
        </div>
        <CognitiveScoreCard scores={summary.domainScores} />
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Exercise detail</h3>
          <div className="space-y-2">
            {summary.results.map((r) => (
              <div key={r.exerciseId} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-muted capitalize">{r.domain.replace("_", " ")}</span>
                  <span className="mono-num text-ink">Score {Math.round(r.score)} · {Math.round(r.accuracyPct)}% accuracy</span>
                </div>
                {r.metrics && Object.keys(r.metrics).length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-ink-faint">
                    {Object.entries(r.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span>{formatMetricLabel(key)}</span>
                        <span className="mono-num text-ink-muted">{value === null ? "Unavailable" : value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <button onClick={() => setMode("select")} className="inline-flex items-center gap-1.5 text-sm font-medium text-clinical hover:underline">
            <ArrowLeft size={15} /> Back to clinician dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cognitive Assessment</h1>
        <p className="text-sm text-ink-faint mt-0.5">Clinician-supervised practice and monitoring â€” not a diagnostic test</p>
      </div>

      <div className="panel p-5 space-y-5 max-w-2xl">
        <div>
          <label htmlFor="cog-patient" className="block text-sm font-medium text-ink-muted mb-1.5">Patient</label>
          <select id="cog-patient" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full border border-border rounded-sm px-3 py-2 text-sm">
            <option value="">Select a patientâ€¦</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
        </div>

        <div>
          <p className="block text-sm font-medium text-ink-muted mb-2">Domains to assess</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(domainLabels) as CognitiveDomain[]).map((d) => (
              <button
                key={d}
                onClick={() => toggleDomain(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm border ${
                  selectedDomains.includes(d) ? "bg-clinical text-white border-clinical" : "bg-surface text-ink-muted border-border hover:bg-surface-sunken"
                }`}
              >
                {domainLabels[d]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={!selectedPatient || selectedDomains.length === 0}
          className="bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark disabled:opacity-40"
        >
          Start cognitive session
        </button>
        <p className="text-xs text-ink-faint">Have the patient complete this session on a clinic-provided device while a staff member is present.</p>
      </div>

      {selectedPatient && (
        <div>
          <h2 className="text-base font-semibold text-ink mb-3">Performance trend</h2>
          {history.length === 0 ? (
            <EmptyState title="No cognitive assessment has been completed" description="Start a supervised session to collect cognitive performance data." />
          ) : (
            <div className="panel p-5">
              <TrendChart
                data={history.map((h) => ({ label: h.date.slice(0, 10), attention: h.domainScores.attention, processing_speed: h.domainScores.processing_speed, memory: h.domainScores.memory }))}
                series={[
                  { key: "attention", name: "Attention", color: "#2C5F8A" },
                  { key: "processing_speed", name: "Processing speed", color: "#1F7A5C" },
                  { key: "memory", name: "Memory", color: "#B7791F" },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatMetricLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/Pct/g, "%").replace(/Ms/g, " ms").replace(/^./, (letter) => letter.toUpperCase());
}

