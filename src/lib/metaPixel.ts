declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

/**
 * Dynamically injects and initializes the Meta Pixel script
 * only if VITE_META_PIXEL_ID is configured in environment variables.
 */
export const initMetaPixel = () => {
  if (typeof window === "undefined") return;

  if (!PIXEL_ID) {
    console.warn("Meta Pixel ID (VITE_META_PIXEL_ID) not found. Facebook Pixel tracking is disabled.");
    return;
  }

  if (window.fbq) {
    console.log("Meta Pixel is already initialized.");
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

    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    console.log("Meta Pixel initialized successfully with ID:", PIXEL_ID);
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
