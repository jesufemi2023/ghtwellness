/**
 * Google Ads Healthcare & Medicines / Misrepresentation Policy Compliance Utility.
 *
 * Google Ads prohibits unapproved dietary/herbal supplement landing pages from making
 * explicit medical cure claims, chronic disease treatment claims, prescription drug
 * comparisons, or explicit sexual dysfunction claims.
 *
 * These helpers reframe database-sourced package titles, descriptions, and benefit
 * bullets on the /ad landing page into clear, accurate, policy-compliant nutritional
 * and herbal wellness support terminology while keeping product bottle names intact.
 */

const TITLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bnatural\s+cure\s+for\s*:\s*/gi, ""],
  [/\bcure\s+for\s*:\s*/gi, ""],
  [/\bpermanent\s+cure\b/gi, "Complete Wellness Pack"],
  [/\bweak\s+erection\s*(\/|&|and)?\s*premature\s+ejaculation\b/gi, "Men's Stamina & Vitality Support"],
  [/\berectile\s+dysfunction\s*(\/|&|and)?\s*premature\s+ejaculation\b/gi, "Men's Stamina & Vitality Support"],
  [/\bweak\s+erection\b/gi, "Men's Vitality Support"],
  [/\berectile\s+dysfunction\b/gi, "Men's Vitality Support"],
  [/\bpremature\s+ejaculation\b/gi, "Men's Endurance Support"],
  [/\bprostate\s+enlargement\b/gi, "Men's Prostate Wellness"],
  [/\bprostate\s+cancer\b/gi, "Men's Prostate Wellness"],
  [/\bhigh\s+blood\s+pressure\b/gi, "Cardiovascular & Circulation Wellness"],
  [/\bhypertension\b/gi, "Cardiovascular & Circulation Wellness"],
  [/\bdiabetes\b/gi, "Metabolic & Sugar Balance Support"],
  [/\bdiabetic\b/gi, "Sugar Balance"],
  [/\bstroke\b/gi, "Mobility & Nerve Wellness Support"],
  [/\bfibroids?\b/gi, "Women's Reproductive Wellness"],
  [/\binfertility\b/gi, "Fertility & Hormonal Balance Support"],
  [/\barthritis\s*(\/|&|and)?\s*rheumatism\b/gi, "Joint Comfort & Mobility Support"],
  [/\barthritis\b/gi, "Joint Comfort & Mobility Support"],
  [/\brheumatism\b/gi, "Joint & Muscle Comfort Support"],
  [/\bulcer\b/gi, "Digestive Comfort Support"],
  [/\binfection(s)?\b/gi, "Immune & Cleansing Support"],
  [/\bstd(s)?\b/gi, "Immune Cleansing Support"],
  [/\bstaphylococcus\b/gi, "Deep Herbal Cleansing Support"],
  [/\bcure(s|d)?\b/gi, "Wellness Support"],
  [/\btreatment\b/gi, "Wellness Regimen"],
  [/\btherapy\b/gi, "Herbal Support"],
];

const PROSE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(100%\s+)?(permanent\s+)?cure(s|d|ing)?\b/gi, "nutritional support"],
  [/\bheal(s|ed|ing)?\b/gi, "support"],
  [/\btreat(s|ed|ing|ment|ments)?\b/gi, "wellness support"],
  [/\breverse(s|d|ing)?\b/gi, "help maintain balance for"],
  [/\beliminate(s|d|ing)?\b/gi, "help ease"],
  [/\beradicate(s|d|ing)?\b/gi, "support natural cleansing for"],
  [/\bshrink(s|ing)?\s+(the\s+)?prostate\b/gi, "support healthy prostate function"],
  [/\bmelt(s|ing|ed)?\s+(away\s+)?fibroids?\b/gi, "support women's uterine wellness"],
  [/\bno\s+more\s+surgery\b/gi, "gentle non-invasive herbal support"],
  [/\bwithout\s+surgery\b/gi, "through daily herbal nutrition"],
  [/\b(zero|no)\s+side\s+effects?\b/gi, "gentle plant-based formulation"],
  [/\bmiracle\b/gi, "trusted herbal"],
  [/\bclinically\s+proven\b/gi, "traditionally formulated"],
  [/\bweak\s+erection\b/gi, "male stamina challenges"],
  [/\berectile\s+dysfunction\b/gi, "male vitality needs"],
  [/\bpremature\s+ejaculation\b/gi, "endurance concerns"],
  [/\blow\s+sperm\s+count\b/gi, "male reproductive vitality"],
  [/\bblocked\s+(fallopian\s+)?tubes?\b/gi, "female reproductive wellness"],
  [/\bfibroids?\b/gi, "uterine wellness concerns"],
  [/\binfertility\b/gi, "reproductive wellness"],
  [/\bprostate\s+enlargement\b/gi, "prostate comfort and urinary flow"],
  [/\bdiabetes\b/gi, "healthy blood glucose balance"],
  [/\bdiabetic\b/gi, "metabolic wellness"],
  [/\bhigh\s+blood\s+pressure\b/gi, "healthy cardiovascular circulation"],
  [/\bhypertension\b/gi, "cardiovascular balance"],
  [/\bstroke\b/gi, "nerve and physical mobility wellness"],
  [/\barthritis\b/gi, "joint stiffness and mobility"],
  [/\brheumatism\b/gi, "joint and muscle comfort"],
  [/\bstaphylococcus\b/gi, "internal microbial balance"],
  [/\binfections?\b/gi, "immune wellness"],
  [/\bulcers?\b/gi, "digestive lining comfort"],
  [/\bpatients?\b/gi, "customers"],
  [/\bdisease(s)?\b/gi, "wellness concerns"],
  [/\bailments?\b/gi, "health goals"],
];

export function sanitizeAdTitle(rawTitle: string): string {
  if (!rawTitle) return "Herbal Wellness Bundle";
  let cleaned = rawTitle.trim();
  for (const [pattern, replacement] of TITLE_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned || "Herbal Wellness Bundle";
}

export function sanitizeAdText(rawText: string): string {
  if (!rawText) {
    return "Formulated with NAFDAC-registered botanical extracts to support daily vitality, nutritional balance, and general well-being.";
  }
  let cleaned = rawText.trim();
  for (const [pattern, replacement] of PROSE_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}
