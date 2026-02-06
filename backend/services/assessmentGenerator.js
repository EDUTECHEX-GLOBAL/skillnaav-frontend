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
 * Remove duplicate questions
 */
function deduplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter(q => {
    const normalized = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
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
  difficulty
}) {
  const safeTitle = sanitizeInput(internshipTitle, 200);
  const safeDescription = sanitizeInput(internshipDescription, 3000);
  const safeSkills = skills.slice(0, 20).map(s => sanitizeInput(s, 50)).filter(Boolean);

  const diffGuide = DIFFICULTY_GUIDELINES[difficulty] || DIFFICULTY_GUIDELINES[2];

  return `You are an expert technical assessment generator for hiring purposes.

<assessment_context>
<internship_title>${safeTitle}</internship_title>
<job_description>${safeDescription}</job_description>
<required_skills>${safeSkills.join(", ")}</required_skills>
<difficulty_level>${difficulty} - ${diffGuide.name}</difficulty_level>
<difficulty_description>${diffGuide.description}</difficulty_description>
<target_bloom_levels>${diffGuide.bloomLevels.join(", ")}</target_bloom_levels>
</assessment_context>

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
- No duplicate or overly similar questions

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
 * Main AI MCQ generator with improved error handling and validation
 */
async function generateMcqSetAI({
  internshipTitle,
  internshipDescription,
  skills = [],
  questionCount = 10,
  difficulty = 2,
}) {
  // Input validation
  if (!internshipTitle || !internshipDescription) {
    throw new Error("Internship title and description are required");
  }

  if (questionCount < 5 || questionCount > 50) {
    throw new Error("Question count must be between 5 and 50");
  }

  if (![1, 2, 3].includes(difficulty)) {
    throw new Error("Difficulty must be 1, 2, or 3");
  }

  const prompt = buildAssessmentPrompt({
    internshipTitle,
    internshipDescription,
    skills,
    questionCount,
    difficulty
  });

  // ✅ FIX: Use cross-region inference profile ARN or fallback models
  const modelId = process.env.BEDROCK_MODEL_ID || 
    // Haiku is the most reliable and cost-effective option
    "anthropic.claude-3-haiku-20240307-v1:0";
    // Alternative: "us.anthropic.claude-3-5-sonnet-20241022-v2:0" (cross-region profile)
    // Alternative: "anthropic.claude-3-sonnet-20240229-v1:0" (older but stable)

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4000,
      temperature: 0.7, // Slightly higher for more creative questions
      messages: [
        { role: "user", content: prompt }
      ],
      system: "You are a JSON generator. You must respond only with valid JSON arrays. No other text is allowed."
    }),
  });

  let response;
  try {
    response = await client.send(command);
  } catch (error) {
    console.error("❌ Bedrock API error:", error);
    throw new Error(`Failed to call Bedrock API: ${error.message}`);
  }

  const raw = JSON.parse(Buffer.from(response.body).toString("utf-8"));
  const text = raw?.content?.[0]?.text || "";

  if (!text) {
    throw new Error("Empty response from Bedrock");
  }

  // Parse AI response
  let parsed;
  try {
    parsed = parseAIResponse(text);
  } catch (error) {
    console.error("❌ Parse error. Raw response:", text.substring(0, 1000));
    throw error;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned empty or invalid question array");
  }

  // Validate each question
  const allErrors = [];
  parsed.forEach((q, index) => {
    const errors = validateQuestion(q, index);
    allErrors.push(...errors);
  });

  if (allErrors.length > 0) {
    console.warn("⚠️ Question validation warnings:", allErrors);
    // Optionally throw if errors are critical
    // throw new Error(`Question validation failed: ${allErrors.join("; ")}`);
  }

  // Remove duplicates
  const uniqueQuestions = deduplicateQuestions(parsed);
  if (uniqueQuestions.length < questionCount * 0.8) {
    console.warn(`⚠️ Only ${uniqueQuestions.length} unique questions generated (expected ${questionCount})`);
  }

  // Transform to final format with secure hashing
  return uniqueQuestions.map((q) => {
    const correctIndex = Number(q.correctIndex);

    return {
      questionId: uid("q"),
      question: q.question.trim(),
      options: q.options.map(o => String(o).trim()),
      correctIndexHash: sha256WithSalt(correctIndex), // ✅ Secure hash
      explanation: `AI generated (Difficulty: ${difficulty})`,
      metadata: {
        domain: q.domain || "general",
        bloomLevel: q.bloomLevel || "apply",
        difficulty: difficulty,
        generatedAt: new Date()
      }
    };
  });
}

module.exports = { 
  generateMcqSetAI,
  sha256WithSalt // Export for use in evaluator
};