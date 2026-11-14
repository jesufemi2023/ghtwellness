export const DEFAULT_GOOGLE_TAG_ID = "AW-18237021036";
export const DEFAULT_GOOGLE_CONVERSION_LABEL = "ew85CImHpLgdEOy2i_hD";
export const DEFAULT_SEND_TO = `${DEFAULT_GOOGLE_TAG_ID}/${DEFAULT_GOOGLE_CONVERSION_LABEL}`;

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    __ghtActiveTagId?: string;
    __ghtConversionLabel?: string;
  }
}

const isValidTagId = (id?: string | null): id is string => {
  if (!id) return false;
  const trimmed = id.trim();
  return (
    trimmed.length > 4 &&
    trimmed !== "YOUR_GOOGLE_TAG_ID_HERE" &&
    trimmed !== "G-XXXXXXXXXX" &&
    (trimmed.startsWith("AW-") || trimmed.startsWith("G-") || trimmed.startsWith("GT-"))
  );
};

/**
 * Ensures dataLayer and gtag queue exist immediately so events fired before
 * async script download completes are buffered and never dropped.
 */
export const ensureGtagStub = () => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
  }
};

/**
 * Injects the Google Tag (gtag.js) script for a given Tag ID if not already loaded.
 */
export const injectGoogleTagScript = (tagId: string = DEFAULT_GOOGLE_TAG_ID) => {
  if (typeof window === "undefined" || !isValidTagId(tagId)) return;

  ensureGtagStub();
  window.__ghtActiveTagId = tagId;

  const existingScript = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}"]`
  );

  if (!existingScript) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
      document.head.appendChild(script);
    } catch (error) {
      console.error("[Google Tag] Error during script injection:", error);
    }
  }

  window.gtag("config", tagId, {
    send_page_view: true,
  });
};

/**
 * Initializes Google Tag (gtag.js) on initial page load AND synchronizes
 * with /api/settings so first-time visitors and Google Ads verification bots
 * immediately load the configured AW-/G-/GT- tag without requiring a second page load.
 */
export const initGoogleTag = () => {
  if (typeof window === "undefined") return;

  ensureGtagStub();

  const cachedTagId = localStorage.getItem("google_tag_id_cache");
  const cachedConvLabel = localStorage.getItem("google_conversion_label_cache");
  const envTagId = import.meta.env.VITE_GOOGLE_TAG_ID;
  const envConvLabel = import.meta.env.VITE_GOOGLE_CONVERSION_LABEL;

  const resolvedConvLabel = (cachedConvLabel || envConvLabel || DEFAULT_GOOGLE_CONVERSION_LABEL).trim();
  window.__ghtConversionLabel = resolvedConvLabel;

  const resolvedTagId = isValidTagId(cachedTagId)
    ? cachedTagId.trim()
    : isValidTagId(envTagId)
      ? envTagId.trim()
      : DEFAULT_GOOGLE_TAG_ID;

  window.__ghtActiveTagId = resolvedTagId;
  injectGoogleTagScript(resolvedTagId);

  // Synchronize with /api/settings so database-configured tag updates immediately
  fetch("/api/settings")
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error("Failed to fetch settings");
    })
    .then((settings) => {
      if (!settings) return;

      if (settings.google_conversion_label) {
        const label = String(settings.google_conversion_label).trim();
        window.__ghtConversionLabel = label;
        localStorage.setItem("google_conversion_label_cache", label);
      }

      if (isValidTagId(settings.google_tag_id)) {
        const freshTagId = String(settings.google_tag_id).trim();
        localStorage.setItem("google_tag_id_cache", freshTagId);

        if (freshTagId !== window.__ghtActiveTagId) {
          injectGoogleTagScript(freshTagId);
        }
      }
    })
    .catch(() => {
      // Quietly continue with default configuration
    });
};

/**
 * Sends event tracking payload to the active Google Tag.
 */
export const trackGoogleTagEvent = (actionName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    ensureGtagStub();
    try {
      window.gtag("event", actionName, params);
    } catch (error) {
      console.error(`[Google Tag] Error tracking event ${actionName}:`, error);
    }
  }
};

/**
 * Fires Google Ads conversion event with exact send_to parameter,
 * actual order amount in Naira (NGN), and unique transaction ID.
 */
export const trackGoogleAdsConversion = (value: number, transactionId?: string) => {
  if (typeof window === "undefined") return;
  ensureGtagStub();

  const tagId = (
    window.__ghtActiveTagId ||
    import.meta.env.VITE_GOOGLE_TAG_ID ||
    DEFAULT_GOOGLE_TAG_ID
  ).trim();

  const rawConvLabel = (
    window.__ghtConversionLabel ||
    import.meta.env.VITE_GOOGLE_CONVERSION_LABEL ||
    DEFAULT_GOOGLE_CONVERSION_LABEL
  ).trim();

  const sendTo = rawConvLabel.includes("/")
    ? rawConvLabel
    : `${tagId}/${rawConvLabel}`;

  const txId =
    transactionId && transactionId.trim()
      ? transactionId.trim()
      : `TX_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const numericValue = typeof value === "number" && !isNaN(value) && value >= 0 ? value : 0;

  try {
    window.gtag("event", "conversion", {
      send_to: sendTo,
      value: numericValue,
      currency: "NGN",
      transaction_id: txId,
    });
    console.log(
      `[Google Tag] Fired conversion: send_to=${sendTo}, value=${numericValue} NGN, transaction_id=${txId}`
    );
  } catch (error) {
    console.error("[Google Tag] Error tracking conversion:", error);
  }
};
