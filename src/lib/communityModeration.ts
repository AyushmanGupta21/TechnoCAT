/**
 * Community Content Moderation & Anti-Spam Engine for TechnoCAT
 * Automatically detects and prevents spam, scams, gibberish, abusive content,
 * link harvesting, and off-topic unwanted content.
 */

export interface ModerationResult {
  isValid: boolean;
  reason?: string;
  flagType?: "spam" | "scam" | "link_spam" | "gibberish" | "toxicity" | "length";
}

// 1. Commercial Scams, Betting, Gambling, and Fraud Patterns
const SPAM_SCAM_PATTERNS: RegExp[] = [
  // Betting / Casino / Gambling
  /\b(casino|satta\s*matka|matka\s*result|1xbet|bet365|stake\.com|roulette|poker\s*real\s*money|rummy\s*(?:cash|money|circle)|color\s*prediction\s*(?:game|app))\b/i,
  // Financial Scams & Get-Rich-Quick
  /\b(earn\s*(?:money\s*online|daily\s*cash|rs\.?\s*\d+)|make\s*money\s*(?:fast|easy|online)|work\s*from\s*home\s*earn|guaranteed\s*(?:profit|returns|income)|daily\s*passive\s*income|crypto\s*doubler|binance\s*pump|free\s*usdt|trading\s*signals?\s*channel|instant\s*loan\s*without\s*cibil)\b/i,
  // Exam Cheating & Paper Leak Fraud
  /\b(cat\s*(?:paper\s*leak|exam\s*leak|question\s*paper\s*leak)|buy\s*cat\s*(?:2025|2026)?\s*paper|hire\s*proxy\s*for\s*cat|guaranteed\s*99\s*percentile\s*proxy|cat\s*proxy\s*exam|iim\s*seat\s*booking\s*management\s*quota)\b/i,
  // Adult / Escort Services
  /\b(escort\s*service|call\s*girls?|sex\s*chat|adult\s*dating|xxx\s*video|porn\s*site|nude\s*video|dating\s*service)\b/i,
];

// 2. Suspicious URL Shorteners & Malicious Link Patterns
const SUSPICIOUS_LINK_PATTERNS: RegExp[] = [
  /\b(?:bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|t\.co)\/[a-zA-Z0-9_\-]+/i,
  // Paid / suspicious Telegram channels spamming outside verified domains
  /(?:t\.me\/(?:\+|joinchat\/)[a-zA-Z0-9_\-]+)/i,
];

// 3. Contact Harvesting & Disguised Phone Spam
const CONTACT_HARVESTING_PATTERNS: RegExp[] = [
  /(?:call\s*me|whatsapp\s*me|contact\s*me|msg\s*on|ping\s*me)\s*(?:at|on)?\s*[:\s]*(\+?\d[\d\s\-\.]{8,}\d)/i,
  /(?:paytm|gpay|phonepe)\s*(?:number|no|transfer)\s*[:\s]*(\+?\d[\d\s\-\.]{8,}\d)/i,
];

// 4. Keyboard Smashes / Gibberish
const GIBBERISH_CONSONANT_CLUSTER = /(?:[bcdfghjklmnpqrstvwxyz]{8,})/i;
const REPEATED_CHARACTERS = /(.)\1{5,}/;
const REPEATED_WORDS = /\b(\w{3,})\b(?:\s+\1\b){3,}/i;

// 5. Profanity / Abuse
const ABUSE_PATTERNS: RegExp[] = [
  /\b(f+u+c+k+|b+i+t+c+h+|a+s+s+h+o+l+e+|b+a+s+t+a+r+d+|c+h+u+t+i+y+a+|b+h+e+n+c+h+o+d+|m+a+d+a+r+c+h+o+d+|g+a+a+n+d+u+|k+u+t+t+e+)\b/i,
];

/**
 * Validates community post title and content for spam, scams, gibberish, and abuse.
 */
