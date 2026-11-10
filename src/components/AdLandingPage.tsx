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
  ArrowDown,
  Lock,
  Package,
  Calendar,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Product, PackageData } from '../types';
import { CONFIG } from '../config';
import { buildWhatsAppUrl, useCompanyWhatsApp } from '../utils/whatsapp';
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
    packName: 'Natural Prostate Care Formula (3-Bottle Complete Regimen)',
    category: 'prostate',
    quote:
      'The dispatch rider delivered to my residence in Bodija within 36 hours. Every bottle carried its intact tamper seal and NAFDAC registration number, and I paid via bank transfer only after inspecting the package. Daily use has noticeably supported my nighttime comfort and uninterrupted sleep.',
  },
  {
    name: 'Engr. Musa K.',
    role: 'Project Director, 51',
    location: 'Wuse II, Abuja',
    packName: 'Male Performance & Stamina Pack',
    category: 'vitality',
    quote:
      'Discreetly packaged in an opaque box and delivered straight to my office in Wuse the next afternoon. Authentic GHT herbal bottles with clear printed manufacturing and expiry dates. Respectful, professional service.',
  },
  {
    name: 'Mrs. Evelyn N.',
    role: 'Retired Educationist, 58',
    location: 'GRA, Benin City',
    packName: 'Joint Comfort & Bone Health Pack',
    category: 'joints',
    quote:
      'What gave my family confidence was the zero-risk Pay on Delivery service. Their health specialist explained the dosage schedule clearly on WhatsApp, and my mother moves around the compound with much steadier comfort.',
  },
  {
    name: 'Dr. Chukwuma I.',
    role: 'Medical Consultant, 54',
    location: 'Enugu, Enugu State',
    packName: 'Natural Prostate Care Formula (3-Bottle Pack)',
    category: 'prostate',
    quote:
      'Verified the NAFDAC numbers right at my door before paying the dispatch rider. Quality herbal formulation with genuine botanical ingredients. Commendable delivery speed and packaging integrity.',
  },
];

