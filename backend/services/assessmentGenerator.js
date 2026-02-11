const crypto = require("crypto");
const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
  region: process.env.ASSESSMENT_AWS_REGION || process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.ASSESSMENT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.ASSESSMENT_AWS_SECRET_ACCESS_KEY,
  },
});

const ASSESSMENT_SALT = process.env.ASSESSMENT_SALT || "CHANGE-THIS-SECRET-SALT";

/**
 * Secure hash with salt
 */
function sha256WithSalt(input) {
  return crypto
    .createHash("sha256")
    .update(ASSESSMENT_SALT + String(input))
    .digest("hex");
}

function uid(prefix = "q") {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * Sanitize user inputs to prevent prompt injection
 */
function sanitizeInput(text, maxLength = 5000) {
  if (!text) return "";
  return String(text)
    .replace(/[<>{}[\]]/g, "") // Remove potentially malicious chars
    .replace(/\\n\\n+/g, "\\n") // Normalize newlines
    .substring(0, maxLength)
    .trim();
}

/**
 * Validate question quality
 */
function validateQuestion(q, index) {
  const errors = [];

  // Check question length
  if (q.question.length < 15) {
    errors.push(`Question ${index + 1}: Question too short (min 15 chars)`);
  }

  // Check options
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`Question ${index + 1}: Must have exactly 4 options`);
  }

  // Check for duplicate options (case-insensitive)
  const uniqueOpts = new Set(q.options.map(o => o.toLowerCase().trim()));
  if (uniqueOpts.size !== 4) {
    errors.push(`Question ${index + 1}: Contains duplicate options`);
  }

  // Check option lengths (correct answer shouldn't be obviously longer)
  const correctIndex = Number(q.correctIndex);
  if (correctIndex >= 0 && correctIndex < 4) {
    const lengths = q.options.map(o => o.length);
    const correctLength = lengths[correctIndex];
    const otherLengths = lengths.filter((_, i) => i !== correctIndex);
    const avgOtherLength = otherLengths.reduce((a, b) => a + b, 0) / 3;

    if (correctLength > avgOtherLength * 2) {
      errors.push(`Question ${index + 1}: Correct answer suspiciously longer than others`);
    }
  }

  // Check correctIndex validity
  if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    errors.push(`Question ${index + 1}: Invalid correctIndex (${q.correctIndex})`);
  }

  return errors;
}

/**
 * Extract core concept from a question for semantic deduplication
 */
function extractQuestionConcept(question) {
  const q = question.toLowerCase().trim();
  
  // Extract the main concept being asked about
  let concept = q;
  
  // Remove question words and common phrases
  concept = concept
    .replace(/^(what|which|how|why|when|where|who|describe|explain|identify|which of the following)\s+(is|are|would|can|will|could|should|does|do|did)\s+/i, '')
    .replace(/\b(the|a|an|in|on|for|to|of|and|with|by|using|most|key|primary|main|best)\b/g, ' ')
    .replace(/\?.*$/, '') // Remove everything after first question mark
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract key noun phrases (3-5 word combinations)
  const words = concept.split(' ').filter(w => w.length > 3);
  
  // Create multiple fingerprints of different lengths to catch variations
  const fingerprints = [];
  
  // Primary fingerprint: first 5 significant words
  if (words.length >= 3) {
    fingerprints.push(words.slice(0, Math.min(5, words.length)).join(' '));
  }
  
  // Secondary fingerprint: core 3-word phrase (skip first word which might vary)
  if (words.length >= 4) {
    fingerprints.push(words.slice(1, 4).join(' '));
  }
  
  // Tertiary: last 3 words (often the actual topic)
  if (words.length >= 3) {
    fingerprints.push(words.slice(-3).join(' '));
  }
  
  return {
    primary: fingerprints[0] || concept,
    secondary: fingerprints[1] || '',
    tertiary: fingerprints[2] || '',
    allFingerprints: fingerprints
  };
}

/**
 * Check if two questions are semantically duplicate
 */
