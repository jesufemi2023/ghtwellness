import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Phone,
  Truck,
  CheckCircle2,
  Star,
  Mail,
  MapPin,
  ChevronDown,
  ChevronRight,
  X,
  ShoppingBag,
  Clock,
  FileText,
  ZoomIn,
  MessageCircle,
  ArrowDown,
  Sparkles,
  Flame,
  Zap,
  Droplets,
  Check,
  Lock,
  Award,
} from 'lucide-react';
import { Product, PackageData } from '../types';
import { CONFIG } from '../config';
import { buildWhatsAppUrl, useCompanyWhatsApp } from '../utils/whatsapp';
import { extractBottleCount } from '../utils/bottleFormatter';
import {
  SymptomCategory,
  captureAndPersistAdAttribution,
  matchesSymptomCategory,
  resolveAdIntent,
} from '../utils/adAttribution';
import {
  computePackagePricing,
  computeProductPricing,
  resolveSingleOptionPricing,
} from '../utils/optionPricing';
import { trackWhatsAppClick, trackAdBundleSelect } from '../lib/analytics';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import { ExpressPodCheckout } from './ExpressPodCheckout';

export type PolicyTab = 'privacy-policy' | 'terms-of-service' | 'return-policy' | 'about' | 'home';

export interface AdLandingPageProps {
  products: Product[];
  packages: PackageData[];
  combos: PackageData[];
  isLoading?: boolean;
  distributorId?: string;
  onOrderProduct?: (product: Product, quantity?: number) => void;
  onOrderPackage?: (pkg: PackageData, type: 'package', quantity?: number, optionIdx?: number) => void;
  onViewProduct?: (product: Product) => void;
  onViewPackage?: (pkg: PackageData) => void;
  onNavigatePolicy?: (tab: PolicyTab) => void;
  onOrderSuccess?: (
    fullName: string,
    itemName: string,
    quantity: number,
    totalPrice: number,
    deliveryDate: string,
    paymentMethod: string
  ) => void;
}

type FilterTabId = SymptomCategory | 'singles';

const SYMPTOM_TABS: Array<{ id: FilterTabId; label: string }> = [
  { id: 'all', label: 'All Wellness Packs' },
  { id: 'prostate', label: 'Prostate Care' },
  { id: 'vitality', label: "Men's Performance & Stamina" },
  { id: 'womens', label: "Women's Wellness" },
  { id: 'joints', label: 'Joints & Mobility' },
  { id: 'sugar', label: 'Sugar Balance' },
  { id: 'cardio', label: 'Cardio & Circulation' },
  { id: 'singles', label: 'Single Bottle' },
];

interface PackageVisualTheme {
  categoryLabel: string;
  headerBgClass: string;
  studioGradientClass: string;
  cardBorderClass: string;
  accentTextClass: string;
  softSurfaceClass: string;
}

const SOFT_BOTANICAL_THEMES: Record<string, PackageVisualTheme> = {
  prostate: {
    categoryLabel: "Men's Prostate Care",
    headerBgClass: 'bg-[#EEF6F1]',
    studioGradientClass:
      'bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#ffffff_52%,#e8f3ec_100%)]',
    cardBorderClass: 'border-[#CFDFD5]',
    accentTextClass: 'text-[#065F46]',
    softSurfaceClass: 'bg-[#F6FAF8]',
  },
  vitality: {
    categoryLabel: "Men's Performance & Stamina",
    headerBgClass: 'bg-[#FBF4E7]',
    studioGradientClass:
      'bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#ffffff_52%,#f6ede0_100%)]',
    cardBorderClass: 'border-[#E6DBC5]',
    accentTextClass: 'text-[#854D0E]',
    softSurfaceClass: 'bg-[#FDFBF6]',
  },
  joints: {
    categoryLabel: 'Joint & Bone Comfort',
    headerBgClass: 'bg-[#ECF5F7]',
    studioGradientClass:
      'bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#ffffff_52%,#e4f0f3_100%)]',
    cardBorderClass: 'border-[#CDE0E5]',
    accentTextClass: 'text-[#155E75]',
    softSurfaceClass: 'bg-[#F6FAFB]',
  },
  sugar: {
    categoryLabel: 'Blood Sugar & Metabolic Care',
    headerBgClass: 'bg-[#EEF2FA]',
    studioGradientClass:
      'bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#ffffff_52%,#e7edf8_100%)]',
    cardBorderClass: 'border-[#D1DCEB]',
    accentTextClass: 'text-[#1E40AF]',
    softSurfaceClass: 'bg-[#F7F9FC]',
  },
  womens: {
    categoryLabel: "Women's Reproductive Care",
    headerBgClass: 'bg-[#FAF0F3]',
    studioGradientClass:
      'bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#ffffff_52%,#f4e6eb_100%)]',
    cardBorderClass: 'border-[#E5CFD7]',
    accentTextClass: 'text-[#9D174D]',
    softSurfaceClass: 'bg-[#FCF7F9]',
  },
  combo: {
    categoryLabel: 'Complete Master Combo Pack',
    headerBgClass: 'bg-[#F4F2EA]',
    studioGradientClass:
      'bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#ffffff_52%,#edeae0_100%)]',
    cardBorderClass: 'border-[#DDD9CC]',
    accentTextClass: 'text-[#57534E]',
    softSurfaceClass: 'bg-[#FAF9F5]',
  },
};

function resolvePackageVisualTheme(pkg: PackageData, index: number): PackageVisualTheme {
  const titleLower = `${pkg.package_code || ''} ${pkg.name || ''}`.toLowerCase();

  if (matchesSymptomCategory(pkg, 'prostate')) {
    return SOFT_BOTANICAL_THEMES.prostate;
  }
  if (matchesSymptomCategory(pkg, 'womens')) {
    return SOFT_BOTANICAL_THEMES.womens;
  }
  if (matchesSymptomCategory(pkg, 'joints')) {
    return SOFT_BOTANICAL_THEMES.joints;
  }
  if (matchesSymptomCategory(pkg, 'sugar')) {
    return SOFT_BOTANICAL_THEMES.sugar;
  }
  if (pkg.is_combo || titleLower.includes('combo')) {
    return SOFT_BOTANICAL_THEMES.combo;
  }
  if (matchesSymptomCategory(pkg, 'vitality')) {
    return SOFT_BOTANICAL_THEMES.vitality;
  }

  const themeList = Object.values(SOFT_BOTANICAL_THEMES);
  return themeList[index % themeList.length];
}

const CUSTOMER_STORIES: Array<{
  name: string;
  role: string;
  location: string;
  packName: string;
  category: SymptomCategory;
  quote: string;
}> = [
  {
    name: 'Chief Adebayo O.',
    role: 'Retired Civil Engineer, 64',
    location: 'Bodija, Ibadan',
    packName: 'Natural Prostate Care Formula (3-Bottle Pack)',
    category: 'prostate',
    quote:
      'I used to wake up 5 to 6 times every single night just to struggle and pass small drops of urine with pain. It was ruining my sleep and health. Within 2 weeks of using this GHT Prostate Pack, the burning stopped, my urine stream became powerful, and now I sleep peacefully straight till 6:00 AM! Being able to inspect the bottles before paying the rider gave me 100% confidence.',
  },
  {
    name: 'Engr. Musa K.',
    role: 'Project Director, 51',
    location: 'Wuse II, Abuja',
    packName: 'Male Performance & Stamina Pack',
    category: 'vitality',
    quote:
      'Work stress and age were seriously killing my bedroom stamina, and I was finishing in less than 2 minutes. This herbal formula completely turned things around. I now easily last 35 to 45 minutes with solid firmness, and my wife is extremely happy! Best part: zero headache, zero racing heart, unlike chemical pills.',
  },
  {
    name: 'Mrs. Evelyn N.',
    role: 'School Principal, 56',
    location: 'GRA, Benin City',
    packName: 'Joint Comfort & Calcium Pack',
    category: 'joints',
    quote:
      'My knee pain was so terrible that climbing stairs in my school was pure punishment. After starting this 3-bottle Joint Pack, the severe stiffness and grinding sound vanished. I now walk comfortably and climb stairs without holding onto the rails. It really works!',
  },
  {
    name: 'Mrs. Folashade A.',
    role: 'Business Executive, 44',
    location: 'Ikeja GRA, Lagos',
    packName: "Women's Wellness & Hormonal Balance Pack",
    category: 'womens',
    quote:
      'For years I battled severe menstrual cramps that knocked me out for 3 days every month, plus irregular cycles. Within one month of this herbal regimen, my period came smoothly with zero pain! I was also impressed that delivery arrived in Ikeja within 24 hours with free inspection.',
  },
  {
    name: 'Pastor Daniel E.',
    role: 'Clergy, 58',
    location: 'Port Harcourt, Rivers State',
    packName: 'Metabolic & Sugar Balance Pack',
    category: 'sugar',
    quote:
      'The burning and numbness in my feet was terrifying, and I always felt completely drained by 2:00 PM. This herbal sugar pack helped stabilize my blood readings and the numbness in my feet is gone. I have real energy to preach and visit church members all day without fatigue.',
  },
];

const BUYER_FAQS = [
  {
    question: 'How do I know this is 100% genuine and safe for my body?',
    answer:
      'Every GHT wellness pack is 100% pure herbal, formulated from trusted medicinal plants, and officially registered and certified by NAFDAC. You get authentic bottles with tamper-proof factory seals and verifiable batch numbers. There are zero harmful chemicals or dangerous stimulants.',
  },
  {
    question: 'How does Pay on Delivery work? Can I really check the package first?',
    answer:
      'Yes, absolutely! You do not pay a single kobo upfront. When our dispatch rider arrives at your home or office, you have the right to open the package, verify the bottles, inspect the intact seals, and check the expiry dates before handing over payment via Bank Transfer, POS, or Cash.',
  },
  {
    question: 'How fast will my order arrive?',
    answer:
      'We deliver free nationwide. Orders within Lagos, Abuja, Port Harcourt, Ibadan, and major cities arrive within 24 to 48 hours. Other states and towns arrive within 48 to 72 hours. Our local dispatch rider will call you before coming to ensure you are available.',
  },
  {
    question: 'How soon can I expect noticeable results?',
    answer:
      'Most customers notice significant relief within the first 7 to 14 days of consistent daily use — such as sleeping through the night without waking up to pee, stronger urine flow, less knee stiffness, or renewed stamina. For full and permanent restoration, we recommend completing the 2 or 3-bottle regimen.',
  },
  {
    question: 'Which pack size should I order for the best results?',
    answer:
      'While the 1 or 2-bottle pack gives quick initial relief, the 3-Bottle Regimen (60-Day Therapy) is our most popular and doctor-recommended choice because it gives your body enough time to thoroughly heal and prevent the problem from returning. Plus, you save extra money on multi-bottle discounts!',
  },
];

const POLICY_MODAL_CONTENT: Record<
  'return-policy' | 'privacy-policy' | 'terms-of-service',
  { title: string; sections: Array<{ heading: string; body: string }> }
