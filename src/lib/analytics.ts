import ReactGA from "react-ga4";
import { 
  initMetaPixel, 
  trackPixelPageView, 
  trackPixelInitiateCheckout, 
  trackPixelPurchase, 
  trackPixelLead,
  trackPixelEvent
} from "./metaPixel";
import {
  initGoogleTag,
  trackGoogleTagEvent
} from "./googleTag";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  // Initialize Google Analytics
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
    console.log("GA Initialized with ID:", MEASUREMENT_ID);
  } else {
    console.warn("GA Measurement ID not found. Analytics disabled.");
  }

  // Initialize Meta Pixel
  initMetaPixel();

  // Initialize Google Tag (gtag.js)
  initGoogleTag();
};

export const trackPageView = (path: string, title?: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path, title: title || path });
  }
  trackPixelPageView();
  // Also log page view event to Google Tag if dynamic router updates
  trackGoogleTagEvent("page_view", { page_path: path, page_title: title || path });
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
  trackPixelEvent(action, { category, label, value });
  trackGoogleTagEvent(action, { category, label, value });
};

// Specific events for the app
export const trackOrderStart = (itemName: string, type: string) => {
  trackEvent("Ecommerce", "Order Start", `${type}: ${itemName}`);
  trackPixelInitiateCheckout(itemName, type);
  trackGoogleTagEvent("begin_checkout", {
    items: [{ item_name: itemName, item_category: type }],
    value: 0,
    currency: "NGN"
  });
};

export const trackOrderComplete = (itemName: string, amount: number) => {
  trackEvent("Ecommerce", "Order Complete", itemName, amount);
  trackPixelPurchase(itemName, amount);
  trackGoogleTagEvent("purchase", {
    transaction_id: `T_${Date.now()}`,
    value: amount,
    currency: "NGN",
    items: [{ item_name: itemName, price: amount }]
  });
};

export const trackConsultation = (illness: string) => {
  trackEvent("Engagement", "Consultation Submitted", illness);
  trackPixelLead(illness);
  trackGoogleTagEvent("generate_lead", {
    lead_type: "Consultation",
    illness_category: illness
  });
};

export const trackWhatsAppClick = (location: string) => {
  trackEvent("Engagement", "WhatsApp Click", location);
  trackPixelEvent("WhatsApp Contact", { location });
  trackGoogleTagEvent("contact", {
    method: "WhatsApp",
    location: location
  });
};

export const trackBlogView = (title: string) => {
  trackEvent("Content", "Blog View", title);
  trackPixelEvent("ViewContent", { content_type: "blog", content_name: title });
  trackGoogleTagEvent("view_item", {
    content_type: "blog",
    item_name: title
  });
};

