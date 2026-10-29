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
  X,
  ShoppingBag,
  Clock,
  FileText,
  ZoomIn,
  MessageCircle,
} from 'lucide-react';
import { Product, PackageData } from '../types';
import { CONFIG } from '../config';
import { openWhatsAppLink } from '../utils/whatsapp';
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
  { id: 'womens', label: "Women's Wellness" },
  { id: 'vitality', label: "Men's Vitality" },
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
    categoryLabel: "Men's Stamina & Vitality",
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

const CUSTOMER_STORIES = [
  {
    name: 'Chief Adebayo O.',
    role: 'Retired Civil Engineer, 64',
    location: 'Bodija, Ibadan',
    packName: '3-Bottle Prostate Pack',
    quote:
      'The dispatch rider delivered to my residence in Bodija within 36 hours. Every bottle carried its intact factory seal and NAFDAC registration number, and I paid via transfer only after inspecting the package. Consistent daily use has noticeably supported my nighttime comfort.',
  },
  {
    name: 'Mrs. Evelyn N.',
    role: 'School Principal, 56',
    location: 'GRA, Benin City',
    packName: 'Joint Comfort & Calcium Pack',
    quote:
      'What gave my family confidence was the zero-risk Pay on Delivery service. Their specialist explained the morning and evening mealtime schedule clearly on WhatsApp, and my mother moves around the compound with much steadier comfort.',
  },
  {
    name: 'Engr. Musa K.',
    role: 'Project Director, 51',
    location: 'Wuse II, Abuja',
    packName: "Men's Stamina & Vitality Pack",
    quote:
      'Discreetly packaged and delivered straight to my office in Wuse the next afternoon. Authentic GHT herbal bottles with clear printed expiry dates and dependable customer follow-up.',
  },
];

