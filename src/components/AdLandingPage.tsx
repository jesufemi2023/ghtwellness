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
  ArrowRight,
} from 'lucide-react';
import { Product, PackageData } from '../types';
import { CONFIG } from '../config';
import { openWhatsAppLink } from '../utils/whatsapp';
import { formatOptionProductList } from '../utils/bottleFormatter';
import { sanitizeAdTitle, sanitizeAdText } from '../utils/adCompliance';
import {
  SymptomCategory,
  captureAndPersistAdAttribution,
  matchesSymptomCategory,
  resolveAdIntent,
} from '../utils/adAttribution';
import { trackWhatsAppClick, trackAdBundleSelect } from '../lib/analytics';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import { ExpressPodCheckout } from './ExpressPodCheckout';

export type PolicyTab = 'privacy-policy' | 'terms-of-service' | 'return-policy' | 'about' | 'home';

export interface AdLandingPageProps {
  products: Product[];
  packages: PackageData[];
  combos: PackageData[];
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
  { id: 'all', label: 'All Courses' },
  { id: 'prostate', label: 'Prostate Care' },
  { id: 'joints', label: 'Joints & Mobility' },
  { id: 'vitality', label: "Men's Vitality" },
  { id: 'sugar', label: 'Sugar Balance' },
  { id: 'cardio', label: 'Cardio & Circulation' },
  { id: 'womens', label: "Women's Wellness" },
  { id: 'singles', label: 'Single Bottles' },
];

const CUSTOMER_STORIES = [
  {
    name: 'Chief Adebayo O.',
    role: 'Retired Civil Engineer, 64',
    location: 'Bodija, Ibadan',
    course: '3-Bottle Prostate & Male Comfort Course',
    quote:
      'The dispatch rider delivered to my residence in Bodija within 36 hours. Every bottle carried its intact factory seal and NAFDAC registration number, and I paid via transfer only after inspecting the package. Consistent daily use has noticeably supported my nighttime comfort.',
  },
  {
    name: 'Mrs. Evelyn N.',
    role: 'School Principal, 56',
    location: 'GRA, Benin City',
    course: 'Joint Comfort & Calcium Course',
    quote:
      'What gave my family confidence was the zero-risk Pay on Delivery service. Their specialist explained the morning and evening mealtime schedule clearly on WhatsApp, and my mother moves around the compound with much steadier comfort.',
  },
  {
    name: 'Engr. Musa K.',
    role: 'Project Director, 51',
    location: 'Wuse II, Abuja',
    course: "Men's Stamina & Vitality Course",
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
    question: 'Which bottle course duration is recommended for adults?',
    answer:
      'A 2-Bottle Starter Pack covers initial nutritional support, while our 3-Bottle and 4-Bottle Recommended Courses are structured for a complete 30 to 60-day herbal wellness regimen with higher multi-bottle savings.',
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
    seen.add(pkg.package_image_url.trim());
    entries.push({
      url: pkg.package_image_url.trim(),
      label: 'Complete Course',
    });
  }

  for (const prod of pkg.products || []) {
    if (prod?.image_url && prod.image_url.trim().length > 0 && !seen.has(prod.image_url.trim())) {
      seen.add(prod.image_url.trim());
      entries.push({
        url: prod.image_url.trim(),
        label: prod.name,
      });
    }
  }

  return entries;
}

interface StudioProductStageProps {
  entries: GalleryImageEntry[];
  alt: string;
  heightClassName: string;
  optimizeWidth?: number;
  priority?: boolean;
  onInspect?: () => void;
}

