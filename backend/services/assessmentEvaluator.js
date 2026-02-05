const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

/**
 * Grade MCQ answers (single correct).
 * Returns { mcqScore, correctCount, total, pass }
 */
function gradeMcq({ questions, answers, passScore = 70 }) {
  const byQid = new Map();
  for (const q of questions) byQid.set(q.questionId, q);

  let correct = 0;
  const total = questions.length;

  const seen = new Set();
  for (const a of answers || []) {
    if (!a || !a.questionId || typeof a.selectedIndex !== "number") continue;
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);

    const q = byQid.get(a.questionId);
    if (!q) continue;

    if (sha256(a.selectedIndex) === q.correctIndexHash) correct += 1;
  }

  const mcqScore = total > 0 ? Math.round((correct / total) * 100) : 0;
  const pass = mcqScore >= passScore;

  return { mcqScore, correctCount: correct, total, pass };
}

module.exports = { gradeMcq, sha256 };
