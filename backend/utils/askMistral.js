require("dotenv").config();
const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const Partner = require("../models/webapp-models/partnerModel");

const client = new BedrockRuntimeClient({
  region: process.env.AWS_CHAT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_CHAT_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_CHAT_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

async function askMistral(userPrompt, partnerId, opts = {}) {
  let partnerContext = "";

  try {
    if (partnerId) {
      const partner = await Partner.findById(partnerId).lean();
      if (partner) {
        partnerContext = `
PARTNER NAME: ${partner.name}
PARTNER EMAIL: ${partner.email}
APPROVAL STATUS: ${partner.adminApproved ? "Approved" : "Not Approved"}

FLOW CONTEXT:
- As a new partner, you must complete your profile.
- Then you can post internships and monitor applications.
- You can only access dashboard features after admin approval.
`;
      }
    }
  } catch (err) {
    console.warn("Could not fetch partner context", err);
  }

  const SYSTEM_PROMPT = `
<<SYS>>
You are **Skill Naav Onboarding Assistant**.

✅ You **MUST ONLY** help *partners* with:
1. Navigating the Skill Naav platform.
2. Understanding each feature on the partner dashboard.
3. Explaining onboarding flow, approval status, and how to post internships.

🚫 If the question is unrelated to Skill Naav (e.g., politics, jokes, math, coding), respond with:
"I'm sorry, I can’t assist you with that."

🔒 Never generate information outside platform context.
${partnerContext}
<</SYS>>
`;

  const cmd = new InvokeModelCommand({
    modelId: "mistral.mistral-large-2402-v1:0",
    contentType: "application/json",
    body: JSON.stringify({
      prompt: `<s>[INST] ${SYSTEM_PROMPT}\n${userPrompt} [/INST]`,
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
      top_p: opts.top_p ?? 0.9,
      top_k: opts.top_k ?? 50,
    }),
  });

  const res = await client.send(cmd);
  const json = JSON.parse(await res.body.transformToString());

  return (
    json.outputs?.[0]?.text ||
    json.completion ||
    json.output ||
    ""
  ).trim();
}

module.exports = askMistral;
