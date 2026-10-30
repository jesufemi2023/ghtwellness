import { useState, useEffect } from "react";
import { CONFIG } from "../config";

const WHATSAPP_CACHE_KEY = "whatsapp_target_cache";
const CONTACT_PHONE_CACHE_KEY = "contact_phone_cache";
const WHATSAPP_UPDATED_EVENT = "ght:whatsapp-updated";

declare global {
  interface Window {
    __ghtWhatsAppTarget?: string;
    __ghtContactPhone?: string;
  }
}

/**
 * Reads any runtime WhatsApp override configured in Admin -> Settings,
 * falling back to CONFIG.whatsapp.number (VITE_WHATSAPP_NUMBER).
 */
export const getActiveWhatsAppTarget = (): string => {
  if (typeof window !== "undefined") {
    const runtimeTarget =
      window.__ghtWhatsAppTarget ?? localStorage.getItem(WHATSAPP_CACHE_KEY) ?? "";
    if (runtimeTarget.trim().length > 0) {
      return runtimeTarget.trim();
    }
  }
  return CONFIG?.whatsapp?.number || "2347060734773";
};

/**
 * Reads any runtime Contact Phone override configured in Admin -> Settings,
 * falling back to CONFIG.company.phone (VITE_CONTACT_PHONE).
 */
export const getActiveContactPhone = (): string => {
  if (typeof window !== "undefined") {
    const runtimePhone =
      window.__ghtContactPhone ?? localStorage.getItem(CONTACT_PHONE_CACHE_KEY) ?? "";
    if (runtimePhone.trim().length > 0) {
      return runtimePhone.trim();
    }
  }
  return CONFIG?.company?.phone || "+234 706 073 4773";
};

/**
 * Persists runtime WhatsApp & Contact Phone settings locally and notifies open components.
 */
export const updateCachedWhatsAppSettings = (
  whatsappTarget?: string,
  contactPhone?: string
): void => {
  if (typeof window === "undefined") return;

  const cleanWa = (whatsappTarget || "").trim();
  const cleanPhone = (contactPhone || "").trim();

  window.__ghtWhatsAppTarget = cleanWa;
  window.__ghtContactPhone = cleanPhone;

  try {
    if (cleanWa) {
      localStorage.setItem(WHATSAPP_CACHE_KEY, cleanWa);
    } else {
      localStorage.removeItem(WHATSAPP_CACHE_KEY);
    }

    if (cleanPhone) {
      localStorage.setItem(CONTACT_PHONE_CACHE_KEY, cleanPhone);
    } else {
      localStorage.removeItem(CONTACT_PHONE_CACHE_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }

  window.dispatchEvent(new Event(WHATSAPP_UPDATED_EVENT));
};

/**
 * Synchronizes runtime WhatsApp & Contact Phone overrides from /api/settings on startup
 * so updates saved in Admin -> Settings apply immediately on all phones without Vercel redeploys.
 */
export const initWhatsAppSettings = (): void => {
  if (typeof window === "undefined") return;

  try {
    const cachedWa = localStorage.getItem(WHATSAPP_CACHE_KEY);
    const cachedPhone = localStorage.getItem(CONTACT_PHONE_CACHE_KEY);
    if (cachedWa) window.__ghtWhatsAppTarget = cachedWa.trim();
    if (cachedPhone) window.__ghtContactPhone = cachedPhone.trim();
  } catch {
    // Ignore storage read restrictions
  }

  fetch("/api/settings")
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error("Failed to fetch settings");
    })
    .then((settings) => {
      if (!settings || typeof settings !== "object") return;
      const remoteWa =
        typeof settings.whatsapp_number === "string" ? settings.whatsapp_number.trim() : "";
      const remotePhone =
        typeof settings.contact_phone === "string" ? settings.contact_phone.trim() : "";

      const prevWa = window.__ghtWhatsAppTarget || "";
      const prevPhone = window.__ghtContactPhone || "";

      if (remoteWa !== prevWa || remotePhone !== prevPhone) {
        updateCachedWhatsAppSettings(remoteWa, remotePhone);
      }
    })
    .catch(() => {
      // Quietly continue using env or cached configuration
    });
};

