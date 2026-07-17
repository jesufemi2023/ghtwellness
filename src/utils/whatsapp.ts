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

  console.log(`[WhatsApp Utility] Redirecting to: ${url}`);

  // Detect iOS / Android mobile devices
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Direct location change is 100% reliable on mobile and does not trigger popup blockers.
    // It also smoothly launches the native WhatsApp application.
    window.location.href = url;
  } else {
    // On desktop, try window.open first
    try {
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      
      // If blocked or returns null (due to popup blockers or iframe restrictions), fall back to anchor click
      if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch (e) {
      // Fallback if window.open throws security error
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }
};