> = {
  'return-policy': {
    title: 'Return, Inspection & Exchange Policy',
    sections: [
      {
        heading: 'Doorstep Inspection Before Payment',
        body: 'With our Pay-on-Delivery service, you are encouraged to inspect the outer parcel, bottle count, expiry dates, and intact factory seals in the presence of our dispatch rider before completing payment.',
      },
      {
        heading: '7-Day Sealed Return & Damaged Transit Replacement',
        body: 'Unopened supplements in their original tamper-evident factory packaging may be returned or exchanged within 7 days of delivery. Any bottle damaged in transit is replaced free of charge within 48 hours.',
      },
      {
        heading: 'How to Request Support',
        body: `Contact our fulfillment desk directly at ${CONFIG.company.phone} or email ${CONFIG.company.email} with your phone number and delivery date for prompt resolution.`,
      },
    ],
  },
  'privacy-policy': {
    title: 'Customer Privacy & Data Protection Policy',
    sections: [
      {
        heading: 'Information Collected for Fulfillment',
        body: 'We collect only your name, phone/WhatsApp number, and delivery address strictly to coordinate doorstep dispatch and provide dosage guidance for your order.',
      },
      {
        heading: 'Confidential Health & Order Handling',
        body: 'All parcels are dispatched in discreet outer packaging. Your personal contact information is never sold, rented, or shared with unauthorized third-party marketers.',
      },
      {
        heading: 'Advertising & Analytics Measurement',
        body: 'Anonymous campaign parameters (such as Google Ads click identifiers) are used solely to measure order conversion performance and improve customer experience.',
      },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service & Nationwide Shipping Policy',
    sections: [
      {
        heading: 'Dietary Supplement Classification',
        body: 'All GHT products offered by SD GHT Health Care Nigeria Ltd are NAFDAC-registered herbal and nutritional dietary supplements intended to support general wellness alongside a balanced diet.',
      },
      {
        heading: 'Nationwide Shipping & Fulfillment',
        body: 'Delivery is free nationwide across all 36 Nigerian states and FCT Abuja. Standard dispatch timelines are 24–48 hours for major cities and 48–72 hours for outer towns.',
      },
      {
        heading: 'Customer Commitment on Pay-on-Delivery Orders',
        body: 'Please place a Pay-on-Delivery order only when you or a designated representative will be available by phone to receive our dispatch rider on your chosen delivery day.',
      },
    ],
  },
};

interface GalleryImageEntry {
  url: string;
  label: string;
}

function getPackageGalleryEntries(pkg: PackageData): GalleryImageEntry[] {
  const entries: GalleryImageEntry[] = [];
  const seen = new Set<string>();

  if (pkg.package_image_url && pkg.package_image_url.trim().length > 0) {
    const cleanPkgUrl = pkg.package_image_url.trim();
    seen.add(cleanPkgUrl);
    entries.push({
      url: cleanPkgUrl,
      label: 'Full Pack',
    });
  }

  for (const prod of pkg.products || []) {
    if (prod?.image_url && prod.image_url.trim().length > 0) {
      const cleanProdUrl = prod.image_url.trim();
      if (!seen.has(cleanProdUrl)) {
        seen.add(cleanProdUrl);
        entries.push({
          url: cleanProdUrl,
          label: prod.name,
        });
      }
    }
  }

  return entries;
}

type ImageAttemptState = 'optimized' | 'raw' | 'failed';

interface StudioProductStageProps {
  entries: GalleryImageEntry[];
  alt: string;
  heightClassName: string;
  studioGradientClass?: string;
  optimizeWidth?: number;
  onInspect?: () => void;
}

const StudioProductStage: React.FC<StudioProductStageProps> = ({
  entries,
  alt,
  heightClassName,
  studioGradientClass = 'bg-[radial-gradient(circle_at_50%_46%,#ffffff_0%,#ffffff_55%,#eef4f1_100%)]',
  optimizeWidth = 1200,
  onInspect,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [attemptMap, setAttemptMap] = useState<Record<number, ImageAttemptState>>({});

  const entriesSignature = entries.map((e) => e.url).join('|');

  useEffect(() => {
    setActiveIdx(0);
    setAttemptMap({});
  }, [entriesSignature]);

  const safeIdx = entries[activeIdx] ? activeIdx : 0;
  const currentEntry = entries[safeIdx];
  const rawUrl = currentEntry?.url?.trim() || '';
  const optimizedUrl = rawUrl ? getOptimizedImageUrl(rawUrl, optimizeWidth) : '';

  const currentStage: ImageAttemptState = attemptMap[safeIdx] || 'optimized';
  const activeSrc =
    currentStage === 'optimized'
      ? optimizedUrl || rawUrl
      : currentStage === 'raw'
        ? rawUrl
        : '';

  const hasFailed = !activeSrc || currentStage === 'failed';
  const hasMultipleEntries = entries.length > 1;

  const handleImageError = () => {
    if (currentStage === 'optimized' && rawUrl && optimizedUrl !== rawUrl) {
      setAttemptMap((prev) => ({ ...prev, [safeIdx]: 'raw' }));
      return;
    }

    setAttemptMap((prev) => {
      const nextMap: Record<number, ImageAttemptState> = { ...prev, [safeIdx]: 'failed' };
      const fallbackIdx = entries.findIndex((_, i) => i !== safeIdx && nextMap[i] !== 'failed');
      if (fallbackIdx >= 0) {
        setActiveIdx(fallbackIdx);
      }
      return nextMap;
    });
  };

  return (
    <div className="w-full flex flex-col select-none">
      {/* Explicit Studio Stage Geometry — Prevents Flex Height Collapse Across Mobile & Desktop */}
      <div className={`relative w-full ${heightClassName} ${studioGradientClass} overflow-hidden group`}>
        <div
          onClick={onInspect}
          role={onInspect ? 'button' : undefined}
          tabIndex={onInspect ? 0 : undefined}
          onKeyDown={
            onInspect
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onInspect();
                  }
                }
              : undefined
          }
          aria-label={onInspect ? `Inspect ${alt} bottles up close` : undefined}
          className={`absolute inset-0 flex items-center justify-center p-4 sm:p-6 ${
            onInspect ? 'cursor-zoom-in' : ''
          }`}
        >
          {hasFailed ? (
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#D5E0DA] flex items-center justify-center text-[#047857] mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="text-lg font-black text-[#0F1F18]">
                {alt}
              </span>
              <span className="text-[13.5px] text-[#047857] font-semibold mt-1">
                NAFDAC Registered Herbal Formulation
              </span>
            </div>
          ) : (
            <img
              key={`${safeIdx}-${currentStage}`}
              src={activeSrc}
              alt={`${alt} — ${currentEntry.label}`}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="max-w-full max-h-full w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          )}
        </div>

        {/* Subtle Zoom Affordance Button */}
        {onInspect && !hasFailed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-[#0F1F18] border border-slate-200/95 text-[13px] sm:text-[14px] font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <ZoomIn className="w-4 h-4 text-[#047857]" />
            <span>Enlarge</span>
          </button>
        )}
      </div>

      {/* Dedicated Non-Clipped Gallery Switcher Row — Full Pack Always 100% Visible on Mobile */}
      {hasMultipleEntries && (
        <div
          className="w-full bg-white/95 border-t border-slate-200/75 overflow-x-auto no-scrollbar py-2.5 px-3.5 sm:px-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 w-max sm:mx-auto">
            {entries.map((entry, idx) => {
              const isSelected = idx === safeIdx;
              const thumbSrc = getOptimizedImageUrl(entry.url, 180) || entry.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  title={entry.label}
                  className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13.5px] sm:text-[14px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#EEF6F2] border-[#047857] text-[#0F1F18] ring-2 ring-[#047857]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <img
                    src={thumbSrc}
                    alt={entry.label}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const imgEl = e.currentTarget;
                      if (imgEl.src !== entry.url) {
                        imgEl.src = entry.url;
                      }
                    }}
                    className="w-6 h-6 object-contain shrink-0"
                  />
                  <span>{entry.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function getDefaultOptionIdx(options?: Array<{ bottles: string }>): number {
  if (!options || options.length === 0) return 0;
  const idx3 = options.findIndex((o) => o.bottles.toLowerCase().includes('3 bottle'));
  return idx3 >= 0 ? idx3 : 0;
}

function truncateDescriptionText(
  rawText: string,
  maxChars: number
): { excerpt: string; isTruncated: boolean } {
  const normalized = rawText.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) {
    return { excerpt: normalized, isTruncated: false };
  }
  const sliced = normalized.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut =
    lastSpace > Math.floor(maxChars * 0.65) ? sliced.slice(0, lastSpace) : sliced;
  return {
    excerpt: `${cleanCut.replace(/[,.;:!?-]+$/, '')}…`,
    isTruncated: true,
  };
}

interface ExpandableDescriptionProps {
  text: string;
  maxChars?: number;
  className?: string;
}

const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  text,
  maxChars = 160,
  className = 'text-[16.5px] sm:text-[17px] text-[#263930] leading-[1.74] font-normal tracking-[0.006em]',
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  const cleanFull = text.trim();
  if (!cleanFull) return null;

  const { excerpt, isTruncated } = truncateDescriptionText(cleanFull, maxChars);

  if (!isTruncated) {
    return <p className={className}>{cleanFull}</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className={`${className} ${expanded ? 'whitespace-pre-line' : ''}`}>
        {expanded ? cleanFull : excerpt}{' '}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline font-semibold text-[#047857] hover:text-[#065F46] underline underline-offset-4 cursor-pointer whitespace-nowrap"
        >
          {expanded ? 'Show less' : 'Read full description'}
        </button>
      </p>
    </div>
  );
};

interface BenefitPillar {
  title: string;
  description: string;
  icon: 'droplets' | 'clock' | 'shield' | 'zap' | 'flame' | 'sparkles' | 'award';
}

interface PackageProfile {
  kicker: string;
  badgeLabel: string;
  subtitle: string;
  description: string;
  pillars: BenefitPillar[];
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  headerGradient: string;
  ctaBg: string;
  ctaHover: string;
  optionActiveBg: string;
  optionActiveBorder: string;
  optionActiveRing: string;
  pillBg: string;
  pillText: string;
}

const PACKAGE_ENHANCED_PROFILES: Record<string, PackageProfile> = {
  prostate: {
    kicker: '★ BEST SELLER FOR MEN 40+ · PROVEN RELIEF',
    badgeLabel: '#1 Best Seller for Men',
    subtitle:
      'Sleep deeply through the night without waking up to pee. Restore strong, painless urine flow naturally.',
    description:
      'Tired of waking up 4, 5, or 6 times every single night just to strain and dribble weak drops of urine? This pure herbal solution shrinks swollen prostate tissue naturally, clears painful urinary burning, stops embarrassing leaks, and helps your bladder empty completely in seconds. Within days, you will enjoy unbroken night rest, wake up energized, and regain your peace of mind.',
    pillars: [
      {
        title: 'Sleep Soundly Through the Night',
        description:
          'Stops constant midnight bathroom urges so you can sleep uninterrupted from night till morning without exhausting awakenings.',
        icon: 'clock',
      },
      {
        title: 'Strong, Pain-Free Urine Stream',
        description:
          'Ends painful straining, hesitations, and weak dribbles. Empty your bladder effortlessly, fully, and in one go.',
        icon: 'droplets',
      },
      {
        title: 'Shrinks Swollen Prostate Naturally',
        description:
          'Soothes deep inflammation and relieves heavy pelvic pressure, lower belly tightness, and groin pain without surgery.',
        icon: 'shield',
      },
      {
        title: '100% Herbal & NAFDAC Approved',
        description:
          'Certified safe with zero dangerous side effects. No harmful chemicals, gentle on digestion, and 100% natural.',
        icon: 'award',
      },
    ],
    accentColor: '#047857',
    badgeBg: 'bg-[#047857]',
    badgeText: 'text-[#F3FAF6]',
    cardBorder:
      'border-[#047857]/30 ring-1 ring-[#047857]/15 shadow-[0_22px_60px_-15px_rgba(4,120,87,0.14)] hover:shadow-[0_28px_70px_-15px_rgba(4,120,87,0.22)]',
    headerGradient: 'bg-gradient-to-br from-[#F2FAF6] via-[#FAFDFB] to-[#E8F5EE]',
    ctaBg: 'bg-[#047857]',
    ctaHover: 'hover:bg-[#065F46]',
    optionActiveBg: 'bg-[#EDF7F2]',
    optionActiveBorder: 'border-[#047857]',
    optionActiveRing: 'ring-2 ring-[#047857]',
    pillBg: 'bg-[#DEF3E6]',
    pillText: 'text-[#047857]',
  },
  vitality: {
    kicker: '★ TOP RATED MALE ENDURANCE & STAMINA',
    badgeLabel: '#1 for Bedroom Power & Control',
    subtitle:
      'Regain rock-solid firmness on demand, last 35–45+ minutes, and satisfy your partner every single time.',
    description:
      'Never suffer from bedroom embarrassment or performance anxiety again. This potent herbal formula boosts your natural masculine energy, delivers rock-solid firmness whenever intimacy starts, and gives you complete staying power to last 35 to 45+ minutes. You will feel revitalized, confident, and recover quickly between rounds — with zero headache, zero racing heart, and zero chemical crashes.',
    pillars: [
      {
        title: 'Rock-Solid Firmness On Demand',
        description:
          'Boosts healthy blood circulation for firm, dependable stiffness whenever you and your partner are ready.',
        icon: 'zap',
      },
      {
        title: 'Last 35 to 45+ Minutes',
        description:
          'Overcomes quick finishes and gives you total control to satisfy your partner completely every round.',
        icon: 'clock',
      },
      {
        title: 'High Energy & Fast Recovery',
        description:
          'Recharges deep masculine stamina so you stay vigorous, strong, and ready for more without feeling drained or weak.',
        icon: 'flame',
      },
      {
        title: '100% Safe with Zero Side Effects',
        description:
          'Pure organic herbs that protect your heart and blood pressure — no pounding headache, no racing pulse, no dizzy spells.',
        icon: 'shield',
      },
    ],
    accentColor: '#B45309',
    badgeBg: 'bg-[#78350F]',
    badgeText: 'text-[#FDE68A]',
    cardBorder:
      'border-[#B45309]/30 ring-1 ring-[#B45309]/15 shadow-[0_22px_60px_-15px_rgba(180,83,9,0.14)] hover:shadow-[0_28px_70px_-15px_rgba(180,83,9,0.22)]',
    headerGradient: 'bg-gradient-to-br from-[#FDF8F0] via-[#FFFCF7] to-[#F8EFE0]',
    ctaBg: 'bg-[#92400E]',
    ctaHover: 'hover:bg-[#78350F]',
    optionActiveBg: 'bg-[#FEF6E9]',
    optionActiveBorder: 'border-[#B45309]',
    optionActiveRing: 'ring-2 ring-[#B45309]',
    pillBg: 'bg-[#FEF0D4]',
    pillText: 'text-[#92400E]',
  },
  joints: {
    kicker: '★ INSTANT KNEE, WAIST & JOINT RELIEF',
    badgeLabel: 'Fast Knee & Back Freedom',
    subtitle:
      'Walk, bend, and climb stairs freely without agonizing knee, back, or waist pain.',
    description:
      'Are stiff knees, painful waist, and creaking joints making simple everyday movements feel like punishment? This proven herbal formula lubricates dry joints, rebuilds worn-out cartilage cushions, and stops deep inflammation. Wake up without morning stiffness, walk freely to work or church, and enjoy comfortable, pain-free mobility again.',
    pillars: [
      {
        title: 'Stops Severe Knee & Waist Pain',
        description:
          'Quickly calms burning aches and throbbing joint soreness so you can walk, bend, and stand with complete ease.',
        icon: 'shield',
      },
      {
        title: 'Restores Joint Cushion & Oil',
        description:
          'Rebuilds natural cartilage lubrication, preventing painful bone-on-bone grinding, creaking, and wear-and-tear.',
        icon: 'droplets',
      },
      {
        title: 'Wake Up Without Morning Stiffness',
        description:
          'Rise from bed or stand up from low chairs effortlessly without hesitation, stiffness, or needing support.',
        icon: 'clock',
      },
      {
        title: 'NAFDAC Certified Pure Herbal Formula',
        description:
          '100% natural and gentle on the stomach. Tested, trusted, and safe for everyday long-term use without side effects.',
        icon: 'award',
      },
    ],
    accentColor: '#0E7490',
    badgeBg: 'bg-[#0E7490]',
    badgeText: 'text-white',
    cardBorder:
      'border-[#0E7490]/30 ring-1 ring-[#0E7490]/15 shadow-[0_22px_60px_-15px_rgba(14,116,144,0.14)]',
    headerGradient: 'bg-gradient-to-br from-[#F0F9FB] via-[#FDFEFE] to-[#E4F4F7]',
    ctaBg: 'bg-[#0E7490]',
    ctaHover: 'hover:bg-[#155E75]',
    optionActiveBg: 'bg-[#ECF7FA]',
    optionActiveBorder: 'border-[#0E7490]',
    optionActiveRing: 'ring-2 ring-[#0E7490]',
    pillBg: 'bg-[#DEF1F5]',
    pillText: 'text-[#0E7490]',
  },
  sugar: {
    kicker: '★ HEALTHY BLOOD SUGAR & DAILY ENERGY',
    badgeLabel: 'Natural Blood Sugar Control',
    subtitle:
      'Keep your blood sugar steady, stop constant fatigue, and end tingling numbness in your feet.',
    description:
      'Stop worrying about dangerous sugar spikes, constant thirst, and frightening numbness or burning sensations in your feet and palms. This herbal blend naturally supports your pancreas, keeps your sugar readings in a healthy balance, and shields your kidneys, eyes, and heart from long-term damage — so you stay vibrant, active, and energetic all day.',
    pillars: [
      {
        title: 'Keeps Blood Sugar Steady All Day',
        description:
          'Prevents sudden post-meal spikes and dangerous crashes, keeping your daily glucose numbers stable and balanced.',
        icon: 'zap',
      },
      {
        title: 'Ends Foot Numbness & Burning',
        description:
          'Restores healthy nerve sensation and blood circulation to eliminate foot pricking, burning, and sudden pain.',
        icon: 'shield',
      },
      {
        title: 'All-Day Stamina & No Fatigue',
        description:
          'Stops midday exhaustion, heavy legs, and constant sleepiness so you stay energetic from morning to night.',
        icon: 'droplets',
      },
      {
        title: 'Protects Eyes, Kidneys & Heart',
        description:
          'Strengthens your vital organs against complications, giving you total health protection and peace of mind.',
        icon: 'award',
      },
    ],
    accentColor: '#1D4ED8',
    badgeBg: 'bg-[#1D4ED8]',
    badgeText: 'text-white',
    cardBorder:
      'border-[#1D4ED8]/30 ring-1 ring-[#1D4ED8]/15 shadow-[0_22px_60px_-15px_rgba(29,78,216,0.14)]',
    headerGradient: 'bg-gradient-to-br from-[#F2F6FE] via-[#FDFEFE] to-[#E9EFFE]',
    ctaBg: 'bg-[#1D4ED8]',
    ctaHover: 'hover:bg-[#1E40AF]',
    optionActiveBg: 'bg-[#EEF4FE]',
    optionActiveBorder: 'border-[#1D4ED8]',
    optionActiveRing: 'ring-2 ring-[#1D4ED8]',
    pillBg: 'bg-[#DFEAFE]',
    pillText: 'text-[#1D4ED8]',
  },
  womens: {
    kicker: '★ TOTAL FEMININE HORMONAL BALANCE',
    badgeLabel: 'Pain-Free Periods & Hormonal Harmony',
    subtitle:
      'End painful menstrual cramps, irregular periods, hot flashes, and balance your hormones naturally.',
    description:
      'Experience peaceful, pain-free womanhood every month. This nourishing herbal remedy eases agonizing menstrual cramps, regulates unpredictable cycles, clears stubborn hormonal acne, and soothes uncomfortable hot flashes and mood swings. Balance your reproductive health and feel radiant, confident, and full of life.',
    pillars: [
      {
        title: 'Stops Severe Menstrual Cramps',
        description:
          'Quickly relaxes tight tummy muscles to eliminate severe monthly cramps and abdominal heaviness.',
        icon: 'clock',
      },
      {
        title: 'Regulates Irregular Periods',
        description:
          'Balances natural female hormones to restore regular, predictable, and healthy monthly cycles.',
        icon: 'shield',
      },
      {
        title: 'Cools Down Hot Flashes & Mood Swings',
        description:
          'Relieves sudden body heat, night sweats, and irritability so you feel calm, refreshed, and in control.',
        icon: 'flame',
      },
      {
        title: 'Glowing Skin & Feminine Energy',
        description:
          'Pure herbal adaptogens that boost your natural glow, restful sleep, and youthful vitality from within.',
        icon: 'award',
      },
    ],
    accentColor: '#BE185D',
    badgeBg: 'bg-[#BE185D]',
    badgeText: 'text-white',
    cardBorder:
      'border-[#BE185D]/30 ring-1 ring-[#BE185D]/15 shadow-[0_22px_60px_-15px_rgba(190,24,93,0.14)]',
    headerGradient: 'bg-gradient-to-br from-[#FDF2F7] via-[#FFFDFF] to-[#FAE4EE]',
    ctaBg: 'bg-[#BE185D]',
    ctaHover: 'hover:bg-[#9D174D]',
    optionActiveBg: 'bg-[#FDF0F6]',
    optionActiveBorder: 'border-[#BE185D]',
    optionActiveRing: 'ring-2 ring-[#BE185D]',
    pillBg: 'bg-[#F9DDE8]',
    pillText: 'text-[#BE185D]',
  },
  combo: {
    kicker: '★ ALL-IN-ONE MASTER BODY RESTORATION',
    badgeLabel: 'Ultimate Full-Body Cleanse & Power',
    subtitle:
      'The complete herbal regimen to renew your vital organs, supercharge stamina, and boost immunity.',
    description:
      'Why treat only one symptom when you can restore your entire body? This master combination cleanses your prostate, supports healthy kidneys and liver, supercharges your bedroom stamina, and fortifies your immune system. Experience maximum whole-body revitalization with Nigeria’s most trusted comprehensive health regimen.',
    pillars: [
      {
        title: 'Deep Organ Cleanse & Kidney Health',
        description:
          'Flushes harmful toxins, supports liver and kidney vitality, and restores youthful organ function.',
        icon: 'sparkles',
      },
      {
        title: 'Maximum Stamina & Bedroom Confidence',
        description:
          'Combines our best vitality boosters for powerful energy, lasting endurance, and unbreakable virility.',
        icon: 'shield',
      },
      {
        title: 'Unbreakable Immune Defense',
        description:
          'Builds a strong natural shield against frequent illnesses, chronic fatigue, and bodily weakness.',
        icon: 'zap',
      },
      {
        title: 'Best Value Multi-Bottle Bundle',
        description:
          'Get our complete medical-grade herbal regimen at our biggest discounted rate with free nationwide delivery.',
        icon: 'award',
      },
    ],
    accentColor: '#047857',
    badgeBg: 'bg-[#047857]',
    badgeText: 'text-white',
    cardBorder:
      'border-[#047857]/30 ring-1 ring-[#047857]/15 shadow-[0_22px_60px_-15px_rgba(4,120,87,0.14)]',
    headerGradient: 'bg-gradient-to-br from-[#F2FAF6] via-[#FAFDFB] to-[#E8F5EE]',
    ctaBg: 'bg-[#047857]',
    ctaHover: 'hover:bg-[#065F46]',
    optionActiveBg: 'bg-[#EDF7F2]',
    optionActiveBorder: 'border-[#047857]',
    optionActiveRing: 'ring-2 ring-[#047857]',
    pillBg: 'bg-[#DEF3E6]',
    pillText: 'text-[#047857]',
  },
};

function getDurationLabel(bottlesCount: number | string | null, optionIdx: number): string {
  const count =
    typeof bottlesCount === 'number'
      ? bottlesCount
      : parseInt(String(bottlesCount || ''), 10);
  if (count === 1) return '15-Day Trial Pack';
  if (count === 2) return '30-Day Starter Pack';
  if (count === 3) return '60-Day Complete Regimen (Best Value)';
  if (count === 4) return '90-Day Full Restoration Supply';
  if (count >= 5) return `${count}-Bottle Full Restoration Supply`;
  if (optionIdx === 0) return 'Starter Pack';
  if (optionIdx === 1) return '60-Day Regimen (Best Value)';
  return 'Full Treatment Pack';
}

interface PackageCardProps {
  pkg: PackageData;
  cardIndex: number;
  selectedIdx: number;
  onSelectOption: (pkg: PackageData, optionIdx: number) => void;
  onOpenCheckout: (pkg: PackageData, optionIdx: number) => void;
  onInspectDetail: (pkg: PackageData) => void;
  isBenefitsExpanded: boolean;
  onToggleBenefits: (pkgId: string) => void;
  whatsappTarget: string;
  badgeLabel?: string;
  badgeVariant?: 'prostate' | 'performance' | 'default';
  isHeroCard?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  cardIndex,
  selectedIdx,
  onSelectOption,
  onOpenCheckout,
  onInspectDetail,
  isBenefitsExpanded,
  onToggleBenefits,
  whatsappTarget,
  badgeLabel,
  badgeVariant,
  isHeroCard = false,
}) => {
  const pricing = computePackagePricing(pkg, selectedIdx);
  const galleryEntries = getPackageGalleryEntries(pkg);
  const theme = resolvePackageVisualTheme(pkg, cardIndex);
  const indexDisplay = String(cardIndex + 1).padStart(2, '0');

  const isProstateFocus =
    badgeVariant === 'prostate' ||
    (pkg.package_code || '').trim().toUpperCase() === 'P001' ||
    (pkg.name || '').toLowerCase().includes('prostate');

  const isPerformanceFocus =
    badgeVariant === 'performance' ||
    (pkg.package_code || '').trim().toUpperCase() === 'P002' ||
    (pkg.name || '').toLowerCase().includes('performance') ||
    (pkg.name || '').toLowerCase().includes('stamina') ||
    (pkg.name || '').toLowerCase().includes('weak erection');

  const enhancedProfile = isProstateFocus
    ? PACKAGE_ENHANCED_PROFILES.prostate
    : isPerformanceFocus
      ? PACKAGE_ENHANCED_PROFILES.vitality
      : matchesSymptomCategory(pkg, 'joints')
        ? PACKAGE_ENHANCED_PROFILES.joints
        : matchesSymptomCategory(pkg, 'sugar')
          ? PACKAGE_ENHANCED_PROFILES.sugar
          : matchesSymptomCategory(pkg, 'womens')
            ? PACKAGE_ENHANCED_PROFILES.womens
            : pkg.is_combo || (pkg.name || '').toLowerCase().includes('combo')
              ? PACKAGE_ENHANCED_PROFILES.combo
              : null;

  const cardBorderClass = enhancedProfile
    ? enhancedProfile.cardBorder
    : `${theme.cardBorderClass} shadow-[0_16px_40px_-16px_rgba(15,31,24,0.08)] hover:shadow-[0_22px_50px_-16px_rgba(15,31,24,0.14)]`;

  const headerBgClass = enhancedProfile
    ? enhancedProfile.headerGradient
    : theme.headerBgClass;

  const accentColor = enhancedProfile
    ? enhancedProfile.accentColor
    : isProstateFocus
      ? '#047857'
      : isPerformanceFocus
        ? '#B45309'
        : '#047857';

  // Description: prefer authoritative profile copy if available to eliminate crude/scattered text
  const displayDescription =
    enhancedProfile?.description || pkg.description || '';

  // Benefits / Pillars
  const rawBenefits = Array.isArray(pkg.health_benefits)
    ? pkg.health_benefits.filter((b) => b && b.trim().length > 0)
    : [];

  const getWhatsAppHref = () => {
    const activeLabel = pricing.activeOption ? ` (${pricing.activeOption.bottles})` : '';
    const msg = `Hello ${CONFIG.company.name}, I would like to order ${pkg.name}${activeLabel} on Pay on Delivery.`;
    return buildWhatsAppUrl(whatsappTarget, msg);
  };

  const renderPillarIcon = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return <Clock className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      case 'droplets':
        return <Droplets className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      case 'shield':
        return <ShieldCheck className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      case 'zap':
        return <Zap className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      case 'flame':
        return <Flame className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      case 'award':
        return <Award className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      case 'sparkles':
        return <Sparkles className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
      default:
        return <CheckCircle2 className="w-5.5 h-5.5 shrink-0" style={{ color: accentColor }} />;
    }
  };

  return (
    <article
      id={`package-card-${pkg.package_code || cardIndex}`}
      className={`relative bg-white rounded-3xl border border-slate-200/90 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1.5 group ${cardBorderClass} ${
        isHeroCard ? 'ring-2 ring-emerald-500/30' : ''
      }`}
    >
      {/* Urgency Badge - Top Center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-5 py-1 rounded-b-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-md animate-bounce">
        Limited Stock · Pay on Delivery Available
      </div>

      {/* 1. Identity Header */}
      <div className={`${headerBgClass} px-5 sm:px-8 pt-7 sm:pt-8 pb-5 border-b border-slate-200/90 space-y-3.5`}>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {isProstateFocus ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#047857] text-white text-xs font-black uppercase tracking-wider shadow-xs">
                <Sparkles size={13} className="text-white" />
                {badgeLabel || enhancedProfile?.badgeLabel || '#1 Best Seller for Men'}
              </span>
            ) : isPerformanceFocus ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#78350F] text-[#FDE68A] border border-[#92400E]/40 text-xs font-black uppercase tracking-wider shadow-xs">
                <Flame size={13} className="text-[#FDE68A]" />
                {badgeLabel || enhancedProfile?.badgeLabel || '#1 for Bedroom Power & Control'}
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-black uppercase tracking-wider ${theme.accentTextClass} shadow-2xs`}>
                Package {indexDisplay} · {theme.categoryLabel}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 border border-slate-200 text-xs font-black text-slate-800 shadow-2xs">
              <ShieldCheck size={14} className="text-[#047857]" />
              NAFDAC Certified
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="bg-white/95 text-slate-900 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200 shadow-xs">
              {pkg.package_code || 'PACKAGE'}
            </span>
            <span className="bg-emerald-600/95 text-white px-2.5 py-1 rounded-md text-[10px] font-black border border-emerald-500 shadow-xs">
              Free Express Dispatch
            </span>
          </div>
        </div>

        {/* Title, Kicker & Benefit Subtitle */}
        <div className="space-y-1.5">
          {enhancedProfile?.kicker && (
            <div className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
              {enhancedProfile.kicker}
            </div>
          )}

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
              <span className={isProstateFocus ? 'text-[#047857]' : isPerformanceFocus ? 'text-[#B45309]' : 'text-emerald-600'}>
                {isProstateFocus ? 'Wellness Pack: ' : isPerformanceFocus ? 'Performance Pack: ' : 'Wellness Pack: '}
              </span>
              {pkg.name}
            </h3>

            <div className="tabular-nums text-left sm:text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₦{pricing.currentPrice.toLocaleString()}
              </span>
              {pricing.savings > 0 && (
                <span className="ml-2 text-sm sm:text-base text-slate-400 line-through font-bold">
                  ₦{pricing.retailPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {enhancedProfile?.subtitle && (
            <p
              className="text-sm sm:text-base font-semibold leading-relaxed"
              style={{ color: accentColor }}
            >
              {enhancedProfile.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 2. Studio Product Stage Gallery */}
      <div className="border-b border-slate-200/80 bg-slate-50/50">
        <StudioProductStage
          entries={galleryEntries}
          alt={pkg.name}
          heightClassName="h-[280px] sm:h-[320px] md:h-[340px] lg:h-[370px]"
          studioGradientClass={theme.studioGradientClass}
          optimizeWidth={1200}
          onInspect={() => onInspectDetail(pkg)}
        />
      </div>

      {/* 3. Package Information Body */}
      <div className="p-5 sm:p-7 lg:p-8 flex-1 flex flex-col justify-between space-y-6 bg-white">
        <div className="space-y-5">
          {/* Solution Highlight Box */}
          {displayDescription && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>What This Solution Does For You:</span>
              </div>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                {displayDescription}
              </p>
            </div>
          )}

          {/* Ratings & Social Proof Strip */}
          <div className="flex items-center justify-between gap-1 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200/70 font-black">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-slate-700 font-black">10,000+ Satisfied Customers · 4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-widest">
              <Award size={14} />
              100% Organic · NAFDAC Approved
            </div>
          </div>

          {/* Key Health Benefits & Pillars (High-Converting Benefit Cards) */}
          {enhancedProfile?.pillars ? (
            <div className="space-y-3">
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>What You Will Experience:</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">NAFDAC Certified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enhancedProfile.pillars.map((pillar, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200/70 bg-white hover:bg-emerald-50/30 hover:border-emerald-300 transition-all flex items-start gap-3 shadow-2xs"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-100/80 shadow-2xs shrink-0 mt-0.5">
                      {renderPillarIcon(pillar.icon)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        {pillar.title}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {pillar.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : rawBenefits.length > 0 ? (
            <div className="space-y-2.5">
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>What You Will Experience:</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">NAFDAC Certified</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(isBenefitsExpanded ? rawBenefits : rawBenefits.slice(0, 4)).map((benefit, bIdx) => (
                  <div
                    key={bIdx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              {rawBenefits.length > 4 && (
                <button
                  type="button"
                  onClick={() => onToggleBenefits(pkg.id)}
                  className="text-xs sm:text-sm font-black text-emerald-700 hover:underline cursor-pointer"
                >
                  {isBenefitsExpanded ? 'Show fewer benefits' : `+ Show ${rawBenefits.length - 4} more benefits`}
                </button>
              )}
            </div>
          ) : null}

          {/* 4. Treatment Duration Selector (Bottle Pack Option Pills) */}
          {pkg.options && pkg.options.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Step 1: Choose Treatment Duration</span>
                <span className="text-xs font-bold text-emerald-700">Multi-Bottle Savings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {pkg.options.map((opt, oIdx) => {
                  const isSel = oIdx === selectedIdx;
                  const bottleNum = extractBottleCount(opt.bottles);
                  const durationLabel = getDurationLabel(bottleNum, oIdx);
                  const optPriceInfo = resolveSingleOptionPricing(
                    opt,
                    Number(pkg.discount) || 0
                  );
                  const isRecommended =
                    opt.bottles.toLowerCase().includes('3 bottle') ||
                    (pkg.options.length >= 3 && oIdx === 1);

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => onSelectOption(pkg, oIdx)}
                      className={`relative p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-3 left-3 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
                          ★ Most Popular Choice
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            {optPriceInfo.label}
                          </span>
                          {optPriceInfo.discountPercent > 0 && (
                            <span className="text-[10px] sm:text-xs font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                              -{optPriceInfo.discountPercent}%
                            </span>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                          {durationLabel}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ₦{optPriceInfo.sellingPrice.toLocaleString()}
                        </span>
                        {optPriceInfo.savings > 0 && (
                          <span className="text-xs sm:text-sm text-slate-400 line-through font-bold">
                            ₦{optPriceInfo.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Included in Pack Details */}
              {pricing.includedList.length > 0 && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black text-slate-900">Supplements included in this parcel: </strong>
                    <span className="font-medium text-slate-600">{pricing.includedList.join(' · ')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Pricing Section & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 mt-auto space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900">
                ₦{pricing.currentPrice.toLocaleString()}
              </span>
              {pricing.savings > 0 && (
                <span className="text-base sm:text-lg text-slate-400 line-through font-bold">
                  ₦{pricing.retailPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end shrink-0">
              {pkg.options && pkg.options.length > 0 && (
                <div className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 border border-emerald-200">
                  {pkg.options.length} Sizes Available
                </div>
              )}
              <div className="text-[10px] md:text-xs font-black text-red-600 uppercase tracking-tighter mb-0.5 flex items-center gap-1">
                <Flame size={12} className="animate-pulse" />
                Only 5 Packs Left Today!
              </div>
              <div className="w-20 sm:w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[85%] rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs sm:text-sm text-emerald-700 font-black">
              {pricing.savings > 0
                ? `Save ₦${pricing.savings.toLocaleString()} (${pricing.discount}% Off) · Free Nationwide Delivery`
                : 'Free Nationwide Delivery · Pay on Delivery'}
            </div>
            <button
              type="button"
              onClick={() => onInspectDetail(pkg)}
              className="text-xs sm:text-sm font-black text-slate-500 hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
            >
              View Full Pack Details
            </button>
          </div>

          {/* Action Buttons - Refined Size & Clear Messaging */}
          <div className="pt-1 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onOpenCheckout(pkg, selectedIdx)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all shadow-lg shadow-emerald-700/20 active:scale-[0.98] flex flex-col items-center justify-center cursor-pointer animate-shimmer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="shrink-0" />
                <span>Order on Delivery Now</span>
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </div>
              <span className="text-xs text-emerald-100 font-medium mt-0.5">
                Pay ₦0 Upfront · Doorstep Inspection Before Payment
              </span>
            </button>

            <a
              href={getWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                try {
                  trackWhatsAppClick(`Ad Package Card Chat: ${pkg.name}`);
                } catch {}
              }}
              className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 sm:py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <MessageCircle size={16} className="text-[#25D366] shrink-0" />
              <span>Chat with a Health Specialist on WhatsApp</span>
            </a>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500 uppercase tracking-wider pt-1">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Pay on Delivery
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Truck size={13} className="text-emerald-600" /> Free 24–48hr Dispatch
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" /> NAFDAC Certified
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export const AdLandingPage: React.FC<AdLandingPageProps> = ({
  products,
  packages,
  combos,
  isLoading = false,
  distributorId,
  onOrderSuccess,
}) => {
  const adIntent = useMemo(() => resolveAdIntent(), []);
  const { whatsappTarget, contactPhone } = useCompanyWhatsApp();

  const allBundles = useMemo(() => {
    const map = new Map<string, PackageData>();
    for (const pkg of [...packages, ...combos]) {
      if (pkg && pkg.id && !map.has(pkg.id)) {
        let normalized = { ...pkg };
        const codeUpper = (pkg.package_code || '').trim().toUpperCase();
        const nameLower = (pkg.name || '').toLowerCase();

        // Standardize compliant focus names
        if (codeUpper === 'P001' || nameLower.includes('prostate')) {
          normalized.name = 'Natural Prostate Care Formula';
          normalized.package_code = pkg.package_code || 'P001';
        } else if (
          codeUpper === 'P002' ||
          nameLower.includes('performance') ||
          nameLower.includes('stamina') ||
          nameLower.includes('weak erection') ||
          nameLower.includes('premature ejaculation') ||
          nameLower.includes('reodoe')
        ) {
          normalized.name = 'Male Performance & Stamina';
          normalized.package_code = pkg.package_code || 'P002';
        }

        map.set(pkg.id, normalized);
      }
    }

    const rawList = Array.from(map.values());

    // Priority rank order:
    // 1. Natural Prostate Care Formula
    // 2. Male Performance & Stamina
    // 3. All other wellness bundles
    return rawList.sort((a, b) => {
      const getRank = (p: PackageData): number => {
        const code = (p.package_code || '').trim().toUpperCase();
        const name = (p.name || '').toLowerCase();
        if (code === 'P001' || name.includes('prostate')) return 1;
        if (
          code === 'P002' ||
          name.includes('performance') ||
          name.includes('stamina') ||
          name.includes('weak erection')
        )
          return 2;
        return 3;
      };
      return getRank(a) - getRank(b);
    });
  }, [packages, combos]);

  // Primary Center-of-Focus bundles: Prostate Card followed by Male Performance Card
  const prostateBundle = useMemo<PackageData | null>(() => {
    if (allBundles.length === 0) return null;
    return (
      allBundles.find((p) => {
        const code = (p.package_code || '').trim().toUpperCase();
        const name = (p.name || '').toLowerCase();
        return code === 'P001' || name.includes('prostate');
      }) || allBundles[0]
    );
  }, [allBundles]);

  const performanceBundle = useMemo<PackageData | null>(() => {
    if (allBundles.length <= 1) return null;
    return (
      allBundles.find((p) => {
        const code = (p.package_code || '').trim().toUpperCase();
        const name = (p.name || '').toLowerCase();
        return (
          code === 'P002' ||
          name.includes('performance') ||
          name.includes('stamina') ||
          name.includes('weak erection')
        );
      }) || allBundles[1]
    );
  }, [allBundles]);

  const otherBundles = useMemo<PackageData[]>(() => {
    return allBundles.filter((b) => {
      const isProstate = b.id === prostateBundle?.id;
      const isPerformance = b.id === performanceBundle?.id;
      return !isProstate && !isPerformance;
    });
  }, [allBundles, prostateBundle, performanceBundle]);

  const [activeFilter, setActiveFilter] = useState<FilterTabId>(adIntent.category);
  const [showOtherPacks, setShowOtherPacks] = useState(false);
  const isDedicatedConditionLanding = adIntent.category !== 'all';
  const activeTabObj = SYMPTOM_TABS.find((t) => t.id === activeFilter);
  const activeCategoryLabel = activeTabObj ? activeTabObj.label : 'Wellness Focus';

  const prioritizedStories = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'singles') return CUSTOMER_STORIES;
    return [...CUSTOMER_STORIES].sort((a, b) => {
      const matchA = a.category === activeFilter ? 1 : 0;
      const matchB = b.category === activeFilter ? 1 : 0;
      return matchB - matchA;
    });
  }, [activeFilter]);

  const [packageOptionMap, setPackageOptionMap] = useState<Record<string, number>>({});
  const [productOptionMap, setProductOptionMap] = useState<Record<string, number>>({});
  const [expandedBenefitsMap, setExpandedBenefitsMap] = useState<Record<string, boolean>>({});
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const [expressModalState, setExpressModalState] = useState<{
    isOpen: boolean;
    item: PackageData | Product | null;
    type: 'package' | 'product';
    optionIdx: number;
  }>({
    isOpen: false,
    item: null,
    type: 'package',
    optionIdx: 0,
  });

  const [inlineTarget, setInlineTarget] = useState<{
    item: PackageData | Product | null;
    type: 'package' | 'product';
    optionIdx: number;
  }>({
    item: null,
    type: 'package',
    optionIdx: 0,
  });

  const [detailModalItem, setDetailModalItem] = useState<{
    item: PackageData | Product;
    type: 'package' | 'product';
  } | null>(null);

  const [activePolicyModal, setActivePolicyModal] = useState<
    'return-policy' | 'privacy-policy' | 'terms-of-service' | null
  >(null);

  useEffect(() => {
    captureAndPersistAdAttribution();

    const prevTitle = document.title;
    document.title = adIntent.pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevMeta = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute('content', adIntent.metaDescription);
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevMeta) {
        metaDesc.setAttribute('content', prevMeta);
      }
    };
  }, [adIntent]);

  useEffect(() => {
    const onScroll = () => {
      setShowMobileBar(window.scrollY > 280);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const defaultBundle = useMemo<PackageData | null>(() => {
    if (allBundles.length === 0) return null;
    if (adIntent.requestedPackageCode) {
      const codeMatch = allBundles.find(
        (b) => (b.package_code || '').toUpperCase() === adIntent.requestedPackageCode
      );
      if (codeMatch) return codeMatch;
    }
    if (adIntent.category !== 'all') {
      const catMatch = allBundles.find((b) => matchesSymptomCategory(b, adIntent.category));
      if (catMatch) return catMatch;
    }
    return allBundles[0];
  }, [allBundles, adIntent]);

  // Keep inlineTarget & modal item synchronized with live Admin catalog refreshes
  useEffect(() => {
    if (!inlineTarget.item && defaultBundle) {
      setInlineTarget({
        item: defaultBundle,
        type: 'package',
        optionIdx: getDefaultOptionIdx(defaultBundle.options),
      });
      return;
    }
    if (!inlineTarget.item && products.length > 0) {
      setInlineTarget({
        item: products[0],
        type: 'product',
        optionIdx: getDefaultOptionIdx(products[0].options),
      });
      return;
    }
    if (inlineTarget.item && inlineTarget.type === 'package') {
      const updatedPkg = allBundles.find((b) => b.id === inlineTarget.item?.id);
      if (updatedPkg && updatedPkg !== inlineTarget.item) {
        setInlineTarget((prev) => ({ ...prev, item: updatedPkg }));
      }
    } else if (inlineTarget.item && inlineTarget.type === 'product') {
      const updatedProd = products.find((p) => p.id === inlineTarget.item?.id);
      if (updatedProd && updatedProd !== inlineTarget.item) {
        setInlineTarget((prev) => ({ ...prev, item: updatedProd }));
      }
    }
  }, [defaultBundle, allBundles, products, inlineTarget.item, inlineTarget.type]);

  const getPkgOptionIdx = (pkg: PackageData): number => {
    if (packageOptionMap[pkg.id] !== undefined) return packageOptionMap[pkg.id];
    return getDefaultOptionIdx(pkg.options);
  };

  const getProdOptionIdx = (prod: Product): number => {
    if (productOptionMap[prod.id] !== undefined) return productOptionMap[prod.id];
    return getDefaultOptionIdx(prod.options);
  };

  const categoryCounts = useMemo<Record<FilterTabId, number>>(() => {
    const counts: Record<FilterTabId, number> = {
      all: allBundles.length,
      prostate: 0,
      womens: 0,
      vitality: 0,
      joints: 0,
      sugar: 0,
      cardio: 0,
      singles: products.length,
    };
    for (const pkg of allBundles) {
      if (matchesSymptomCategory(pkg, 'prostate')) counts.prostate += 1;
      if (matchesSymptomCategory(pkg, 'womens')) counts.womens += 1;
      if (matchesSymptomCategory(pkg, 'vitality')) counts.vitality += 1;
      if (matchesSymptomCategory(pkg, 'joints')) counts.joints += 1;
      if (matchesSymptomCategory(pkg, 'sugar')) counts.sugar += 1;
      if (matchesSymptomCategory(pkg, 'cardio')) counts.cardio += 1;
    }
    return counts;
  }, [allBundles, products.length]);

  const visibleSymptomTabs = useMemo(() => {
    return SYMPTOM_TABS.filter((tab) => {
      if (tab.id === 'all') return true;
      if (tab.id === 'singles') return products.length > 0;
      if (allBundles.length === 0) return true;
      return categoryCounts[tab.id] > 0 || adIntent.category === tab.id;
    });
  }, [allBundles.length, products.length, categoryCounts, adIntent.category]);

  const categoryFilteredBundles = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'singles') return allBundles;
    return allBundles.filter((pkg) => matchesSymptomCategory(pkg, activeFilter));
  }, [allBundles, activeFilter]);

  const hasExactCategoryMatch =
    activeFilter === 'all' ||
    activeFilter === 'singles' ||
    categoryFilteredBundles.length > 0;

  const bundlesToDisplay = hasExactCategoryMatch ? categoryFilteredBundles : allBundles;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectCategory = (tabId: FilterTabId) => {
    setActiveFilter(tabId);

    if (tabId === 'singles') {
      if (products.length > 0) {
        const firstProd = products[0];
        setInlineTarget({
          item: firstProd,
          type: 'product',
          optionIdx: getProdOptionIdx(firstProd),
        });
      }
    } else if (tabId === 'all') {
      const fallbackPkg = defaultBundle || allBundles[0];
      if (fallbackPkg) {
        setInlineTarget({
          item: fallbackPkg,
          type: 'package',
          optionIdx: getPkgOptionIdx(fallbackPkg),
        });
      }
    } else {
      const matched = allBundles.filter((pkg) => matchesSymptomCategory(pkg, tabId));
      if (matched.length > 0) {
        const primaryPkg = matched[0];
        setInlineTarget({
          item: primaryPkg,
          type: 'package',
          optionIdx: getPkgOptionIdx(primaryPkg),
        });
      }
    }
  };

  const handleSelectPackageOption = (pkg: PackageData, oIdx: number) => {
    setPackageOptionMap((prev) => ({
      ...prev,
      [pkg.id]: oIdx,
    }));
    setInlineTarget({
      item: pkg,
      type: 'package',
      optionIdx: oIdx,
    });
    const opt = pkg.options?.[oIdx];
    if (opt) {
      const optPriceInfo = resolveSingleOptionPricing(opt, Number(pkg.discount) || 0);
      trackAdBundleSelect(pkg.name, optPriceInfo.label, optPriceInfo.sellingPrice);
    }
  };

  const openExpressCheckout = (
    item: PackageData | Product,
    type: 'package' | 'product',
    optionIdx: number
  ) => {
    setInlineTarget({ item, type, optionIdx });
    setExpressModalState({
      isOpen: true,
      item,
      type,
      optionIdx,
    });
  };

  const getAdvisorWhatsAppHref = (customSubject?: string): string => {
    const message = customSubject
      ? `Hello ${CONFIG.company.name}, I am visiting your Wellness Packs page and would like guidance on ${customSubject}.`
      : `Hello ${CONFIG.company.name}, I would like guidance on choosing the right GHT herbal wellness pack with Pay on Delivery.`;
    return buildWhatsAppUrl(whatsappTarget, message);
  };

  const recordAdvisorWhatsAppClick = (contextLabel: string) => {
    try {
      trackWhatsAppClick(contextLabel);
    } catch {
      // Never block native WhatsApp link navigation if analytics fails
    }
  };

  const defaultBundleOptIdx = defaultBundle ? getPkgOptionIdx(defaultBundle) : 0;
  const defaultBundlePricing = defaultBundle
    ? computePackagePricing(defaultBundle, defaultBundleOptIdx)
    : null;

  const inlineGallery = useMemo<GalleryImageEntry[]>(() => {
    if (!inlineTarget.item) return [];
    if (inlineTarget.type === 'package') {
      return getPackageGalleryEntries(inlineTarget.item as PackageData);
    }
    const p = inlineTarget.item as Product;
    return p.image_url ? [{ url: p.image_url, label: p.name }] : [];
  }, [inlineTarget]);

  const inlineSummaryPricing = useMemo(() => {
    if (!inlineTarget.item) return null;
    if (inlineTarget.type === 'package') {
      return computePackagePricing(inlineTarget.item as PackageData, inlineTarget.optionIdx);
    }
    const p = computeProductPricing(inlineTarget.item as Product, inlineTarget.optionIdx);
    return { ...p, includedList: [] as string[] };
  }, [inlineTarget]);

  const mobileBarItem = inlineTarget.item || defaultBundle;
  const mobileBarPricing = useMemo(() => {
    if (!mobileBarItem) return null;
    if (inlineTarget.item) {
      return inlineTarget.type === 'package'
        ? computePackagePricing(inlineTarget.item as PackageData, inlineTarget.optionIdx)
        : computeProductPricing(inlineTarget.item as Product, inlineTarget.optionIdx);
    }
    return defaultBundlePricing;
  }, [mobileBarItem, inlineTarget, defaultBundlePricing]);

  const showSkeletonState = isLoading && allBundles.length === 0 && products.length === 0;

  const brandLogoSrc = useMemo(() => {
    if (!CONFIG.company.logoUrl) return '';
    return getOptimizedImageUrl(CONFIG.company.logoUrl, 240) || CONFIG.company.logoUrl;
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#14261E] font-[family-name:var(--font-soft-body)] antialiased pb-20 lg:pb-0">
      {/* 1. Strict 3-Zone Top Bar — Official Company Logo & Name + Calm Adult Navigation */}
      <header className="lg:sticky lg:top-0 z-40 h-[64px] sm:h-[72px] bg-white/95 backdrop-blur-xs border-b border-[#DCE5E0]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
          {/* Zone 1: Official Company Logo + Company Name Lockup */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left shrink-0 cursor-pointer group"
            title={CONFIG.company.name}
          >
            {brandLogoSrc && !logoLoadFailed ? (
              <img
                src={brandLogoSrc}
                alt={CONFIG.company.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const imgEl = e.currentTarget;
                  if (CONFIG.company.logoUrl && imgEl.src !== CONFIG.company.logoUrl) {
                    imgEl.src = CONFIG.company.logoUrl;
                  } else {
                    setLogoLoadFailed(true);
                  }
                }}
                className="h-9 sm:h-11 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#0E261D] flex items-center justify-center text-[#95E4B9] shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}

            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[16px] phablet:text-[18px] sm:text-[21px] font-black tracking-tight text-[#14261E] leading-[1.15] whitespace-nowrap">
                {CONFIG.company.name}
              </span>
              {CONFIG.company.subtitle && (
                <span className="text-[12px] sm:text-[13px] font-bold text-[#047857] tracking-[0.03em] leading-none mt-1 whitespace-nowrap">
                  {CONFIG.company.subtitle}
                </span>
              )}
            </div>
          </button>

          {/* Zone 2: 4 concise single-line navigation links on desktop */}
          <nav
            aria-label="Landing page sections"
            className="hidden lg:flex items-center gap-8 text-[16px] sm:text-[17px] font-semibold text-[#283B32]"
          >
            <button
              type="button"
              onClick={() => scrollToSection('hero-cards')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Prostate Care
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('package-card-P002')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Male Stamina
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-pod-works')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              How Delivery Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ad-reviews')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reviews
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('express-order')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Order Form
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <button
            type="button"
            onClick={() => scrollToSection('express-order')}
            className="min-h-[46px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 rounded-xl bg-[#0E261D] hover:bg-[#065F46] text-white text-[15px] sm:text-[16px] font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <span className="sm:hidden">Order Now</span>
            <span className="hidden sm:inline">Order on Delivery</span>
          </button>
        </div>
      </header>

      {/* 2. Refined Botanical Hero Section — Right Hero Heading + Prostate Card #1 + Male Performance Card #2 */}
      <section className="relative bg-[#0E261D] text-[#FAF9F5] border-b border-[#1D3E31] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_120%_at_90%_0%,rgba(16,185,129,0.18)_0%,rgba(14,38,29,0)_60%),radial-gradient(65%_90%_at_5%_100%,rgba(217,185,120,0.09)_0%,rgba(14,38,29,0)_55%)]"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-8 sm:space-y-10">
          {/* Hero Editorial Heading & Value Proposition */}
          <div className="max-w-3xl space-y-4 sm:space-y-5">
            <p className="text-[15px] sm:text-[16.5px] font-bold text-[#95E4B9] tracking-[0.03em] uppercase leading-snug">
              {adIntent.kicker}
            </p>

            <h1 className="text-2xl phablet:text-3xl sm:text-4xl lg:text-[2.85rem] font-black text-[#FAF9F5] tracking-tight leading-[1.18] [text-wrap:balance]">
              {adIntent.headline}
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#E4EDE7] leading-relaxed max-w-2xl font-medium">
              {adIntent.subheadline}
            </p>

            {/* Direct Assurance Actions */}
            <div className="pt-2.5 flex flex-wrap items-center gap-3.5 sm:gap-4.5">
              <button
                type="button"
                onClick={() => scrollToSection('express-order')}
                className="min-h-[58px] sm:min-h-[62px] px-7 sm:px-8 py-3.5 rounded-2xl bg-[#F5FAF7] hover:bg-white text-[#0E261D] text-[17.5px] sm:text-[18.5px] font-extrabold transition-all inline-flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer shadow-md hover:shadow-lg"
              >
                <span>Order on Delivery Form</span>
                <ArrowDown className="w-5 h-5 text-[#047857] shrink-0" />
              </button>

              <a
                href={getAdvisorWhatsAppHref("Men's Prostate & Stamina Formulations")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordAdvisorWhatsAppClick('Ad Hero Specialist')}
                className="min-h-[58px] sm:min-h-[62px] px-6 sm:px-7 py-3.5 rounded-2xl border border-white/35 bg-white/[0.1] hover:bg-white/[0.18] text-[#FAF9F5] text-[17px] sm:text-[18px] font-bold transition-colors inline-flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-[#95E4B9] shrink-0" />
                <span>Speak with a Specialist</span>
              </a>

              <a
                href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 text-[16.5px] sm:text-[17.5px] font-bold text-[#D7E8DE] hover:text-white transition-colors py-2 sm:pl-1 tabular-nums whitespace-nowrap"
              >
                <Phone className="w-4.5 h-4.5 text-[#95E4B9] shrink-0" />
                <span>Call {contactPhone}</span>
              </a>
            </div>
          </div>

          {/* Architectural 3-Column Doorstep Assurance Ledger */}
          <div className="pt-6 sm:pt-7 border-t border-white/16 grid grid-cols-3 gap-3 sm:gap-8 divide-x divide-white/16">
            <div className="pr-1.5 sm:pr-4">
              <div className="text-[15.5px] phablet:text-[17px] sm:text-[18.5px] font-bold text-[#FAF9F5] leading-snug">
                <span className="hidden lg:inline">Pay ₦0 Upfront — </span>
                <span>Pay on Delivery</span>
              </div>
              <div className="text-[14px] sm:text-[15.5px] text-[#CDE2D6] leading-snug mt-1.5">
                Inspect seals before paying
              </div>
            </div>

            <div className="pl-3 sm:pl-8 pr-1.5 sm:pr-4">
              <div className="text-[15.5px] phablet:text-[17px] sm:text-[18.5px] font-bold text-[#FAF9F5] leading-snug">
                <span className="sm:hidden">Free Dispatch</span>
                <span className="hidden sm:inline">Free Nationwide Delivery</span>
              </div>
              <div className="text-[14px] sm:text-[15.5px] text-[#CDE2D6] leading-snug mt-1.5 tabular-nums">
                24–48 hrs to all 36 states
              </div>
            </div>

            <div className="pl-3 sm:pl-8">
              <div className="text-[15.5px] phablet:text-[17px] sm:text-[18.5px] font-bold text-[#FAF9F5] leading-snug">
                <span className="phablet:hidden">NAFDAC Reg.</span>
                <span className="hidden phablet:inline">NAFDAC Certified</span>
              </div>
              <div className="text-[14px] sm:text-[15.5px] text-[#CDE2D6] leading-snug mt-1.5">
                Genuine GHT herbal packs
              </div>
            </div>
          </div>

          {/* DISPLAY THE PROSTATE CARD IN HERO THEN FOLLOW BY MALE PERFORMANCE CARD */}
          <div id="hero-cards" className="pt-4 sm:pt-6 scroll-mt-24 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-white/90 pb-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-wider text-[#95E4B9] uppercase font-sans">
                <Sparkles className="w-4 h-4 shrink-0 text-[#95E4B9]" />
                <span>★ Most Popular Formulations · Select Pack &amp; Order on Delivery</span>
              </div>
              <div className="text-xs sm:text-sm text-[#D4E6DC] font-semibold hidden sm:block">
                Free Nationwide Delivery · Inspect seals at your doorstep before payment
              </div>
            </div>

            {showSkeletonState ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {[0, 1].map((skeletonKey) => (
                  <div
                    key={skeletonKey}
                    className="bg-white rounded-[26px] border border-[#DCE5E0] overflow-hidden animate-pulse"
                  >
                    <div className="h-24 bg-[#EEF4F1]" />
                    <div className="h-[320px] bg-[#F6F9F7]" />
                    <div className="p-6 space-y-4">
                      <div className="h-5 w-3/4 bg-slate-200 rounded" />
                      <div className="h-16 w-full bg-slate-100 rounded-xl" />
                      <div className="h-14 w-full bg-emerald-100 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
                {/* Card 1: Natural Prostate Care Formula */}
                {prostateBundle && (
                  <PackageCard
                    pkg={prostateBundle}
                    cardIndex={0}
                    selectedIdx={getPkgOptionIdx(prostateBundle)}
                    onSelectOption={handleSelectPackageOption}
                    onOpenCheckout={(pkg, optIdx) => openExpressCheckout(pkg, 'package', optIdx)}
                    onInspectDetail={(pkg) => setDetailModalItem({ item: pkg, type: 'package' })}
                    isBenefitsExpanded={Boolean(expandedBenefitsMap[prostateBundle.id])}
                    onToggleBenefits={(pkgId) =>
                      setExpandedBenefitsMap((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }))
                    }
                    whatsappTarget={whatsappTarget}
                    badgeLabel="Recommended First Step · Package 01"
                    badgeVariant="prostate"
                    isHeroCard={true}
                  />
                )}

                {/* Card 2: Male Performance & Stamina */}
                {performanceBundle && (
                  <PackageCard
                    pkg={performanceBundle}
                    cardIndex={1}
                    selectedIdx={getPkgOptionIdx(performanceBundle)}
                    onSelectOption={handleSelectPackageOption}
                    onOpenCheckout={(pkg, optIdx) => openExpressCheckout(pkg, 'package', optIdx)}
                    onInspectDetail={(pkg) => setDetailModalItem({ item: pkg, type: 'package' })}
                    isBenefitsExpanded={Boolean(expandedBenefitsMap[performanceBundle.id])}
                    onToggleBenefits={(pkgId) =>
                      setExpandedBenefitsMap((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }))
                    }
                    whatsappTarget={whatsappTarget}
                    badgeLabel="Core Regimen · Package 02"
                    badgeVariant="performance"
                    isHeroCard={true}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Condition-Specific Spotlight (if URL has a dedicated non-male condition like ?condition=joints or ?condition=sugar) */}
      {isDedicatedConditionLanding &&
        activeFilter !== 'all' &&
        activeFilter !== 'prostate' &&
        activeFilter !== 'vitality' && (
          <section className="py-8 sm:py-10 bg-[#FAFBF9] border-b border-[#DCE5E0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#CBD8D1] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#047857] shrink-0" />
                  <span className="text-[14.5px] sm:text-base text-[#14261E]">
                    Dedicated targeted formulations for:{' '}
                    <strong className="font-semibold text-[#047857]">{activeCategoryLabel}</strong>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#EEF6F1] text-[#047857] font-semibold tabular-nums">
                    {categoryFilteredBundles.length} Packs Available
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="self-start sm:self-auto text-[13.5px] sm:text-sm font-semibold text-[#047857] hover:text-[#065F46] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  View All Formulations →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {categoryFilteredBundles.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    cardIndex={idx}
                    selectedIdx={getPkgOptionIdx(pkg)}
                    onSelectOption={handleSelectPackageOption}
                    onOpenCheckout={(p, optIdx) => openExpressCheckout(p, 'package', optIdx)}
                    onInspectDetail={(p) => setDetailModalItem({ item: p, type: 'package' })}
                    isBenefitsExpanded={Boolean(expandedBenefitsMap[pkg.id])}
                    onToggleBenefits={(pkgId) =>
                      setExpandedBenefitsMap((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }))
                    }
                    whatsappTarget={whatsappTarget}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      {/* 4. Quiet Secondary Catalog Drawer — Keeps Landing Page 100% Distraction-Free */}
      {otherBundles.length > 0 && (
        <section id="additional-packs" className="py-6 sm:py-8 bg-[#F4FAF7] border-b border-[#DCE5E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#CBD8D1] shadow-2xs">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-[#14261E]">
                  Looking for solutions for another health condition?
                </h3>
                <p className="text-sm text-[#475A50] mt-0.5">
                  We also stock authentic NAFDAC-certified GHT packs for Joint Comfort, Blood Sugar, and Women's Wellness.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOtherPacks((prev) => !prev)}
                className="self-start sm:self-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[#047857] bg-[#EEF6F1] hover:bg-[#E2F0E7] text-[#047857] text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <span>{showOtherPacks ? 'Hide Additional Packs' : `Browse ${otherBundles.length} Other Formulations`}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showOtherPacks ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {showOtherPacks && (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {otherBundles.map((pkg, idx) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      cardIndex={idx + 2}
                      selectedIdx={getPkgOptionIdx(pkg)}
                      onSelectOption={handleSelectPackageOption}
                      onOpenCheckout={(p, optIdx) => openExpressCheckout(p, 'package', optIdx)}
                      onInspectDetail={(p) => setDetailModalItem({ item: p, type: 'package' })}
                      isBenefitsExpanded={Boolean(expandedBenefitsMap[pkg.id])}
                      onToggleBenefits={(pkgId) =>
                        setExpandedBenefitsMap((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }))
                      }
                      whatsappTarget={whatsappTarget}
                    />
                  ))}
                </div>

                {products.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#DCE5E0] space-y-4">
                    <h4 className="text-base font-semibold text-[#14261E]">
                      Individual GHT Herbal Bottles ({products.length} Available):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((prod) => {
                        const selOptIdx = getProdOptionIdx(prod);
                        const pricing = computeProductPricing(prod, selOptIdx);
                        return (
                          <div
                            key={prod.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-[#14261E] truncate">
                                {prod.name}
                              </div>
                              <div className="text-xs text-[#047857] font-bold mt-0.5 tabular-nums">
                                ₦{pricing.currentPrice.toLocaleString()}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openExpressCheckout(prod, 'product', selOptIdx)}
                              className="px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                            >
                              Order
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Editorial Fulfillment & Customer Proof Section — Calm Adult Typography */}
      <section
        id="how-pod-works"
        className="py-16 sm:py-24 bg-white border-t border-[#E4EBE7] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
          <div className="space-y-10 sm:space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-[14px] sm:text-[15px] font-black text-[#047857] tracking-wider uppercase">
                100% Risk-Free Doorstep Fulfillment
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#14261E] tracking-tight leading-tight [text-wrap:balance]">
                How Nationwide Pay-on-Delivery Works
              </h2>
              <p className="text-base sm:text-lg text-[#263930] leading-relaxed font-medium">
                Designed for your complete peace of mind — inspect your sealed herbal bottles in person at your doorstep before paying the delivery rider.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-6 border-t border-[#E4EBE7]">
              <div className="space-y-3 pt-2">
                <span className="text-xs sm:text-sm font-black text-[#047857] uppercase tracking-wider tabular-nums">
                  Step 01 · Quick Request
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#14261E] leading-snug">
                  Select Your Wellness Pack
                </h3>
                <p className="text-sm sm:text-base text-[#263930] leading-relaxed font-medium">
                  Choose your preferred pack size and enter your phone number, state, and delivery address. No ATM card or upfront payment needed.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs sm:text-sm font-black text-[#047857] uppercase tracking-wider tabular-nums">
                  Step 02 · Fast Dispatch
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#14261E] leading-snug">
                  Phone &amp; Rider Confirmation
                </h3>
                <p className="text-sm sm:text-base text-[#263930] leading-relaxed font-medium">
                  Our regional fulfillment desk calls or messages you to confirm your convenient delivery time within 24 to 48 hours.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs sm:text-sm font-black text-[#047857] uppercase tracking-wider tabular-nums">
                  Step 03 · Doorstep Inspection
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#14261E] leading-snug">
                  Inspect Sealed Bottles &amp; Pay
                </h3>
                <p className="text-sm sm:text-base text-[#263930] leading-relaxed font-medium">
                  Open your parcel, verify intact factory seals, NAFDAC numbers, and expiry dates, then pay the rider via Transfer, POS, or Cash.
                </p>
              </div>
            </div>
          </div>

          {/* Verified Customer Experiences */}
          <div id="ad-reviews" className="pt-14 border-t border-[#E4EBE7] space-y-10 sm:space-y-12 scroll-mt-20">
            <div className="max-w-2xl space-y-3">
              <p className="text-[14px] sm:text-[15px] font-black text-[#047857] tracking-wider uppercase">
                Real Nigerian Customer Reviews
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#14261E] tracking-tight leading-tight [text-wrap:balance]">
                Over 10,000+ Men &amp; Women Trust GHT Wellness
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {prioritizedStories.slice(0, 3).map((story, idx) => (
                <blockquote
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl bg-[#F7FAF8] border border-[#DCE5E0] flex flex-col justify-between space-y-5 shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3.5">
                    <div
                      className="flex items-center gap-1.5 text-amber-500"
                      aria-label="5 out of 5 stars"
                    >
                      {[...Array(5)].map((_, sIdx) => (
                        <Star key={sIdx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-[#24372E] leading-relaxed font-medium">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  </div>

                  <footer className="pt-3.5 border-t border-[#DCE5E0]">
                    <div className="font-black text-base text-[#14261E]">
                      {story.name}
                    </div>
                    <div className="text-xs sm:text-sm text-[#4C6056] font-medium mt-0.5">
                      {story.role} · {story.location}
                    </div>
                    <div className="text-xs font-black text-[#047857] mt-1 uppercase tracking-wider">
                      Verified Buyer · {story.packName}
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>

            {/* Clean High-Legibility FAQ Accordion */}
            <div className="max-w-3xl mx-auto pt-6 sm:pt-8 space-y-6">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#14261E] text-center leading-snug [text-wrap:balance]">
                Frequently Asked Questions Before You Order
              </h3>
              <div className="divide-y divide-[#E4EBE7] border-y border-[#E4EBE7]">
                {BUYER_FAQS.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="py-2">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className="text-base sm:text-lg font-black text-[#14261E] leading-snug">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-[#4C6056] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="pb-5 text-sm sm:text-base text-[#263930] leading-relaxed font-medium">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contiguous Express Checkout Section */}
      <section
        id="express-order"
        className="py-16 sm:py-24 bg-[#F2F5F3] border-t border-[#DCE5E0] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-[14px] sm:text-[15px] font-black text-[#047857] tracking-wider uppercase">
              1-Step Doorstep Dispatch Form
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#14261E] tracking-tight leading-tight [text-wrap:balance]">
              Complete Your Pay-on-Delivery Order
            </h2>
            <p className="text-base sm:text-lg text-[#263930] leading-relaxed font-medium">
              {isDedicatedConditionLanding && activeFilter !== 'all'
                ? `Enter your delivery address below to dispatch your ${activeCategoryLabel} pack. Free nationwide delivery across all 36 states and FCT. Pay only upon inspection.`
                : 'Enter your delivery address below. No payment or bank card is required now. We dispatch directly to your home or office with Free Nationwide Delivery. Inspect your parcel before paying.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Sticky Visual Showcase of the Selected Pack on Desktop */}
            <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24 space-y-5">
              {inlineTarget.item && inlineSummaryPricing && (
                <div className="bg-white rounded-[28px] border border-[#DCE5E0] shadow-[0_12px_34px_-16px_rgba(15,31,24,0.08)] overflow-hidden">
                  <StudioProductStage
                    entries={inlineGallery}
                    alt={inlineTarget.item.name}
                    heightClassName="h-[360px]"
                    optimizeWidth={1000}
                    onInspect={() =>
                      setDetailModalItem({
                        item: inlineTarget.item!,
                        type: inlineTarget.type,
                      })
                    }
                  />
                  <div className="p-6 border-t border-[#E4EBE7] space-y-3">
                    <div className="text-xs font-medium text-[#047857]">
                      Selected for Doorstep Dispatch
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#162820] leading-tight">
                      {inlineTarget.item.name}
                    </h3>
                    {inlineSummaryPricing.includedList.length > 0 && (
                      <p className="text-[15px] text-[#33453D] leading-[1.68]">
                        <strong className="font-semibold text-[#162820]">Includes: </strong>
                        {inlineSummaryPricing.includedList.join(' · ')}
                      </p>
                    )}
                    <div className="pt-3 border-t border-[#E4EBE7] space-y-2.5 text-sm text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-4 h-4 text-[#047857] shrink-0" />
                        <span>Free Doorstep Delivery Across All 36 States &amp; FCT</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#047857] shrink-0" />
                        <span>Inspect Tamper-Evident Seals Before Paying</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#047857] shrink-0" />
                        <span>Specialist Line: {contactPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Express Order Form */}
            <div className="lg:col-span-7">
              {inlineTarget.item && (
                <ExpressPodCheckout
                  mode="inline"
                  allBundles={allBundles}
                  selectedItem={inlineTarget.item}
                  itemType={inlineTarget.type}
                  selectedOptionIdx={inlineTarget.optionIdx}
                  distributorId={distributorId}
                  onSelectBundle={(pkg, optIdx) => {
                    setPackageOptionMap((prev) => ({ ...prev, [pkg.id]: optIdx }));
                    setInlineTarget({ item: pkg, type: 'package', optionIdx: optIdx });
                  }}
                  onOrderSuccess={onOrderSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Quiet Policy-Compliant Footer — Official Brand Logo & Name Lockup */}
      <footer className="bg-[#0E261D] text-slate-200 py-14 sm:py-16 border-t border-[#1D3E31]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {brandLogoSrc && !logoLoadFailed ? (
                  <div className="bg-white px-2.5 py-1.5 rounded-xl shrink-0">
                    <img
                      src={brandLogoSrc}
                      alt={CONFIG.company.name}
                      referrerPolicy="no-referrer"
                      onError={() => setLogoLoadFailed(true)}
                      className="h-9 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#95E4B9] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}

                <div>
                  <div className="font-black text-xl sm:text-2xl text-white leading-tight">
                    {CONFIG.company.name}
                  </div>
                  {CONFIG.company.subtitle && (
                    <div className="text-[12px] sm:text-[13px] font-bold text-[#95E4B9] tracking-[0.03em] mt-0.5">
                      {CONFIG.company.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[16px] sm:text-[16.5px] text-[#D2E4DA] leading-[1.75]">
                Authorized Nigerian distributor of NAFDAC-registered GHT herbal and nutritional
                dietary supplements with nationwide doorstep fulfillment.
              </p>
            </div>

            <div className="space-y-3.5 text-[16px]">
              <div className="font-bold text-white text-[17px] sm:text-[18px]">Fulfillment Hub &amp; Support</div>
              <div className="flex items-start gap-2.5 text-[#D2E4DA] leading-relaxed">
                <MapPin className="w-4.5 h-4.5 text-[#95E4B9] shrink-0 mt-1" />
                <span>{CONFIG.company.address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#D2E4DA]">
                <Phone className="w-4.5 h-4.5 text-[#95E4B9] shrink-0" />
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  className="hover:text-white tabular-nums font-semibold"
                >
                  {contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[#D2E4DA]">
                <Mail className="w-4.5 h-4.5 text-[#95E4B9] shrink-0" />
                <a href={`mailto:${CONFIG.company.email}`} className="hover:text-white font-medium">
                  {CONFIG.company.email}
                </a>
              </div>
            </div>

            <div className="space-y-3.5 text-[16px]">
              <div className="font-bold text-white text-[17px] sm:text-[18px]">Policies &amp; Compliance</div>
              <ul className="space-y-2.5 text-[#D2E4DA]">
                <li>
                  <a
                    href="/return-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePolicyModal('return-policy');
                    }}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Return, Inspection &amp; Exchange Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePolicyModal('privacy-policy');
                    }}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Privacy &amp; Data Protection Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms-of-service"
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePolicyModal('terms-of-service');
                    }}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Terms of Service &amp; Shipping Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/14 space-y-3.5 text-[15.5px] sm:text-[16px] text-[#DCE8E1] leading-[1.75]">
            <p>
              <strong className="text-white font-bold">Health Disclaimer:</strong> These
              products are dietary supplements intended for general wellness support and do not
              replace professional medical advice or treatments.
            </p>
            <p className="text-[13.5px] sm:text-[14px] text-[#A6C0B4]">
              © {new Date().getFullYear()} {CONFIG.company.name} {CONFIG.company.subtitle}. All
              Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile & Tablet Compact Sticky Quick-Order Bar (Strictly <= 15% Viewport Height) */}
      {showMobileBar &&
        !expressModalState.isOpen &&
        !detailModalItem &&
        !activePolicyModal &&
        mobileBarItem &&
        mobileBarPricing && (
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-[68px] bg-white/95 backdrop-blur-md border-t border-[#DCE5E0] shadow-xl px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13.5px] sm:text-[14.5px] font-bold text-slate-900 truncate">
                {mobileBarItem.name}
              </div>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-[17.5px] sm:text-[19px] font-black text-slate-900">
                  ₦{mobileBarPricing.currentPrice.toLocaleString()}
                </span>
                {mobileBarPricing.savings > 0 && (
                  <span className="text-[12.5px] sm:text-[13px] text-slate-400 line-through">
                    ₦{mobileBarPricing.retailPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={getAdvisorWhatsAppHref(mobileBarItem.name)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  recordAdvisorWhatsAppClick(`Ad Sticky Bar Chat: ${mobileBarItem.name}`)
                }
                aria-label="Chat with us on WhatsApp"
                className="min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#BBD6C8] bg-[#F4FAF7] hover:bg-[#E7F4ED] text-[#065F46] font-bold text-[13.5px] sm:text-[14.5px] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5 text-[#25D366] shrink-0" />
                <span className="hidden phablet:inline">WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() =>
                  openExpressCheckout(
                    mobileBarItem,
                    inlineTarget.item ? inlineTarget.type : 'package',
                    inlineTarget.item ? inlineTarget.optionIdx : defaultBundleOptIdx
                  )
                }
                className="min-h-[46px] px-4 sm:px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-extrabold text-[14.5px] sm:text-[15.5px] whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
              >
                Order on Delivery
              </button>
            </div>
          </div>
        )}

      {/* Express Pay-on-Delivery Checkout Modal */}
      {expressModalState.item && (
        <ExpressPodCheckout
          mode="modal"
          isOpen={expressModalState.isOpen}
          onClose={() => setExpressModalState((prev) => ({ ...prev, isOpen: false }))}
          allBundles={allBundles}
          selectedItem={expressModalState.item}
          itemType={expressModalState.type}
          selectedOptionIdx={expressModalState.optionIdx}
          distributorId={distributorId}
          onSelectBundle={(pkg, optIdx) => {
            setPackageOptionMap((prev) => ({ ...prev, [pkg.id]: optIdx }));
            setInlineTarget({ item: pkg, type: 'package', optionIdx: optIdx });
          }}
          onOrderSuccess={(fullName, itemName, qty, total, delivDate, payMethod) => {
            setExpressModalState((prev) => ({ ...prev, isOpen: false }));
            onOrderSuccess?.(fullName, itemName, qty, total, delivDate, payMethod);
          }}
        />
      )}

      {/* High-Resolution Bottle Lightbox & Supplement Details Modal */}
      {detailModalItem && (
        <div
          className="fixed inset-0 z-[155] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setDetailModalItem(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DCE5E0] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E4EBE7] flex items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-xs font-medium text-[#047857]">
                  High-Resolution Bottle &amp; Formulation Details
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                  {detailModalItem.type === 'package' && (
                    <span className="text-emerald-600">Wellness Pack: </span>
                  )}
                  {detailModalItem.item.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close supplement details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-[#E4EBE7]">
                <StudioProductStage
                  entries={
                    detailModalItem.type === 'package'
                      ? getPackageGalleryEntries(detailModalItem.item as PackageData)
                      : (detailModalItem.item as Product).image_url
                        ? [
                            {
                              url: (detailModalItem.item as Product).image_url,
                              label: detailModalItem.item.name,
                            },
                          ]
                        : []
                  }
                  alt={detailModalItem.item.name}
                  heightClassName="h-[320px] sm:h-[420px] md:h-[460px]"
                  optimizeWidth={1400}
                />
              </div>

              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 text-[17px] text-[#2F4239]">
                <div className="space-y-5">
                  <p className="leading-[1.8] font-normal text-slate-800">
                    {(() => {
                      if (detailModalItem.type === 'package') {
                        const pkg = detailModalItem.item as PackageData;
                        const isPros =
                          (pkg.package_code || '').toUpperCase() === 'P001' ||
                          (pkg.name || '').toLowerCase().includes('prostate');
                        const isPerf =
                          (pkg.package_code || '').toUpperCase() === 'P002' ||
                          (pkg.name || '').toLowerCase().includes('performance') ||
                          (pkg.name || '').toLowerCase().includes('stamina') ||
                          (pkg.name || '').toLowerCase().includes('weak erection');
                        const prof = isPros
                          ? PACKAGE_ENHANCED_PROFILES.prostate
                          : isPerf
                            ? PACKAGE_ENHANCED_PROFILES.vitality
                            : matchesSymptomCategory(pkg, 'joints')
                              ? PACKAGE_ENHANCED_PROFILES.joints
                              : matchesSymptomCategory(pkg, 'sugar')
                                ? PACKAGE_ENHANCED_PROFILES.sugar
                                : matchesSymptomCategory(pkg, 'womens')
                                  ? PACKAGE_ENHANCED_PROFILES.womens
                                  : pkg.is_combo || (pkg.name || '').toLowerCase().includes('combo')
                                    ? PACKAGE_ENHANCED_PROFILES.combo
                                    : null;
                        return prof?.description || pkg.description;
                      }
                      return (
                        (detailModalItem.item as Product).long_desc ||
                        (detailModalItem.item as Product).short_desc
                      );
                    })()}
                  </p>

                  {(detailModalItem.item.health_benefits || []).length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-[#E4EBE7]">
                      <h4 className="text-[16px] font-bold text-[#162820]">
                        Key Therapeutic Benefits:
                      </h4>
                      <ul className="space-y-2.5">
                        {detailModalItem.item.health_benefits.map((b, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-[15.5px] text-[#2F4239] leading-[1.66]"
                          >
                            <CheckCircle2 className="w-5 h-5 text-[#057A55] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailModalItem.type === 'product' &&
                    (detailModalItem.item as Product).usage && (
                      <div className="pt-3 border-t border-[#E4EBE7] text-[15.5px]">
                        <strong className="font-semibold text-[#162820] block mb-1">
                          Suggested Daily Usage:
                        </strong>
                        <span className="text-[#33453D] leading-[1.68]">
                          {(detailModalItem.item as Product).usage}
                        </span>
                      </div>
                    )}
                </div>

                <div className="pt-4 border-t border-[#E4EBE7] space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailModalItem;
                      setDetailModalItem(null);
                      const optIdx =
                        target.type === 'package'
                          ? getPkgOptionIdx(target.item as PackageData)
                          : getProdOptionIdx(target.item as Product);
                      openExpressCheckout(target.item, target.type, optIdx);
                    }}
                    className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-base font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Order Now — Pay on Delivery
                  </button>
                  <a
                    href={getAdvisorWhatsAppHref(detailModalItem.item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      recordAdvisorWhatsAppClick(
                        `Ad Detail Modal Chat: ${detailModalItem.item.name}`
                      )
                    }
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#BBD6C8] bg-[#F4FAF7] hover:bg-[#E7F4ED] text-[#065F46] text-[15.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-[18px] h-[18px] shrink-0" />
                    <span>Chat with us</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDetailModalItem(null)}
                    className="w-full py-2.5 rounded-xl border border-[#CBD5CF] bg-white text-sm font-medium text-[#475A50] hover:bg-slate-50 cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {activePolicyModal && (
        <div
          className="fixed inset-0 z-[155] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setActivePolicyModal(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-xl max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#DCE5E0] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E4EBE7] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#047857]" />
                <h3 className="text-lg font-black text-[#0F1F18]">
                  {POLICY_MODAL_CONTENT[activePolicyModal].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close policy modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-base text-slate-700">
              {POLICY_MODAL_CONTENT[activePolicyModal].sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="font-bold text-[#0F1F18]">{sec.heading}</h4>
                  <p className="leading-relaxed text-slate-600">{sec.body}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-[#F6F8F7] border-t border-[#E4EBE7] text-right">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0F1F18] hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
              >
                Back to Wellness Packs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
