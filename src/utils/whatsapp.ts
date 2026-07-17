/**
 * Opens a WhatsApp link in a way that is highly compatible with all browsers and devices,
 * especially iOS (iPhone Safari), and handles iframe constraints seamlessly.
 * 
 * Key optimizations for iPhone/iOS:
 * 1. Uses 'https://api.whatsapp.com/send' instead of 'wa.me' as it bypasses redirects
 *    and triggers iOS Universal Links natively.
 * 2. On mobile/iOS, uses direct window.location.href instead of window.open to bypass
 *    Safari's strict popup blocker (especially inside webviews or after tracking handlers).
 * 3. Falls back to a dynamically generated synchronous anchor click if window.open fails.
 */
export const openWhatsAppLink = (phoneNumber: string, message: string) => {
  if (typeof window === "undefined") return;

  // Clean the phone number (remove any non-digits)
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  
  // Use api.whatsapp.com/send for maximum reliability on iOS and inside iframes
  const encodedText = encodeURIComponent(message);
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

  console.log(`[WhatsApp Utility] Initiating redirection: ${url}`);

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