export function validateCommunityContent(
  title: string,
  content: string
): ModerationResult {
  const cleanTitle = (title || "").trim();
  const cleanContent = (content || "").trim();

  // 1. Length constraints
  if (cleanTitle) {
    if (cleanTitle.length < 3) {
      return {
        isValid: false,
        flagType: "length",
        reason: "Discussion title must be at least 3 characters long.",
      };
    }
    if (cleanTitle.length > 120) {
      return {
        isValid: false,
        flagType: "length",
        reason: "Discussion title cannot exceed 120 characters.",
      };
    }
  }

  if (cleanContent.length < 5) {
    return {
      isValid: false,
      flagType: "length",
      reason: "Please provide a bit more detail in your discussion (at least 5 characters).",
    };
  }

  if (cleanContent.length > 8000) {
    return {
      isValid: false,
      flagType: "length",
      reason: "Discussion content exceeds the 8,000 character limit.",
    };
  }

  const combinedText = `${cleanTitle} ${cleanContent}`;

  // 2. Check for commercial spam & financial/betting scams
  for (const pattern of SPAM_SCAM_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        isValid: false,
        flagType: "scam",
        reason:
          "Your post contains prohibited promotional, betting, or scam-related content. TechnoCAT community is strictly for CAT & MBA preparation.",
      };
    }
  }

  // 3. Check for suspicious URL shorteners & telegram spam
  for (const pattern of SUSPICIOUS_LINK_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        isValid: false,
        flagType: "link_spam",
        reason:
          "Masked link shorteners and unauthorized invite links are not permitted. Please share direct educational references.",
      };
    }
  }

  // 4. Check for contact harvesting spam
  for (const pattern of CONTACT_HARVESTING_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        isValid: false,
        flagType: "spam",
        reason:
          "Posting personal phone numbers or soliciting off-platform payments is prohibited to protect student privacy.",
      };
    }
  }

  // 5. Check for toxicity and abuse
  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        isValid: false,
        flagType: "toxicity",
        reason:
          "Your post contains inappropriate or abusive language. Please adhere to respectful community guidelines.",
      };
    }
  }

  // 6. Check for gibberish & keyboard smashes in title
  if (cleanTitle) {
    if (GIBBERISH_CONSONANT_CLUSTER.test(cleanTitle)) {
      return {
        isValid: false,
        flagType: "gibberish",
        reason: "Discussion title appears to be random keystrokes or gibberish. Please provide a clear title.",
      };
    }
    if (REPEATED_CHARACTERS.test(cleanTitle)) {
      return {
        isValid: false,
        flagType: "gibberish",
        reason: "Please avoid repeating the same character continuously in the title.",
      };
    }
  }

  // 7. Check for gibberish in content
  if (GIBBERISH_CONSONANT_CLUSTER.test(cleanContent)) {
    return {
      isValid: false,
      flagType: "gibberish",
      reason: "Discussion content appears to contain random keyboard mash. Please share meaningful doubts or notes.",
    };
  }

  if (REPEATED_CHARACTERS.test(cleanContent)) {
    return {
      isValid: false,
      flagType: "gibberish",
      reason: "Please avoid repeating the same character continuously.",
    };
  }

  if (REPEATED_WORDS.test(cleanContent)) {
    return {
      isValid: false,
      flagType: "spam",
      reason: "Repetitive word spam detected. Please structure your discussion properly.",
    };
  }

  // 8. Symbol density check (e.g. 50% non-whitespace characters are symbols)
  const nonSpaceChars = combinedText.replace(/\s+/g, "");
  if (nonSpaceChars.length >= 20) {
    const symbolCount = nonSpaceChars.replace(/[\w\u0900-\u097F\u00A0-\uD7FF\uF900-\uFDCF]/g, "").length;
    if (symbolCount / nonSpaceChars.length > 0.45) {
      return {
        isValid: false,
        flagType: "gibberish",
        reason: "Content has excessive special characters or emojis. Please use standard text.",
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates comments and replies for spam, abuse, and safety.
 * Sensibly decoupled from post discussion constraints.
 */
export function validateCommentContent(content: string): ModerationResult {
  const clean = (content || "").trim();
  if (clean.length < 2) {
    return {
      isValid: false,
      flagType: "length",
      reason: "Comment cannot be empty.",
    };
  }

  if (clean.length > 3000) {
    return {
      isValid: false,
      flagType: "length",
      reason: "Comment is too long (maximum 3,000 characters).",
    };
  }

  // 1. Scams / Commercial gambling
  for (const pattern of SPAM_SCAM_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isValid: false,
        flagType: "scam",
        reason: "Comment contains prohibited promotional or scam-related content.",
      };
    }
  }

  // 2. Suspicious URL shorteners
  for (const pattern of SUSPICIOUS_LINK_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isValid: false,
        flagType: "link_spam",
        reason: "Masked links and suspicious invites are not permitted in comments.",
      };
    }
  }

  // 3. Contact harvesting
  for (const pattern of CONTACT_HARVESTING_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isValid: false,
        flagType: "spam",
        reason: "Posting personal phone numbers or payment links is not permitted.",
      };
    }
  }

  // 4. Abuse / Profanity
  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isValid: false,
        flagType: "toxicity",
        reason: "Comment contains inappropriate or abusive language.",
      };
    }
  }

  // 5. Gibberish / repeated characters
  if (clean.length >= 15 && GIBBERISH_CONSONANT_CLUSTER.test(clean)) {
    return {
      isValid: false,
      flagType: "gibberish",
      reason: "Comment appears to be random keyboard mash.",
    };
  }

  if (REPEATED_CHARACTERS.test(clean)) {
    return {
      isValid: false,
      flagType: "gibberish",
      reason: "Please avoid repeating the same character continuously.",
    };
  }

  if (REPEATED_WORDS.test(clean)) {
    return {
      isValid: false,
      flagType: "spam",
      reason: "Repetitive word spam detected in comment.",
    };
  }

  return { isValid: true };
}
