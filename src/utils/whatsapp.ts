/**
 * Cleans any phone number to ensure it is in the exact international format required by WhatsApp,
 * with no leading zero after the country code, no spaces, no symbols, and with the proper country code.
 * Optimized specifically for Nigerian numbers (+234) and standard international formatting.
 */
export const cleanWhatsAppNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  
  // 1. Remove all non-digits
  let digits = phoneNumber.replace(/\D/g, "");

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
 * 1. Uses 'https://wa.me' instead of legacy formats to guarantee immediate, native
 *    iOS Universal Links registration and trigger direct WhatsApp app opening.
 * 2. Cleans Nigerian formatting anomalies (such as invalid '2340...' codes) which cause
 *    strict iOS WhatsApp app validation to throw "link could not be opened" errors.
 * 3. Escapes iframe contexts and bypasses Safari's strict popup blocker using a dynamic anchor click.
 */
export const openWhatsAppLink = (phoneNumber: string, message: string) => {
  if (typeof window === "undefined") return;

  // Clean the phone number (using robust international cleaning rules)
  const cleanPhone = cleanWhatsAppNumber(phoneNumber);
  
  // Use wa.me for modern, reliable WhatsApp Click-to-Chat that handles Universal Links perfectly on iOS
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  console.log(`[WhatsApp Utility] Initiating redirection for cleaned number ${cleanPhone}: ${url}`);

  // To support both standard mobile browsing and iframe-embedded previews (e.g., iPhone inside the AI Studio preview),
  // we MUST open in a new tab/window using a dynamically created anchor element with target="_blank".
  // Setting window.location.href inside an iframe fails because api.whatsapp.com prevents embedding via X-Frame-Options.
  // Using a dynamic anchor with target="_blank" bypasses popup blockers (when triggered by click) and escapes the iframe context.
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    
    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    
    // Small delay to ensure browser processed the click before cleaning up the element
    setTimeout(() => {
      try {
        document.body.removeChild(anchor);
      } catch (e) {
        // Ignored if already removed or not found
      }
    }, 100);
  } catch (error) {
    console.error("[WhatsApp Utility] Anchor click failed, falling back to window.open:", error);
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e2) {
      // Direct window location fallback
      window.location.href = url;
    }
  }
};
