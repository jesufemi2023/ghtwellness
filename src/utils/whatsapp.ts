import { CONFIG } from "../config";

/**
 * Cleans any phone number to ensure it is in the exact international format required by WhatsApp,
 * with no leading zero after the country code, no spaces, no symbols, and with the proper country code.
 * Optimized specifically for Nigerian numbers (+234) and standard international formatting.
 */
export const cleanWhatsAppNumber = (phoneNumber?: string): string => {
  const fallbackRaw = CONFIG?.whatsapp?.number || "2347060734773";
  const source = (phoneNumber || fallbackRaw).trim();

  // If multiple numbers were accidentally entered (comma/slash/pipe separated), take the primary one
  const primarySegment = source.split(/[,/|]/)[0] || source;

  // 1. Remove all non-digits (strips +, spaces, quotes, hyphens, parentheses, invisible chars)
  let digits = primarySegment.replace(/\D/g, "");

  // If number is a placeholder or too short, fallback to configured business number
  if (!digits || digits.includes("123456789") || digits.length < 8) {
    const cleanFallback = fallbackRaw.split(/[,/|]/)[0].replace(/\D/g, "");
    digits = cleanFallback && cleanFallback.length >= 8 ? cleanFallback : "2347060734773";
  }

  // 2. Handle Nigerian number edge cases
  // Remove leading international '00' prefix if entered as 00234...
  if (digits.startsWith("00")) {
    digits = digits.substring(2);
  }

  // Common mistake: "+234 (0) 904 775 2410" -> "23409047752410"
  if (digits.startsWith("2340") && digits.length === 14) {
    digits = "234" + digits.substring(4);
  } else if (digits.startsWith("2340")) {
    digits = "234" + digits.substring(4);
  }
  // Local Nigerian 11-digit number like "09047752410" -> "2349047752410"
  else if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.substring(1);
  }
  // Local Nigerian 10-digit number without leading 0 like "9047752410" -> "2349047752410"
  else if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = "234" + digits;
  }

  return digits;
};

/**
 * Strict RFC 3986 percent-encoding so characters like apostrophes ('), parentheses (),
 * and exclamation marks (!) never corrupt mobile iOS/Android WhatsApp deep-link parsers.
 */
export const encodeWhatsAppText = (message?: string): string => {
  if (!message) return "";
  return encodeURIComponent(message).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
};

/**
 * Builds the canonical api.whatsapp.com Click-to-Chat URL (matching the exact endpoint
 * used by Desktop/Laptop redirects) to avoid iOS 17/18 & mobile WebView `wa.me` Universal Link bugs.
 */
export const buildWhatsAppUrl = (phoneNumber?: string, message?: string): string => {
  const cleanPhone = cleanWhatsAppNumber(phoneNumber || CONFIG?.whatsapp?.number);
  const encodedText = encodeWhatsAppText(message);
  if (!encodedText) {
    return `https://api.whatsapp.com/send/?phone=${cleanPhone}&type=phone_number&app_absent=0`;
  }
  return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}&type=phone_number&app_absent=0`;
};

/**
 * Programmatic WhatsApp navigation helper for dynamic forms/modals where a static <a> tag isn't used.
 * Avoids window.open and uses direct location navigation on mobile browsers outside iframes.
 */
export const openWhatsAppLink = (phoneNumber: string, message: string) => {
  if (typeof window === "undefined") return;

  const url = buildWhatsAppUrl(phoneNumber, message);
  const inIframe = window.self !== window.top;
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isMobile && !inIframe) {
    window.location.assign(url);
    return;
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      try {
        document.body.removeChild(anchor);
      } catch {
        // Ignored
      }
    }, 200);
  } catch {
    window.location.assign(url);
  }
};
