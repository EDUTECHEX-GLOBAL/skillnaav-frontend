/**
 * Utility functions for form input validation
 */

// Comprehensive set of legitimate IANA Top-Level Domains (ccTLDs + gTLDs)
export const VALID_TLDS = new Set([
  // Core & Generic TLDs
  "com", "org", "net", "edu", "gov", "mil", "int", "info", "biz", "name", "pro",
  "aero", "coop", "museum", "mobi", "asia", "jobs", "tel", "travel", "xxx",

  // Popular & Modern gTLDs
  "app", "dev", "tech", "io", "ai", "co", "me", "online", "site", "xyz", "store",
  "club", "live", "space", "top", "work", "agency", "global", "center", "digital",
  "world", "link", "ltd", "group", "today", "services", "solutions", "academy",
  "community", "zone", "cloud", "design", "media", "software", "systems", "network",
  "university", "school", "care", "health", "foundation", "expert", "guru", "consulting",
  "legal", "financial", "capital", "ventures", "international", "company", "studio",
  "enterprises", "marketing", "management", "holdings", "properties", "estate",
  "events", "exchange", "express", "finance", "hospital", "institute", "insurance",
  "investments", "security", "technology", "training", "blog", "shop", "news",
  "page", "life", "guide", "direct", "support", "help", "review", "tools", "team",
  "chat", "social", "art", "eco", "earth", "fund", "law", "lawyer", "clinic",
  "doctor", "realty", "house", "homes", "build", "builders", "delivery",

  // ISO 3166-1 Official Country-Code TLDs (ccTLDs)
  "ac", "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "aq", "ar", "as", "at", "au",
  "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bn",
  "bo", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch",
  "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cw", "cx", "cy", "cz", "de",
  "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg", "er", "es", "et", "eu", "fi", "fj",
  "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm",
  "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht",
  "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir", "is", "it", "je", "jm", "jo",
  "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb",
  "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg",
  "mh", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw",
  "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu",
  "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt",
  "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg",
  "sh", "si", "sk", "sl", "sm", "sn", "so", "sr", "ss", "st", "sv", "sx", "sy", "sz",
  "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tr", "tt", "tv",
  "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn",
  "vu", "wf", "ws", "ye", "yt", "za", "zm", "zw"
]);

export const EMAIL_FORMAT_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates whether an email has a valid format AND a legitimate registered Top-Level Domain (TLD)
 * Matches: user@gmail.com, user@domain.in, user@sub.example.co.uk, user@company.ca
 * Rejects: user@gmail.ff, user@gmail.c, user@domain, user@.com, user@@gmail.com
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();

  // Check basic email syntax
  if (!EMAIL_FORMAT_REGEX.test(trimmed)) {
    return false;
  }

  // Levenshtein distance algorithm for robust typo detection
  const levenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Extract TLD (last part after final dot)
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;

  const domainParts = parts[1].split(".");
  if (domainParts.length < 2) return false;

  const domain = parts[1];

  // Block common full domain typos (where the TLD is the typo, but is technically a real country code)
  const invalidFullDomainTypos = [
    // .co typos
    "gmail.co", "yahoo.co", "hotmail.co", "outlook.co", "icloud.co",
    // .c typos
    "gmail.c", "yahoo.c", "hotmail.c", "outlook.c", "icloud.c",
    // .cm typos
    "gmail.cm", "yahoo.cm", "hotmail.cm", "outlook.cm",
    // .om typos
    "gmail.om", "yahoo.om", "hotmail.om", "outlook.om",
    // .con typos
    "gmail.con", "yahoo.con", "hotmail.con", "outlook.con"
  ];
  if (invalidFullDomainTypos.includes(domain)) return false;

  const domainNamePart = domainParts.slice(0, -1).join(".");

  // Block common mistyped domain names regardless of TLD
  const invalidDomainNameTypos = [
    "g", "gm", "gmm", "gml", "gmai", "gmal", "gamil", "gmmail", "gmaill", "gmammil", "gamil", "gmaail", "gmi", "gmil", "gmailll",
    "y", "yaho", "yahooo", "yahoou", "yahou", "yhaoo",
    "h", "hotmai", "hotmal", "hotmial", "hotmaill",
    "o", "outloo", "outlookk", "outlok", "outlock"
  ];
  if (invalidDomainNameTypos.includes(domainNamePart)) return false;

  // Check for near-miss typos of popular providers
  const popularProviders = ["gmail", "yahoo", "hotmail", "outlook", "icloud"];
  if (!popularProviders.includes(domainNamePart)) {
    for (const provider of popularProviders) {
      // If it starts with the same letter and is very close in spelling (dist <= 2)
      if (
        domainNamePart.charAt(0) === provider.charAt(0) &&
        levenshtein(domainNamePart, provider) <= 2 &&
        domainNamePart !== "gmx" // whitelist gmx.com
      ) {
        return false; // reject typo!
      }
    }
  }

  // Reject suspicious domains with 3 or more consecutive identical characters (e.g. gmmmmail, gmvvvail)
  if (/(.)\1{2,}/.test(domainNamePart)) {
    return false;
  }

  // Reject gibberish domains with 5 or more consecutive consonants (e.g. gkzhzmmzm)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(domainNamePart)) {
    // There are very few valid domains with 5+ consecutive consonants.
    return false;
  }

  const tld = domainParts[domainParts.length - 1];

  // Validate that TLD is at least 2 chars and exists in known valid TLDs
  return VALID_TLDS.has(tld);
};

/**
 * Validates postal / ZIP code based on country
 * - United States: 5 digits (e.g. 94105) or ZIP+4 (e.g. 94105-1234)
 * - Canada: A1A 1A1 or A1A-1A1 or A1A1A1 format (e.g. K1A 0B1)
 * - General / Other: 3 to 10 alphanumeric characters
 */
export const validatePostalCode = (code, country = "United States") => {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();

  if (country === "United States" || country === "USA") {
    // 5 digits (standard) or ZIP+4 (12345-6789)
    return /^\d{5}(-\d{4})?$/.test(trimmed);
  }

  if (country === "Canada") {
    // Canadian postal code format: A1A 1A1 or A1A-1A1 or A1A1A1
    return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(trimmed);
  }

  // Fallback for other countries: generic 3-10 alphanumeric
  return /^[a-zA-Z0-9\s-]{3,10}$/.test(trimmed);
};

/**
 * Returns specific error message for invalid postal / ZIP code based on country
 */
export const getPostalCodeErrorMessage = (code, country = "United States") => {
  if (!code || !code.trim()) return "";
  if (validatePostalCode(code, country)) return "";

  if (country === "United States" || country === "USA") {
    return "Please enter a valid 5-digit US ZIP code (e.g. 94105) or ZIP+4 (e.g. 94105-1234).";
  }

  if (country === "Canada") {
    return "Please enter a valid Canadian postal code (e.g. K1A 0B1).";
  }

  return "Please enter a valid postal or ZIP code.";
};

/**
 * Auto-formats postal / ZIP code as the user types
 */
export const formatPostalCodeInput = (value, country = "United States") => {
  if (!value) return "";

  if (country === "United States" || country === "USA") {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) {
      return digits;
    }
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  }

  if (country === "Canada") {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return cleaned;
  }

  return value.slice(0, 10);
};
