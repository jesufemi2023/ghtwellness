import { CONFIG } from "../config";

/**
 * Cleans any phone number to ensure it is in the exact international format required by WhatsApp,
 * with no leading zero after the country code, no spaces, no symbols, and with the proper country code.
 * Optimized specifically for Nigerian numbers (+234) and standard international formatting.
 */
export const cleanWhatsAppNumber = (phoneNumber?: string): string => {
  if (!phoneNumber) return "2347060734773";
  
  // 1. Remove all non-digits
  let digits = phoneNumber.replace(/\D/g, "");

  // If number is a placeholder or too short, fallback to business number
  if (!digits || digits.includes("123456789") || digits.length < 8) {
    return CONFIG?.whatsapp?.number ? CONFIG.whatsapp.number.replace(/\D/g, "") : "2347060734773";
  }

  // 2. Handle Nigerian number edge cases
  // Nigeria country code: 234. Local numbers always start with 0 (e.g. 07060734773).
  // A very common mistake is entering "+234 (0) 706 073 4773" or "23407060734773".
  // WhatsApp will fail with "link could not be opened" if there is a '0' right after '234'.
  if (digits.startsWith("2340")) {
    digits = "234" + digits.substring(4);
  }
  // If user entered a local Nigerian number like "07060734773" (11 digits, starts with 0)
  else if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.substring(1);
  }
  // If user entered local number without leading 0 or country code (10 digits, starts with 7, 8, or 9)
  else if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = "234" + digits;
  }

  return digits;
};

/**
 * Opens a WhatsApp link in a way that is highly compatible with all browsers and devices,
 * especially iOS (iPhone Safari), and handles iframe constraints seamlessly.
 * 
 * Key optimizations for iPhone/iOS:
 * 1. Uses 'https://wa.me' with cleaned E.164 phone numbers to guarantee native
 *    iOS Universal Links registration and direct WhatsApp app opening.
 * 2. Protects against placeholder/dummy numbers that trigger the iOS WhatsApp error
 *    "This link could not be opened. Check the link and try again."
 * 3. Handles iframe contexts and popup blocker bypassing.
 */
export const openWhatsAppLink = (phoneNumber: string, message: string) => {
  if (typeof window === "undefined") return;

  // Clean the phone number (using robust international cleaning rules + fallback)
  const cleanPhone = cleanWhatsAppNumber(phoneNumber || CONFIG?.whatsapp?.number);
  
  // Use wa.me for modern, reliable WhatsApp Click-to-Chat that handles Universal Links perfectly on iOS
  const encodedText = encodeURIComponent(message || "");
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  console.log(`[WhatsApp Utility] Initiating redirection for cleaned number ${cleanPhone}: ${url}`);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // If running inside an iframe
  const inIframe = window.self !== window.top;

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    // For iOS outside iframe, target="_blank" triggers the Universal Link prompt cleanly
    anchor.target = inIframe ? "_top" : "_blank";
    anchor.rel = "noopener noreferrer";
    
    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    
    setTimeout(() => {
      try {
        document.body.removeChild(anchor);
      } catch (e) {
        // Ignored
      }
    }, 200);
  } catch (error) {
    console.error("[WhatsApp Utility] Anchor click failed, falling back:", error);
    try {
      if (inIframe) {
        window.top!.location.href = url;
      } else if (isIOS) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e2) {
      window.location.href = url;
    }
  }
};