const BUYER_FAQS = [
  {
    question: 'Do I really pay only after the supplements arrive at my doorstep?',
    answer:
      'Yes. Every order placed on this page qualifies for Nationwide Pay on Delivery. Our dispatch rider brings your sealed parcel to your home or office first—you inspect the outer package, intact factory seals, and NAFDAC numbers before completing payment via Bank Transfer, POS, or Cash.',
  },
  {
    question: 'How fast is delivery to Lagos, Abuja, Port Harcourt, and other states?',
    answer:
      'Orders within Lagos, Abuja, Ibadan, Port Harcourt, Benin City, and major state capitals arrive within 24 to 48 hours via our regional fulfillment hubs. All other towns nationwide are delivered within 48 to 72 hours at ₦0 delivery fee.',
  },
  {
    question: 'How do I confirm that the GHT herbal supplements are genuine?',
    answer:
      'All supplements supplied by SD GHT Health Care Nigeria Ltd are sourced directly from authorized GHT corporate distribution, featuring tamper-evident seals, batch numbers, manufacturing/expiry dates, and verifiable NAFDAC registration numbers.',
  },
  {
    question: 'Which bottle regimen is recommended for maximum lasting results?',
    answer:
      'A 2-Bottle Starter Pack covers initial 30-day nutritional support, while our 3-Bottle Complete Pack (60-day regimen) is our most recommended protocol for deep, sustained wellness support and includes maximum multi-bottle discount savings.',
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
        heading: '7-Day Sealed Return & Transit Replacement',
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
        body: 'All parcels are dispatched in discreet, plain outer packaging. Your personal contact information is never sold, rented, or shared with unauthorized third-party marketers.',
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
  optimizeWidth?: number;
  onInspect?: () => void;
}

const StudioProductStage: React.FC<StudioProductStageProps> = ({
  entries,
  alt,
  heightClassName,
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
      <div
        className={`relative w-full ${heightClassName} bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#ffffff_60%,#f1f5f3_100%)] overflow-hidden group`}
      >
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
          className={`absolute inset-0 flex items-center justify-center p-6 ${
            onInspect ? 'cursor-zoom-in' : ''
          }`}
        >
          {hasFailed ? (
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#D5E0DA] flex items-center justify-center text-[#065F46] mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="text-base font-bold text-[#0F1E17] font-[family-name:var(--font-editorial)]">
                {alt}
              </span>
              <span className="text-xs text-[#065F46] font-medium mt-1">
                NAFDAC Registered Herbal Formulation
              </span>
            </div>
          ) : (
            <img
              key={`${safeIdx}-${currentStage}`}
              src={activeSrc}
              alt={`${alt} — ${currentEntry?.label || 'Supplement'}`}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="max-w-full max-h-full w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          )}
        </div>

        {onInspect && !hasFailed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-[#0F1E17] border border-[#CBDAD2] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ZoomIn className="w-4 h-4 text-[#065F46]" />
            <span>Tap to Zoom / Read Label</span>
          </button>
        )}
      </div>

      {hasMultipleEntries && (
        <div
          className="w-full bg-[#FAFBF9] border-t border-slate-200/80 overflow-x-auto no-scrollbar py-3 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 w-max sm:mx-auto">
            {entries.map((entry, idx) => {
              const isSelected = idx === safeIdx;
              const thumbSrc = getOptimizedImageUrl(entry.url, 240) || entry.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  title={entry.label}
                  className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white border-[#065F46] text-[#065F46] ring-2 ring-[#065F46]/30 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <img
                    src={thumbSrc}
                    alt={entry.label}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
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
  kickerText?: string;
  priorityBadge?: string;
  nafdacLabel?: string;
}

const ClinicalPackageCard: React.FC<PackageCardProps> = ({
  pkg,
  cardIndex,
  selectedIdx,
  onSelectOption,
  onOpenCheckout,
  onInspectDetail,
  isBenefitsExpanded,
  onToggleBenefits,
  whatsappTarget,
  kickerText,
  priorityBadge,
  nafdacLabel,
}) => {
  const pricing = computePackagePricing(pkg, selectedIdx);
  const galleryEntries = getPackageGalleryEntries(pkg);

  const benefits = Array.isArray(pkg.health_benefits)
    ? pkg.health_benefits.filter((b) => b && b.trim().length > 0)
    : [];
  const visibleBenefits = isBenefitsExpanded ? benefits : benefits.slice(0, 4);
  const hiddenBenefitCount = Math.max(0, benefits.length - 4);

  const getWhatsAppHref = () => {
    const activeLabel = pricing.activeOption ? ` (${pricing.activeOption.bottles})` : '';
    const msg = `Hello ${CONFIG.company.name}, I would like to order ${pkg.name}${activeLabel} with Pay on Delivery.`;
    return buildWhatsAppUrl(whatsappTarget, msg);
  };

  return (
    <article
      id={`package-card-${pkg.package_code || cardIndex}`}
      className="bg-white rounded-3xl border border-[#DCE4E0] shadow-[0_12px_40px_-16px_rgba(15,31,24,0.08)] hover:shadow-[0_20px_50px_-20px_rgba(6,95,70,0.12)] hover:border-[#065F46]/50 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Top Clinical Protocol Identity Header */}
      <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-slate-100 bg-[#FCFDFD]">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#52685D] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="text-[#065F46] font-bold">
              {kickerText || `PROTOCOL ${String(cardIndex + 1).padStart(2, '0')}`}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-[#384F43]">
              {pkg.package_code || 'NAFDAC VERIFIED'}
            </span>
          </div>

          {priorityBadge && (
            <span className="text-[11px] font-bold text-[#065F46] bg-[#E1EFE7] px-2.5 py-1 rounded-md uppercase tracking-wider border border-[#065F46]/20">
              {priorityBadge}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h3 className="text-2xl sm:text-[1.85rem] lg:text-[2.1rem] font-bold text-[#0F1E17] font-[family-name:var(--font-editorial)] tracking-[-0.015em] leading-[1.2] [text-wrap:balance]">
            {pkg.name}
          </h3>

          <div className="tabular-nums text-left sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F1E17]">
              ₦{pricing.currentPrice.toLocaleString()}
            </span>
            {pricing.savings > 0 && (
              <span className="ml-2 text-sm sm:text-base text-slate-400 line-through">
                ₦{pricing.retailPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Large Studio Product Pedestal with Enlarge & Bottle Inspection */}
      <div className="border-b border-slate-100 bg-white">
        <StudioProductStage
          entries={galleryEntries}
          alt={pkg.name}
          heightClassName="h-[400px] sm:h-[480px] lg:h-[520px]"
          optimizeWidth={1600}
          onInspect={() => onInspectDetail(pkg)}
        />

        {/* Quick-Read Bottle Verification Bar (Tailored for Adults) */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F4F8F5] border-t border-[#DCE4E0] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#065F46]">
            <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
            <span>{nafdacLabel || 'NAFDAC Certified · Tamper-Evident Seals'}</span>
          </div>
          <span className="text-xs sm:text-[13px] text-[#384F43] font-medium">
            Inspect bottle labels &amp; seals at doorstep before payment
          </span>
        </div>
      </div>

      {/* Card Content & Interactive Regimen Selector */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {pkg.description && (
            <p className="text-base sm:text-[17px] text-[#2F4239] leading-[1.75]">
              {pkg.description}
            </p>
          )}

          {visibleBenefits.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#52685D]">
                Verified Clinical Benefits:
              </h4>
              <ul className="space-y-2.5">
                {visibleBenefits.map((benefit, bIdx) => (
                  <li
                    key={bIdx}
                    className="flex items-start gap-3 text-base sm:text-[16.5px] text-[#1E3027] font-medium leading-[1.65]"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#065F46] shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {hiddenBenefitCount > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleBenefits(pkg.id)}
                  className="text-xs sm:text-sm font-bold text-[#065F46] hover:underline cursor-pointer pt-1"
                >
                  {isBenefitsExpanded
                    ? 'Show fewer benefits'
                    : `+ Show ${hiddenBenefitCount} more clinical benefits`}
                </button>
              )}
            </div>
          )}

          {/* Tactile Regimen Selector Sized for Adults */}
          {pkg.options && pkg.options.length > 0 && (
            <div className="space-y-3.5 pt-5 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-[17px] font-bold text-[#0F1E17]">
                  Select Treatment Regimen:
                </span>
                <span className="text-xs sm:text-sm text-[#065F46] font-bold">
                  Free Nationwide Delivery
                </span>
              </div>

              <div className="space-y-3">
                {pkg.options.map((opt, oIdx) => {
                  const isSel = oIdx === selectedIdx;
                  const optPriceInfo = resolveSingleOptionPricing(
                    opt,
                    Number(pkg.discount) || 0
                  );
                  const isRecommended =
                    oIdx === 1 ||
                    opt.bottles.toLowerCase().includes('3 bottle') ||
                    (pkg.options && pkg.options.length === 1);

                  return (
                    <div
                      key={oIdx}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectOption(pkg, oIdx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectOption(pkg, oIdx);
                        }
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 text-left ${
                        isSel
                          ? 'bg-[#F2F8F4] border-[#065F46] ring-2 ring-[#065F46]/30 shadow-xs'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSel ? 'border-[#065F46] bg-[#065F46]' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base sm:text-[17px] text-[#0F1E17]">
                              {optPriceInfo.label}
                            </span>
                            {isRecommended && (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#065F46] bg-[#E1EFE7] px-2.5 py-0.5 rounded-md border border-[#065F46]/20">
                                Recommended
                              </span>
                            )}
                            {optPriceInfo.discountPercent > 0 && !isRecommended && (
                              <span className="text-[11px] font-bold text-[#065F46] bg-[#EBF5F0] px-2 py-0.5 rounded-md">
                                -{optPriceInfo.discountPercent}% Off
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#52685D] mt-1 font-medium">
                            {isRecommended
                              ? 'Recommended 60-day complete restorative regimen'
                              : optPriceInfo.label.includes('1') || optPriceInfo.label.includes('2')
                                ? 'Starter nutritional support'
                                : 'Comprehensive extended care protocol'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <div className="text-lg sm:text-xl font-extrabold text-[#0F1E17]">
                          ₦{optPriceInfo.sellingPrice.toLocaleString()}
                        </div>
                        {optPriceInfo.savings > 0 && (
                          <div className="text-xs sm:text-sm text-slate-400 line-through">
                            ₦{optPriceInfo.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pricing.includedList.length > 0 && (
            <p className="text-xs sm:text-sm text-[#52685D] pt-1 leading-relaxed">
              <strong className="text-[#0F1E17] font-semibold">Included in Regimen: </strong>
              {pricing.includedList.join(' · ')}
            </p>
          )}
        </div>

        {/* Pricing Summary & Direct Actions */}
        <div className="pt-5 border-t border-slate-200/80 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3 tabular-nums">
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F1E17]">
                  ₦{pricing.currentPrice.toLocaleString()}
                </span>
                {pricing.savings > 0 && (
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    ₦{pricing.retailPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#065F46] mt-0.5">
                {pricing.savings > 0
                  ? `Save ₦${pricing.savings.toLocaleString()} (${pricing.discount}% Off) · Pay on Delivery`
                  : 'Free Nationwide Delivery · Zero Upfront Payment'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onInspectDetail(pkg)}
              className="text-xs sm:text-sm font-bold text-[#52685D] hover:text-[#065F46] underline underline-offset-4 cursor-pointer"
            >
              Full Formulation Sheet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => onOpenCheckout(pkg, selectedIdx)}
              className="sm:col-span-3 min-h-[56px] sm:min-h-[60px] px-5 py-3.5 rounded-xl bg-[#065F46] hover:bg-[#044E39] text-white font-bold text-base sm:text-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-5 h-5 shrink-0" />
              <span>Order with Pay on Delivery</span>
            </button>

            <a
              href={getWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                try {
                  trackWhatsAppClick(`Ad Card WhatsApp: ${pkg.name}`);
                } catch {}
              }}
              className="sm:col-span-2 min-h-[56px] sm:min-h-[60px] px-4 py-3.5 rounded-xl border border-[#CBDAD2] bg-[#F6FAF8] hover:bg-[#EAF3EF] text-[#065F46] font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>Consult Specialist</span>
            </a>
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
        } else if (
          codeUpper === 'P003' ||
          nameLower.includes('sugar') ||
          nameLower.includes('diabet') ||
          nameLower.includes('gluco')
        ) {
          normalized.name = 'Natural Blood Sugar Support (Diabetes Care Pack)';
          normalized.package_code = pkg.package_code || 'P003';
        } else if (
          codeUpper === 'P004' ||
          nameLower.includes('arthri') ||
          nameLower.includes('joint') ||
          nameLower.includes('bone')
        ) {
          normalized.name = 'Joint Comfort & Arthritis Relief Protocol';
          normalized.package_code = pkg.package_code || 'P004';
        } else if (
          codeUpper === 'P009' ||
          nameLower.includes('female') ||
          nameLower.includes('infertilit') ||
          nameLower.includes('women')
        ) {
          normalized.name = 'Women’s Reproductive & Hormonal Protocol';
          normalized.package_code = pkg.package_code || 'P009';
        } else if (nameLower.includes('combo')) {
          normalized.name = 'Complete Male Vitality & Prostate Synergy Combo';
          normalized.package_code = pkg.package_code || 'COMBO-01';
        }

        map.set(pkg.id, normalized);
      }
    }

    const rawList = Array.from(map.values());

    // Strict order of importance requested: Prostate first -> Performance -> Diabetes -> Arthritis -> Rest
    return rawList.sort((a, b) => {
      const getRank = (p: PackageData): number => {
        const code = (p.package_code || '').trim().toUpperCase();
        const name = (p.name || '').toLowerCase();
        // 1. Prostate
        if (code === 'P001' || name.includes('prostate')) return 1;
        // 2. Male Performance / Stamina
        if (
          code === 'P002' ||
          name.includes('performance') ||
          name.includes('stamina') ||
          name.includes('weak erection') ||
          name.includes('reodoe')
        )
          return 2;
        // 3. Diabetes / Blood Sugar
        if (
          code === 'P003' ||
          name.includes('sugar') ||
          name.includes('diabet') ||
          name.includes('gluco')
        )
          return 3;
        // 4. Arthritis / Joint Comfort
        if (
          code === 'P004' ||
          name.includes('arthri') ||
          name.includes('joint') ||
          name.includes('bone')
        )
          return 4;
        // 5. Female Infertility / Women's Care
        if (
          code === 'P009' ||
          name.includes('female') ||
          name.includes('infertilit') ||
          name.includes('women')
        )
          return 5;
        // 6. Others / Combos
        return 6;
      };
      return getRank(a) - getRank(b);
    });
  }, [packages, combos]);

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

  const getCardMetadata = (pkg: PackageData, idx: number) => {
    const code = (pkg.package_code || '').trim().toUpperCase();
    const name = (pkg.name || '').toLowerCase();

    if (code === 'P001' || name.includes('prostate')) {
      return {
        kicker: "PROTOCOL 01 · MEN'S PROSTATE HEALTH & BLADDER COMFORT",
        priorityBadge: isDedicatedProstate ? 'Primary Focus' : 'Flagship Protocol #1',
        nafdacLabel: 'NAFDAC Approved · Laboratory Tested Formulation',
      };
    }
    if (code === 'P002' || name.includes('performance') || name.includes('stamina')) {
      return {
        kicker: "PROTOCOL 02 · MALE STAMINA, LIBIDO & ENDURANCE",
        priorityBadge: isDedicatedVitality ? 'Primary Focus' : 'Masculine Synergy #2',
        nafdacLabel: 'NAFDAC Approved · Clinical Adaptogens & Zinc',
      };
    }
    if (code === 'P003' || name.includes('sugar') || name.includes('diabet')) {
      return {
        kicker: 'PROTOCOL 03 · BLOOD SUGAR & DIABETES CARE',
        priorityBadge: 'Metabolic Balance #3',
        nafdacLabel: 'NAFDAC Approved · Natural Glycemic Support',
      };
    }
    if (code === 'P004' || name.includes('arthri') || name.includes('joint')) {
      return {
        kicker: 'PROTOCOL 04 · JOINT COMFORT & CARTILAGE MOBILITY',
        priorityBadge: 'Joint Mobility #4',
        nafdacLabel: 'NAFDAC Approved · Bone & Cartilage Relief',
      };
    }
    if (code === 'P009' || name.includes('female') || name.includes('infertilit') || name.includes('women')) {
      return {
        kicker: 'PROTOCOL 05 · FEMALE REPRODUCTIVE & HORMONAL CARE',
        priorityBadge: "Women's Wellness #5",
        nafdacLabel: 'NAFDAC Approved · Hormonal Balance Synergy',
      };
    }
    return {
      kicker: `PROTOCOL ${String(idx + 1).padStart(2, '0')} · TARGETED FORMULATION`,
      priorityBadge: 'Authorized Pack',
      nafdacLabel: 'NAFDAC Approved · Tamper-Evident Seals',
    };
  };

  const [packageOptionMap, setPackageOptionMap] = useState<Record<string, number>>({});
  const [productOptionMap, setProductOptionMap] = useState<Record<string, number>>({});
  const [expandedBenefitsMap, setExpandedBenefitsMap] = useState<Record<string, boolean>>({});
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
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
    return prostateBundle || allBundles[0];
  }, [allBundles, adIntent, prostateBundle]);

  useEffect(() => {
    if (!inlineTarget.item && defaultBundle) {
      setInlineTarget({
        item: defaultBundle,
        type: 'package',
        optionIdx: getDefaultOptionIdx(defaultBundle.options),
      });
      return;
    }
    if (inlineTarget.item && inlineTarget.type === 'package') {
      const updatedPkg = allBundles.find((b) => b.id === inlineTarget.item?.id);
      if (updatedPkg && updatedPkg !== inlineTarget.item) {
        setInlineTarget((prev) => ({ ...prev, item: updatedPkg }));
      }
    }
  }, [defaultBundle, allBundles, inlineTarget.item, inlineTarget.type]);

  const getPkgOptionIdx = (pkg: PackageData): number => {
    if (packageOptionMap[pkg.id] !== undefined) return packageOptionMap[pkg.id];
    return getDefaultOptionIdx(pkg.options);
  };

  const getProdOptionIdx = (prod: Product): number => {
    if (productOptionMap[prod.id] !== undefined) return productOptionMap[prod.id];
    return getDefaultOptionIdx(prod.options);
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
    const targetElement = document.getElementById('express-order');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setExpressModalState({
        isOpen: true,
        item,
        type,
        optionIdx,
      });
    }
  };

  const getAdvisorWhatsAppHref = (customSubject?: string): string => {
    const message = customSubject
      ? `Hello ${CONFIG.company.name}, I am visiting your Wellness page and would like guidance on ${customSubject}.`
      : `Hello ${CONFIG.company.name}, I would like guidance on choosing the right GHT herbal wellness pack with Pay on Delivery.`;
    return buildWhatsAppUrl(whatsappTarget, message);
  };

  const recordAdvisorWhatsAppClick = (contextLabel: string) => {
    try {
      trackWhatsAppClick(contextLabel);
    } catch {
      // Non-blocking
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const brandLogoSrc = useMemo(() => {
    if (!CONFIG.company.logoUrl) return '';
    return getOptimizedImageUrl(CONFIG.company.logoUrl, 240) || CONFIG.company.logoUrl;
  }, []);

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

  const isDedicatedProstate = adIntent.category === 'prostate';
  const isDedicatedVitality = adIntent.category === 'vitality';

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#0F1E17] font-[family-name:var(--font-soft-body)] antialiased selection:bg-[#065F46] selection:text-white">
      {/* 1. Clinical Brand Masthead (Header) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE4E0]">
        <div className="max-w-7xl mx-auto h-[64px] sm:h-[72px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* Brand Wordmark & Official Seal */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            {brandLogoSrc && !logoLoadFailed ? (
              <img
                src={brandLogoSrc}
                alt={CONFIG.company.name}
                referrerPolicy="no-referrer"
                onError={() => setLogoLoadFailed(true)}
                className="h-9 sm:h-10 w-auto object-contain shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#0B1E16] text-[#A3E5C1] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}

            <div>
              <span className="text-[15px] sm:text-[18px] font-bold text-[#0F1E17] font-[family-name:var(--font-editorial)] tracking-tight block leading-tight">
                {CONFIG.company.name}
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-[#065F46] uppercase block">
                Direct Doorstep Distribution
              </span>
            </div>
          </button>

          {/* Clean Editorial Navigation (Desktop) */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-7 text-[14.5px] font-medium text-[#384F43]"
          >
            <button
              type="button"
              onClick={() => scrollToSection('featured-protocols')}
              className="hover:text-[#065F46] transition-colors whitespace-nowrap cursor-pointer"
            >
              Prostate Protocol
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('featured-protocols')}
              className="hover:text-[#065F46] transition-colors whitespace-nowrap cursor-pointer"
            >
              Male Stamina
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#065F46] transition-colors whitespace-nowrap cursor-pointer"
            >
              Doorstep Verification
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('reviews')}
              className="hover:text-[#065F46] transition-colors whitespace-nowrap cursor-pointer"
            >
              Verified Reviews
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('express-order')}
              className="hover:text-[#065F46] transition-colors whitespace-nowrap cursor-pointer"
            >
              Order Form
            </button>
          </nav>

          {/* Primary Action Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToSection('express-order')}
              className="min-h-[42px] sm:min-h-[46px] px-4 sm:px-5 rounded-xl bg-[#065F46] hover:bg-[#044E39] text-white text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Order on Delivery (₦0 Upfront)
            </button>
          </div>
        </div>
      </header>

      {/* 2. Sleek Authoritative Clinical Hero Section */}
      <section className="relative bg-[#0B1E16] text-[#FAF9F5] border-b border-[#1A3327] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.14)_0%,transparent_65%),radial-gradient(ellipse_at_bottom_left,rgba(217,185,120,0.08)_0%,transparent_60%)]"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
          <div className="max-w-3xl space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#A3E5C1] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>{adIntent.kicker}</span>
            </div>

            <h1 className="text-[2.1rem] sm:text-[2.8rem] lg:text-[3.2rem] font-bold text-[#FAF9F5] tracking-[-0.02em] leading-[1.12] [text-wrap:balance] font-[family-name:var(--font-editorial)]">
              {adIntent.headline}
            </h1>

            <p className="text-base sm:text-lg text-[#D8E6DF] leading-[1.65] max-w-2xl font-normal">
              {adIntent.subheadline}
            </p>

            {/* Quick Hero Consultation & Jump Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => scrollToSection('featured-protocols')}
                className="min-h-[50px] sm:min-h-[54px] px-6 sm:px-7 rounded-xl bg-[#FAF9F5] hover:bg-white text-[#0B1E16] text-base font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Select Your Bottle Regimen</span>
                <ArrowDown className="w-4 h-4 text-[#065F46] shrink-0" />
              </button>

              <a
                href={getAdvisorWhatsAppHref("Men's Health Consultation")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordAdvisorWhatsAppClick('Hero WhatsApp Consultation')}
                className="min-h-[50px] sm:min-h-[54px] px-5 sm:px-6 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] text-[#FAF9F5] text-sm sm:text-base font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-[#A3E5C1] shrink-0" />
                <span>Consult with Specialist</span>
              </a>

              <a
                href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 text-sm sm:text-[15px] font-semibold text-[#C2D8CE] hover:text-white transition-colors py-2 tabular-nums"
              >
                <Phone className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <span>Call {contactPhone}</span>
              </a>
            </div>
          </div>

          {/* Compact 4-Pillar Doorstep Assurance Strip */}
          <div className="pt-6 border-t border-white/12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <span>₦0 Upfront Payment</span>
              </div>
              <p className="text-xs text-[#BED2C8] leading-relaxed">
                Inspect sealed parcel at your doorstep before paying.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <Truck className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <span>Free Express Delivery</span>
              </div>
              <p className="text-xs text-[#BED2C8] leading-relaxed">
                24–48 hours nationwide to all 36 states and FCT.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <span>NAFDAC Certified</span>
              </div>
              <p className="text-xs text-[#BED2C8] leading-relaxed">
                Tamper-evident seals and genuine GHT formulations.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <Lock className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <span>100% Confidential</span>
              </div>
              <p className="text-xs text-[#BED2C8] leading-relaxed">
                Discreet plain outer box with confidential dispatch.
              </p>
            </div>
          </div>

          {/* Quick Condition Navigator for Adult Users */}
          <div className="pt-5 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#A3E5C1] uppercase tracking-wider">
              <span>Quick Jump to Health Condition:</span>
              <span className="text-[#C2D8CE] normal-case font-normal text-[11.5px] hidden sm:inline">
                Tap any condition below to jump directly to its bottle regimen
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {allBundles.map((pkg, idx) => {
                const label =
                  idx === 0
                    ? '01. Prostate Care'
                    : idx === 1
                      ? '02. Male Stamina'
                      : idx === 2
                        ? '03. Blood Sugar (Diabetes)'
                        : idx === 3
                          ? '04. Joint & Arthritis'
                          : idx === 4
                            ? "05. Women's Wellness"
                            : `06. ${pkg.name.slice(0, 18)}`;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => scrollToSection(`package-card-${pkg.package_code || idx}`)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF9F5] text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors shrink-0 border border-white/10 flex items-center gap-1.5"
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Health Formulations Showcase (Zero-Delay, Strict Order of Importance) */}
      <section id="featured-protocols" className="pt-8 pb-16 sm:pb-24 bg-[#FAFBF9] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Direct Presentation of All Packs in Strict Order of Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            {allBundles.map((pkg, idx) => {
              const meta = getCardMetadata(pkg, idx);
              return (
                <ClinicalPackageCard
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
                  kickerText={meta.kicker}
                  priorityBadge={meta.priorityBadge}
                  nafdacLabel={meta.nafdacLabel}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How Nationwide Pay-on-Delivery Works */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-white border-y border-[#DCE4E0] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-xs font-bold text-[#065F46] uppercase tracking-widest">
              Zero Upfront Risk
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-[#0F1E17] font-[family-name:var(--font-editorial)] tracking-[-0.015em] leading-[1.2]">
              How Nationwide Pay-on-Delivery Works
            </h2>
            <p className="text-base sm:text-lg text-[#384F43] leading-[1.7]">
              Designed for complete peace of mind. You inspect the factory-sealed supplements in
              person at your doorstep before making any payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            <div className="space-y-3 p-6 rounded-2xl bg-[#FAFBF9] border border-[#DCE4E0]">
              <div className="w-10 h-10 rounded-xl bg-[#065F46] text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-[#0F1E17]">Request Doorstep Dispatch</h3>
              <p className="text-sm text-[#384F43] leading-relaxed">
                Choose your bottle regimen and fill in your delivery address. No ATM card details,
                BVN, or online payments are ever required.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-[#FAFBF9] border border-[#DCE4E0]">
              <div className="w-10 h-10 rounded-xl bg-[#065F46] text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-[#0F1E17]">Rider Phone Confirmation</h3>
              <p className="text-sm text-[#384F43] leading-relaxed">
                Our regional dispatch desk calls or messages you on WhatsApp to confirm your exact
                delivery time within 24–48 hours.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-[#FAFBF9] border border-[#DCE4E0]">
              <div className="w-10 h-10 rounded-xl bg-[#065F46] text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-[#0F1E17]">Inspect Seals &amp; Pay</h3>
              <p className="text-sm text-[#384F43] leading-relaxed">
                Verify intact tamper-evident seals and NAFDAC registration numbers at your door, then
                pay via Bank Transfer, POS, or Cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verified Customer Testimonials */}
      <section id="reviews" className="py-14 sm:py-20 bg-[#FAFBF9] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-xs font-bold text-[#065F46] uppercase tracking-widest">
              Verified Doorstep Buyers
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-[#0F1E17] font-[family-name:var(--font-editorial)] tracking-[-0.015em] leading-[1.2]">
              Trusted by Adults &amp; Professionals Nationwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {CUSTOMER_STORIES.slice(0, 3).map((story, sIdx) => (
              <blockquote
                key={sIdx}
                className="p-6 sm:p-7 rounded-2xl bg-white border border-[#DCE4E0] flex flex-col justify-between space-y-6 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-[15px] text-[#2F4239] leading-[1.74]">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>

                <footer className="pt-4 border-t border-slate-100">
                  <div className="font-bold text-[15.5px] text-[#0F1E17] font-[family-name:var(--font-editorial)]">
                    {story.name}
                  </div>
                  <div className="text-xs text-[#52685D] mt-0.5">
                    {story.role} · {story.location}
                  </div>
                  <div className="text-xs font-semibold text-[#065F46] mt-1">
                    Verified Doorstep Purchase
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>

          {/* Frequently Asked Questions */}
          <div className="max-w-3xl mx-auto pt-6 space-y-5">
            <h3 className="text-xl sm:text-3xl font-semibold text-[#0F1E17] font-[family-name:var(--font-editorial)] text-center">
              Frequently Asked Questions
            </h3>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {BUYER_FAQS.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="py-2">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-base sm:text-[17px] font-semibold text-[#0F1E17]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#52685D] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="pb-4 text-sm sm:text-[15px] text-[#384F43] leading-[1.72]">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Complete Your Pay-on-Delivery Order (1-Step Checkout) */}
      <section id="express-order" className="py-14 sm:py-20 bg-[#F4F6F4] border-t border-[#DCE4E0] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-xs font-bold text-[#065F46] uppercase tracking-widest">
              Direct Doorstep Dispatch
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-[#0F1E17] font-[family-name:var(--font-editorial)] tracking-[-0.015em] leading-[1.2]">
              Complete Your Pay-on-Delivery Order
            </h2>
            <p className="text-base sm:text-lg text-[#384F43] leading-[1.7]">
              Enter your recipient details below. Our regional fulfillment center dispatches directly
              to your doorstep with free nationwide shipping.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual Summary Column (Desktop) */}
            <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-5">
              {inlineTarget.item && inlineSummaryPricing && (
                <div className="bg-white rounded-2xl border border-[#DCE4E0] shadow-sm overflow-hidden">
                  <StudioProductStage
                    entries={inlineGallery}
                    alt={inlineTarget.item.name}
                    heightClassName="h-[340px]"
                    optimizeWidth={1000}
                    onInspect={() =>
                      setDetailModalItem({
                        item: inlineTarget.item!,
                        type: inlineTarget.type,
                      })
                    }
                  />
                  <div className="p-6 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold text-[#065F46] uppercase tracking-wider block">
                      Selected for Doorstep Dispatch
                    </span>
                    <h3 className="text-xl font-bold text-[#0F1E17] font-[family-name:var(--font-editorial)]">
                      {inlineTarget.item.name}
                    </h3>
                    <div className="text-xl font-bold text-[#065F46] tabular-nums">
                      ₦{inlineSummaryPricing.currentPrice.toLocaleString()}
                    </div>
                    {inlineSummaryPricing.includedList.length > 0 && (
                      <p className="text-xs text-[#52685D] leading-relaxed">
                        <strong className="text-[#0F1E17]">Includes: </strong>
                        {inlineSummaryPricing.includedList.join(' · ')}
                      </p>
                    )}
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-[#384F43]">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#065F46] shrink-0" />
                        <span>Free Nationwide Delivery across all 36 states &amp; FCT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#065F46] shrink-0" />
                        <span>Inspect tamper-evident factory seals before payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Column */}
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

      {/* 7. Quiet Compliance Footer */}
      <footer className="bg-[#0B1E16] text-[#BED2C8] py-14 border-t border-[#1A3327]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#A3E5C1] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-base font-[family-name:var(--font-editorial)]">
                  {CONFIG.company.name}
                </span>
              </div>
              <p className="text-xs text-[#A3B8AF] leading-relaxed">
                Authorized Nigerian distributor of genuine NAFDAC-certified GHT herbal dietary
                supplements with direct nationwide fulfillment.
              </p>
            </div>

            <div className="space-y-2 text-xs text-[#BED2C8]">
              <span className="font-bold text-white text-sm block mb-1">Fulfillment Desk</span>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#A3E5C1] shrink-0 mt-0.5" />
                <span>{CONFIG.company.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:text-white tabular-nums">
                  {contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#A3E5C1] shrink-0" />
                <a href={`mailto:${CONFIG.company.email}`} className="hover:text-white">
                  {CONFIG.company.email}
                </a>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#BED2C8]">
              <span className="font-bold text-white text-sm block mb-1">Customer Policies</span>
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePolicyModal('return-policy')}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Return, Inspection &amp; Exchange Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePolicyModal('privacy-policy')}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Customer Privacy &amp; Data Protection Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePolicyModal('terms-of-service')}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Terms of Service &amp; Nationwide Delivery
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-xs text-[#7F998E]">
            © {new Date().getFullYear()} {CONFIG.company.name}. All rights reserved. Dietary supplements
            are intended to support nutritional balance.
          </div>
        </div>
      </footer>

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

      {/* High-Resolution Supplement Details Modal */}
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
          <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DCE4E0] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-xs font-bold text-[#065F46] uppercase tracking-wider block">
                  Supplement Formulation Sheet
                </span>
                <h3 className="text-lg sm:text-2xl font-bold text-[#0F1E17] font-[family-name:var(--font-editorial)]">
                  {detailModalItem.item.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-slate-100">
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
                  heightClassName="h-[380px] sm:h-[460px] md:h-[520px]"
                  optimizeWidth={1600}
                />
              </div>

              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 text-[#2F4239]">
                <div className="space-y-4">
                  <p className="text-base sm:text-[16.5px] leading-relaxed">
                    {detailModalItem.type === 'package'
                      ? (detailModalItem.item as PackageData).description
                      : (detailModalItem.item as Product).long_desc ||
                        (detailModalItem.item as Product).short_desc}
                  </p>

                  {(detailModalItem.item.health_benefits || []).length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <h4 className="font-bold text-[#0F1E17] text-xs sm:text-sm uppercase tracking-wider">
                        Wellness &amp; Health Benefits:
                      </h4>
                      <ul className="space-y-2">
                        {detailModalItem.item.health_benefits.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
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
                    className="w-full min-h-[52px] sm:min-h-[56px] px-5 py-3.5 rounded-xl bg-[#065F46] hover:bg-[#044E39] text-white font-bold text-base cursor-pointer shadow-sm transition-colors whitespace-nowrap"
                  >
                    Order Now — Pay on Delivery
                  </button>
                  <a
                    href={getAdvisorWhatsAppHref(detailModalItem.item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      recordAdvisorWhatsAppClick(
                        `Detail Modal WhatsApp: ${detailModalItem.item.name}`
                      )
                    }
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#065F46] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Consult on WhatsApp</span>
                  </a>
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
          <div className="relative z-10 w-full max-w-xl max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#DCE4E0] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#065F46]" />
                <h3 className="text-lg font-bold text-[#0F1E17] font-[family-name:var(--font-editorial)]">
                  {POLICY_MODAL_CONTENT[activePolicyModal].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close policy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
              {POLICY_MODAL_CONTENT[activePolicyModal].sections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[#0F1E17]">{sec.heading}</h4>
                  <p className="leading-relaxed text-slate-600">{sec.body}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0F1E17] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
