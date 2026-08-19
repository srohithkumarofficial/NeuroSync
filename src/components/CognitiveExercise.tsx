import { useEffect, useRef, useState } from "react";
import { CognitiveExerciseDef, CognitiveResult } from "@/types";

// Simplified, clinic-supervised reaction/attention exercise. Large targets,
// minimal chrome, big text — designed for a patient sitting at a clinic
// tablet with a staff member present, per the product's supervised-session model.
export function CognitiveExerciseRunner({
  exercise,
  onComplete,
}: {
  exercise: CognitiveExerciseDef;
  onComplete: (result: CognitiveResult) => void;
}) {
  const [phase, setPhase] = useState<"ready" | "waiting" | "go" | "done">("ready");
  const [round, setRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const goTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const totalRounds = 6;

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function startRound() {
    setPhase("waiting");
    const delay = 900 + Math.random() * 1600;
    timeoutRef.current = setTimeout(() => {
      goTimeRef.current = performance.now();
      setPhase("go");
    }, delay);
  }

  function handleTap() {
    if (phase === "ready") {
      startRound();
      return;
    }
    if (phase === "waiting") {
      // tapped too early
      clearTimeout(timeoutRef.current);
      setMisses((m) => m + 1);
      nextOrFinish();
      return;
    }
    if (phase === "go") {
      const rt = performance.now() - goTimeRef.current;
      setReactionTimes((rts) => [...rts, rt]);
      nextOrFinish();
    }
  }

  function nextOrFinish() {
    const next = round + 1;
    setRound(next);
    if (next >= totalRounds) {
      finish(next);
    } else {
      setPhase("ready");
      setTimeout(startRound, 400);
    }
  }

  function finish(roundsRun: number) {
    setPhase("done");
    const avgRt = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
    const accuracy = Math.round(((roundsRun - misses) / roundsRun) * 100);
    const score = Math.max(0, Math.min(100, Math.round(100 - avgRt / 8 - misses * 5)));
    onComplete({
      exerciseId: exercise.id,
      domain: exercise.domain,
      score,
      avgReactionTimeMs: Math.round(avgRt),
      accuracyPct: accuracy,
      completed: true,
    });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-10 select-none">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold text-ink mb-2">{exercise.name}</h2>
        <p className="text-base text-ink-muted">{exercise.instructions}</p>
      </div>

      <button
        onClick={handleTap}
        disabled={phase === "done"}
        aria-label={phase === "go" ? "Tap now" : "Tap to begin"}
        className={`w-56 h-56 rounded-full text-white text-xl font-semibold shadow-pop transition-colors ${
          phase === "go" ? "bg-stable" : phase === "waiting" ? "bg-clinical-dark" : "bg-clinical"
        } disabled:opacity-40`}
      >
        {phase === "ready" && (round === 0 ? "Tap to start" : "Tap to continue")}
        {phase === "waiting" && "Wait..."}
        {phase === "go" && "TAP NOW"}
        {phase === "done" && "Done"}
      </button>

      <div className="flex items-center gap-6 text-sm text-ink-faint">
        <span>Round {Math.min(round + 1, totalRounds)} of {totalRounds}</span>
        <span className="mono-num">Misses: {misses}</span>
      </div>

      <div className="w-full max-w-md h-1.5 bg-surface-sunken rounded-full overflow-hidden">
        <div className="h-full bg-clinical transition-all" style={{ width: `${(round / totalRounds) * 100}%` }} />
      </div>
    </div>
  );
}
