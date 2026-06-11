declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

/**
 * Dynamically injects and initializes the Meta Pixel script.
 * Looks for configured Pixel ID in:
 * 1. Database app settings ('meta_pixel_id')
 * 2. Environment variables ('VITE_META_PIXEL_ID')
 * 3. Standard fallback ID ('4024543217840998')
 */
export const initMetaPixel = async () => {
  if (typeof window === "undefined") return;

  let activePixelId = import.meta.env.VITE_META_PIXEL_ID || '4024543217840998';

  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const settings = await res.json();
      if (settings && settings.meta_pixel_id) {
        activePixelId = settings.meta_pixel_id.trim();
        console.log("Using dynamically configured database Meta Pixel ID:", activePixelId);
      }
    }
  } catch (err) {
    console.warn("Could not retrieve dynamic database settings for Meta Pixel, falling back to static/default ID:", err);
  }

  if (!activePixelId) {
    console.warn("Meta Pixel ID not found. Facebook Pixel tracking is disabled.");
    return;
  }

  if (window.fbq) {
    console.log("Meta Pixel was already initialized.");
    return;
  }

  try {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', activePixelId);
    window.fbq('track', 'PageView');
    console.log("Meta Pixel initialized successfully with ID:", activePixelId);
  } catch (error) {
    console.error("Error during Meta Pixel script injection:", error);
  }
};

/**
 * Tracks standard Page View event.
 */
export const trackPixelPageView = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

/**
 * Tracks custom or standard Meta Pixel events.
 * 
 * @param eventName Standard Meta Pixel event name (e.g. Purchase, InitiateCheckout, Lead, ViewContent)
 * @param data Optional event properties
 */
export const trackPixelEvent = (eventName: string, data?: any) => {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      if (data) {
        window.fbq('track', eventName, data);
      } else {
        window.fbq('track', eventName);
      }
    } catch (error) {
      console.error(`Error tracking Meta Pixel event ${eventName}:`, error);
    }
  }
};

/**
 * Standard product view content
 */
export const trackPixelViewContent = (name: string, type: string, value?: number) => {
  trackPixelEvent('ViewContent', {
    content_name: name,
    content_category: type,
    value: value || 0,
    currency: 'NGN'
  });
};

/**
 * Standard Checkout Start Event
 */
export const trackPixelInitiateCheckout = (itemName: string, type: string) => {
  trackPixelEvent('InitiateCheckout', {
    content_name: itemName,
    content_category: type,
    currency: 'NGN'
  });
};

/**
 * Standard Completed Purchase Event
 */
export const trackPixelPurchase = (itemName: string, amount: number) => {
  trackPixelEvent('Purchase', {
    content_name: itemName,
    value: amount,
    currency: 'NGN'
  });
};

/**
 * Standard Lead Event (for consultation requests)
 */
export const trackPixelLead = (illness: string) => {
  trackPixelEvent('Lead', {
    content_category: 'Consultation',
    content_name: illness
  });
};
