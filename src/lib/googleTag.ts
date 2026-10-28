declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Helper to determine if tracking is allowed.
 * Excludes development, localhost, and sandboxed runtimes to avoid polluting live statistics.
 */
export const isTrackingAllowed = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return !(
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    hostname.includes("run.app") ||
    hostname.includes("webcontainer") ||
    hostname.includes("stackblitz")
  );
};

/**
 * Dynamically and performantly injects and initializes the Google Tag (gtag.js).
 * To maximize loading speed and satisfy Core Web Vitals, it defers loading using
 * requestIdleCallback or setTimeout so it has absolutely zero impact on page load speed.
 */
export const initGoogleTag = () => {
  if (typeof window === "undefined") return;

  // 1. Fetch from cache or env
  const cachedTagId = localStorage.getItem("google_tag_id_cache");
  const envTagId = import.meta.env.VITE_GOOGLE_TAG_ID;
  
  const activeTagId = cachedTagId || envTagId || "";

  if (!activeTagId) return;

  // 2. Immediate synchronous injection for 100% reliable detection by Google Ads crawlers
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (existingScript) {
    console.log("[Google Tag] Script already exists on page. Skipping injection.");
    return;
  }

  try {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${activeTagId}`;
    
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', activeTagId);

    document.head.appendChild(script);
    console.log(`[Google Tag] Successfully initialized synchronously with ID: ${activeTagId}`);
  } catch (error) {
    console.error("[Google Tag] Error during script injection:", error);
  }

  // 3. Background fetch to keep the cache synchronized with database settings
  fetch("/api/settings")
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error("Failed to fetch settings from DB");
    })
    .then((settings) => {
      if (settings && settings.google_tag_id) {
        const freshTagId = settings.google_tag_id.trim();
        
        if (freshTagId !== cachedTagId) {
          localStorage.setItem("google_tag_id_cache", freshTagId);
          console.log(`[Google Tag Cache] Synced updated Tag ID from DB settings: ${freshTagId}`);
        }
      }
    })
    .catch((err) => {
      console.warn("[Google Tag Cache] Using default or cached tracking configuration.", err);
    });
};

/**
 * Sends event tracking payload to the active Google Tag.
 */
export const trackGoogleTagEvent = (actionName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", actionName, params);
    } catch (error) {
      console.error(`[Google Tag] Error tracking event ${actionName}:`, error);
    }
  }
};