function areQuestionsDuplicate(q1, q2) {
  const c1 = extractQuestionConcept(q1);
  const c2 = extractQuestionConcept(q2);
  
  // Check primary fingerprint match
  if (c1.primary === c2.primary && c1.primary.length > 10) {
    return true;
  }
  
  // Check if any fingerprints overlap significantly
  for (const fp1 of c1.allFingerprints) {
    for (const fp2 of c2.allFingerprints) {
      if (fp1 && fp2 && fp1.length > 8 && fp2.length > 8) {
        // Calculate similarity (simple word overlap)
        const words1 = fp1.split(' ');
        const words2 = fp2.split(' ');
        const overlap = words1.filter(w => words2.includes(w)).length;
        const similarity = overlap / Math.max(words1.length, words2.length);
        
        if (similarity > 0.7) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Remove duplicate questions using semantic analysis
 */
function deduplicateQuestions(questions) {
  const unique = [];
  const seenConcepts = new Map();
  
  for (const q of questions) {
    const concept = extractQuestionConcept(q.question);
    let isDuplicate = false;
    
    // Check against all previously seen questions
    for (const [seenQ, seenConcept] of seenConcepts.entries()) {
      if (areQuestionsDuplicate(q.question, seenQ)) {
        console.log(`🔄 Skipping duplicate: "${q.question.substring(0, 60)}..." (similar to existing question)`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      unique.push(q);
      seenConcepts.set(q.question, concept);
    }
  }
  
  return unique;
}


/**
 * Enhanced difficulty guidelines
 */
const DIFFICULTY_GUIDELINES = {
  1: {
    name: "Basic",
    description: "Entry-level knowledge, recall and recognition",
    examples: "Define terms, identify concepts, list components",
    bloomLevels: ["remember", "understand"]
  },
  2: {
    name: "Intermediate",
    description: "Application and analysis of concepts",
    examples: "Apply concepts to scenarios, debug code, compare approaches",
    bloomLevels: ["apply", "analyze"]
  },
  3: {
    name: "Advanced",
    description: "Expert-level problem-solving and optimization",
    examples: "Design solutions, optimize algorithms, handle edge cases",
    bloomLevels: ["evaluate", "create"]
  }
};

/**
 * Build enhanced AI prompt
 */
function buildAssessmentPrompt({
  internshipTitle,
  internshipDescription,
  skills,
  questionCount,
  difficulty,
  focusArea = null, // NEW: specific area to focus on
}) {
  const safeTitle = sanitizeInput(internshipTitle, 200);
  const safeDescription = sanitizeInput(internshipDescription, 3000);
  const safeSkills = skills.slice(0, 20).map(s => sanitizeInput(s, 50)).filter(Boolean);

  const diffGuide = DIFFICULTY_GUIDELINES[difficulty] || DIFFICULTY_GUIDELINES[2];

  const focusText = focusArea 
    ? `\n🎯 FOCUS AREA: Prioritize questions about "${focusArea}" for this batch.\n`
    : '';

  return `You are an expert technical assessment generator for hiring purposes.

<assessment_context>
<internship_title>${safeTitle}</internship_title>
<job_description>${safeDescription}</job_description>
<required_skills>${safeSkills.join(", ")}</required_skills>
<difficulty_level>${difficulty} - ${diffGuide.name}</difficulty_level>
<difficulty_description>${diffGuide.description}</difficulty_description>
<target_bloom_levels>${diffGuide.bloomLevels.join(", ")}</target_bloom_levels>
</assessment_context>${focusText}

Generate exactly ${questionCount} multiple-choice questions following these requirements:

QUESTION QUALITY REQUIREMENTS:
1. Each question must be clear, unambiguous, and professionally written
2. Questions should test practical knowledge relevant to the role
3. Avoid trivial, outdated, or trick questions
4. Cover diverse aspects of the required skills
5. Ensure questions are at the specified difficulty level

ANSWER OPTIONS REQUIREMENTS:
1. Exactly 4 options per question
2. Only ONE correct answer
3. All options must be plausible (no obvious wrong answers)
4. Options should be similar in length (correct answer not suspiciously longer)
5. Options must be distinct (no duplicates or near-duplicates)
6. Avoid "All of the above" or "None of the above" options

DIVERSITY REQUIREMENTS:
- Cover different skill areas from the required skills list
- Mix conceptual understanding with practical application
- Include scenario-based questions for difficulty 2+
- Vary question types and formats

CRITICAL UNIQUENESS RULES:
- Each question MUST test a COMPLETELY DIFFERENT concept or skill
- DO NOT ask about the same topic/feature/technique multiple times
- Avoid these common duplicates:
  * Multiple questions about the SAME algorithm (e.g., don't ask "what is X?" AND "why use X?")
  * Multiple questions about the SAME technique (e.g., don't ask "purpose of dropout" AND "how does dropout work")
  * Multiple questions about the SAME problem (e.g., don't ask "how to handle X?" AND "what technique addresses X?")
- If you've asked about attention mechanisms, DON'T ask about it again
- If you've asked about dynamic programming, DON'T ask about it again
- Each question should cover a UNIQUE entry from the skills list


OUTPUT FORMAT:
Return ONLY a valid JSON array with NO additional text, markdown, or explanations.

JSON Schema:
[
  {
    "question": "Complete question text here?",
    "options": [
      "First option",
      "Second option",
      "Third option",
      "Fourth option"
    ],
    "correctIndex": 0,
    "domain": "frontend|backend|database|devops|general",
    "bloomLevel": "remember|understand|apply|analyze|evaluate|create"
  }
]

CRITICAL: 
- Start response with [ and end with ]
- Use correctIndex as integer (0-3)
- Ensure all strings are properly escaped
- No markdown code blocks
- No explanatory text

Generate ${questionCount} questions now:`;
}

/**
 * Parse AI response with multiple fallback strategies
 */
function parseAIResponse(text) {
  if (!text) {
    throw new Error("Empty AI response");
  }

  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Continue to fallback strategies
  }

  // Strategy 2: Remove markdown code blocks
  let cleaned = text
    .replace(/```json\\s*/g, "")
    .replace(/```\\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Continue to fallback strategies
  }

  // Strategy 3: Extract JSON array with regex
  const jsonMatch = cleaned.match(/\\[\\s*{[\\s\\S]*?}\\s*\\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Continue to fallback strategies
    }
  }

  // Strategy 4: Try to find array boundaries
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const extracted = cleaned.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(extracted);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // All strategies failed
    }
  }

  console.error("❌ Failed to parse AI response:", text.substring(0, 500));
  throw new Error("AI response is not valid JSON array");
}

/**
 * Generate ONE batch of MCQs from Bedrock
 */
async function generateMcqBatch({
  internshipTitle,
  internshipDescription,
  skills,
  questionCount,
  difficulty,
  excludeConcepts = [],
  relaxUniqueness = false,
  attemptNumber = 1,
  focusArea = null, // NEW
}) {
  // Extract key concepts from existing questions
  const existingConcepts = excludeConcepts.map(q => {
    // Try to extract the core concept/topic
    const lowerQ = q.toLowerCase();
    
    // Pattern 1: "what/which/how is/are X?" -> extract X
    let match = lowerQ.match(/(?:what|which|how|why)\s+(?:is|are|does|do|can|would)\s+(.+?)(?:\?|used|important|effective|appropriate)/i);
    if (match) return match[1].trim();
    
    // Pattern 2: "purpose/role of X" -> extract X
    match = lowerQ.match(/(?:purpose|role|advantage|benefit|use)\s+of\s+(.+?)(?:\?|in|for)/i);
    if (match) return match[1].trim();
    
    // Pattern 3: "how to handle/address X" -> extract X
    match = lowerQ.match(/(?:handle|address|solve|improve|optimize)\s+(.+?)(?:\?|in|using)/i);
    if (match) return match[1].trim();
    
    // Pattern 4: "X technique/algorithm/method" -> extract X
    match = lowerQ.match(/(?:using|applying|implementing)\s+(.+?)(?:\s+technique|\s+algorithm|\s+method|\s+in|\?)/i);
    if (match) return match[1].trim();
    
    // Fallback: just take key words
    return lowerQ
      .replace(/^(what|which|how|why|when|describe|explain|identify)\s+/i, '')
      .replace(/\?.*$/, '')
      .split(' ')
      .filter(w => w.length > 4)
      .slice(0, 5)
      .join(' ');
  }).filter(Boolean).slice(-20); // Keep last 20 to avoid prompt bloat

  const exclusionText =
  existingConcepts.length > 0
    ? `
⚠️ CRITICAL EXCLUSION RULES - GENERATE COMPLETELY NEW QUESTIONS:

You have ALREADY asked about these concepts - DO NOT repeat them:
${existingConcepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}

MANDATORY REQUIREMENTS:
- Test COMPLETELY DIFFERENT concepts, features, or scenarios
- Use DIFFERENT topics from the skills list
- DO NOT rephrase or reword existing concepts
- If stuck, focus on: debugging, optimization, edge cases, real-world scenarios, comparisons, trade-offs
`
    : "";

const diversityBoost = attemptNumber > 5
  ? `
🎯 DIVERSITY BOOST (Attempt ${attemptNumber}):
Since this is attempt #${attemptNumber}, you MUST be more creative:
- Use scenario-based questions with realistic examples
- Ask about edge cases, best practices, or performance considerations  
- Cover advanced features, patterns, or architectural decisions
- Test debugging, optimization, or security aspects
- Include comparison questions between different approaches
`
  : "";

const relaxationText = relaxUniqueness
  ? `
🔓 RELAXED MODE:
- You may reference similar technologies or concepts
- BUT the specific question and learning objective must be UNIQUE
- Focus on practical application, troubleshooting, or real-world scenarios
`
  : "";


  const prompt =
    buildAssessmentPrompt({
      internshipTitle,
      internshipDescription,
      skills,
      questionCount,
      difficulty,
      focusArea, // NEW
    }) +
    "\n" +
    exclusionText +
    "\n" +
    diversityBoost +
    "\n" +
    relaxationText;

  const modelId =
    process.env.BEDROCK_MODEL_ID ||
    "anthropic.claude-3-haiku-20240307-v1:0";

  // Increase temperature after multiple failed attempts to boost creativity
  const baseTemperature = 0.7;
  const temperatureBoost = attemptNumber > 5 ? Math.min(0.2, (attemptNumber - 5) * 0.05) : 0;
  const finalTemperature = Math.min(baseTemperature + temperatureBoost, 1.0);

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 8192,
      temperature: finalTemperature,
      messages: [{ role: "user", content: prompt }],
      system:
        "You are a strict JSON generator. You MUST output a COMPLETE, VALID JSON array. " +
        "Do NOT stop early. Do NOT include commentary. " +
        "Generate UNIQUE questions that have NOT been asked before. " +
        "If you cannot finish, reduce detail but ALWAYS close the JSON array.",
    }),
  });

  let response;
  try {
    response = await client.send(command);
  } catch (err) {
    console.error("❌ Bedrock call failed:", err);
    throw err;
  }

  const raw = JSON.parse(Buffer.from(response.body).toString("utf-8"));
  const text = raw?.content?.[0]?.text || "";

  if (!text) {
    console.warn("⚠️ Empty response from Bedrock");
    return [];
  }

  let parsed;
  try {
    parsed = parseAIResponse(text);
  } catch (err) {
    console.warn("⚠️ Partial/invalid JSON from AI. Retrying batch...");
    return [];
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return [];
  }

  return parsed;
}


