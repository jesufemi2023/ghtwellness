import { PackageData } from '../types';

export type SymptomCategory =
  | 'all'
  | 'prostate'
  | 'joints'
  | 'vitality'
  | 'sugar'
  | 'cardio'
  | 'womens';

export interface AdAttributionData {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  gad_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  matched_condition?: string;
  landing_path?: string;
  captured_at?: string;
}

export interface AdIntentConfig {
  category: SymptomCategory;
  kicker: string;
  headline: string;
  subheadline: string;
  pageTitle: string;
  metaDescription: string;
  ctaLabel: string;
  matchedKeyword?: string;
  requestedPackageCode?: string;
}

const ATTRIBUTION_STORAGE_KEY = 'ght_ad_attribution_v1';

export function captureAndPersistAdAttribution(): AdAttributionData {
  if (typeof window === 'undefined') return {};

  try {
    const existingRaw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    const existing: AdAttributionData = existingRaw ? JSON.parse(existingRaw) : {};
    const params = new URLSearchParams(window.location.search);

    const updated: AdAttributionData = { ...existing };
    const keys: Array<keyof AdAttributionData> = [
      'gclid',
      'gbraid',
      'gbraid',
      'wbraid',
      'gad_source',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ];

    let hasNewParam = false;
    for (const key of keys) {
      const val = params.get(key);
      if (val) {
        updated[key] = val;
        hasNewParam = true;
      }
    }

    const condParam =
      params.get('condition') ||
      params.get('symptom') ||
      params.get('kw') ||
      params.get('pkg') ||
      params.get('utm_term');
    if (condParam) {
      updated.matched_condition = condParam;
      hasNewParam = true;
    }

    if (!updated.landing_path) {
      updated.landing_path = window.location.pathname + window.location.search;
    }
    if (hasNewParam || !updated.captured_at) {
      updated.captured_at = new Date().toISOString();
    }

    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return {};
  }
}

export function getStoredAdAttribution(): AdAttributionData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function matchesSymptomCategory(pkg: PackageData, category: SymptomCategory): boolean {
  if (category === 'all') return true;

  const haystack = [
    pkg.name,
    pkg.description,
    pkg.package_code || '',
    ...(pkg.symptoms || []),
    ...(pkg.health_benefits || []),
    ...((pkg.products || []).map((p) => p.name)),
    ...((pkg.options || []).flatMap((o) => o.products || [])),
  ]
    .join(' ')
    .toLowerCase();

  switch (category) {
    case 'prostate':
      return /prostate|prostbeta|urinar|frequent\s+urin|bladder|p001/.test(haystack);
    case 'joints':
      return /arthrit|joint|rheumat|knee|waist|bone|calcium|panicept|spabucta|mobility|p004/.test(haystack);
    case 'vitality':
      return /erection|vitality|stamina|vigor|reodoe|premature|endurance|men|male|zinc|p002/.test(haystack);
    case 'sugar':
      return /diabet|sugar|glucose|dialese|metabolic|glycemic|pancreas|p003/.test(haystack);
    case 'cardio':
      return /blood\s+pressure|hypertension|cardio|heart|circulation|hyperfree|cholesterol|stroke/.test(haystack);
    case 'womens':
      return /fibroid|female|women|fertility|infertility|hormon|uter|reproductive|menstru|p009/.test(haystack);
    default:
      return true;
  }
}