const StudioProductStage: React.FC<StudioProductStageProps> = ({
  entries,
  alt,
  heightClassName,
  optimizeWidth = 1200,
  priority = false,
  onInspect,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [failedMap, setFailedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveIdx(0);
    setFailedMap({});
  }, [entries[0]?.url]);

  const currentEntry = entries[activeIdx] || entries[0];
  const resolvedUrl = currentEntry?.url
    ? getOptimizedImageUrl(currentEntry.url, optimizeWidth)
    : '';
  const hasFailed = !resolvedUrl || Boolean(failedMap[activeIdx]);

  return (
    <div
      className={`relative w-full ${heightClassName} bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#f1f6f3_62%,#e4ede8_100%)] flex flex-col justify-between overflow-hidden select-none group`}
    >
      {/* Main Monumental Bottle Canvas */}
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
        className={`flex-1 w-full min-h-0 flex items-center justify-center p-3 sm:p-6 ${
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
            src={resolvedUrl}
            alt={`${alt} — ${currentEntry.label}`}
            loading={priority ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setFailedMap((prev) => ({ ...prev, [activeIdx]: true }))}
            className="w-full h-full object-contain mix-blend-multiply scale-[1.06] group-hover:scale-[1.11] transition-transform duration-200"
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
          className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-[#0F1F18] border border-[#D5DFDA] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <ZoomIn className="w-3.5 h-3.5 text-[#047857]" />
          <span>Enlarge</span>
        </button>
      )}

      {/* Multi-Bottle Interactive Gallery Strip */}
      {entries.length > 1 && (
        <div
          className="relative z-10 px-3 sm:px-5 pb-3.5 pt-1 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {entries.slice(0, 5).map((entry, idx) => {
            const isSelected = idx === activeIdx;
            const thumbUrl = getOptimizedImageUrl(entry.url, 220);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                title={entry.label}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white border-[#047857] text-[#0F1F18] ring-1 ring-[#047857]'
                    : 'bg-white/75 hover:bg-white border-[#D5DFDA] text-slate-600'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={entry.label}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 object-contain mix-blend-multiply shrink-0"
                />
                <span className="max-w-[110px] truncate">{entry.label}</span>
              </button>
            );
          })}
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

function computePackagePricing(pkg: PackageData, optIdx: number) {
  const activeOption =
    pkg.options && pkg.options.length > 0
      ? pkg.options[Math.min(optIdx, pkg.options.length - 1)] || pkg.options[0]
      : null;

  const discount = activeOption ? Number(activeOption.discount) || 0 : Number(pkg.discount) || 0;
  const retailPrice = activeOption ? Number(activeOption.price) || 0 : Number(pkg.price) || 0;
  const currentPrice =
    discount > 0 ? Math.round(retailPrice * (1 - discount / 100)) : retailPrice;
  const savings = Math.max(0, retailPrice - currentPrice);

  const includedList =
    activeOption && Array.isArray(activeOption.products) && activeOption.products.length > 0
      ? formatOptionProductList(activeOption.products)
      : (pkg.products || []).map((p) => p.name);

  return {
    activeOption,
    discount,
    retailPrice,
    currentPrice,
    savings,
    includedList,
  };
}

function computeProductPricing(prod: Product, optIdx: number) {
  const activeOption =
    prod.options && prod.options.length > 0
      ? prod.options[Math.min(optIdx, prod.options.length - 1)] || prod.options[0]
      : null;

  const discount = activeOption
    ? Number(activeOption.discount) || 0
    : Number(prod.discount_percent) || 0;
  const retailPrice = activeOption
    ? Number(activeOption.price) || 0
    : Number(prod.price_naira) || 0;
  const currentPrice =
    discount > 0 ? Math.round(retailPrice * (1 - discount / 100)) : retailPrice;

  return {
    activeOption,
    discount,
    retailPrice,
    currentPrice,
    savings: Math.max(0, retailPrice - currentPrice),
  };
}

export const AdLandingPage: React.FC<AdLandingPageProps> = ({
  products,
  packages,
  combos,
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
      setShowMobileBar(window.scrollY > 520);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const spotlightBundle = useMemo<PackageData | null>(() => {
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

  useEffect(() => {
    if (!inlineTarget.item && spotlightBundle) {
      setInlineTarget({
        item: spotlightBundle,
        type: 'package',
        optionIdx: getDefaultOptionIdx(spotlightBundle.options),
      });
    } else if (!inlineTarget.item && products.length > 0) {
      setInlineTarget({
        item: products[0],
        type: 'product',
        optionIdx: getDefaultOptionIdx(products[0].options),
      });
    }
  }, [spotlightBundle, products, inlineTarget.item]);

  const getPkgOptionIdx = (pkg: PackageData): number => {
    if (packageOptionMap[pkg.id] !== undefined) return packageOptionMap[pkg.id];
    return getDefaultOptionIdx(pkg.options);
  };

  const getProdOptionIdx = (prod: Product): number => {
    if (productOptionMap[prod.id] !== undefined) return productOptionMap[prod.id];
    return getDefaultOptionIdx(prod.options);
  };

  const categoryFilteredBundles = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'singles') return allBundles;
    return allBundles.filter((pkg) => matchesSymptomCategory(pkg, activeFilter));
  }, [allBundles, activeFilter]);

  const hasExactCategoryMatch =
    activeFilter === 'all' ||
    activeFilter === 'singles' ||
    categoryFilteredBundles.length > 0;

  const bundlesToDisplay = hasExactCategoryMatch ? categoryFilteredBundles : allBundles;

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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAdvisorWhatsApp = (contextLabel: string, customSubject?: string) => {
    trackWhatsAppClick(contextLabel);
    const message = customSubject
      ? `Hello ${CONFIG.company.name}, I am visiting your Wellness Course page and would like guidance on ${customSubject}.`
      : `Hello ${CONFIG.company.name}, I would like guidance on choosing the right GHT herbal wellness course with Pay on Delivery.`;
    openWhatsAppLink(CONFIG.whatsapp.number, message);
  };

  const spotlightOptIdx = spotlightBundle ? getPkgOptionIdx(spotlightBundle) : 0;
  const spotlightPricing = spotlightBundle
    ? computePackagePricing(spotlightBundle, spotlightOptIdx)
    : null;
  const spotlightGallery = useMemo(
    () => (spotlightBundle ? getPackageGalleryEntries(spotlightBundle) : []),
    [spotlightBundle]
  );

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

  const mobileBarItem = inlineTarget.item || spotlightBundle;
  const mobileBarPrice = useMemo(() => {
    if (!mobileBarItem) return 0;
    if (inlineTarget.item) {
      return inlineTarget.type === 'package'
        ? computePackagePricing(inlineTarget.item as PackageData, inlineTarget.optionIdx)
            .currentPrice
        : computeProductPricing(inlineTarget.item as Product, inlineTarget.optionIdx)
            .currentPrice;
    }
    return spotlightPricing?.currentPrice || 0;
  }, [mobileBarItem, inlineTarget, spotlightPricing]);

  return (
    <div className="min-h-screen bg-white text-[#0F1F18] font-[family-name:var(--font-clinical-body)] pb-16 md:pb-0">
      {/* 1. Strict 3-Zone Top Bar Contract */}
      <header className="md:sticky md:top-0 z-40 h-16 bg-white/95 backdrop-blur-xs border-b border-[#E4EBE7]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean brand wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-lg sm:text-xl font-bold tracking-tight text-[#0F1F18] font-[family-name:var(--font-editorial)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {CONFIG.company.name}
          </button>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav
            aria-label="Landing page sections"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => scrollToSection('ad-bundles')}
              className="hover:text-[#0F1F18] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Wellness Courses
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-pod-works')}
              className="hover:text-[#0F1F18] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              How Delivery Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ad-reviews')}
              className="hover:text-[#0F1F18] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reviews
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('express-order')}
              className="hover:text-[#0F1F18] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Order Form
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <button
            type="button"
            onClick={() => scrollToSection('express-order')}
            className="px-5 py-2.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Order on Delivery
          </button>
        </div>
      </header>

      {/* 2. Monumental Split Hero — Scaled-Up Product Showcase as the Centerpiece */}
      <section className="bg-white border-b border-[#E4EBE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Editorial Headline & Purchase Controls (Left on Desktop, split around Giant Visual on Mobile) */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6 order-2 lg:order-1">
              <div className="hidden lg:block space-y-4">
                <p className="text-xs sm:text-sm font-semibold text-[#047857]">
                  {adIntent.kicker}
                </p>

                <h1 className="text-[clamp(2.25rem,3.4vw,3.35rem)] font-bold text-[#0F1F18] tracking-tight leading-[1.1] [text-wrap:balance] font-[family-name:var(--font-editorial)]">
                  {adIntent.headline}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {adIntent.subheadline}
                </p>
              </div>

              {/* Mobile Subheadline */}
              <p className="lg:hidden text-base text-slate-600 leading-relaxed">
                {adIntent.subheadline}
              </p>

              {/* Contiguous Featured Course Purchase Module */}
              {spotlightBundle && spotlightPricing && (
                <div className="pt-2 lg:pt-4 border-t border-[#E4EBE7] space-y-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500">
                        Featured Herbal Course
                        {spotlightBundle.package_code ? ` · ${spotlightBundle.package_code}` : ''}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] mt-0.5">
                        {sanitizeAdTitle(spotlightBundle.name)}
                      </h2>
                    </div>

                    <div className="text-left sm:text-right tabular-nums">
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#0F1F18]">
                        ₦{spotlightPricing.currentPrice.toLocaleString()}
                      </div>
                      {spotlightPricing.savings > 0 && (
                        <div className="text-xs text-slate-400 line-through">
                          ₦{spotlightPricing.retailPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {spotlightBundle.options && spotlightBundle.options.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm font-semibold text-slate-700">
                        Select Course Duration:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
                        {spotlightBundle.options.map((opt, idx) => {
                          const isSelected = idx === spotlightOptIdx;
                          const d = Number(opt.discount) || 0;
                          const eff =
                            d > 0 ? Math.round(opt.price * (1 - d / 100)) : opt.price;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPackageOptionMap((prev) => ({
                                  ...prev,
                                  [spotlightBundle.id]: idx,
                                }));
                                setInlineTarget({
                                  item: spotlightBundle,
                                  type: 'package',
                                  optionIdx: idx,
                                });
                                trackAdBundleSelect(
                                  sanitizeAdTitle(spotlightBundle.name),
                                  opt.bottles,
                                  eff
                                );
                              }}
                              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer tabular-nums ${
                                isSelected
                                  ? 'border-[#047857] bg-[#F2F7F4] ring-1 ring-[#047857]'
                                  : 'border-[#D5DFDA] bg-white hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-sm font-bold text-[#0F1F18] whitespace-nowrap">
                                  {opt.bottles}
                                </span>
                                {d > 0 && (
                                  <span className="text-xs font-semibold text-[#047857]">
                                    -{d}%
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-bold text-[#047857] mt-0.5">
                                ₦{eff.toLocaleString()}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {spotlightPricing.includedList.length > 0 && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-[#0F1F18]">Bottles Included: </strong>
                      {spotlightPricing.includedList.join(' · ')}
                    </p>
                  )}

                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        openExpressCheckout(spotlightBundle, 'package', spotlightOptIdx)
                      }
                      className="w-full min-h-[56px] px-7 py-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-base sm:text-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-5 h-5 shrink-0" />
                      <span>Order Now — Pay on Delivery</span>
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-medium text-slate-600">
                      <button
                        type="button"
                        onClick={() => scrollToSection('ad-bundles')}
                        className="hover:text-[#047857] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Browse All {allBundles.length || ''} Wellness Courses</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdvisorWhatsApp('Ad Hero Specialist')}
                        className="text-[#047857] hover:text-[#065F46] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Specialist: {CONFIG.company.phone}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Centerpiece Giant Product Visual Stage (7 Columns on Desktop, Top-of-Screen on Mobile) */}
            <div className="lg:col-span-7 flex flex-col space-y-4 order-1 lg:order-2">
              {/* Mobile Headline Above Giant Image so Mobile Visitors Immediately See Context + Huge Bottles */}
              <div className="lg:hidden space-y-2">
                <p className="text-xs font-semibold text-[#047857]">{adIntent.kicker}</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1F18] tracking-tight leading-[1.12] [text-wrap:balance] font-[family-name:var(--font-editorial)]">
                  {adIntent.headline}
                </h1>
              </div>

              {spotlightBundle ? (
                <div className="flex-1 rounded-3xl border border-[#DCE5E0] overflow-hidden flex flex-col">
                  <StudioProductStage
                    entries={spotlightGallery}
                    alt={sanitizeAdTitle(spotlightBundle.name)}
                    heightClassName="h-[370px] sm:h-[490px] lg:h-[580px]"
                    optimizeWidth={1400}
                    priority={true}
                    onInspect={() =>
                      setDetailModalItem({ item: spotlightBundle, type: 'package' })
                    }
                  />
                  <div className="px-5 py-3.5 bg-[#F6F8F7] border-t border-[#E4EBE7] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-600">
                    <span>
                      Authentic Tamper-Evident GHT Bottles · Inspect Seals Before Paying
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailModalItem({ item: spotlightBundle, type: 'package' })
                      }
                      className="font-semibold text-[#047857] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      View Supplement Facts →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-[380px] sm:h-[520px] rounded-3xl bg-[#F6F8F7] border border-[#DCE5E0] flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <ShieldCheck className="w-10 h-10 text-[#047857]" />
                  <p className="text-base font-semibold text-slate-700">
                    Loading Authentic NAFDAC-Registered Herbal Wellness Courses...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Assurance Strip Below Hero */}
        <div className="bg-[#F6F8F7] border-t border-[#E4EBE7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-[#DDE5E0]">
            <div className="lg:pr-6">
              <div className="text-lg sm:text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tabular-nums">
                24–48 Hours
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Doorstep Dispatch to Major Cities
              </div>
            </div>
            <div className="lg:px-6">
              <div className="text-lg sm:text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tabular-nums">
                ₦0 Upfront Payment
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Inspect Intact Seals Before Paying
              </div>
            </div>
            <div className="lg:px-6">
              <div className="text-lg sm:text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                NAFDAC Registered
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Direct Corporate Batch Supply
              </div>
            </div>
            <div className="lg:pl-6">
              <div className="text-lg sm:text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tabular-nums">
                36 States + FCT
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Free Nationwide Home &amp; Office Delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Collection Showcase — Oversized Gallery Cards Centered Around Big Bottle Imagery */}
      <section id="ad-bundles" className="py-14 sm:py-20 bg-[#F6F8F7]/65 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <p className="text-xs sm:text-sm font-semibold text-[#047857]">
                Curated Adult Wellness Formulations
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tracking-tight [text-wrap:balance]">
                Select Your Targeted Herbal Wellness Course
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Tap any bottle image to inspect up close, choose your preferred course duration,
                and request doorstep Pay-on-Delivery dispatch.
              </p>
            </div>
          </div>

          {/* Clean Segmented Filter Controls */}
          <div
            role="tablist"
            aria-label="Filter supplements by wellness focus"
            className="flex items-center gap-1.5 p-1.5 bg-[#E9EFEC] rounded-xl overflow-x-auto no-scrollbar"
          >
            {SYMPTOM_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0F1F18] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1F18]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {!hasExactCategoryMatch && (
            <div className="py-4 px-5 rounded-xl bg-white border border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm sm:text-base text-slate-700">
                Showing all complete multi-bottle herbal courses below. Need personal guidance for
                your specific wellness goal? Speak directly with our specialist.
              </p>
              <button
                type="button"
                onClick={() =>
                  handleAdvisorWhatsApp(
                    'Ad Category Fallback',
                    SYMPTOM_TABS.find((t) => t.id === activeFilter)?.label
                  )
                }
                className="px-4 py-2.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ask Specialist on WhatsApp
              </button>
            </div>
          )}

          {activeFilter !== 'singles' ? (
            /* 2-Column Flagship Gallery Layout so Every Package Image Is Huge (400px–460px tall) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {bundlesToDisplay.map((pkg) => {
                const selectedIdx = getPkgOptionIdx(pkg);
                const pricing = computePackagePricing(pkg, selectedIdx);
                const cleanTitle = sanitizeAdTitle(pkg.name);
                const cleanDesc = sanitizeAdText(pkg.description);
                const cleanBenefits = (pkg.health_benefits || [])
                  .slice(0, 3)
                  .map((b) => sanitizeAdText(b));
                const galleryEntries = getPackageGalleryEntries(pkg);

                return (
                  <article
                    key={pkg.id}
                    className="bg-white rounded-3xl border border-[#DCE5E0] hover:border-[#047857]/50 transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden"
                  >
                    {/* Oversized Studio Product Stage — 65%+ Visual Presence */}
                    <div className="border-b border-[#E6ECE8]">
                      <StudioProductStage
                        entries={galleryEntries}
                        alt={cleanTitle}
                        heightClassName="h-[340px] sm:h-[420px] lg:h-[450px]"
                        optimizeWidth={1200}
                        onInspect={() => setDetailModalItem({ item: pkg, type: 'package' })}
                      />
                    </div>

                    {/* Clean Uncluttered Adult Purchase Area */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        {/* Unboxed Metadata with Middot Separators */}
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
                          <span className="font-semibold text-[#047857]">
                            {pkg.is_combo ? 'Complete Value Course' : 'Targeted Herbal Course'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>NAFDAC Registered</span>
                          {pkg.package_code && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{pkg.package_code}</span>
                            </>
                          )}
                        </div>

                        <div>
                          <h3 className="text-2xl sm:text-[1.7rem] font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] leading-snug">
                            {cleanTitle}
                          </h3>
                          <p className="text-base text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                            {cleanDesc}
                          </p>
                        </div>

                        {cleanBenefits.length > 0 && (
                          <ul className="space-y-2 pt-1">
                            {cleanBenefits.map((benefit, bIdx) => (
                              <li
                                key={bIdx}
                                className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700"
                              >
                                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-1" />
                                <span className="line-clamp-2">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {pkg.options && pkg.options.length > 0 && (
                          <div className="space-y-2.5 pt-2 border-t border-[#EBF0ED]">
                            <span className="block text-sm font-semibold text-[#0F1F18]">
                              Choose Course Duration:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {pkg.options.map((opt, oIdx) => {
                                const isSel = oIdx === selectedIdx;
                                const d = Number(opt.discount) || 0;
                                const eff =
                                  d > 0 ? Math.round(opt.price * (1 - d / 100)) : opt.price;
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
                                      trackAdBundleSelect(cleanTitle, opt.bottles, eff);
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer tabular-nums ${
                                      isSel
                                        ? 'border-[#047857] bg-[#F2F7F4] ring-1 ring-[#047857]'
                                        : 'border-[#DCE5E0] bg-white hover:border-slate-400'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs sm:text-sm font-bold text-[#0F1F18] whitespace-nowrap">
                                        {opt.bottles}
                                      </span>
                                      {d > 0 && (
                                        <span className="text-[11px] font-semibold text-[#047857]">
                                          -{d}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm font-bold text-[#047857] mt-1">
                                      ₦{eff.toLocaleString()}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {pricing.includedList.length > 0 && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            <strong className="text-[#0F1F18]">Included Bottles: </strong>
                            {pricing.includedList.join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Price & Primary Action Row */}
                      <div className="pt-5 border-t border-[#E4EBE7] space-y-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-3 tabular-nums">
                          <div>
                            <div className="flex items-baseline gap-2.5">
                              <span className="text-3xl font-extrabold text-[#0F1F18]">
                                ₦{pricing.currentPrice.toLocaleString()}
                              </span>
                              {pricing.savings > 0 && (
                                <span className="text-sm text-slate-400 line-through">
                                  ₦{pricing.retailPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-[#047857] font-medium mt-0.5">
                              {pricing.savings > 0
                                ? `Save ₦${pricing.savings.toLocaleString()} · Free Doorstep Delivery`
                                : 'Free Nationwide Delivery · Pay on Delivery'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDetailModalItem({ item: pkg, type: 'package' })}
                            className="text-sm font-semibold text-slate-600 hover:text-[#047857] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                          >
                            Supplement Facts
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openExpressCheckout(pkg, 'package', selectedIdx)}
                          className="w-full min-h-[54px] px-6 py-3.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-base sm:text-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-5 h-5 shrink-0" />
                          <span>Order Now — Pay on Delivery</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Single Supplements — Tall Studio Pedestals */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((prod) => {
                const selectedIdx = getProdOptionIdx(prod);
                const pricing = computeProductPricing(prod, selectedIdx);
                const prodEntries: GalleryImageEntry[] = prod.image_url
                  ? [{ url: prod.image_url, label: prod.name }]
                  : [];

                return (
                  <article
                    key={prod.id}
                    className="bg-white rounded-3xl border border-[#DCE5E0] hover:border-[#047857]/50 transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden"
                  >
                    <div className="border-b border-[#E6ECE8]">
                      <StudioProductStage
                        entries={prodEntries}
                        alt={prod.name}
                        heightClassName="h-[320px] sm:h-[360px]"
                        optimizeWidth={900}
                        onInspect={() => setDetailModalItem({ item: prod, type: 'product' })}
                      />
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2.5">
                        <div className="text-xs text-[#047857] font-semibold">
                          Single Herbal Supplement
                          {prod.nafdac_no ? ` · NAFDAC ${prod.nafdac_no}` : ''}
                        </div>
                        <h3 className="text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                          {prod.name}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-600 line-clamp-2 leading-relaxed">
                          {sanitizeAdText(prod.short_desc)}
                        </p>

                        {prod.options && prod.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            {prod.options.map((opt, oIdx) => {
                              const isSel = oIdx === selectedIdx;
                              const d = Number(opt.discount) || 0;
                              const eff =
                                d > 0 ? Math.round(opt.price * (1 - d / 100)) : opt.price;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() =>
                                    setProductOptionMap((prev) => ({
                                      ...prev,
                                      [prod.id]: oIdx,
                                    }))
                                  }
                                  className={`p-2.5 rounded-xl border text-left text-xs sm:text-sm cursor-pointer tabular-nums ${
                                    isSel
                                      ? 'border-[#047857] bg-[#F2F7F4] font-bold text-[#0F1F18]'
                                      : 'border-[#DCE5E0] bg-white text-slate-700'
                                  }`}
                                >
                                  <div className="whitespace-nowrap">{opt.bottles}</div>
                                  <div className="font-bold text-[#047857]">
                                    ₦{eff.toLocaleString()}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-[#E4EBE7] space-y-3.5">
                        <div className="flex items-baseline justify-between tabular-nums">
                          <span className="text-2xl font-extrabold text-[#0F1F18]">
                            ₦{pricing.currentPrice.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-[#047857] font-medium">
                            Free Delivery · POD
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openExpressCheckout(prod, 'product', selectedIdx)}
                          className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-base transition-colors cursor-pointer"
                        >
                          Order Bottle — Pay on Delivery
                        </button>

                        <button
                          type="button"
                          onClick={() => setDetailModalItem({ item: prod, type: 'product' })}
                          className="w-full text-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#047857] underline underline-offset-4 cursor-pointer"
                        >
                          Inspect Bottle &amp; Daily Usage
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeFilter !== 'singles' && products.length > 0 && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setActiveFilter('singles')}
                className="text-sm sm:text-base font-semibold text-[#047857] hover:text-[#065F46] underline underline-offset-4 cursor-pointer"
              >
                Looking for an individual GHT supplement bottle instead? View all {products.length}{' '}
                single bottles →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Editorial Fulfillment & Customer Proof Section */}
      <section
        id="how-pod-works"
        className="py-16 sm:py-20 bg-white border-t border-[#E4EBE7] scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* 3-Step Clean Editorial Numbering */}
          <div className="space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-[#047857]">
                Zero-Risk Doorstep Fulfillment
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tracking-tight [text-wrap:balance]">
                How Nationwide Pay-on-Delivery Works
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Designed for complete peace of mind—you inspect your sealed supplements in person
                before paying a single Naira.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-[#E4EBE7]">
              <div className="space-y-3 pt-2">
                <span className="text-sm font-bold text-[#047857] tabular-nums">
                  01. Request Dispatch
                </span>
                <h3 className="text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                  Select Your Wellness Course
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Choose your multi-bottle duration and enter your phone number, state, and street
                  address. No card or online payment is required.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-sm font-bold text-[#047857] tabular-nums">
                  02. Rider Scheduling
                </span>
                <h3 className="text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                  Personal Phone Confirmation
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Our regional fulfillment desk calls or messages you on WhatsApp to confirm your
                  convenient delivery window within 24–48 hours.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-sm font-bold text-[#047857] tabular-nums">
                  03. Doorstep Verification
                </span>
                <h3 className="text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                  Inspect Intact Seals &amp; Pay
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Verify intact factory seals, NAFDAC numbers, and expiry dates at your door, then
                  pay the rider via Bank Transfer, POS, or Cash.
                </p>
              </div>
            </div>
          </div>

          {/* Verified Adult Customer Experiences */}
          <div id="ad-reviews" className="pt-12 border-t border-[#E4EBE7] space-y-10 scroll-mt-20">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-[#047857]">
                Verified Doorstep Buyers
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tracking-tight">
                Trusted by Adults &amp; Families Nationwide
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {CUSTOMER_STORIES.map((story, idx) => (
                <blockquote
                  key={idx}
                  className="p-7 rounded-2xl bg-[#F6F8F7] border border-[#DCE5E0] flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div
                      className="flex items-center gap-1 text-amber-500"
                      aria-label="5 out of 5 stars"
                    >
                      {[...Array(5)].map((_, sIdx) => (
                        <Star key={sIdx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-base text-slate-700 leading-relaxed">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  </div>

                  <footer className="pt-4 border-t border-[#DCE5E0]">
                    <div className="font-bold text-base text-[#0F1F18]">{story.name}</div>
                    <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {story.role} · {story.location}
                    </div>
                    <div className="text-xs font-semibold text-[#047857] mt-1">{story.course}</div>
                  </footer>
                </blockquote>
              ))}
            </div>

            {/* Clean High-Legibility FAQ Accordion */}
            <div className="max-w-3xl mx-auto pt-6 space-y-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] text-center">
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
                        className="w-full py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className="text-base sm:text-lg font-bold text-[#0F1F18]">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="pb-5 text-base text-slate-600 leading-relaxed">
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
        className="py-16 sm:py-20 bg-[#F6F8F7] border-t border-[#DCE5E0] scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-[#047857]">
              1-Step Doorstep Dispatch Form
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] tracking-tight [text-wrap:balance]">
              Complete Your Pay-on-Delivery Order
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Enter your delivery address below. Our regional hub dispatches directly to your home
              or office at ₦0 shipping cost.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Sticky Visual Showcase of the Selected Course on Desktop */}
            <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24 space-y-5">
              {inlineTarget.item && inlineSummaryPricing && (
                <div className="bg-white rounded-3xl border border-[#DCE5E0] overflow-hidden">
                  <StudioProductStage
                    entries={inlineGallery}
                    alt={
                      inlineTarget.type === 'package'
                        ? sanitizeAdTitle(inlineTarget.item.name)
                        : inlineTarget.item.name
                    }
                    heightClassName="h-[380px]"
                    optimizeWidth={1000}
                    onInspect={() =>
                      setDetailModalItem({
                        item: inlineTarget.item!,
                        type: inlineTarget.type,
                      })
                    }
                  />
                  <div className="p-6 border-t border-[#E4EBE7] space-y-3">
                    <div className="text-xs font-semibold text-[#047857]">
                      Selected for Doorstep Dispatch
                    </div>
                    <h3 className="text-2xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                      {inlineTarget.type === 'package'
                        ? sanitizeAdTitle(inlineTarget.item.name)
                        : inlineTarget.item.name}
                    </h3>
                    {inlineSummaryPricing.includedList.length > 0 && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        <strong className="text-[#0F1F18]">Includes: </strong>
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

          <div className="pt-8 border-t border-white/10 space-y-3 text-xs text-slate-400 leading-relaxed">
            <p>
              <strong className="text-slate-200">
                Mandatory Health &amp; Dietary Supplement Disclaimer:
              </strong>{' '}
              Products offered on this landing page are herbal and nutritional dietary supplements
              formulated to support general daily wellness. These statements have not been evaluated
              to diagnose, treat, cure, or prevent any disease. Individual results vary depending on
              consistency, diet, and baseline health. Always consult a qualified physician or
              healthcare professional before starting any supplement course, especially if you are
              pregnant, nursing, taking prescription medication, or under medical supervision.
            </p>
            <p className="text-slate-500">
              © {new Date().getFullYear()} {CONFIG.company.name} {CONFIG.company.subtitle}. All
              Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Compact Sticky Quick-Order Bar (Strictly <= 15% Viewport Height) */}
      {showMobileBar &&
        !expressModalState.isOpen &&
        !detailModalItem &&
        !activePolicyModal &&
        mobileBarItem && (
          <div className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-xs border-t border-[#DCE5E0] shadow-lg px-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500 truncate">
                Pay on Delivery · Free Shipping
              </div>
              <div className="text-base font-extrabold text-[#0F1F18] tabular-nums">
                ₦{mobileBarPrice.toLocaleString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                openExpressCheckout(
                  mobileBarItem,
                  inlineTarget.item ? inlineTarget.type : 'package',
                  inlineTarget.item ? inlineTarget.optionIdx : spotlightOptIdx
                )
              }
              className="px-5 py-2.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              Order Now (POD)
            </button>
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

      {/* High-Resolution Bottle Lightbox & Supplement Facts Modal */}
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
                <div className="text-xs font-semibold text-[#047857]">
                  High-Resolution Bottle &amp; Formulation View
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
                  {detailModalItem.type === 'package'
                    ? sanitizeAdTitle(detailModalItem.item.name)
                    : detailModalItem.item.name}
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
              {/* Left 7 Cols: Huge Studio Bottle Gallery */}
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
                  heightClassName="h-[340px] sm:h-[440px] md:h-full md:min-h-[460px]"
                  optimizeWidth={1400}
                />
              </div>

              {/* Right 5 Cols: Supplement Facts & Immediate Action */}
              <div className="md:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-6 text-base text-slate-700">
                <div className="space-y-4">
                  <p className="leading-relaxed">
                    {detailModalItem.type === 'package'
                      ? sanitizeAdText((detailModalItem.item as PackageData).description)
                      : sanitizeAdText(
                          (detailModalItem.item as Product).long_desc ||
                            (detailModalItem.item as Product).short_desc
                        )}
                  </p>

                  {(detailModalItem.item.health_benefits || []).length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-[#E4EBE7]">
                      <h4 className="text-sm font-bold text-[#0F1F18]">
                        Nutritional &amp; Daily Wellness Support:
                      </h4>
                      <ul className="space-y-2">
                        {detailModalItem.item.health_benefits.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                            <span>{sanitizeAdText(b)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailModalItem.type === 'product' &&
                    (detailModalItem.item as Product).usage && (
                      <div className="pt-3 border-t border-[#E4EBE7] text-sm">
                        <strong className="text-[#0F1F18] block mb-1">
                          Suggested Daily Usage:
                        </strong>
                        <span className="text-slate-600">
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
                    className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-base font-bold cursor-pointer"
                  >
                    Order Now — Pay on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalItem(null)}
                    className="w-full py-2.5 rounded-xl border border-[#CBD5CF] bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
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
                Back to Wellness Courses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