async function generateUntilExactCount({
  internshipTitle,
  internshipDescription,
  skills,
  difficulty,
  questionCount,
}) {
  let allQuestions = [];
  const maxAttempts = 20;
  let consecutiveZeros = 0; // Track consecutive failed attempts

  console.log(`🎯 Target: ${questionCount} questions`);
  console.log(`📚 Available skills: ${skills.join(", ")}`);

  // Phase 1: Generate with topic rotation for diversity
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remaining = questionCount - allQuestions.length;
    if (remaining <= 0) break;

    // Early exit if stuck (5 consecutive attempts with 0 new questions)
    if (consecutiveZeros >= 5) {
      console.log(`⚠️ Stuck after ${attempt} attempts - moving to Phase 2`);
      break;
    }

    // Rotate through skills to force diversity
    const focusSkill = skills.length > 0 ? skills[(attempt - 1) % skills.length] : null;
    
    // Request more questions than needed to account for deduplication
    const batchSize = Math.min(Math.ceil(remaining * 1.3), 10);
    
    console.log(`📦 Attempt ${attempt}/${maxAttempts}: Requesting ${batchSize} questions focusing on "${focusSkill}" (have ${allQuestions.length}/${questionCount})`);

    const batch = await generateMcqBatch({
      internshipTitle,
      internshipDescription,
      skills,
      difficulty,
      questionCount: batchSize,
      excludeConcepts: allQuestions.map(q => q.question),
      relaxUniqueness: false,
      attemptNumber: attempt,
      focusArea: focusSkill,
    });

    const beforeCount = allQuestions.length;
    
    // First deduplicate within the batch itself
    const uniqueBatch = deduplicateQuestions(batch);
    
    // Then deduplicate against existing questions
    allQuestions = deduplicateQuestions([...allQuestions, ...uniqueBatch]);
    
    const addedCount = allQuestions.length - beforeCount;
    
    console.log(`✅ Added ${addedCount} unique questions (total: ${allQuestions.length}/${questionCount})`);

    // Track consecutive failures
    if (addedCount === 0) {
      consecutiveZeros++;
    } else {
      consecutiveZeros = 0; // Reset on success
    }

    // Early exit if we have enough
    if (allQuestions.length >= questionCount) {
      break;
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Phase 2: Relaxed uniqueness for remaining questions
  if (allQuestions.length < questionCount) {
    const remaining = questionCount - allQuestions.length;
    console.log(`🔄 Phase 2: Need ${remaining} more questions with relaxed uniqueness`);
    consecutiveZeros = 0; // Reset counter

    for (let attempt = 1; attempt <= 8; attempt++) { // Increased from 5 to 8
      const needed = questionCount - allQuestions.length;
      if (needed <= 0) break;

      // Early exit if stuck in Phase 2
      if (consecutiveZeros >= 3) {
        console.log(`⚠️ Phase 2 stuck - accepting ${allQuestions.length} questions`);
        break;
      }

      console.log(`📦 Relaxed attempt ${attempt}/8: Requesting ${needed} questions`);

      const topUp = await generateMcqBatch({
        internshipTitle,
        internshipDescription,
        skills,
        difficulty,
        questionCount: needed,
        excludeConcepts: allQuestions.map(q => q.question),
        relaxUniqueness: true,
        attemptNumber: attempt + 20, // Continue numbering from Phase 1
        focusArea: null, // No focus in relaxed mode
      });

      const beforeCount = allQuestions.length;
      
      // First deduplicate within the batch
      const uniqueTopUp = deduplicateQuestions(topUp);
      
      // Then deduplicate against existing questions
      allQuestions = deduplicateQuestions([...allQuestions, ...uniqueTopUp]);
      
      const addedCount = allQuestions.length - beforeCount;
      
      console.log(`✅ Added ${addedCount} questions (total: ${allQuestions.length}/${questionCount})`);

      if (addedCount === 0) {
        consecutiveZeros++;
      } else {
        consecutiveZeros = 0;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`✨ Final count: ${allQuestions.length}/${questionCount} questions`);
  
  // Final quality check: ensure no semantic duplicates slipped through
  console.log(`🔍 Running final duplicate check...`);
  const finalUnique = deduplicateQuestions(allQuestions);
  
  if (finalUnique.length < allQuestions.length) {
    console.log(`⚠️ Removed ${allQuestions.length - finalUnique.length} semantic duplicates in final check`);
    allQuestions = finalUnique;
  } else {
    console.log(`✅ No duplicates found in final set`);
  }
  
  return allQuestions.slice(0, questionCount);
}


/**
 * Main AI MCQ generator with improved error handling and validation
 */
async function generateMcqSetAI({
  internshipTitle,
  internshipDescription,
  skills = [],
  questionCount = 10,
  difficulty = 2,
}) {
  const rawQuestions = await generateUntilExactCount({
    internshipTitle,
    internshipDescription,
    skills,
    difficulty,
    questionCount,
  });

  // Relaxed threshold: accept 70% instead of 90%
  const minAcceptable = Math.floor(questionCount * 0.7);
  
  if (rawQuestions.length < minAcceptable) {
    throw new Error(
      `AI produced too few questions (${rawQuestions.length}/${questionCount}). Minimum required: ${minAcceptable}`
    );
  }

  // If we don't have exactly the right count, warn but continue
  if (rawQuestions.length < questionCount) {
    console.warn(`⚠️ Generated ${rawQuestions.length}/${questionCount} questions (${Math.round(rawQuestions.length/questionCount*100)}%)`);
  }

  return rawQuestions.map((q) => {
    const correctIndex = Number(q.correctIndex);

    return {
      questionId: uid("q"),
      question: q.question.trim(),
      options: q.options.map((o) => String(o).trim()),
      correctIndexHash: sha256WithSalt(correctIndex),
      explanation: `AI generated (Difficulty: ${difficulty})`,
      metadata: {
        domain: q.domain || "general",
        bloomLevel: q.bloomLevel || "apply",
        difficulty,
        generatedAt: new Date(),
      },
    };
  });
}


module.exports = { 
  generateMcqSetAI,
  sha256WithSalt // Export for use in evaluator
};