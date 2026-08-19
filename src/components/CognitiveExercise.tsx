import { useEffect, useMemo, useRef, useState } from "react";
import { CognitiveDomain, CognitiveExerciseDef, CognitiveResult } from "@/types";

type RunnerProps = {
  exercise: CognitiveExerciseDef;
  onComplete: (result: CognitiveResult) => void;
};

type Trial = { value: string; isTarget: boolean };
type FlexTrial = { value: string; correct: string; switched: boolean };

const domainTitles: Record<CognitiveDomain, string> = {
  attention: "Attention: Target Detection",
  processing_speed: "Processing Speed: Response Timing",
  memory: "Memory: Sequence Recall",
  cognitive_flexibility: "Cognitive Flexibility: Task Switching",
};

export function CognitiveExerciseRunner(props: RunnerProps) {
  if (props.exercise.domain === "attention") return <AttentionExercise {...props} />;
  if (props.exercise.domain === "memory") return <MemoryExercise {...props} />;
  if (props.exercise.domain === "cognitive_flexibility") return <FlexibilityExercise {...props} />;
  return <ProcessingSpeedExercise {...props} />;
}

function Shell({ title, instructions, children }: { title: string; instructions: string; children: React.ReactNode }) {
  return (
    <div className="panel p-6 space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-ink mb-2">{title}</h2>
        <p className="text-sm text-ink-muted">{instructions}</p>
      </div>
      {children}
    </div>
  );
}

function AttentionExercise({ exercise, onComplete }: RunnerProps) {
  const trials = useMemo<Trial[]>(() => [3, 7, 2, 9, 7, 4, 1, 7, 5, 8, 7, 6, 2, 7, 9, 4, 7, 1, 3, 7].map((value) => ({ value: String(value), isTarget: value === 7 })), []);
  const [phase, setPhase] = useState<"ready" | "running">("ready");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const shownAtRef = useRef(0);
  const respondedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const statsRef = useRef({ correct: 0, incorrect: 0, missed: 0, reactionTimes: [] as number[] });

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function start() {
    setPhase("running");
    showTrial(0);
  }

  function showTrial(nextIndex: number) {
    setIndex(nextIndex);
    respondedRef.current = false;
    shownAtRef.current = performance.now();
    timeoutRef.current = setTimeout(() => {
      const trial = trials[nextIndex];
      if (trial.isTarget && !respondedRef.current) {
        statsRef.current.missed += 1;
        setMissed(statsRef.current.missed);
      }
      advance(nextIndex);
    }, 1200);
  }

  function advance(currentIndex: number) {
    const next = currentIndex + 1;
    if (next >= trials.length) setTimeout(finish, 80);
    else showTrial(next);
  }

  function respond() {
    if (phase !== "running" || respondedRef.current) return;
    respondedRef.current = true;
    clearTimeout(timeoutRef.current);
    const trial = trials[index];
    if (trial.isTarget) {
      const rt = performance.now() - shownAtRef.current;
      statsRef.current.correct += 1;
      statsRef.current.reactionTimes.push(rt);
      setCorrect(statsRef.current.correct);
      setReactionTimes([...statsRef.current.reactionTimes]);
      setFeedback("Target detected");
    } else {
      statsRef.current.incorrect += 1;
      setIncorrect(statsRef.current.incorrect);
      setFeedback("Distractor response");
    }
    setTimeout(() => {
      setFeedback("");
      advance(index);
    }, 220);
  }

  function finish() {
    const totalTargets = trials.filter((trial) => trial.isTarget).length;
    const stats = statsRef.current;
    const accuracy = Math.round((stats.correct / Math.max(1, totalTargets + stats.incorrect)) * 100);
    const avgRt = average(stats.reactionTimes);
    onComplete({
      exerciseId: exercise.id,
      domain: "attention",
      exerciseType: "target_detection",
      score: accuracy,
      avgReactionTimeMs: Math.round(avgRt ?? 0),
      accuracyPct: accuracy,
      completed: true,
      metrics: {
        correctResponses: stats.correct,
        incorrectResponses: stats.incorrect,
        missedTargets: stats.missed,
        totalTargets,
        averageReactionTimeMs: avgRt === null ? null : Math.round(avgRt),
        fastestReactionMs: minOrNull(stats.reactionTimes),
        slowestReactionMs: maxOrNull(stats.reactionTimes),
      },
    });
  }

  if (phase === "ready") {
    return <Shell title={domainTitles.attention} instructions={exercise.instructions}><StartButton onClick={start} label="Start target detection" /></Shell>;
  }

  return (
    <Shell title={domainTitles.attention} instructions="Click only when the target number 7 appears.">
      <div className="text-center space-y-5">
        <p className="text-sm text-ink-faint">Trial {Math.min(index + 1, trials.length)} of {trials.length}</p>
        <button onClick={respond} className="w-36 h-36 rounded-md bg-surface-sunken border border-border text-6xl font-semibold text-ink hover:bg-clinical-light">{trials[index].value}</button>
        <p className="h-5 text-sm text-ink-muted">{feedback}</p>
        <div className="flex justify-center gap-5 text-xs text-ink-faint">
          <span>Correct: {correct}</span>
          <span>Incorrect: {incorrect}</span>
          <span>Missed: {missed}</span>
          <span>RTs: {reactionTimes.length}</span>
        </div>
      </div>
    </Shell>
  );
}

