import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Mic, MicOff, Play, Square } from "lucide-react";
import { Patient, SpeechAssessmentResult, SpeechAssessmentState, SpeechSegment } from "@/types";
import { patientService } from "@/services/patientService";
import {
  SPEECH_ASSESSMENT_DURATION_SECONDS,
  SPEECH_PASSAGE,
  calculateSpeechAssessmentResult,
  countSequentialMatches,
  tokenizeSpeechText,
} from "@/services/speechAssessmentService";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const durationMs = SPEECH_ASSESSMENT_DURATION_SECONDS * 1000;

export function SpeechAssessment() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [state, setState] = useState<SpeechAssessmentState>("IDLE");
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(SPEECH_ASSESSMENT_DURATION_SECONDS);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [result, setResult] = useState<SpeechAssessmentResult | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const speechSegmentsRef = useRef<SpeechSegment[]>([]);
  const activeSpeechStartRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const stateRef = useRef<SpeechAssessmentState>("IDLE");

  const words = useMemo(() => tokenizeSpeechText(SPEECH_PASSAGE), []);
  const spokenWordCount = useMemo(() => countSequentialMatches(words, `${transcript} ${interimTranscript}`), [interimTranscript, transcript, words]);

  useEffect(() => {
    patientService.listPatients().then(setPatients);
    return cleanup;
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    try {
      recognitionRef.current?.stop();
    } catch {
      // Browser recognition may already be stopped.
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();
    timerRef.current = null;
    animationRef.current = null;
    recognitionRef.current = null;
    recorderRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    activeSpeechStartRef.current = null;
  }

  async function startAssessment() {
    setError("");
    setResult(null);
    setTranscript("");
    transcriptRef.current = "";
    setInterimTranscript("");
    setRemainingSeconds(SPEECH_ASSESSMENT_DURATION_SECONDS);
    speechSegmentsRef.current = [];

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setState("ERROR");
      setError("Browser speech recognition is unavailable. Use Chrome or Edge for live transcript and word tracking.");
      return;
    }

    if (!selectedPatient) {
      setState("ERROR");
      setError("Select a patient before starting the speech assessment.");
      return;
    }

    try {
      setState("REQUESTING_MICROPHONE");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorderRef.current = recorder;

      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const item = event.results[index];
          if (item.isFinal) finalText += item[0].transcript;
          else interimText += item[0].transcript;
        }
        if (finalText) {
          setTranscript((previous) => {
            const next = `${previous} ${finalText}`.trim();
            transcriptRef.current = next;
            return next;
          });
        }
        setInterimTranscript(interimText.trim());
      };
      recognition.onerror = (event) => {
        if (event.error && event.error !== "no-speech") {
          setError(`Speech recognition issue: ${event.error}. Recording will continue until the timer ends.`);
        }
      };
      recognitionRef.current = recognition;

      startedAtRef.current = performance.now();
      recorder.start();
      recognition.start();
      monitorAudio(stream);
      startTimer();
      setState("RECORDING");
    } catch (err) {
      cleanup();
      setState("ERROR");
      setError(err instanceof DOMException && err.name === "NotAllowedError" ? "Microphone permission was denied." : "Unable to access the microphone for this assessment.");
    }
  }

  function startTimer() {
    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setRemainingSeconds(nextRemaining);
      if (elapsed >= durationMs) finishAssessment();
    }, 250);
  }

  function monitorAudio(stream: MediaStream) {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const centered = value - 128;
        sum += centered * centered;
      }
      const rms = Math.sqrt(sum / data.length) / 128;
      setAmplitude(rms);
      const elapsed = performance.now() - startedAtRef.current;
      const speaking = rms > 0.035;
      if (speaking && activeSpeechStartRef.current === null) activeSpeechStartRef.current = elapsed;
      if (!speaking && activeSpeechStartRef.current !== null) {
        speechSegmentsRef.current.push({ startMs: activeSpeechStartRef.current, endMs: elapsed });
        activeSpeechStartRef.current = null;
      }
      animationRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }

  function finishAssessment() {
    if (stateRef.current === "PROCESSING" || stateRef.current === "COMPLETED") return;
    stateRef.current = "PROCESSING";
    setState("PROCESSING");
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    const elapsed = Math.min(durationMs, performance.now() - startedAtRef.current);
    if (activeSpeechStartRef.current !== null) {
      speechSegmentsRef.current.push({ startMs: activeSpeechStartRef.current, endMs: elapsed });
      activeSpeechStartRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // Browser recognition may already be stopped.
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();
    const finalTranscript = transcriptRef.current.trim();
    const completedWords = countSequentialMatches(words, finalTranscript);
    const nextResult = calculateSpeechAssessmentResult({
      patientId: selectedPatient,
      transcript: finalTranscript,
      totalWords: words.length,
      completedWords,
      durationSeconds: SPEECH_ASSESSMENT_DURATION_SECONDS,
      speechSegments: speechSegmentsRef.current,
    });
    setResult(nextResult);
    setRemainingSeconds(0);
    setAmplitude(0);
    stateRef.current = "COMPLETED";
    setState("COMPLETED");
  }

  if (state === "COMPLETED" && result) {
    return <SpeechReport result={result} patient={patients.find((patient) => patient.id === result.patientId)} onBack={() => setState("IDLE")} />;
  }

  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  const progress = Math.round(((SPEECH_ASSESSMENT_DURATION_SECONDS - remainingSeconds) / SPEECH_ASSESSMENT_DURATION_SECONDS) * 100);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-ink">Speech Assessment</h1>
        <p className="text-sm text-ink-faint mt-0.5">Timed reading task with live word tracking and measured speech timing</p>
      </div>

      {state !== "RECORDING" && state !== "REQUESTING_MICROPHONE" ? (
        <div className="panel p-5 space-y-5 max-w-2xl">
          <div>
            <label htmlFor="speech-patient" className="block text-sm font-medium text-ink-muted mb-1.5">Patient</label>
            <select id="speech-patient" value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)} className="w-full border border-border rounded-sm px-3 py-2 text-sm">
              <option value="">Select a patient...</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} ({patient.id})</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <InfoTile label="Duration" value="About 1 minute" />
            <InfoTile label="Input" value="Microphone required" />
            <InfoTile label="Output" value="Speech metrics report" />
          </div>
          <p className="text-sm text-ink-muted">Read the displayed passage aloud at your natural speaking pace. Speak clearly and continuously until the assessment ends.</p>
          {state === "ERROR" && error && <ErrorNotice message={error} />}
          <button onClick={startAssessment} disabled={!selectedPatient} className="inline-flex items-center gap-2 bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark disabled:opacity-40">
            <Play size={16} /> Start assessment
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="panel p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <Mic size={18} className="text-clinical" />
                <span className="text-sm font-medium text-ink">{state === "REQUESTING_MICROPHONE" ? "Requesting microphone..." : "Listening..."}</span>
              </div>
              <div className="mono-num text-2xl font-semibold text-ink">{minutes}:{seconds}</div>
            </div>
            <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
              <div className="h-full bg-clinical transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-base font-semibold text-ink">Reading passage</h2>
              <AudioActivity amplitude={amplitude} />
            </div>
            <div className="text-2xl leading-loose text-ink">
              {words.map((word, index) => (
                <span key={`${word}-${index}`} className={`inline-block mr-2 mb-1 px-1 rounded-sm transition-colors ${index < spokenWordCount ? "bg-stable/10 text-stable" : index === spokenWordCount ? "bg-clinical-light text-clinical-dark" : "text-ink"}`}>
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_220px] gap-4">
            <div className="panel p-4 min-h-28">
              <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">Live transcript</p>
              <p className="text-sm text-ink-muted leading-relaxed">{`${transcript} ${interimTranscript}`.trim() || "Speech recognition will appear here after words are detected."}</p>
              {error && <p className="text-xs text-warn mt-3">{error}</p>}
            </div>
            <div className="panel p-4">
              <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">Words completed</p>
              <p className="mono-num text-2xl font-semibold text-ink">{spokenWordCount} / {words.length}</p>
              <button onClick={finishAssessment} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-critical border border-critical/30 bg-critical-light px-3 py-2 rounded-sm hover:bg-critical/10">
                <Square size={14} /> End assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="panel p-3"><p className="text-xs text-ink-faint mb-1">{label}</p><p className="text-sm font-medium text-ink">{value}</p></div>;
}

function ErrorNotice({ message }: { message: string }) {
  return <div className="flex items-start gap-2.5 bg-critical-light border border-critical/30 rounded-sm p-3.5"><AlertTriangle size={17} className="text-critical shrink-0 mt-0.5" /><p className="text-sm text-critical">{message}</p></div>;
}

function AudioActivity({ amplitude }: { amplitude: number }) {
  const width = Math.round(Math.min(1, amplitude * 8) * 100);
  return <div className="flex items-center gap-2 text-xs text-ink-faint"><span className="w-20 h-1.5 rounded-full bg-surface-sunken overflow-hidden"><span className="block h-full bg-stable transition-all" style={{ width: `${width}%` }} /></span>Voice activity</div>;
}

function Metric({ label, value, unit }: { label: string; value: number | string | null; unit?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">{label}</p>
      <p className="mono-num text-xl font-semibold text-ink">{value === null ? "Unavailable" : `${value}${unit ? ` ${unit}` : ""}`}</p>
    </div>
  );
}

function SpeechReport({ result, patient, onBack }: { result: SpeechAssessmentResult; patient?: Patient; onBack: () => void }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink">Speech Assessment Report</h1>
          <p className="text-sm text-ink-faint mt-0.5">Patient: {patient ? `${patient.name} (${patient.id})` : result.patientId}</p>
        </div>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-clinical hover:underline"><ArrowLeft size={15} /> New assessment</button>
      </div>
      <div className="panel p-4 flex items-center gap-2 text-sm text-stable"><CheckCircle2 size={17} /> Assessment completed and microphone access released.</div>
      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Speech metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Duration" value={result.assessmentDuration} unit="sec" />
          <Metric label="Words spoken" value={result.wordsSpoken} />
          <Metric label="Words per minute" value={result.speechRateWpm} unit="WPM" />
          <Metric label="Articulation rate" value={result.articulationRate} unit="WPM" />
          <Metric label="Speaking time" value={result.speakingTimeSeconds} unit="sec" />
          <Metric label="Total pause time" value={result.totalPauseTimeSeconds} unit="sec" />
          <Metric label="Pause count" value={result.pauseCount} />
          <Metric label="Average pause" value={result.averagePauseSeconds} unit="sec" />
          <Metric label="Longest pause" value={result.longestPauseSeconds} unit="sec" />
          <Metric label="Jitter" value={result.jitter} />
          <Metric label="Shimmer" value={result.shimmer} />
          <Metric label="Pitch/F0" value={result.fundamentalFrequency} />
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h2 className="text-base font-semibold text-ink mb-3">Speech progress</h2>
          <p className="text-sm text-ink-muted">Words completed: <span className="mono-num text-ink font-medium">{Math.min(result.totalWords, countSequentialMatches(tokenizeSpeechText(SPEECH_PASSAGE), result.transcript))} / {result.totalWords}</span></p>
          <p className="text-sm text-ink-muted mt-2">Speech fluency: <span className="mono-num text-ink font-medium">{result.fluencyScore === null ? "Unavailable" : `${result.fluencyScore}/100`}</span></p>
        </div>
        <div className="panel p-5">
          <h2 className="text-base font-semibold text-ink mb-3">Assessment summary</h2>
          <p className="text-sm text-ink-muted leading-relaxed">{summaryText(result)}</p>
        </div>
      </div>
      <div className="panel p-5">
        <h2 className="text-base font-semibold text-ink mb-3">Transcript</h2>
        <p className="text-sm text-ink-muted leading-relaxed">{result.transcript || "No transcript was captured by browser speech recognition."}</p>
      </div>
      <div className="panel p-4 flex items-start gap-2 text-sm text-ink-muted">
        <MicOff size={16} className="text-ink-faint shrink-0 mt-0.5" />
        Acoustic jitter, shimmer, and F0 are unavailable in this browser-only workflow. They require a validated backend audio-analysis layer.
      </div>
    </div>
  );
}

function summaryText(result: SpeechAssessmentResult): string {
  const parts = [`The assessment recorded ${result.wordsSpoken} recognized words during a ${result.assessmentDuration}-second reading task.`];
  if (result.speechRateWpm !== null) parts.push(`Measured speech rate was ${result.speechRateWpm} WPM.`);
  if (result.pauseCount !== null) parts.push(`${result.pauseCount} pauses were detected from microphone activity.`);
  parts.push("These measurements describe captured speech characteristics only and do not establish a clinical diagnosis.");
  return parts.join(" ");
}
