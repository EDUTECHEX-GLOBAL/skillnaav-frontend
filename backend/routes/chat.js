// backend/routes/chat.js
const express      = require("express");
const router       = express.Router();
const askMistral   = require("../services/bedrockChat");
const {
  listCompanies,
  listTypes,
  listModes,
} = require("../services/ragHelpers");

/* ---------- regex buckets ---------- */
const GREET_RX =
  /^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|how\s*are\s*you)\b/i;

const ALLOWED_RX =
  /(skill\s*naav|internship|career|resume|cv|job|schedule|partner)/i;

/* ---------- POST  /api/career-chat ---------- */
router.post("/career-chat", async (req, res) => {
  const { message = "" } = req.body;

  /* 1️⃣  greetings – quick reply, no Bedrock call */
  if (GREET_RX.test(message.trim())) {
    return res.json({
      reply:
        "Hello! 👋 How can I help you?",
    });
  }

  /* 2️⃣  reject clearly off-topic */
  if (!ALLOWED_RX.test(message)) {
    return res.json({
      reply: "I’m sorry, I can’t assist you with that.",
    });
  }

  /* 3️⃣  Build dynamic context (companies / types / modes) */
  let ctx = "";

  /* –– companies –– */
  if (/(which|what).*companies?.*internship|list.*companies/i.test(message)) {
    const companies = await listCompanies();
    if (companies.length) {
      ctx += `\n\n**COMPANIES:**\n${companies
        .map((c) => "• " + c)
        .join("\n")}\n`;
    }
  }

  /* –– types –– */
  if (/(which|what).*types?.*internship|paid|free|stipend/i.test(message)) {
    const types = await listTypes();
    if (types.length) {
      ctx += `\n\n**TYPES:**\n${types.map((t) => "• " + t).join("\n")}\n`;
    }
  }

  /* –– modes –– */
  if (/(online|offline|hybrid).*internship/i.test(message)) {
    const modes = await listModes();
    if (modes.length) {
      ctx += `\n\n**MODES:**\n${modes.map((m) => "• " + m).join("\n")}\n`;
    }
  }

  const promptForAI = ctx ? `${ctx}\n\nUser: ${message}` : message;

  /* 4️⃣  forward to Bedrock */
  try {
    const reply = await askMistral(promptForAI);
    return res.json({ reply });
  } catch (err) {
    console.error("Bedrock error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong with the AI service." });
  }
});

module.exports = router;