function ProcessingSpeedExercise({ exercise, onComplete }: RunnerProps) {
  const [phase, setPhase] = useState<"ready" | "waiting" | "go" | "done">("ready");
  const [round, setRound] = useState(0);
  const [earlyResponses, setEarlyResponses] = useState(0);
  const goTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reactionTimesRef = useRef<number[]>([]);
  const earlyRef = useRef(0);
  const totalRounds = 6;

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

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
      clearTimeout(timeoutRef.current);
      earlyRef.current += 1;
      setEarlyResponses(earlyRef.current);
      nextOrFinish();
      return;
    }
    if (phase === "go") {
      reactionTimesRef.current = [...reactionTimesRef.current, performance.now() - goTimeRef.current];
      nextOrFinish();
    }
  }

  function nextOrFinish() {
    const next = round + 1;
    setRound(next);
    if (next >= totalRounds) finish();
    else {
      setPhase("ready");
      setTimeout(startRound, 400);
    }
  }

  function finish() {
    setPhase("done");
    const times = reactionTimesRef.current;
    const correctResponses = times.length;
    const accuracy = Math.round((correctResponses / totalRounds) * 100);
    const avgRt = average(times);
    const score = Math.max(0, Math.min(100, Math.round(accuracy - (avgRt ?? 0) / 25 - earlyRef.current * 4)));
    onComplete({
      exerciseId: exercise.id,
      domain: "processing_speed",
      exerciseType: "processing_speed_reaction",
      score,
      avgReactionTimeMs: Math.round(avgRt ?? 0),
      accuracyPct: accuracy,
      completed: true,
      metrics: {
        completedRounds: totalRounds,
        correctResponses,
        earlyResponses: earlyRef.current,
        averageResponseTimeMs: avgRt === null ? null : Math.round(avgRt),
        fastestReactionMs: minOrNull(times),
        slowestReactionMs: maxOrNull(times),
      },
    });
  }

  return (
    <Shell title={domainTitles.processing_speed} instructions={exercise.instructions}>
      <div className="flex flex-col items-center justify-center gap-7 select-none">
        <button onClick={handleTap} disabled={phase === "done"} className={`w-56 h-56 rounded-full text-white text-xl font-semibold shadow-pop transition-colors ${phase === "go" ? "bg-stable" : phase === "waiting" ? "bg-clinical-dark" : "bg-clinical"} disabled:opacity-40`}>
          {phase === "ready" && (round === 0 ? "Tap to start" : "Tap to continue")}
          {phase === "waiting" && "Wait..."}
          {phase === "go" && "TAP NOW"}
          {phase === "done" && "Done"}
        </button>
        <div className="flex items-center gap-6 text-sm text-ink-faint">
          <span>Round {Math.min(round + 1, totalRounds)} of {totalRounds}</span>
          <span className="mono-num">Early responses: {earlyResponses}</span>
        </div>
        <Progress value={round / totalRounds} />
      </div>
    </Shell>
  );
}

const memoryRounds = [
  ["APPLE", "RIVER", "CHAIR"],
  ["BLUE", "TRAIN", "GARDEN", "CLOCK"],
  ["WINDOW", "PENCIL", "ORANGE", "BRIDGE", "MARKET"],
  ["SILVER", "FOREST", "LAMP", "BOTTLE", "CLOUD", "TABLE"],
];
const memoryOptions = Array.from(new Set(memoryRounds.flat().concat(["STONE", "PAPER", "MUSIC", "PLANT"])));

