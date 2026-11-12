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
      kicker: "★ OFFICIAL GHT HEALTHCARE NIGERIA · NAFDAC CERTIFIED",
      headline: "Sleep Soundly All Night Without Frequent Urination, Pain, or Weak Stream",
      subheadline:
        '100% natural herbal formula that naturally shrinks swollen prostate, stops midnight bathroom runs, and restores a powerful, painless urine flow. Delivered sealed to your door with zero upfront payment — inspect before paying.',
      pageTitle: "Natural Prostate Care Formula – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT natural prostate care herbal packs with Free 24–48hr Nationwide Delivery across Nigeria. Inspect seals upon arrival before payment.",
      ctaLabel: 'Order Prostate Formula',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P001',
    };
  }

  if (/arthrit|joint|knee|rheumat|waist|back|calcium|panicept|mobility|p004/.test(rawQuery)) {
    return {
      category: 'joints',
      kicker: '★ OFFICIAL GHT HEALTHCARE NIGERIA · FAST JOINT FREEDOM',
      headline: 'Walk, Bend & Climb Stairs Pain-Free Without Agonizing Knee, Waist or Back Pain',
      subheadline:
        'Pure herbal & calcium nourishment that lubricates dry joints, rebuilds cartilage, and melts away morning stiffness. Delivered sealed to your doorstep with Pay on Delivery.',
      pageTitle: 'Joint Comfort & Mobility Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Shop NAFDAC-registered GHT joint comfort and calcium wellness packs. Free 24–48hr delivery across Nigeria with Pay on Delivery.',
      ctaLabel: 'Order Joint Freedom Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P004',
    };
  }

  if (/fibroid|female|women|menstru|ovulat|gynec|p009/.test(rawQuery)) {
    return {
      category: 'womens',
      kicker: "★ OFFICIAL GHT HEALTHCARE NIGERIA · FEMININE HORMONAL HARMONY",
      headline: "End Agonizing Menstrual Cramps, Regulate Periods & Balance Your Hormones Naturally",
      subheadline:
        'Pure herbal remedy that relieves painful monthly cramps, normalizes irregular cycles, cools down hot flashes, and brings back your feminine glow. 100% NAFDAC certified with Pay on Delivery.',
      pageTitle: "Women's Herbal Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT women's herbal wellness packs with Free 24–48hr Nationwide Pay on Delivery.",
      ctaLabel: "Order Women's Balance Pack",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P009',
    };
  }

  if (
    /vitality|performance|stamina|erection|endurance|reodoe|vigor|\bmen\b|\bmens\b|\bmale\b|mens_|male_|p002/.test(
      rawQuery
    )
  ) {
    return {
      category: 'vitality',
      kicker: "★ OFFICIAL GHT HEALTHCARE NIGERIA · MALE CONFIDENCE & STAMINA",
      headline: "Regain Rock-Solid Firmness, Last 35–45+ Minutes & Restore Bedroom Power",
      subheadline:
        '100% herbal endurance formula that eliminates quick finishes, restores dependable firmness, and gives you deep physical stamina. No headache, no racing heart — delivered sealed with Pay on Delivery.',
      pageTitle: "Male Performance & Stamina Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Authentic NAFDAC-registered GHT male performance and stamina combo packs with discreet 24–48hr nationwide delivery and Pay on Delivery.",
      ctaLabel: "Order Performance & Stamina Pack",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P002',
    };
  }

  if (/sugar|diabet|glucose|metabolic|dialese|p003/.test(rawQuery)) {
    return {
      category: 'sugar',
      kicker: '★ OFFICIAL GHT HEALTHCARE NIGERIA · NATURAL BLOOD SUGAR CONTROL',
      headline: 'Keep Your Blood Sugar Balanced All Day, Stop Constant Fatigue & End Foot Numbness',
      subheadline:
        'Safe herbal remedy that supports your pancreas, keeps your sugar readings stable, and shields your kidneys and eyes from damage. Inspect before paying at your doorstep.',
      pageTitle: 'Metabolic & Sugar Balance Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Order NAFDAC-registered GHT metabolic and sugar balance herbal wellness packs. Free 24–48hr delivery across Nigeria with Pay on Delivery.',
      ctaLabel: 'Order Sugar Balance Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P003',
    };
  }

  if (/blood\s*pressure|\bbp\b|hypertension|cardio|heart|circulation|hyperfree/.test(rawQuery)) {
    return {
      category: 'cardio',
      kicker: '★ OFFICIAL GHT HEALTHCARE NIGERIA · CARDIOVASCULAR HEALTH',
      headline: 'Support Healthy Blood Pressure, Clean Arteries & Steady Heart Vitality',
      subheadline:
        'Natural herbal wellness pack that enhances blood circulation, calms vascular tension, and protects your heart safely. Delivered sealed with Pay on Delivery.',
      pageTitle: 'Cardiovascular & Circulation Wellness Packs – Pay on Delivery | SD GHT Health Care',
      metaDescription:
        'Shop NAFDAC-registered GHT cardiovascular and circulation herbal wellness packs with Free Nationwide Pay on Delivery.',
      ctaLabel: 'Order Circulation Pack',
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || undefined,
    };
  }

  if (/fertility|hormon|reproductive/.test(rawQuery)) {
    return {
      category: 'womens',
      kicker: "★ OFFICIAL GHT HEALTHCARE NIGERIA · FEMININE HORMONAL HARMONY",
      headline: "End Agonizing Menstrual Cramps, Regulate Periods & Balance Your Hormones Naturally",
      subheadline:
        'Pure herbal remedy that relieves painful monthly cramps, normalizes irregular cycles, cools down hot flashes, and brings back your feminine glow. 100% NAFDAC certified with Pay on Delivery.',
      pageTitle: "Women's Herbal Wellness Packs – Pay on Delivery | SD GHT Health Care",
      metaDescription:
        "Order NAFDAC-registered GHT women's herbal wellness packs with Free 24–48hr Nationwide Pay on Delivery.",
      ctaLabel: "Order Women's Balance Pack",
      matchedKeyword: rawQuery,
      requestedPackageCode: pkgParam || 'P009',
    };
  }

  return {
    category: 'all',
    kicker: '★ OFFICIAL GHT HEALTHCARE NIGERIA · NAFDAC CERTIFIED HERBAL REGIMENS',
    headline: 'Natural Herbal Formulations That Restore Your Health, Sleep & Daily Vitality',
    subheadline:
      '100% pure herbal remedies certified by NAFDAC. Stops frequent midnight urination, weak urine stream, knee pain, and bedroom weakness. Pay ₦0 upfront — our rider delivers to your doorstep anywhere in Nigeria so you can inspect before payment.',
    pageTitle: 'Official GHT Herbal Wellness Packs – Nationwide Pay on Delivery | SD GHT Health Care',
    metaDescription:
      'Shop authentic NAFDAC-registered GHT herbal wellness packs and value bundles. Free 24–48hr delivery across Nigeria with zero upfront risk—Pay on Delivery.',
    ctaLabel: 'Order Wellness Packs',
    requestedPackageCode: pkgParam || undefined,
  };
}
