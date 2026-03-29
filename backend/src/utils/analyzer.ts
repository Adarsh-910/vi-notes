import { predictAuthenticity } from './mlModel';

export interface PasteEvent {
  length: number;
  timestamp: number;
}

export interface AnalysisResult {
  score: number;
  report: {
    avgDelay: number;
    variance: number;
    totalPasteLength: number;
    editRatio: number;
    pauseRatio: number;
    cpm: number;
    navRatio: number;
    flags: string[];
  };
}

export function analyzeSession(
  content: string,
  delays: number[],
  pasteEvents: PasteEvent[],
  editCount: number,
  navCount: number,
  sessionDuration: number
): AnalysisResult {
  const flags: string[] = [];
  const totalPasteLength = pasteEvents.reduce((acc, curr) => acc + curr.length, 0);
  const contentLen = content.length || 1; // avoid div-by-zero

  // ── Paste Ratio ─────────────────────────────────────────────────────────────
  const pasteRatio = Math.min(1, totalPasteLength / contentLen);

  if (pasteRatio >= 0.6) {
    flags.push(`Critical: ${Math.round(pasteRatio * 100)}% of content was pasted — likely AI-generated or copied.`);
  } else if (pasteRatio > 0.15) {
    flags.push(`Suspicious: ${Math.round(pasteRatio * 100)}% of content came from paste events.`);
  }

  // ── Keystroke Metrics ───────────────────────────────────────────────────────
  let avgDelay = 0;
  let variance = 0;
  let pauseRatio = 0;
  const editRatio = editCount / contentLen;

  if (delays.length > 1) {
    avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;

    const varianceSq = delays.reduce((a, b) => a + Math.pow(b - avgDelay, 2), 0) / delays.length;
    variance = Math.sqrt(varianceSq);

    const pauses = delays.filter(d => d > 2000).length;
    pauseRatio = pauses / delays.length;
  }

  // ── Heuristic Flags ─────────────────────────────────────────────────────────

  // No keystrokes at all but has content → bot fill or paste-only
  if (delays.length === 0 && content.length > 50) {
    flags.push('Critical: Content present with no typing activity detected.');
  }

  // AI Retyping heuristic removed — now handled entirely by ML model training.
  // The ML is trained on explicit zero-edit + zero-nav feature vectors to catch retyped AI text.

  // Superhuman speed — only flag if sustained over many keystrokes
  // At 15ms avg, that's ~4000 CPM — physically impossible for humans
  if (avgDelay < 15 && delays.length > 40) {
    flags.push('Suspicious: Average keystroke interval below 15ms — likely automated input.');
  }

  // Robotic variance — only flag at truly impossible uniformity
  if (variance < 1.5 && delays.length > 30 && avgDelay >= 20) {
    flags.push('Highly Suspicious: Mechanical timing rhythm — variance under 1.5ms across 30+ keystrokes.');
  }

  // CPM ────────────────────────────────────────────────────────────────────────
  let navRatio = navCount / contentLen;
  let cpm = 0;
  if (sessionDuration > 0) {
    const minutes = sessionDuration / 60000;
    cpm = content.length / minutes;
  }

  if (cpm > 850) {
    flags.push('Highly Suspicious: Typing speed exceeds 850 CPM — beyond normal human capability.');
  }

  // ── Normalize for ML ────────────────────────────────────────────────────────
  const normAvgDelay   = Math.min(1.0, avgDelay / 1000);
  const normVariance   = Math.min(1.0, variance / 500);
  const normEditRatio  = Math.min(1.0, editRatio);
  const normPauseRatio = Math.min(1.0, pauseRatio);
  const normPasteRatio = pasteRatio;
  const normNavRatio   = Math.min(1.0, navRatio);
  const normCpm        = Math.min(1.0, cpm / 1000);

  const confidence = predictAuthenticity([
    normAvgDelay,
    normVariance,
    normEditRatio,
    normPauseRatio,
    normPasteRatio,
    normNavRatio,
    normCpm,
  ]);

  // ── Override Rules ──────────────────────────────────────────────────────────
  let finalScore = Math.round(confidence * 100);

  // Hard overrides for obvious cases
  if (delays.length === 0 && content.length > 50) finalScore = 0;
  if (pasteRatio >= 0.8) finalScore = Math.min(finalScore, 8);
  if (pasteRatio >= 0.6) finalScore = Math.min(finalScore, 20);

  return {
    score: finalScore,
    report: {
      avgDelay,
      variance,
      totalPasteLength,
      editRatio,
      pauseRatio,
      cpm,
      navRatio,
      flags,
    },
  };
}
