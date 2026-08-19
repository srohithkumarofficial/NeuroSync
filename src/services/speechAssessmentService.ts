import { SpeechAssessmentResult, SpeechSegment } from "@/types";

export const SPEECH_ASSESSMENT_DURATION_SECONDS = 60;

export const SPEECH_PASSAGE =
  "The patient walks slowly through the room, turns toward the window, and describes what they see in a clear and steady voice. The clinician listens for rhythm, pauses, articulation, and consistency while the patient continues reading at a natural speaking pace.";

const WORD_RE = /[a-zA-Z0-9']+/g;

export function tokenizeSpeechText(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");
}

export function countSequentialMatches(expectedWords: string[], transcript: string): number {
  const spoken = tokenizeSpeechText(transcript).map(normalizeWord).filter(Boolean);
  let expectedIndex = 0;
  for (const word of spoken) {
    if (expectedIndex >= expectedWords.length) break;
    if (word === normalizeWord(expectedWords[expectedIndex])) {
      expectedIndex += 1;
    }
  }
  return expectedIndex;
}

function mergeSegments(segments: SpeechSegment[], gapMs = 250): SpeechSegment[] {
  const sorted = [...segments].filter((segment) => segment.endMs > segment.startMs).sort((a, b) => a.startMs - b.startMs);
  const merged: SpeechSegment[] = [];
  for (const segment of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && segment.startMs - previous.endMs <= gapMs) {
      previous.endMs = Math.max(previous.endMs, segment.endMs);
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

function calculatePauses(segments: SpeechSegment[], durationMs: number): SpeechSegment[] {
  const pauses: SpeechSegment[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    const startMs = segments[index - 1].endMs;
    const endMs = segments[index].startMs;
    if (endMs - startMs >= 600) pauses.push({ startMs, endMs });
  }
  return pauses.filter((pause) => pause.startMs >= 0 && pause.endMs <= durationMs);
}

export function calculateSpeechAssessmentResult(args: {
  patientId: string;
  transcript: string;
  totalWords: number;
  completedWords: number;
  durationSeconds: number;
  speechSegments: SpeechSegment[];
}): SpeechAssessmentResult {
  const durationMs = args.durationSeconds * 1000;
  const segments = mergeSegments(args.speechSegments).map((segment) => ({
    startMs: Math.max(0, Math.min(durationMs, segment.startMs)),
    endMs: Math.max(0, Math.min(durationMs, segment.endMs)),
  }));
  const speakingTimeSeconds = segments.reduce((total, segment) => total + (segment.endMs - segment.startMs) / 1000, 0);
  const pauses = calculatePauses(segments, durationMs);
  const totalPauseTimeSeconds = pauses.reduce((total, pause) => total + (pause.endMs - pause.startMs) / 1000, 0);
  const wordsSpoken = tokenizeSpeechText(args.transcript).length;
  const elapsedMinutes = args.durationSeconds / 60;
  const speakingMinutes = speakingTimeSeconds / 60;
  const speechRateWpm = elapsedMinutes > 0 && wordsSpoken > 0 ? Math.round(wordsSpoken / elapsedMinutes) : null;
  const articulationRate = speakingMinutes > 0 && wordsSpoken > 0 ? Math.round(wordsSpoken / speakingMinutes) : null;
  const progressRatio = args.totalWords > 0 ? args.completedWords / args.totalWords : 0;
  const pausePenalty = pauses.length > 0 ? Math.min(0.35, pauses.length * 0.025) : 0;

  return {
    patientId: args.patientId,
    assessmentDuration: args.durationSeconds,
    wordsSpoken,
    totalWords: args.totalWords,
    speechRateWpm,
    articulationRate,
    speakingTimeSeconds: segments.length > 0 ? Number(speakingTimeSeconds.toFixed(1)) : null,
    totalPauseTimeSeconds: segments.length > 0 ? Number(totalPauseTimeSeconds.toFixed(1)) : null,
    pauseCount: segments.length > 0 ? pauses.length : null,
    averagePauseSeconds: pauses.length > 0 ? Number((totalPauseTimeSeconds / pauses.length).toFixed(1)) : segments.length > 0 ? 0 : null,
    longestPauseSeconds: pauses.length > 0 ? Number(Math.max(...pauses.map((pause) => (pause.endMs - pause.startMs) / 1000)).toFixed(1)) : segments.length > 0 ? 0 : null,
    jitter: null,
    shimmer: null,
    fundamentalFrequency: null,
    fluencyScore: wordsSpoken > 0 ? Math.round(Math.max(0, Math.min(1, progressRatio - pausePenalty)) * 100) : null,
    transcript: args.transcript.trim(),
    completedAt: new Date().toISOString(),
  };
}