function MemoryExercise({ exercise, onComplete }: RunnerProps) {
  const [phase, setPhase] = useState<"ready" | "memorize" | "recall">("ready");
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const statsRef = useRef({ correctSequences: 0, itemsCorrect: 0, orderErrors: 0, incorrectItems: 0, maxSpan: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function startRound(nextRound = 0) {
    setRound(nextRound);
    setSelected([]);
    setPhase("memorize");
    timeoutRef.current = setTimeout(() => setPhase("recall"), 3200);
  }

  function choose(word: string) {
    if (phase !== "recall" || selected.includes(word)) return;
    setSelected((items) => [...items, word]);
  }

  function submit() {
    const target = memoryRounds[round];
    const correctAtPosition = selected.filter((word, wordIndex) => word === target[wordIndex]).length;
    const correctSet = selected.filter((word) => target.includes(word)).length;
    const wrongItems = selected.filter((word) => !target.includes(word)).length;
    const orderMisses = Math.max(0, correctSet - correctAtPosition);
    const exact = correctAtPosition === target.length && selected.length === target.length;
    statsRef.current.itemsCorrect += correctAtPosition;
    statsRef.current.incorrectItems += wrongItems;
    statsRef.current.orderErrors += orderMisses;
    if (exact) {
      statsRef.current.correctSequences += 1;
      statsRef.current.maxSpan = Math.max(statsRef.current.maxSpan, target.length);
    }
    if (round + 1 >= memoryRounds.length) finish();
    else startRound(round + 1);
  }

  function finish() {
    const totalItems = memoryRounds.reduce((sum, items) => sum + items.length, 0);
    const stats = statsRef.current;
    const accuracy = Math.round((stats.itemsCorrect / totalItems) * 100);
    onComplete({
      exerciseId: exercise.id,
      domain: "memory",
      exerciseType: "sequence_recall",
      score: Math.max(0, accuracy - stats.orderErrors * 3 - stats.incorrectItems * 5),
      avgReactionTimeMs: 0,
      accuracyPct: accuracy,
      completed: true,
      metrics: {
        itemsPresented: totalItems,
        itemsCorrectlyRecalled: stats.itemsCorrect,
        incorrectItems: stats.incorrectItems,
        orderErrors: stats.orderErrors,
        maximumSuccessfulSpan: stats.maxSpan,
        correctSequences: stats.correctSequences,
        completedRounds: memoryRounds.length,
      },
    });
  }

  if (phase === "ready") return <Shell title={domainTitles.memory} instructions={exercise.instructions}><StartButton onClick={() => startRound()} label="Start sequence recall" /></Shell>;

  const target = memoryRounds[round];
  return (
    <Shell title={domainTitles.memory} instructions={phase === "memorize" ? "Memorize the sequence in order." : "Select the remembered words in the original order."}>
      <div className="space-y-5">
        <p className="text-center text-sm text-ink-faint">Round {round + 1} of {memoryRounds.length} · {target.length} items</p>
        {phase === "memorize" ? (
          <div className="flex flex-wrap justify-center gap-3">{target.map((word) => <span key={word} className="px-4 py-3 rounded-sm bg-clinical-light text-clinical-dark font-semibold">{word}</span>)}</div>
        ) : (
          <>
            <div className="min-h-14 border border-border rounded-sm p-3 flex flex-wrap gap-2">{selected.length === 0 ? <span className="text-sm text-ink-faint">Selected sequence will appear here.</span> : selected.map((word, selectedIndex) => <span key={`${word}-${selectedIndex}`} className="px-3 py-1.5 rounded-sm bg-surface-sunken text-sm font-medium">{word}</span>)}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{memoryOptions.map((word) => <button key={word} onClick={() => choose(word)} disabled={selected.includes(word)} className="border border-border bg-surface text-ink text-sm font-medium px-3 py-2 rounded-sm hover:bg-surface-muted disabled:opacity-40">{word}</button>)}</div>
            <button onClick={submit} disabled={selected.length === 0} className="bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark disabled:opacity-40">Submit recall</button>
          </>
        )}
      </div>
    </Shell>
  );
}

const flexTrials: FlexTrial[] = [
  { value: "8", correct: "Even", switched: false },
  { value: "B", correct: "Before M", switched: true },
  { value: "13", correct: "Odd", switched: true },
  { value: "T", correct: "After M", switched: true },
  { value: "4", correct: "Even", switched: true },
  { value: "6", correct: "Even", switched: false },
  { value: "F", correct: "Before M", switched: true },
  { value: "17", correct: "Odd", switched: true },
  { value: "Q", correct: "After M", switched: true },
  { value: "2", correct: "Even", switched: true },
  { value: "K", correct: "Before M", switched: true },
  { value: "19", correct: "Odd", switched: true },
];

function FlexibilityExercise({ exercise, onComplete }: RunnerProps) {
  const [phase, setPhase] = useState<"ready" | "running">("ready");
  const [index, setIndex] = useState(0);
  const statsRef = useRef({ correct: 0, incorrect: 0, switchCorrect: 0, nonSwitchCorrect: 0, switchTimes: [] as number[], nonSwitchTimes: [] as number[] });
  const shownAtRef = useRef(0);

  function start() {
    shownAtRef.current = performance.now();
    setPhase("running");
  }

  function answer(value: string) {
    const trial = flexTrials[index];
    const rt = performance.now() - shownAtRef.current;
    const isCorrect = value === trial.correct;
    if (isCorrect) {
      statsRef.current.correct += 1;
      if (trial.switched) statsRef.current.switchCorrect += 1;
      else statsRef.current.nonSwitchCorrect += 1;
    } else {
      statsRef.current.incorrect += 1;
    }
    if (trial.switched) statsRef.current.switchTimes.push(rt);
    else statsRef.current.nonSwitchTimes.push(rt);
    if (index + 1 >= flexTrials.length) finish();
    else {
      setIndex((valueIndex) => valueIndex + 1);
      shownAtRef.current = performance.now();
    }
  }

  function finish() {
    const stats = statsRef.current;
    const switchCount = flexTrials.filter((trial) => trial.switched).length;
    const nonSwitchCount = flexTrials.length - switchCount;
    const avgSwitch = average(stats.switchTimes);
    const avgNonSwitch = average(stats.nonSwitchTimes);
    const accuracy = Math.round((stats.correct / flexTrials.length) * 100);
    onComplete({
      exerciseId: exercise.id,
      domain: "cognitive_flexibility",
      exerciseType: "task_switching",
      score: accuracy,
      avgReactionTimeMs: Math.round(average([...stats.switchTimes, ...stats.nonSwitchTimes]) ?? 0),
      accuracyPct: accuracy,
      completed: true,
      metrics: {
        correctResponses: stats.correct,
        incorrectResponses: stats.incorrect,
        taskSwitches: switchCount,
        switchTrialAccuracyPct: Math.round((stats.switchCorrect / Math.max(1, switchCount)) * 100),
        nonSwitchAccuracyPct: Math.round((stats.nonSwitchCorrect / Math.max(1, nonSwitchCount)) * 100),
        switchReactionTimeMs: avgSwitch === null ? null : Math.round(avgSwitch),
        nonSwitchReactionTimeMs: avgNonSwitch === null ? null : Math.round(avgNonSwitch),
        switchCostMs: avgSwitch !== null && avgNonSwitch !== null ? Math.round(avgSwitch - avgNonSwitch) : null,
      },
    });
  }

  if (phase === "ready") return <Shell title={domainTitles.cognitive_flexibility} instructions={exercise.instructions}><StartButton onClick={start} label="Start task switching" /></Shell>;

  const trial = flexTrials[index];
  return (
    <Shell title={domainTitles.cognitive_flexibility} instructions="Numbers: choose even or odd. Letters: choose before or after M.">
      <div className="space-y-5 text-center">
        <p className="text-sm text-ink-faint">Trial {index + 1} of {flexTrials.length} · {trial.switched ? "Switch trial" : "Repeat rule"}</p>
        <div className="mx-auto w-32 h-32 rounded-md border border-border bg-surface-sunken flex items-center justify-center text-6xl font-semibold text-ink">{trial.value}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto">{["Even", "Odd", "Before M", "After M"].map((choice) => <button key={choice} onClick={() => answer(choice)} className="border border-border bg-surface text-ink text-sm font-medium px-3 py-2.5 rounded-sm hover:bg-clinical-light">{choice}</button>)}</div>
      </div>
    </Shell>
  );
}

function StartButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <div className="flex justify-center"><button onClick={onClick} className="bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark">{label}</button></div>;
}

function Progress({ value }: { value: number }) {
  return <div className="w-full max-w-md h-1.5 bg-surface-sunken rounded-full overflow-hidden"><div className="h-full bg-clinical transition-all" style={{ width: `${Math.round(value * 100)}%` }} /></div>;
}

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function minOrNull(values: number[]): number | null {
  return values.length > 0 ? Math.round(Math.min(...values)) : null;
}

function maxOrNull(values: number[]): number | null {
  return values.length > 0 ? Math.round(Math.max(...values)) : null;
}
