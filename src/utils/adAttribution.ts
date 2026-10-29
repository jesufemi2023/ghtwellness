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

  const titleAndCode = `${pkg.name || ''} ${pkg.package_code || ''}`.toLowerCase();
  const primarySignals = [
    pkg.name || '',
    pkg.package_code || '',
    ...(pkg.symptoms || []),
  ]
    .join(' ')
    .toLowerCase();

  // Short descriptions (< 120 chars) state the primary topic (e.g. "Male Infertility");
  // long descriptions may mention other conditions as surgical side-effects.
  const shortTopicDesc =
    pkg.description && pkg.description.trim().length <= 120
      ? pkg.description.trim().toLowerCase()
      : '';

  const coreIdentity = `${primarySignals} ${shortTopicDesc}`;
  const isExplicitlyMale =
    /\bmale\b|\bmen\b|\bprostate\b|\bprostbeta\b|\berection\b|\bejaculation\b|\bp001\b|\bp002\b/.test(
      `${titleAndCode} ${shortTopicDesc}`
    );
  const isExplicitlyFemale =
    /\bfemale\b|\bwomen\b|\bfibroid|\bovulat|\bmenstru|\buter|\bp009\b/.test(coreIdentity);

  switch (category) {
    case 'prostate':
      return /\bprostate\b|\bprostbeta\b|\bp001\b/.test(titleAndCode);

    case 'womens':
      if (isExplicitlyMale) return false;
      return (
        isExplicitlyFemale ||
        /\binfertility\b|\bfertility\b|\bconceive\b|\bhormon/.test(coreIdentity)
      );

    case 'vitality':
      if (isExplicitlyFemale || /\bprostate\b|\bp001\b/.test(titleAndCode)) return false;
      return /\berection\b|\bejaculation\b|\bvitality\b|\bstamina\b|\blibido\b|\bimpotence\b|\bmale\s+combo\b|\bmale\s+infertility\b|\bp002\b/.test(
        coreIdentity
      );

    case 'joints':
      if (pkg.is_combo && !/\barthrit|\bjoint|\bbone/.test(titleAndCode)) return false;
      return /\barthrit|\bjoint|\brheumat|\bknee\b|\bwaist\b|\bspondylitis\b|\bosteoporosis\b|\bp004\b/.test(
        coreIdentity
      );

    case 'sugar':
      if (pkg.is_combo && !/\bdiabet|\bsugar\b/.test(titleAndCode)) return false;
      return /\bdiabet|\bblood\s+sugar\b|\bglucose\b|\binsulin\b|\bp003\b/.test(coreIdentity);

    case 'cardio':
      if (pkg.is_combo && !/\bhypertension\b|\bblood\s+pressure\b|\bcardio|\bheart\b/.test(titleAndCode)) {
        return false;
      }
      return /\bhypertension\b|\bblood\s+pressure\b|\bcardio|\bheart\b|\bstroke\b|\bhyperfree\b/.test(
        coreIdentity
      );

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
      kicker: "Authorized GHT Healthcare Distribution · Men's Prostate Wellness",
      headline: "Targeted Botanical Support for Men's Prostate Comfort & Uninterrupted Rest",
      subheadline:
        'Genuine NAFDAC-registered herbal formulations crafted to support healthy urinary flow, bladder ease, and restful nights—delivered sealed to your doorstep so you inspect before paying.',
      pageTitle: "Men's Prostate Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT herbal prostate wellness packs with Free 24–48hr Nationwide Delivery across Nigeria. Inspect seals upon arrival before payment.",
      ctaLabel: 'Explore Prostate Packs',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P001',
    };
  }

  if (/arthrit|joint|knee|rheumat|waist|back|calcium|panicept|mobility|p004/.test(rawQuery)) {
    return {
      category: 'joints',
      kicker: 'Authorized GHT Healthcare Distribution · Bone & Joint Mobility',
      headline: 'Concentrated Herbal & Calcium Nutrition for Supple Joints & Effortless Mobility',
      subheadline:
        'Support comfortable knees, waist strength, and everyday flexibility with genuine NAFDAC-registered GHT wellness packs—delivered free nationwide with doorstep seal inspection before payment.',
      pageTitle: 'Joint Comfort & Mobility Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Shop NAFDAC-registered GHT joint comfort and calcium wellness packs. Free 24–48hr delivery across Nigeria with Pay on Delivery.',
      ctaLabel: 'Explore Joint & Bone Packs',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P004',
    };
  }

  if (/fibroid|female|women|menstru|ovulat|gynec|p009/.test(rawQuery)) {
    return {
      category: 'womens',
      kicker: "Authorized GHT Healthcare Distribution · Women's Holistic Wellness",
      headline: "Gentle Botanical Nutrition for Women's Hormonal Balance & Reproductive Care",
      subheadline:
        'Pure NAFDAC-registered plant formulations thoughtfully paired to support cycle harmony and feminine vitality—dispatched discreetly to your door with payment only upon inspection.',
      pageTitle: "Women's Herbal Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT women's herbal wellness packs with Free 24–48hr Nationwide Pay on Delivery.",
      ctaLabel: "Explore Women's Packs",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P009',
    };
  }

  if (/vitality|stamina|erection|endurance|reodoe|vigor|\bmen\b|\bmens\b|\bmale\b|mens_|male_|p002/.test(rawQuery)) {
    return {
      category: 'vitality',
      kicker: "Authorized GHT Healthcare Distribution · Men's Stamina & Vitality",
      headline: "Restorative Herbal Nutrition for Men's Stamina, Circulation & Quiet Confidence",
      subheadline:
        'Synergistic NAFDAC-registered botanical packs formulated to support male energy, physical endurance, and lasting vitality—delivered in discreet sealed packaging with Pay on Delivery.',
      pageTitle: "Men's Stamina & Vitality Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Authentic NAFDAC-registered GHT men's vitality combo packs with discreet 24–48hr nationwide delivery and Pay on Delivery.",
      ctaLabel: "Explore Men's Vitality Packs",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P002',
    };
  }

  if (/sugar|diabet|glucose|metabolic|dialese|p003/.test(rawQuery)) {
    return {
      category: 'sugar',
      kicker: 'Authorized GHT Healthcare Distribution · Metabolic & Glucose Support',
      headline: 'Balanced Botanical Nutrition for Steady Glucose Metabolism & Daily Energy',
      subheadline:
        'Carefully selected NAFDAC-registered herbal formulations supporting healthy metabolic balance, nerve comfort, and sustained vitality—inspect your factory-sealed bottles upon delivery before paying.',
      pageTitle: 'Metabolic & Sugar Balance Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Order NAFDAC-registered GHT metabolic and sugar balance herbal wellness packs. Free 24–48hr delivery across Nigeria with Pay on Delivery.',
      ctaLabel: 'Explore Sugar Balance Packs',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P003',
    };
  }

  if (/blood\s*pressure|\bbp\b|hypertension|cardio|heart|circulation|hyperfree/.test(rawQuery)) {
    return {
      category: 'cardio',
      kicker: 'Authorized GHT Healthcare Distribution · Cardiovascular Wellness',
      headline: 'Plant-Based Nutritional Support for Healthy Circulation & Vascular Calm',
      subheadline:
        'Genuine NAFDAC-registered GHT botanical packs formulated to support cardiovascular balance and steady daily vitality—delivered free across Nigeria with Pay on Delivery.',
      pageTitle: 'Cardiovascular & Circulation Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Shop NAFDAC-registered GHT cardiovascular and circulation herbal wellness packs with Free Nationwide Pay on Delivery.',
      ctaLabel: 'Explore Circulation Packs',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || undefined,
    };
  }

  if (/fertility|hormon|reproductive/.test(rawQuery)) {
    return {
      category: 'womens',
      kicker: "Authorized GHT Healthcare Distribution · Women's Holistic Wellness",
      headline: "Gentle Botanical Nutrition for Women's Hormonal Balance & Reproductive Care",
      subheadline:
        'Pure NAFDAC-registered plant formulations thoughtfully paired to support cycle harmony and feminine vitality—dispatched discreetly to your door with payment only upon inspection.',
      pageTitle: "Women's Herbal Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT women's herbal wellness packs with Free 24–48hr Nationwide Pay on Delivery.",
      ctaLabel: "Explore Women's Packs",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P009',
    };
  }

  return {
    category: 'all',
    kicker: 'Official Nigerian Distribution · NAFDAC-Certified Botanicals',
    headline: 'Pure Herbal Formulations for Lasting Vitality, Joint Comfort & Daily Strength',
    subheadline:
      'Every multi-bottle GHT wellness pack is factory-sealed, NAFDAC-registered, and delivered free to your home or office—so you can inspect your supplements in person before making payment.',
    pageTitle: 'Official GHT Herbal Wellness Packs – Nationwide Pay on Delivery | SD GHT Health Care',
    metaDescription:
      'Shop authentic NAFDAC-registered GHT herbal wellness packs and value bundles. Free 24–48hr delivery across Nigeria with zero upfront risk—Pay on Delivery.',
    ctaLabel: 'Explore Wellness Packs',
    requestedPackageCode: pkgParam || undefined,
  };
}
