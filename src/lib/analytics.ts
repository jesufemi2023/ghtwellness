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
  trackGoogleTagEvent,
  trackGoogleAdsConversion
} from "./googleTag";
import { initWhatsAppSettings } from "../utils/whatsapp";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  // Synchronize live WhatsApp & Contact Phone settings from /api/settings
  initWhatsAppSettings();

  // Initialize Google Analytics
  if (MEASUREMENT_ID && MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    ReactGA.initialize(MEASUREMENT_ID);
  }

  // Initialize Meta Pixel
  initMetaPixel();

  // Initialize Google Tag (gtag.js)
  initGoogleTag();
};

export const trackPageView = (path: string, title?: string) => {
  if (MEASUREMENT_ID && MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    ReactGA.send({ hitType: "pageview", page: path, title: title || path });
  }
  trackPixelPageView();
  // Also log page view event to Google Tag if dynamic router updates
  trackGoogleTagEvent("page_view", { page_path: path, page_title: title || path });
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (MEASUREMENT_ID && MEASUREMENT_ID !== "G-XXXXXXXXXX") {
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
export const trackOrderStart = (itemName: string, type: string, amount: number = 0) => {
  trackEvent("Ecommerce", "Order Start", `${type}: ${itemName}`, amount);
  trackPixelInitiateCheckout(itemName, type);
  trackGoogleTagEvent("begin_checkout", {
    items: [{ item_name: itemName, item_category: type, price: amount }],
    value: amount,
    currency: "NGN"
  });
};

export const trackAdBundleSelect = (bundleName: string, optionLabel: string, price: number) => {
  trackEvent("Ad_Funnel", "Select Bundle Course", `${bundleName} - ${optionLabel}`, price);
  trackGoogleTagEvent("select_item", {
    item_list_name: "Ad Landing Bundles",
    items: [{ item_name: bundleName, item_variant: optionLabel, price }],
    value: price,
    currency: "NGN"
  });
};

export const trackOrderComplete = (itemName: string, amount: number) => {
  const txId = `T_${Date.now()}`;
  trackEvent("Ecommerce", "Order Complete", itemName, amount);
  trackPixelPurchase(itemName, amount);
  trackGoogleTagEvent("purchase", {
    transaction_id: txId,
    value: amount,
    currency: "NGN",
    items: [{ item_name: itemName, price: amount }]
  });
  trackGoogleAdsConversion(amount, txId);
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