const BUYER_FAQS = [
  {
    question: 'Do I really pay only when my supplements arrive at my doorstep?',
    answer:
      'Yes. Every order placed on this page qualifies for Nationwide Pay on Delivery. Our dispatch rider brings your sealed package to your home or office first—you inspect the factory seals and NAFDAC numbers before paying via Bank Transfer, POS, or Cash.',
  },
  {
    question: 'How fast is delivery to Lagos, Abuja, Port Harcourt, and other states?',
    answer:
      'Orders within Lagos, Abuja, Ibadan, Port Harcourt, Benin City, and major state capitals typically arrive within 24 to 48 hours through our regional fulfillment hubs. Other towns nationwide are delivered within 48 to 72 hours at ₦0 delivery cost.',
  },
  {
    question: 'How do I verify that the GHT herbal bottles are authentic?',
    answer:
      'All supplements supplied by SD GHT Health Care Nigeria Ltd are sourced directly from authorized GHT corporate distribution, featuring tamper-evident foil seals, batch numbers, manufacturing/expiry dates, and NAFDAC registration details.',
  },
  {
    question: 'Which multi-bottle pack size is recommended for adults?',
    answer:
      'A 2-Bottle Starter Pack covers initial nutritional support, while our 3-Bottle and 4-Bottle Value Packs are structured for a complete 30 to 60-day herbal wellness regimen with multi-bottle discount savings.',
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
              <span className="text-base font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                {alt}
              </span>
              <span className="text-xs text-[#047857] font-medium mt-1">
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
            className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#0F1F18] border border-slate-200/90 text-xs font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#047857]" />
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
                  className={`min-h-[42px] flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#EEF6F2] border-[#047857] text-[#0F1F18] ring-1 ring-[#047857]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
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
  maxChars = 155,
  className = 'text-[16px] sm:text-[17px] text-[#33453D] leading-[1.72] font-normal tracking-[0.005em]',
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

export const AdLandingPage: React.FC<AdLandingPageProps> = ({
  products,
  packages,
  combos,
  isLoading = false,
  distributorId,
  onOrderSuccess,
}) => {
  const adIntent = useMemo(() => resolveAdIntent(), []);

  const allBundles = useMemo(() => {
    const map = new Map<string, PackageData>();
    for (const pkg of [...packages, ...combos]) {
      if (pkg && pkg.id && !map.has(pkg.id)) {
        map.set(pkg.id, pkg);
      }
    }
    return Array.from(map.values());
  }, [packages, combos]);

  const [activeFilter, setActiveFilter] = useState<FilterTabId>(adIntent.category);
  const [packageOptionMap, setPackageOptionMap] = useState<Record<string, number>>({});
  const [productOptionMap, setProductOptionMap] = useState<Record<string, number>>({});
  const [expandedBenefitsMap, setExpandedBenefitsMap] = useState<Record<string, boolean>>({});
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [showMobileBar, setShowMobileBar] = useState(false);

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

  const handleAdvisorWhatsApp = (contextLabel: string, customSubject?: string) => {
    trackWhatsAppClick(contextLabel);
    const message = customSubject
      ? `Hello ${CONFIG.company.name}, I am visiting your Wellness Packs page and would like guidance on ${customSubject}.`
      : `Hello ${CONFIG.company.name}, I would like guidance on choosing the right GHT herbal wellness pack with Pay on Delivery.`;
    openWhatsAppLink(CONFIG.whatsapp.number, message);
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

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#162820] font-[family-name:var(--font-soft-body)] antialiased pb-20 lg:pb-0">
      {/* 1. Strict 3-Zone Top Bar Contract — Mobile & Tablet Ergonomic Proportions */}
      <header className="lg:sticky lg:top-0 z-40 h-[58px] sm:h-16 bg-white/95 backdrop-blur-xs border-b border-[#DFE7E2]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single clean brand wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[17px] sm:text-xl font-semibold tracking-tight text-[#162820] font-[family-name:var(--font-editorial)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {CONFIG.company.name}
          </button>

          {/* Zone 2: 4 concise single-line navigation links on desktop */}
          <nav
            aria-label="Landing page sections"
            className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#2F4239]"
          >
            <button
              type="button"
              onClick={() => scrollToSection('ad-bundles')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Wellness Packs
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
            className="min-h-[42px] sm:min-h-[44px] px-4 sm:px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-sm sm:text-[15px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Order on Delivery
          </button>
        </div>
      </header>

      {/* 2. Compact, Soft Above-the-Fold Trust & Pay-on-Delivery Headline Banner */}
      <section className="bg-white border-b border-[#DFE7E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-7">
          <div className="max-w-4xl space-y-2">
            <p className="text-[13px] sm:text-sm font-medium text-[#047857] tracking-[0.01em]">
              {adIntent.kicker}
            </p>
            <h1 className="text-[1.42rem] phablet:text-[1.6rem] sm:text-[1.9rem] lg:text-[2.4rem] font-semibold text-[#162820] tracking-[-0.012em] leading-[1.24] [text-wrap:balance] font-[family-name:var(--font-editorial)]">
              {adIntent.headline}
            </h1>
          </div>

          {/* Unboxed High-Trust Buyer Assurances — 'Pay ₦0 Upfront' Hidden on Mobile & Tablet Only */}
          <div className="mt-3.5 pt-3 border-t border-[#EBF1ED] flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 text-[14px] sm:text-[15px] text-[#33453D] leading-relaxed">
            <strong className="hidden lg:inline font-semibold text-[#162820]">
              Pay ₦0 Upfront
            </strong>
            <span aria-hidden="true" className="hidden lg:inline text-slate-300">
              ·
            </span>
            <span className="font-semibold text-[#162820]">Pay Only on Delivery</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="tabular-nums">24–48h Free Nationwide Dispatch</span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-300">
              ·
            </span>
            <span className="hidden sm:inline">NAFDAC-Registered Herbal Formulas</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <button
              type="button"
              onClick={() => handleAdvisorWhatsApp('Ad Trust Banner Specialist')}
              className="font-medium text-[#047857] hover:text-[#065F46] underline underline-offset-4 cursor-pointer whitespace-nowrap tabular-nums"
            >
              Chat / Call Specialist: {CONFIG.company.phone}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Above-the-Fold Unified Wellness Pack Catalog — Horizontal Touch Selection + Soft Adult Cards */}
      <section
        id="ad-bundles"
        className="pt-4 sm:pt-5 lg:pt-10 pb-14 sm:pb-20 lg:pb-24 bg-[#FAFBF9] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6 lg:space-y-8">
          {/* Desktop-Only Section Heading — Removed from Mobile & Tablet View Only */}
          <div className="hidden lg:block max-w-3xl space-y-2">
            <h2 className="text-3xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] tracking-[-0.01em] leading-[1.24] [text-wrap:balance]">
              Select Your Targeted Herbal Wellness Pack
            </h2>
            <p className="text-[17px] text-[#33453D] leading-[1.72]">
              Tap any wellness category below—such as{' '}
              <strong className="font-semibold text-[#162820]">Prostate Care</strong> or{' '}
              <strong className="font-semibold text-[#162820]">Women&apos;s Wellness</strong>—to
              filter right to your focus area, choose your bottle pack, and request Pay-on-Delivery
              dispatch.
            </p>
          </div>

          {/* Smooth Horizontal Category Selection for Mobile, Tablet & Desktop */}
          <div className="space-y-3">
            <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              <div
                role="tablist"
                aria-label="Filter supplements by wellness focus"
                className="flex flex-nowrap items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth snap-x py-1 pr-6 lg:pr-0"
              >
                {visibleSymptomTabs.map((tab) => {
                  const isActive = activeFilter === tab.id;
                  const count = categoryCounts[tab.id];
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.scrollIntoView({
                          behavior: 'smooth',
                          inline: 'center',
                          block: 'nearest',
                        });
                        handleSelectCategory(tab.id);
                      }}
                      className={`snap-start min-h-[46px] sm:min-h-[48px] px-4 sm:px-5 py-2.5 rounded-xl border text-[15px] sm:text-[15.5px] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer tabular-nums flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#047857] border-[#047857] text-white font-semibold shadow-2xs'
                          : 'bg-white border-[#CBD8D1] text-[#22352C] font-medium hover:border-[#047857] hover:bg-[#F4F9F6]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-xs sm:text-[13px] ${
                            isActive ? 'text-emerald-100' : 'text-[#5C7066]'
                          }`}
                        >
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steady Unboxed Status & Reset Row — Soft & Calm Reading Line */}
            {!showSkeletonState && hasExactCategoryMatch && (
              <div className="min-h-[28px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14.5px] sm:text-[15.5px] text-[#3A4D44] leading-relaxed">
                {activeFilter === 'all' ? (
                  <span>
                    Showing all{' '}
                    <strong className="font-semibold text-[#162820] tabular-nums">
                      {allBundles.length}
                    </strong>{' '}
                    authentic wellness packs · Inspect intact factory seals at your doorstep before
                    paying
                  </span>
                ) : (
                  <>
                    <span>
                      Showing{' '}
                      <strong className="font-semibold text-[#162820] tabular-nums">
                        {activeFilter === 'singles' ? products.length : bundlesToDisplay.length}
                      </strong>{' '}
                      {activeFilter === 'singles'
                        ? 'individual herbal bottles'
                        : bundlesToDisplay.length === 1
                          ? 'wellness pack'
                          : 'wellness packs'}{' '}
                      for{' '}
                      <strong className="font-semibold text-[#047857]">
                        {SYMPTOM_TABS.find((t) => t.id === activeFilter)?.label}
                      </strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      —
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('all')}
                      className="font-semibold text-[#047857] hover:text-[#065F46] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                    >
                      Show All Wellness Packs
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {!hasExactCategoryMatch && !showSkeletonState && (
            <div className="py-4 px-5 rounded-2xl bg-white border border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[16px] text-[#33453D] leading-[1.7]">
                Showing all available multi-bottle wellness packs below. Need personal guidance for
                your specific wellness goal? Chat directly with our specialist.
              </p>
              <button
                type="button"
                onClick={() =>
                  handleAdvisorWhatsApp(
                    'Ad Category Fallback',
                    SYMPTOM_TABS.find((t) => t.id === activeFilter)?.label
                  )
                }
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-[15px] sm:text-base font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Chat with us</span>
              </button>
            </div>
          )}

          {showSkeletonState ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-10">
              {[0, 1].map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className="bg-white rounded-[26px] border border-[#DCE5E0] overflow-hidden animate-pulse"
                >
                  <div className="h-24 bg-[#EEF4F1]" />
                  <div className="h-[310px] sm:h-[360px] bg-[#F6F9F7]" />
                  <div className="p-5 sm:p-7 space-y-4">
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-16 w-full bg-slate-100 rounded-xl" />
                    <div className="h-14 w-full bg-emerald-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeFilter !== 'singles' ? (
            /* Soft, Distinct, Easy-to-Identify Adult Wellness Package Cards — Optimized for Mobile & Tablet */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-10">
              {bundlesToDisplay.map((pkg, cardIndex) => {
                const selectedIdx = getPkgOptionIdx(pkg);
                const pricing = computePackagePricing(pkg, selectedIdx);
                const galleryEntries = getPackageGalleryEntries(pkg);
                const theme = resolvePackageVisualTheme(pkg, cardIndex);
                const indexDisplay = String(cardIndex + 1).padStart(2, '0');
                const benefits = Array.isArray(pkg.health_benefits)
                  ? pkg.health_benefits.filter((b) => b && b.trim().length > 0)
                  : [];
                const isBenefitsExpanded = Boolean(expandedBenefitsMap[pkg.id]);
                const visibleBenefits = isBenefitsExpanded ? benefits : benefits.slice(0, 5);
                const hiddenBenefitCount = Math.max(0, benefits.length - 5);

                return (
                  <article
                    key={pkg.id}
                    className={`bg-white rounded-[26px] sm:rounded-[28px] border ${theme.cardBorderClass} shadow-[0_12px_34px_-16px_rgba(15,31,24,0.07)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-16px_rgba(15,31,24,0.12)] transition-all duration-200 flex flex-col overflow-hidden`}
                  >
                    {/* Top Package Identity Header — Soft Tinted Clarity for Adult Differentiation */}
                    <div
                      className={`${theme.headerBgClass} px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-200/65 space-y-1.5`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] sm:text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-semibold tabular-nums ${theme.accentTextClass}`}>
                            Package {indexDisplay}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className={`font-medium ${theme.accentTextClass}`}>
                            {theme.categoryLabel}
                          </span>
                        </div>

                        <div className="text-[#52655C] font-normal tabular-nums text-xs sm:text-[13px]">
                          {pkg.package_code ? `${pkg.package_code} · ` : ''}
                          NAFDAC Registered
                        </div>
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-0.5">
                        <h3 className="text-[1.42rem] sm:text-[1.65rem] lg:text-[1.75rem] font-semibold text-[#162820] font-[family-name:var(--font-editorial)] leading-[1.24] tracking-[-0.01em] [text-wrap:balance]">
                          {pkg.name}
                        </h3>

                        <div className="tabular-nums text-left sm:text-right shrink-0">
                          <span className="text-xl sm:text-2xl font-bold text-[#162820]">
                            ₦{pricing.currentPrice.toLocaleString()}
                          </span>
                          {pricing.savings > 0 && (
                            <span className="ml-2 text-xs sm:text-sm text-slate-400 line-through">
                              ₦{pricing.retailPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Oversized Soft-Lit Studio Product Stage + Non-Clipped Full Pack Switcher */}
                    <div className="border-b border-slate-200/70">
                      <StudioProductStage
                        entries={galleryEntries}
                        alt={pkg.name}
                        heightClassName="h-[300px] phablet:h-[340px] sm:h-[380px] md:h-[320px] lg:h-[410px]"
                        studioGradientClass={theme.studioGradientClass}
                        optimizeWidth={1200}
                        onInspect={() => setDetailModalItem({ item: pkg, type: 'package' })}
                      />
                    </div>

                    {/* Soft, Spacious Adult Reading & Purchase Body */}
                    <div className="p-5 sm:p-7 lg:p-8 flex-1 flex flex-col justify-between space-y-5 sm:space-y-6 bg-white">
                      <div className="space-y-4 sm:space-y-5">
                        {pkg.description && pkg.description.trim().length > 0 && (
                          <ExpandableDescription
                            text={pkg.description}
                            maxChars={155}
                            className="text-[16px] sm:text-[16.5px] lg:text-[17px] text-[#33453D] leading-[1.72] font-normal tracking-[0.005em]"
                          />
                        )}

                        {visibleBenefits.length > 0 && (
                          <div className="space-y-2.5 pt-0.5">
                            <h4 className="text-[14.5px] sm:text-[15.5px] font-semibold text-[#162820]">
                              Key Wellness Benefits:
                            </h4>
                            <ul className="grid grid-cols-1 xl:grid-cols-2 gap-x-5 gap-y-2.5">
                              {visibleBenefits.map((benefit, bIdx) => (
                                <li
                                  key={bIdx}
                                  className="flex items-start gap-2.5 text-[15.5px] sm:text-[16px] text-[#2F4239] leading-[1.66] font-normal"
                                >
                                  <CheckCircle2 className="w-[17px] h-[17px] text-[#057A55] shrink-0 mt-1" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>

                            {hiddenBenefitCount > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedBenefitsMap((prev) => ({
                                    ...prev,
                                    [pkg.id]: !isBenefitsExpanded,
                                  }))
                                }
                                className="text-[14.5px] sm:text-[15px] font-semibold text-[#047857] hover:underline underline-offset-4 pt-1 cursor-pointer"
                              >
                                {isBenefitsExpanded
                                  ? 'Show fewer benefits'
                                  : `+ Show ${hiddenBenefitCount} more benefits`}
                              </button>
                            )}
                          </div>
                        )}

                        {pkg.options && pkg.options.length > 0 && (
                          <div className="space-y-2.5 pt-4 border-t border-slate-200/75">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[14.5px] sm:text-[15px] font-semibold text-[#162820]">
                                Choose Your Bottle Pack:
                              </span>
                              <span className="text-xs sm:text-[13px] font-normal text-[#566A60]">
                                Tap to select size
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                              {pkg.options.map((opt, oIdx) => {
                                const isSel = oIdx === selectedIdx;
                                const optPriceInfo = resolveSingleOptionPricing(
                                  opt,
                                  Number(pkg.discount) || 0
                                );
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => {
                                      setPackageOptionMap((prev) => ({
                                        ...prev,
                                        [pkg.id]: oIdx,
                                      }));
                                      setInlineTarget({
                                        item: pkg,
                                        type: 'package',
                                        optionIdx: oIdx,
                                      });
                                      trackAdBundleSelect(
                                        pkg.name,
                                        optPriceInfo.label,
                                        optPriceInfo.sellingPrice
                                      );
                                    }}
                                    className={`min-h-[68px] p-3 sm:p-3.5 rounded-2xl border text-left transition-colors cursor-pointer tabular-nums ${
                                      isSel
                                        ? 'border-[#047857] bg-[#F2F9F5] ring-1 ring-[#047857]'
                                        : 'border-[#D8E2DC] bg-[#FAFBF9] hover:bg-white hover:border-[#94ACA0]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[13px] sm:text-sm font-semibold text-[#162820] whitespace-nowrap">
                                        {optPriceInfo.label}
                                      </span>
                                      {optPriceInfo.discountPercent > 0 && (
                                        <span className="text-[11px] font-semibold text-[#047857]">
                                          -{optPriceInfo.discountPercent}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 space-y-0.5">
                                      <div className="text-[15px] sm:text-base font-bold text-[#047857]">
                                        ₦{optPriceInfo.sellingPrice.toLocaleString()}
                                      </div>
                                      {optPriceInfo.savings > 0 && (
                                        <div className="text-[11px] text-slate-400 line-through">
                                          ₦{optPriceInfo.originalPrice.toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {pricing.includedList.length > 0 && (
                          <p className="text-[15px] sm:text-[15.5px] text-[#33453D] leading-[1.68] pt-0.5">
                            <strong className="font-semibold text-[#162820]">
                              Included in Pack:{' '}
                            </strong>
                            {pricing.includedList.join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Clear Package Summary, Primary Order Action & 'Chat with us' Button */}
                      <div className="pt-5 border-t border-slate-200/75 space-y-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-3 tabular-nums">
                          <div>
                            <div className="flex items-baseline gap-2.5 flex-wrap">
                              <span className="text-[1.65rem] sm:text-[1.85rem] font-bold text-[#162820] tracking-tight">
                                ₦{pricing.currentPrice.toLocaleString()}
                              </span>
                              {pricing.savings > 0 && (
                                <span className="text-sm sm:text-base text-slate-400 line-through">
                                  ₦{pricing.retailPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="text-[13px] sm:text-sm text-[#047857] font-medium mt-0.5">
                              {pricing.savings > 0
                                ? `Save ₦${pricing.savings.toLocaleString()} (${pricing.discount}% Off) · Free Doorstep Delivery`
                                : 'Free Nationwide Delivery · Pay on Delivery'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDetailModalItem({ item: pkg, type: 'package' })}
                            className="text-sm font-medium text-[#475A50] hover:text-[#047857] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                          >
                            Full Details
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 md:grid-cols-1 xl:grid-cols-5 gap-2.5">
                          <button
                            type="button"
                            onClick={() => openExpressCheckout(pkg, 'package', selectedIdx)}
                            className="sm:col-span-3 md:col-span-1 xl:col-span-3 min-h-[52px] sm:min-h-[54px] px-5 py-3.5 rounded-2xl bg-[#047857] hover:bg-[#065F46] text-white font-semibold text-[16px] sm:text-[17px] transition-colors flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer shadow-2xs"
                          >
                            <ShoppingBag className="w-5 h-5 shrink-0" />
                            <span>Order on Delivery</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleAdvisorWhatsApp(
                                `Ad Package Card Chat: ${pkg.name}`,
                                `${pkg.name}${pricing.activeOption ? ` (${pricing.activeOption.bottles})` : ''}`
                              )
                            }
                            className="sm:col-span-2 md:col-span-1 xl:col-span-2 min-h-[50px] sm:min-h-[54px] px-4 py-3 rounded-2xl border border-[#BBD6C8] bg-[#F4FAF7] hover:bg-[#E7F4ED] text-[#065F46] font-semibold text-[15.5px] sm:text-[16px] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                          >
                            <MessageCircle className="w-[18px] h-[18px] shrink-0" />
                            <span>Chat with us</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Single Supplements — Soft Studio Pedestals + 'Chat with us' on Every Card */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {products.map((prod) => {
                const selectedIdx = getProdOptionIdx(prod);
                const pricing = computeProductPricing(prod, selectedIdx);
                const prodEntries: GalleryImageEntry[] = prod.image_url
                  ? [{ url: prod.image_url, label: prod.name }]
                  : [];

                return (
                  <article
                    key={prod.id}
                    className="bg-white rounded-[26px] border border-[#D8E2DC] shadow-[0_12px_32px_-16px_rgba(15,31,24,0.07)] hover:border-[#047857]/50 transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    <div className="border-b border-[#E6ECE8]">
                      <StudioProductStage
                        entries={prodEntries}
                        alt={prod.name}
                        heightClassName="h-[290px] sm:h-[330px]"
                        optimizeWidth={900}
                        onInspect={() => setDetailModalItem({ item: prod, type: 'product' })}
                      />
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2.5">
                        <div className="text-xs sm:text-[13px] text-[#047857] font-medium">
                          Single Herbal Supplement
                          {prod.nafdac_no ? ` · NAFDAC ${prod.nafdac_no}` : ''}
                        </div>
                        <h3 className="text-[1.3rem] sm:text-[1.4rem] font-semibold text-[#162820] font-[family-name:var(--font-editorial)] leading-[1.26]">
                          {prod.name}
                        </h3>
                        {prod.short_desc && (
                          <ExpandableDescription
                            text={prod.short_desc}
                            maxChars={135}
                            className="text-[15.5px] sm:text-[16px] text-[#33453D] leading-[1.7] font-normal"
                          />
                        )}

                        {prod.options && prod.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            {prod.options.map((opt, oIdx) => {
                              const isSel = oIdx === selectedIdx;
                              const optPriceInfo = resolveSingleOptionPricing(
                                opt,
                                Number(prod.discount_percent) || 0
                              );
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => {
                                    setProductOptionMap((prev) => ({
                                      ...prev,
                                      [prod.id]: oIdx,
                                    }));
                                    setInlineTarget({
                                      item: prod,
                                      type: 'product',
                                      optionIdx: oIdx,
                                    });
                                    trackAdBundleSelect(
                                      prod.name,
                                      optPriceInfo.label,
                                      optPriceInfo.sellingPrice
                                    );
                                  }}
                                  className={`min-h-[58px] p-2.5 rounded-xl border text-left text-xs sm:text-sm cursor-pointer tabular-nums transition-colors ${
                                    isSel
                                      ? 'border-[#047857] bg-[#F2F9F5] ring-1 ring-[#047857] text-[#162820]'
                                      : 'border-[#DCE5E0] bg-[#FAFBF9] hover:bg-white text-[#2F4239]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold whitespace-nowrap">
                                      {optPriceInfo.label}
                                    </span>
                                    {optPriceInfo.discountPercent > 0 && (
                                      <span className="text-[11px] font-semibold text-[#047857]">
                                        -{optPriceInfo.discountPercent}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                                    <span className="font-bold text-[#047857]">
                                      ₦{optPriceInfo.sellingPrice.toLocaleString()}
                                    </span>
                                    {optPriceInfo.savings > 0 && (
                                      <span className="text-[11px] text-slate-400 line-through">
                                        ₦{optPriceInfo.originalPrice.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-[#E4EBE7] space-y-3.5">
                        <div className="flex items-baseline justify-between gap-2 tabular-nums">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-[#162820]">
                                ₦{pricing.currentPrice.toLocaleString()}
                              </span>
                              {pricing.savings > 0 && (
                                <span className="text-sm text-slate-400 line-through">
                                  ₦{pricing.retailPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-[13px] font-medium text-[#047857] mt-0.5">
                              {pricing.discount > 0
                                ? `Save ${pricing.discount}% · Free POD Delivery`
                                : 'Free Nationwide Delivery · Pay on Delivery'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDetailModalItem({ item: prod, type: 'product' })}
                            className="text-xs sm:text-sm font-medium text-[#475A50] hover:text-[#047857] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                          >
                            Details
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          <button
                            type="button"
                            onClick={() => openExpressCheckout(prod, 'product', selectedIdx)}
                            className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-semibold text-[16px] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-2xs"
                          >
                            <ShoppingBag className="w-4 h-4 shrink-0" />
                            <span>Order on Delivery</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleAdvisorWhatsApp(
                                `Ad Single Bottle Card Chat: ${prod.name}`,
                                `${prod.name}${pricing.activeOption ? ` (${pricing.activeOption.bottles})` : ''}`
                              )
                            }
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#BBD6C8] bg-[#F4FAF7] hover:bg-[#E7F4ED] text-[#065F46] font-semibold text-[15.5px] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                          >
                            <MessageCircle className="w-[18px] h-[18px] shrink-0" />
                            <span>Chat with us</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeFilter !== 'singles' && products.length > 0 && (
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => handleSelectCategory('singles')}
                className="text-[15px] sm:text-base font-medium text-[#047857] hover:text-[#065F46] underline underline-offset-4 cursor-pointer"
              >
                Looking for an individual GHT supplement bottle instead? View all {products.length}{' '}
                single bottles →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Editorial Fulfillment & Customer Proof Section — Calm Adult Typography */}
      <section
        id="how-pod-works"
        className="py-14 sm:py-20 bg-white border-t border-[#E4EBE7] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
          <div className="space-y-8 sm:space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-[#047857]">
                Peace-of-Mind Doorstep Fulfillment
              </p>
              <h2 className="text-[1.75rem] sm:text-4xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] tracking-[-0.01em] leading-[1.24] [text-wrap:balance]">
                How Nationwide Pay-on-Delivery Works
              </h2>
              <p className="text-[16px] sm:text-[17.5px] text-[#33453D] leading-[1.72]">
                Designed for complete comfort and confidence—you inspect your sealed supplements in
                person at your doorstep before paying.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-8 pt-4 border-t border-[#E4EBE7]">
              <div className="space-y-2.5 pt-2">
                <span className="text-sm sm:text-[15px] font-semibold text-[#047857] tabular-nums">
                  01. Request Dispatch
                </span>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] leading-snug">
                  Select Your Wellness Pack
                </h3>
                <p className="text-[16px] sm:text-[16.5px] text-[#33453D] leading-[1.72]">
                  Choose your preferred multi-bottle pack and enter your phone number, state, and
                  street address. No card or online payment is required.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <span className="text-sm sm:text-[15px] font-semibold text-[#047857] tabular-nums">
                  02. Rider Scheduling
                </span>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] leading-snug">
                  Personal Phone Confirmation
                </h3>
                <p className="text-[16px] sm:text-[16.5px] text-[#33453D] leading-[1.72]">
                  Our regional fulfillment desk calls or messages you on WhatsApp to confirm your
                  convenient delivery window within 24–48 hours.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <span className="text-sm sm:text-[15px] font-semibold text-[#047857] tabular-nums">
                  03. Doorstep Verification
                </span>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] leading-snug">
                  Inspect Intact Seals &amp; Pay
                </h3>
                <p className="text-[16px] sm:text-[16.5px] text-[#33453D] leading-[1.72]">
                  Verify intact factory seals, NAFDAC numbers, and expiry dates at your door, then
                  pay the rider via Bank Transfer, POS, or Cash.
                </p>
              </div>
            </div>
          </div>

          {/* Verified Adult Customer Experiences */}
          <div id="ad-reviews" className="pt-12 border-t border-[#E4EBE7] space-y-8 sm:space-y-10 scroll-mt-20">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-[#047857]">
                Verified Doorstep Buyers
              </p>
              <h2 className="text-[1.75rem] sm:text-4xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] tracking-[-0.01em] leading-[1.24]">
                Trusted by Adults &amp; Families Nationwide
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {CUSTOMER_STORIES.map((story, idx) => (
                <blockquote
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl bg-[#F7FAF8] border border-[#DCE5E0] flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3.5">
                    <div
                      className="flex items-center gap-1 text-amber-500"
                      aria-label="5 out of 5 stars"
                    >
                      {[...Array(5)].map((_, sIdx) => (
                        <Star key={sIdx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-[16px] sm:text-[16.5px] text-[#33453D] leading-[1.74] font-normal">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  </div>

                  <footer className="pt-4 border-t border-[#DCE5E0]">
                    <div className="font-semibold text-[16px] sm:text-[17px] text-[#162820]">
                      {story.name}
                    </div>
                    <div className="text-sm text-[#54685E] mt-0.5">
                      {story.role} · {story.location}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-[#047857] mt-1">
                      {story.packName}
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>

            {/* Clean High-Legibility FAQ Accordion */}
            <div className="max-w-3xl mx-auto pt-4 sm:pt-6 space-y-5">
              <h3 className="text-[1.5rem] sm:text-3xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] text-center leading-snug">
                Questions Before Placing Your Order
              </h3>
              <div className="divide-y divide-[#E4EBE7] border-y border-[#E4EBE7]">
                {BUYER_FAQS.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="py-1">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className="text-[16px] sm:text-[17.5px] font-semibold text-[#162820] leading-snug">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-[#54685E] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="pb-5 text-[16px] sm:text-[16.5px] text-[#33453D] leading-[1.74] font-normal">
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

      {/* 5. Contiguous Express Checkout Section — Sticky Large Product Stage Left + Clean Form Right */}
      <section
        id="express-order"
        className="py-14 sm:py-20 bg-[#F2F5F3] border-t border-[#DCE5E0] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium text-[#047857]">
              1-Step Doorstep Dispatch Form
            </p>
            <h2 className="text-[1.75rem] sm:text-4xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)] tracking-[-0.01em] leading-[1.24] [text-wrap:balance]">
              Complete Your Pay-on-Delivery Order
            </h2>
            <p className="text-[16px] sm:text-[17.5px] text-[#33453D] leading-[1.72]">
              Enter your delivery address below. Our regional hub dispatches directly to your home
              or office with free nationwide doorstep delivery.
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
                    <h3 className="text-2xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)]">
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
                        <span>Specialist Line: {CONFIG.company.phone}</span>
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

      {/* 6. Quiet Policy-Compliant Footer */}
      <footer className="bg-[#0F1F18] text-slate-300 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-3">
              <div className="font-bold text-xl text-white font-[family-name:var(--font-editorial)]">
                {CONFIG.company.name} {CONFIG.company.subtitle}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Authorized Nigerian distributor of NAFDAC-registered GHT herbal and nutritional
                dietary supplements with nationwide doorstep fulfillment.
              </p>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="font-bold text-white">Fulfillment Hub &amp; Support</div>
              <div className="flex items-start gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{CONFIG.company.address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{CONFIG.company.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${CONFIG.company.email}`} className="hover:text-white">
                  {CONFIG.company.email}
                </a>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="font-bold text-white">Policies &amp; Compliance</div>
              <ul className="space-y-2 text-slate-400">
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

          <div className="pt-8 border-t border-white/10 space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white font-semibold">Health Disclaimer:</strong> These
              products are dietary supplements intended for general wellness support and do not
              replace professional medical advice or treatments.
            </p>
            <p className="text-xs text-slate-500">
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
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-[60px] bg-white/95 backdrop-blur-xs border-t border-[#DCE5E0] shadow-lg px-4 sm:px-6 flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#54685E] truncate">
                {mobileBarItem.name}
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-base sm:text-lg font-bold text-[#162820]">
                  ₦{mobileBarPricing.currentPrice.toLocaleString()}
                </span>
                {mobileBarPricing.savings > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    ₦{mobileBarPricing.retailPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleAdvisorWhatsApp(`Ad Sticky Bar Chat: ${mobileBarItem.name}`, mobileBarItem.name)
                }
                aria-label="Chat with us on WhatsApp"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-[#BBD6C8] bg-[#F4FAF7] hover:bg-[#E7F4ED] text-[#065F46] font-semibold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="hidden phablet:inline">Chat with us</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  openExpressCheckout(
                    mobileBarItem,
                    inlineTarget.item ? inlineTarget.type : 'package',
                    inlineTarget.item ? inlineTarget.optionIdx : defaultBundleOptIdx
                  )
                }
                className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Order Now (POD)
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
                <h3 className="text-lg sm:text-2xl font-semibold text-[#162820] font-[family-name:var(--font-editorial)]">
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

              <div className="md:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-6 text-[16px] text-[#33453D]">
                <div className="space-y-4">
                  <p className="leading-[1.72]">
                    {detailModalItem.type === 'package'
                      ? (detailModalItem.item as PackageData).description
                      : (detailModalItem.item as Product).long_desc ||
                        (detailModalItem.item as Product).short_desc}
                  </p>

                  {(detailModalItem.item.health_benefits || []).length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-[#E4EBE7]">
                      <h4 className="text-sm font-semibold text-[#162820]">Wellness Benefits:</h4>
                      <ul className="space-y-2">
                        {detailModalItem.item.health_benefits.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-[15px] text-[#2F4239] leading-[1.66]">
                            <CheckCircle2 className="w-4 h-4 text-[#057A55] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailModalItem.type === 'product' &&
                    (detailModalItem.item as Product).usage && (
                      <div className="pt-3 border-t border-[#E4EBE7] text-[15px]">
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
                  <button
                    type="button"
                    onClick={() =>
                      handleAdvisorWhatsApp(
                        `Ad Detail Modal Chat: ${detailModalItem.item.name}`,
                        detailModalItem.item.name
                      )
                    }
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#BBD6C8] bg-[#F4FAF7] hover:bg-[#E7F4ED] text-[#065F46] text-[15.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-[18px] h-[18px] shrink-0" />
                    <span>Chat with us</span>
                  </button>
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
                <h3 className="text-lg font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
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