/**
 * React hook that subscribes components rendering <a href="..."> links to live Admin WhatsApp updates.
 */
export const useCompanyWhatsApp = () => {
  const [state, setState] = useState(() => ({
    whatsappTarget: getActiveWhatsAppTarget(),
    contactPhone: getActiveContactPhone(),
  }));

  useEffect(() => {
    const handleUpdate = () => {
      setState({
        whatsappTarget: getActiveWhatsAppTarget(),
        contactPhone: getActiveContactPhone(),
      });
    };

    window.addEventListener(WHATSAPP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(WHATSAPP_UPDATED_EVENT, handleUpdate);
  }, []);

  return state;
};

/**
 * Detects if the configured target is already a direct WhatsApp Business Short Link
 * (e.g., https://wa.me/message/XXXXXXX or https://wa.link/XXXXXXX) rather than a raw phone number.
 */
const extractDirectWhatsAppShortLink = (rawInput: string): string | null => {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Match wa.me/message/CODE, api.whatsapp.com/message/CODE, or wa.link/CODE
  if (
    /^(https?:\/\/)?(www\.)?(wa\.me\/message\/|api\.whatsapp\.com\/message\/|wa\.link\/)/i.test(
      trimmed
    )
  ) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  return null;
};

/**
 * Cleans any phone number to ensure it is in the exact E.164 digits-only format required by WhatsApp
 * (no +, no leading zero after country code, no spaces, no symbols).
 * Optimized specifically for Nigerian numbers (+234) and international formatting.
 */
export const cleanWhatsAppNumber = (phoneNumber?: string): string => {
  const fallbackRaw = getActiveWhatsAppTarget();
  let source = (phoneNumber || fallbackRaw).trim();

  // If someone pasted a full numeric wa.me URL like "https://wa.me/2349047752410", extract path/query
  const waNumericMatch = source.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=)([+\d\s()-]+)/i
  );
  if (waNumericMatch && waNumericMatch[1]) {
    source = waNumericMatch[1];
  }

  // If multiple numbers were accidentally entered (comma/slash/pipe separated), take the primary one
  const primarySegment = source.split(/[,/|]/)[0] || source;

  // 1. Remove all non-digits (strips +, spaces, quotes, hyphens, parentheses, zero-width chars)
  let digits = primarySegment.replace(/\D/g, "");

  // If number is a placeholder or too short, fallback to configured business number
  if (!digits || digits.includes("123456789") || digits.length < 8) {
    const cleanFallback = fallbackRaw.split(/[,/|]/)[0].replace(/\D/g, "");
    digits = cleanFallback && cleanFallback.length >= 8 ? cleanFallback : "2347060734773";
  }

  // 2. Handle Nigerian & international prefix edge cases
  // Remove leading international '00' prefix if entered as 00234...
  if (digits.startsWith("00")) {
    digits = digits.substring(2);
  }

  // Common mistake: "+234 (0) 904 775 2410" -> "23409047752410"
  if (digits.startsWith("2340")) {
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
 * Resolves whether the caller is targeting the company WhatsApp line (allowing live Admin override)
 * or a specific customer's phone number (e.g., from Orders/Consultations admin view).
 */
const resolveTargetInput = (phoneNumber?: string): string => {
  if (!phoneNumber || phoneNumber === CONFIG?.whatsapp?.number) {
    return getActiveWhatsAppTarget();
  }
  return phoneNumber;
};

/**
 * Builds the official universal WhatsApp Click-to-Chat URL (`https://wa.me/<digits>?text=...`)
 * or preserves a direct WhatsApp Business Short Link (`https://wa.me/message/...`) if configured.
 */
export const buildWhatsAppUrl = (phoneNumber?: string, message?: string): string => {
  const resolvedInput = resolveTargetInput(phoneNumber);

  // Support official WhatsApp Business account-token short links (e.g. https://wa.me/message/XXXX)
  const directShortLink = extractDirectWhatsAppShortLink(resolvedInput);
  if (directShortLink) {
    return directShortLink;
  }

  const cleanPhone = cleanWhatsAppNumber(resolvedInput);
  const encodedText = encodeWhatsAppText(message);
  if (!encodedText) {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
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