export function resolveAdIntent(searchString?: string): AdIntentConfig {
  const params = new URLSearchParams(
    searchString !== undefined
      ? searchString
      : typeof window !== 'undefined'
        ? window.location.search
        : ''
  );

  const rawQuery = [
    params.get('condition'),
    params.get('symptom'),
    params.get('kw'),
    params.get('pkg'),
    params.get('utm_term'),
    params.get('utm_campaign'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .trim();

  const pkgParam = (params.get('pkg') || '').trim().toUpperCase();

  if (/prostate|prostbeta|urinar|p001/.test(rawQuery)) {
    return {
      category: 'prostate',
      kicker: "NAFDAC Registered Men's Herbal Nutrition · Nationwide Pay on Delivery",
      headline: "Plant-Based Nutritional Support for Men's Prostate Comfort & Restful Nights",
      subheadline:
        'Authentic multi-bottle GHT herbal wellness packs featuring Prostbeta, Longzit, and Ganoderma to support healthy urinary flow and daily male comfort. Delivered in 24–48 hours—inspect intact seals before you pay.',
      pageTitle: "Men's Prostate Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT herbal prostate wellness packs with Free 24–48hr Nationwide Delivery across Nigeria. Inspect seals upon arrival before payment.",
      ctaLabel: 'Select Prostate Wellness Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P001',
    };
  }

  if (/arthrit|joint|knee|rheumat|waist|back|calcium|panicept|mobility|p004/.test(rawQuery)) {
    return {
      category: 'joints',
      kicker: 'NAFDAC Registered Bone & Joint Support · Nationwide Pay on Delivery',
      headline: 'Targeted Herbal & Calcium Nutrition for Joint Comfort & Daily Mobility',
      subheadline:
        'Support flexible knees, waist comfort, and bone strength with authentic NAFDAC-registered GHT wellness packs. Dispatched to your doorstep in 24–48 hours with zero upfront payment.',
      pageTitle: 'Joint Comfort & Mobility Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Shop NAFDAC-registered GHT joint comfort and calcium wellness packs. Free 24–48hr delivery across Nigeria with Pay on Delivery.',
      ctaLabel: 'Select Joint Mobility Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P004',
    };
  }

  if (/vitality|stamina|erection|endurance|reodoe|vigor|men|male|p002/.test(rawQuery)) {
    return {
      category: 'vitality',
      kicker: "NAFDAC Registered Men's Stamina Formulas · Discreet Doorstep Dispatch",
      headline: "Natural Botanical Support for Men's Stamina, Energy & Confidence",
      subheadline:
        'Multi-bottle GHT herbal combo packs formulated with Reodoe, Zinc, and Vigor Max to support male energy, circulation, and physical endurance. Discreet 24–48hr delivery—pay only upon inspection.',
      pageTitle: "Men's Stamina & Vitality Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Authentic NAFDAC-registered GHT men's vitality combo packs with discreet 24–48hr nationwide delivery and Pay on Delivery.",
      ctaLabel: "Select Men's Vitality Pack",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P002',
    };
  }

  if (/sugar|diabet|glucose|metabolic|dialese|p003/.test(rawQuery)) {
    return {
      category: 'sugar',
      kicker: 'NAFDAC Registered Metabolic Support · Nationwide Pay on Delivery',
      headline: 'Daily Herbal Support for Healthy Blood Glucose Balance & Steady Vitality',
      subheadline:
        'Botanical dietary wellness packs designed to support metabolic balance, nerve comfort, and daily energy alongside a balanced diet. Free 24–48hr nationwide dispatch—pay on delivery.',
      pageTitle: 'Metabolic & Sugar Balance Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Order NAFDAC-registered GHT metabolic and sugar balance herbal wellness packs. Free 24–48hr delivery across Nigeria with Pay on Delivery.',
      ctaLabel: 'Select Sugar Balance Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P003',
    };
  }

  if (/blood\s*pressure|bp|hypertension|cardio|heart|circulation|hyperfree/.test(rawQuery)) {
    return {
      category: 'cardio',
      kicker: 'NAFDAC Registered Cardiovascular Nutrition · Nationwide Pay on Delivery',
      headline: 'Botanical Wellness Support for Healthy Circulation & Cardiovascular Calm',
      subheadline:
        'Authentic GHT plant-based wellness packs formulated to support vascular wellness, healthy circulation, and daily vitality. Delivered in 24–48 hours—inspect seals before paying.',
      pageTitle: 'Cardiovascular & Circulation Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Shop NAFDAC-registered GHT cardiovascular and circulation herbal wellness packs with Free Nationwide Pay on Delivery.',
      ctaLabel: 'Select Circulation Wellness Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || undefined,
    };
  }

  if (/fibroid|female|women|fertility|hormon|reproductive|p009/.test(rawQuery)) {
    return {
      category: 'womens',
      kicker: "NAFDAC Registered Women's Wellness · Nationwide Pay on Delivery",
      headline: "Gentle Herbal Nutritional Support for Women's Hormonal & Reproductive Wellness",
      subheadline:
        'Plant-based GHT nutritional wellness packs crafted to support feminine balance and holistic daily well-being. Free 24–48hr doorstep delivery across Nigeria—pay upon inspection.',
      pageTitle: "Women's Herbal Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT women's herbal wellness packs with Free 24–48hr Nationwide Pay on Delivery.",
      ctaLabel: "Select Women's Wellness Pack",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P009',
    };
  }

  return {
    category: 'all',
    kicker: 'NAFDAC Registered Herbal Supplements · Free 24–48hr Nationwide Dispatch',
    headline: 'Authentic Herbal Wellness Packs for Vitality, Joint Comfort & Daily Health',
    subheadline:
      'Choose your NAFDAC-registered GHT multi-bottle wellness pack with discounted bundle savings. Delivered directly to your home or office across all 36 states & FCT—inspect intact factory seals before you pay.',
    pageTitle: 'Official GHT Herbal Wellness Packs – Nationwide Pay on Delivery | SD GHT Health Care',
    metaDescription:
      'Shop authentic NAFDAC-registered GHT herbal wellness packs and value bundles. Free 24–48hr delivery across Nigeria with zero upfront risk—Pay on Delivery.',
    ctaLabel: 'Choose Your Wellness Pack',
    requestedPackageCode: pkgParam || undefined,
  };
}
