const crypto = require("crypto");
const { sha256 } = require("./assessmentEvaluator");
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

function uid(prefix = "q") {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * 🔒 SAFE OPTION PARSER (NO STRING SPLITTING)
 */
function safeParseOptions(optionsBlock) {
  try {
    const parsed = JSON.parse(`[${optionsBlock}]`);

    const cleaned = parsed
      .map(opt =>
        String(opt)
          .replace(/^[A-D]\.?[\]\)]?\s*/i, "")
          .trim()
      )
      .filter(Boolean);

    if (cleaned.length !== 4) return null;

    return cleaned;
  } catch {
    return null;
  }
}

/**
 * 🤖 AI MCQ GENERATOR (BEDROCK)
 */
async function generateMcqSetAI({
  internshipTitle,
  internshipDescription,
  skills = [],
  questionCount = 10,
  difficulty = 2,
}) {
  const prompt = `
You are an assessment generator for hiring.

Internship Title:
${internshipTitle}

Job Description:
${internshipDescription}

Required Skills:
${skills.join(", ")}

Difficulty Level: ${difficulty} (1 = easy, 3 = hard)

Generate exactly ${questionCount} MCQ questions.

Rules:
- Exactly 4 options
- Only ONE correct answer
- Options must be plain strings
- Return STRICT JSON ONLY
- No markdown
- No explanations

JSON format:
[
  {
    "question": "string",
    "options": ["opt1","opt2","opt3","opt4"],
    "correctIndex": 0
  }
]
`;

  const command = new InvokeModelCommand({
    // ✅ Recommended model (BEST)
    modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",

    contentType: "application/json",
    accept: "application/json",

    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1500,
      temperature: 0.6,
      messages: [
        { role: "user", content: prompt }
      ],
    }),
  });

  const response = await client.send(command);

  const raw = JSON.parse(Buffer.from(response.body).toString("utf-8"));
  const text = raw?.content?.[0]?.text || "";

  if (!text) {
    throw new Error("Empty AI response from Bedrock");
  }

  /**
   * 🔥 STEP 1: REMOVE MARKDOWN
   */
  let cleanedText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```/g, "")
    .trim();

  /**
   * 🔥 STEP 2: EXTRACT JSON ARRAY
   */
  const jsonMatch = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);
  if (!jsonMatch) {
    console.error("❌ Raw AI Output:", text);
    throw new Error("AI did not return a JSON array");
  }

  let jsonString = jsonMatch[0];

  /**
   * 🔥 STEP 3: SANITIZE OPTIONS SAFELY
   */
  jsonString = jsonString.replace(
    /"options"\s*:\s*\[(.*?)\]/gs,
    (_, optionsBlock) => {
      const cleanedOptions = safeParseOptions(optionsBlock);
      if (!cleanedOptions) {
        throw new Error("Invalid options detected");
      }
      return `"options":[${cleanedOptions.map(o => `"${o.replace(/"/g, '\\"')}"`).join(",")}]`;
    }
  );

  /**
   * 🔥 STEP 4: FINAL JSON PARSE
   */
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("❌ Sanitized JSON:", jsonString);
    throw err;
  }

  /**
   * 🔥 STEP 5: VALIDATION + HASHING
   */
  return parsed.map((q, index) => {
    const correctIndex = Number(q.correctIndex);

    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      Number.isNaN(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      throw new Error(`Invalid question at index ${index + 1}`);
    }

    return {
      questionId: uid("q"),
      question: q.question.trim(),
      options: q.options.map(o => o.trim()),
      correctIndexHash: sha256(correctIndex),
      explanation: "AI generated (Bedrock)",
    };
  });
}

module.exports = { generateMcqSetAI };
