const crypto = require("crypto");

const ASSESSMENT_SALT = process.env.ASSESSMENT_SALT || "CHANGE-THIS-SECRET-SALT";

/**
 * Secure hash with salt (must match generator)
 */
function sha256WithSalt(input) {
  return crypto
    .createHash("sha256")
    .update(ASSESSMENT_SALT + String(input))
    .digest("hex");
}

/**
 * Analyze answer timing patterns for suspicious activity
 */
function analyzeTimingPatterns(timingPattern) {
  if (!Array.isArray(timingPattern) || timingPattern.length === 0) {
    return { suspicious: false, reason: null };
  }

  const times = timingPattern.map(t => t.timeSpentSeconds).filter(t => t > 0);
  
  if (times.length === 0) {
    return { suspicious: true, reason: "No timing data available" };
  }

  // Check for impossibly fast answers (< 3 seconds on average)
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  if (avgTime < 3) {
    return { suspicious: true, reason: `Abnormally fast (avg ${avgTime.toFixed(1)}s)` };
  }

  // Check for uniform timing (bot-like behavior)
  const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev < 1 && times.length > 5) {
    return { suspicious: true, reason: "Suspiciously uniform timing pattern" };
  }

  return { suspicious: false, reason: null };
}

/**
 * Enhanced MCQ grading with detailed feedback
 */
function gradeMcq({ questions, answers, passScore = 70, timingPattern = null }) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Questions array is required and cannot be empty");
  }

  const byQid = new Map();
  for (const q of questions) {
    byQid.set(q.questionId, q);
  }

  let correct = 0;
  const total = questions.length;
  const detailed = [];
  const seen = new Set();

  // Grade each answer
  for (const a of answers || []) {
    if (!a || !a.questionId || typeof a.selectedIndex !== "number") {
      continue;
    }

    // Prevent duplicate submissions for same question
    if (seen.has(a.questionId)) {
      continue;
    }
    seen.add(a.questionId);

    const q = byQid.get(a.questionId);
    if (!q) {
      // Question not found - possible tampering
      detailed.push({
        questionId: a.questionId,
        isCorrect: false,
        reason: "Question not found"
      });
      continue;
    }

    // Validate selected index range
    if (a.selectedIndex < 0 || a.selectedIndex >= q.options.length) {
      detailed.push({
        questionId: a.questionId,
        isCorrect: false,
        reason: "Invalid option index"
      });
      continue;
    }

    // Check if answer is correct using secure hash
    const isCorrect = sha256WithSalt(a.selectedIndex) === q.correctIndexHash;
    if (isCorrect) {
      correct += 1;
    }

    detailed.push({
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      isCorrect,
      domain: q.metadata?.domain,
      difficulty: q.metadata?.difficulty
    });
  }

  // Calculate unanswered questions
  const answeredCount = seen.size;
  const unansweredCount = total - answeredCount;

  // Calculate score
  const mcqScore = total > 0 ? Math.round((correct / total) * 100) : 0;
  const pass = mcqScore >= passScore;

  // Analyze timing if provided
  let timingAnalysis = null;
  if (timingPattern) {
    timingAnalysis = analyzeTimingPatterns(timingPattern);
  }

  // Generate domain-specific breakdown
  const domainStats = {};
  detailed.forEach(d => {
    const domain = d.domain || "general";
    if (!domainStats[domain]) {
      domainStats[domain] = { correct: 0, total: 0 };
    }
    domainStats[domain].total += 1;
    if (d.isCorrect) {
      domainStats[domain].correct += 1;
    }
  });

  return {
    mcqScore,
    correctCount: correct,
    incorrectCount: answeredCount - correct,
    unansweredCount,
    total,
    pass,
    detailed,
    domainStats,
    timingAnalysis,
    completionRate: Math.round((answeredCount / total) * 100)
  };
}

/**
 * Generate human-readable feedback
 */
function generateFeedback({ mcqScore, correctCount, total, domainStats, pass, passScore }) {
  const feedback = [];

  // Overall result
  if (pass) {
    feedback.push(`✅ Congratulations! You passed with ${mcqScore}% (${correctCount}/${total} correct).`);
  } else {
    feedback.push(`You scored ${mcqScore}% (${correctCount}/${total} correct). Pass score is ${passScore}%.`);
  }

  // Domain breakdown
  if (Object.keys(domainStats).length > 1) {
    feedback.push("\\n**Performance by domain:**");
    Object.entries(domainStats).forEach(([domain, stats]) => {
      const domainScore = Math.round((stats.correct / stats.total) * 100);
      feedback.push(`- ${domain}: ${stats.correct}/${stats.total} (${domainScore}%)`);
    });
  }

  // Suggestions
  if (!pass) {
    const weakDomains = Object.entries(domainStats)
      .filter(([_, stats]) => stats.correct / stats.total < 0.6)
      .map(([domain]) => domain);

    if (weakDomains.length > 0) {
      feedback.push(`\\n**Areas to improve:** ${weakDomains.join(", ")}`);
    }
  }

  return feedback.join("\\n");
}

module.exports = { 
  gradeMcq, 
  sha256WithSalt,
  generateFeedback,
  analyzeTimingPatterns
};