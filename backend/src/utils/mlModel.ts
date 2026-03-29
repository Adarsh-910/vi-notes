// @ts-ignore
import brain from 'brain.js';

const net = new brain.NeuralNetwork({
  hiddenLayers: [14, 10, 6],
  activation: 'sigmoid'
});

// Feature vector (7 dims):
// [normAvgDelay, normVariance, normEditRatio, normPauseRatio, normPasteRatio, normNavRatio, normCpm]
//
// THE KEY INSIGHT:
// The ONLY reliable discriminators between fast humans and AI retypers are:
//   1. editRatio  — humans ALWAYS make mistakes (>= 0.5%)
//   2. navRatio   — humans occasionally reposition cursor (>= 0.3%)
//   3. pauseRatio — humans occasionally pause to think (>= 0.1%)
//
// So ALL human profiles must have non-zero edits, nav, and pauses.
// ALL AI/bot profiles have effectively zero edits AND zero nav AND zero pauses.

function r(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function trainModel() {
  console.log('Training Authenticity ML Model with synthetic profiles...');
  const data: any[] = [];

  // ══════════════════════════════════════════════════════════════════
  //  AUTHENTIC HUMAN — 3 speed classes, all share the same guarantees:
  //   edit >= 0.005, nav >= 0.003, pause >= 0.001
  // ══════════════════════════════════════════════════════════════════

  // Slow / deliberate writer
  for (let i = 0; i < 200; i++) {
    data.push({ input: [
      r(0.25, 0.90),  // 250–900ms per key
      r(0.10, 0.40),  // high rhythm variation
      r(0.02, 0.20),  // clear edit trail (2–20%)
      r(0.02, 0.15),  // real thinking pauses
      r(0.00, 0.04),  // minimal paste
      r(0.01, 0.15),  // cursor repositioning
      r(0.03, 0.18),  // slow CPM
    ], output: [1] });
  }

  // Medium typist
  for (let i = 0; i < 220; i++) {
    data.push({ input: [
      r(0.10, 0.28),  // 100–280ms per key
      r(0.04, 0.18),  // moderate variance
      r(0.01, 0.10),  // 1–10% edits — always > 0
      r(0.005, 0.06), // at least some thinking breaks
      r(0.00, 0.05),  // little to no paste
      r(0.005, 0.10), // some nav — always > 0
      r(0.10, 0.40),  // 100–400 CPM
    ], output: [1] });
  }

  // Fast / expert typist
  // CRITICAL: even at 80 WPM humans still backspace ~2–5% and use nav occasionally
  for (let i = 0; i < 200; i++) {
    data.push({ input: [
      r(0.04, 0.12),  // 40–120ms per key (very fast)
      r(0.015, 0.08), // low but nonzero variance
      r(0.008, 0.05), // at least 0.8% edit rate — guaranteed
      r(0.001, 0.02), // rare but nonzero pauses
      r(0.00, 0.02),  // near-zero paste
      r(0.003, 0.06), // at least 0.3% nav — guaranteed
      r(0.35, 0.85),  // 350–850 CPM
    ], output: [1] });
  }

  // Human with legitimate quoting (low paste, otherwise normal)
  for (let i = 0; i < 120; i++) {
    data.push({ input: [
      r(0.10, 0.35),
      r(0.05, 0.20),
      r(0.01, 0.08),  // still has edits
      r(0.005, 0.05),
      r(0.03, 0.20),  // small paste for a quote
      r(0.005, 0.08), // still uses nav
      r(0.10, 0.35),
    ], output: [1] });
  }

  // ══════════════════════════════════════════════════════════════════
  //  INAUTHENTIC — all share: zero or near-zero edits AND nav AND pauses
  // ══════════════════════════════════════════════════════════════════

  // Scripted bot / automation
  for (let i = 0; i < 200; i++) {
    data.push({ input: [
      r(0.00, 0.025), // <25ms — physically impossible for humans
      r(0.00, 0.003), // near-zero variance
      0,              // ZERO edits
      0,              // ZERO pauses
      Math.random() > 0.5 ? r(0.3, 1.0) : 0,
      0,              // ZERO nav
      r(0.80, 1.00),  // superhuman CPM
    ], output: [0] });
  }

  // AI text — pasted in bulk
  for (let i = 0; i < 200; i++) {
    data.push({ input: [
      r(0.08, 0.35),
      r(0.01, 0.12),
      r(0.00, 0.006), // near-zero edits (AI is clean)
      r(0.00, 0.005), // no real thinking pauses
      r(0.50, 1.00),  // HIGH paste — the clearest signal
      r(0.00, 0.008), // no navigation needed when pasting
      r(0.50, 1.00),  // high CPM from bulk paste
    ], output: [0] });
  }

  // AI text — retyped by human (hardest case)
  // Distinguisher: ZERO backspaces + ZERO nav events (just reading and copying)
  for (let i = 0; i < 200; i++) {
    data.push({ input: [
      r(0.10, 0.30),  // human-speed pacing
      r(0.00, 0.03),  // very consistent (copying, not composing)
      r(0.00, 0.004), // near-ZERO edits — AI output has no errors
      r(0.00, 0.003), // near-ZERO pauses — not thinking, just reading
      r(0.00, 0.02),  // no paste
      r(0.00, 0.003), // near-ZERO nav — no cursor repositioning
      r(0.15, 0.55),  // reading speed CPM
    ], output: [0] });
  }

  // Partial paste — clearly suspicious but not full submission
  for (let i = 0; i < 100; i++) {
    data.push({ input: [
      r(0.10, 0.30),
      r(0.02, 0.10),
      r(0.00, 0.005), // very few edits
      r(0.00, 0.01),
      r(0.25, 0.60),  // significant paste
      r(0.00, 0.005), // no real nav
      r(0.30, 0.70),
    ], output: [0] });
  }

  const res = net.train(data, {
    iterations: 6000,
    errorThresh: 0.003,
    log: true,
    logPeriod: 1000,
  });

  console.log(`ML Training complete. Error: ${res.error.toFixed(5)}`);
}

export function predictAuthenticity(features: number[]): number {
  const result = net.run(features) as number[];
  return result[0];
}
