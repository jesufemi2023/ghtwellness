import React, { useState } from 'react';
import { Product, PackageData } from '../types';
import { CONFIG } from '../config';
import { openWhatsAppLink, cleanWhatsAppNumber } from '../utils/whatsapp';
import { formatOptionProductList } from '../utils/bottleFormatter';
import { sanitizeAdTitle, sanitizeAdText } from '../utils/adCompliance';
import {
  ShieldCheck,
  Phone,
  ShoppingBag,
  CheckCircle2,
  Truck,
  HeartHandshake,
  Star,
  Mail,
  MapPin,
  Scale,
  Info
} from 'lucide-react';

type PolicyTab = 'privacy-policy' | 'terms-of-service' | 'return-policy' | 'about' | 'home';

interface AdLandingPageProps {
  products: Product[];
  packages: PackageData[];
  combos: PackageData[];
  onOrderProduct: (product: Product, quantity?: number) => void;
  onOrderPackage: (pkg: PackageData, type: 'package', quantity?: number, optionIdx?: number) => void;
  onViewProduct: (product: Product) => void;
  onViewPackage: (pkg: PackageData) => void;
  onNavigatePolicy?: (tab: PolicyTab) => void;
}

const FALLBACK_WELLNESS_IMG =
  'https://res.cloudinary.com/drizgfofw/image/upload/v1773906809/compressed_70kb_ox1i8j.jpg';

const CUSTOMER_REVIEWS = [
  {
    name: 'Chief Adebayo O.',
    location: 'Ibadan, Oyo State',
    bundle: 'Complete Wellness Bundle',
    quote:
      'The dispatch rider delivered to my residence in Bodija within 36 hours. Every bottle had its intact factory seal and NAFDAC number, and I paid via transfer only after inspecting the package. After a month of consistent daily use alongside my regular routine, my daily energy and joint comfort feel noticeably supported.',
  },
  {
    name: 'Mrs. Evelyn N.',
    location: 'Benin City, Edo State',
    bundle: 'Daily Vitality Pack',
    quote:
      'What stood out to me was the transparency—no hidden delivery fees and very patient wellness advisors on WhatsApp who explained the morning and evening schedule clearly for my parents.',
  },
  {
    name: 'Engr. Musa K.',
    location: 'Abuja, FCT',
    bundle: "Men's Stamina & Vitality Bundle",
    quote:
      'Authentic GHT herbal supplements delivered right to my office in Wuse. Clear dosage instructions on every bottle and dependable customer follow-up.',
  },
];

export const AdLandingPage: React.FC<AdLandingPageProps> = ({
  products,
  packages,
  combos,
  onOrderProduct,
  onOrderPackage,
  onViewProduct,
  onViewPackage,
  onNavigatePolicy,
}) => {
  const [packageOptionSelections, setPackageOptionSelections] = useState<Record<string, number>>({});
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'packages' | 'combos' | 'singles'>('all');

  const whatsappNumber = cleanWhatsAppNumber(CONFIG.whatsapp.number);

  const allPackagesAndCombos = [...packages, ...combos];
  const visiblePackages =
    catalogFilter === 'packages'
      ? packages
      : catalogFilter === 'combos'
        ? combos
        : allPackagesAndCombos;

  const getSelectedOptionIdx = (pkg: PackageData) => {
    if (packageOptionSelections[pkg.id] !== undefined) {
      return packageOptionSelections[pkg.id];
    }
    if (pkg.options && pkg.options.length > 0) {
      const idx3 = pkg.options.findIndex((o) => o.bottles.toLowerCase().includes('3 bottle'));
      return idx3 >= 0 ? idx3 : 0;
    }
    return 0;
  };

  const handlePolicyLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, tab: PolicyTab) => {
    if (onNavigatePolicy) {
      e.preventDefault();
      onNavigatePolicy(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Editorial Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-medium text-emerald-800">
              <span>NAFDAC Registered Herbal Supplements</span>
              <span aria-hidden="true">·</span>
              <span>Authorized {CONFIG.company.name} {CONFIG.company.subtitle} Store</span>
              <span aria-hidden="true">·</span>
              <span>Nationwide Pay on Delivery</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 tracking-tight leading-[1.12] [text-wrap:balance]">
              Natural Herbal Supplements for Daily Vitality, Mobility &amp; Holistic Wellness
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Shop authentic multi-bottle herbal wellness bundles and single nutritional supplements formulated with plant-based extracts. Delivered to your doorstep across Nigeria in 24–48 hours—inspect intact seals before you pay.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="#wellness-catalog"
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors text-center"
              >
                Browse Wellness Bundles
              </a>
              <button
                type="button"
                onClick={() =>
                  openWhatsAppLink(
                    whatsappNumber,
                    'Hello SD GHT Health Care, I would like guidance on choosing the right herbal wellness supplement bundle.'
                  )
                }
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone size={16} className="text-emerald-700" />
                Speak With a Product Specialist ({CONFIG.company.phone})
              </button>
            </div>

            {/* Key Fulfillment Assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-100 text-left">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <Truck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Free Nationwide Delivery</p>
                  <p className="text-xs text-slate-600 mt-0.5">24–48 hours to major cities across all 36 states &amp; FCT.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Pay on Delivery (POD)</p>
                  <p className="text-xs text-slate-600 mt-0.5">Zero upfront risk—verify factory seals upon arrival before paying.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <HeartHandshake size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Dedicated Wellness Support</p>
                  <p className="text-xs text-slate-600 mt-0.5">Clear usage schedules &amp; responsive customer care desk.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Wellness Bundles & Supplement Catalog */}
      <section id="wellness-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Transparent NGN Pricing · Free Nationwide Dispatch
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Choose Your Herbal Wellness Bundle
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
              Select your preferred bottle course below to view exact included supplements and place a Pay-on-Delivery order.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start">
            {(
              [
                { id: 'all', label: `All Bundles (${allPackagesAndCombos.length})` },
                { id: 'packages', label: `Wellness Packs (${packages.length})` },
                { id: 'combos', label: `Value Combos (${combos.length})` },
                { id: 'singles', label: `Single Supplements (${products.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCatalogFilter(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  catalogFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Bottle Packages & Combos Grid */}
        {catalogFilter !== 'singles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visiblePackages.map((pkg) => {
              const selectedOptIdx = getSelectedOptionIdx(pkg);
              const activeOpt =
                pkg.options && pkg.options.length > 0 && pkg.options[selectedOptIdx]
                  ? pkg.options[selectedOptIdx]
                  : null;

              const optDiscount = activeOpt ? Number(activeOpt.discount) || 0 : 0;
              const pkgDiscount = Number(pkg.discount) || 0;
              const effectiveDiscount = activeOpt ? optDiscount : pkgDiscount;

              const baseOriginalPrice = activeOpt ? activeOpt.price : pkg.price;
              const finalPrice = Math.round(
                effectiveDiscount > 0
                  ? baseOriginalPrice * (1 - effectiveDiscount / 100)
                  : baseOriginalPrice
              );

              const includedBottleNames =
                activeOpt && activeOpt.products && activeOpt.products.length > 0
                  ? formatOptionProductList(activeOpt.products, activeOpt.bottles)
                  : pkg.products && pkg.products.length > 0
                    ? pkg.products.map((p) => p.name)
                    : [];

              const safeTitle = sanitizeAdTitle(pkg.name);
              const safeDescription = sanitizeAdText(pkg.description);
              const safeBenefits = (pkg.health_benefits || []).slice(0, 3).map(sanitizeAdText);
              const imageUrl = pkg.package_image_url || FALLBACK_WELLNESS_IMG;

              return (
                <article
                  key={pkg.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-600/50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Product Image */}
                    <div
                      className="relative h-60 bg-slate-100 overflow-hidden cursor-pointer border-b border-slate-100"
                      onClick={() => onViewPackage(pkg)}
                    >
                      <img
                        src={imageUrl}
                        alt={`${safeTitle} – GHT Herbal Wellness Supplement Bundle`}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_WELLNESS_IMG;
                        }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-emerald-700">
                          Herbal Dietary Supplement · NAFDAC Registered
                        </p>
                        <h3
                          onClick={() => onViewPackage(pkg)}
                          className="text-xl font-bold text-slate-900 leading-snug hover:text-emerald-700 cursor-pointer"
                        >
                          {safeTitle}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {safeDescription}
                        </p>
                      </div>

                      {/* Course Option Selector */}
                      {pkg.options && pkg.options.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-slate-700">
                            Select Bottle Course:
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {pkg.options.map((opt, optI) => {
                              const isSelected = selectedOptIdx === optI;
                              const thisDiscount = Number(opt.discount) || 0;
                              const thisPrice = Math.round(
                                thisDiscount > 0 ? opt.price * (1 - thisDiscount / 100) : opt.price
                              );
                              return (
                                <button
                                  key={optI}
                                  type="button"
                                  onClick={() =>
                                    setPackageOptionSelections((prev) => ({
                                      ...prev,
                                      [pkg.id]: optI,
                                    }))
                                  }
                                  className={`py-2 px-2 rounded-xl border text-center transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'border-emerald-700 bg-emerald-50/70 text-slate-900'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <span className="block text-[11px] font-semibold truncate">
                                    {opt.bottles}
                                  </span>
                                  <span className="block text-xs font-bold text-emerald-800 mt-0.5 tabular-nums">
                                    ₦{thisPrice.toLocaleString()}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Included Supplements Transparency */}
                      {includedBottleNames.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">Included Supplements: </span>
                          <span>{includedBottleNames.join(' · ')}</span>
                        </div>
                      )}

                      {/* Nutritional Support Highlights */}
                      {safeBenefits.length > 0 && (
                        <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                          {safeBenefits.map((benefit, i) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                              <CheckCircle2 size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Honest Pricing Row */}
                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-xs text-slate-500 block">Total Price (Free Delivery)</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                              ₦{finalPrice.toLocaleString()}
                            </span>
                            {effectiveDiscount > 0 && (
                              <span className="text-sm text-slate-400 line-through tabular-nums">
                                ₦{Math.round(baseOriginalPrice).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-800">
                          Pay on Delivery Available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-6 pt-0 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const optionText = activeOpt ? ` (${activeOpt.bottles})` : '';
                          const message = `Hello SD GHT Health Care, I have a question about the ${safeTitle}${optionText} supplement bundle.`;
                          openWhatsAppLink(whatsappNumber, message);
                        }}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone size={14} className="text-emerald-700" />
                        Ask Question
                      </button>

                      <button
                        type="button"
                        onClick={() => onOrderPackage(pkg, 'package', 1, selectedOptIdx)}
                        className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <ShoppingBag size={14} />
                        Order Now (POD)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewPackage(pkg)}
                      className="w-full text-center text-xs text-slate-600 hover:text-emerald-700 font-medium py-1 cursor-pointer"
                    >
                      View Supplement Ingredients &amp; Full Details →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Single Supplements View */}
        {catalogFilter === 'singles' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const disc = Number(product.discount_percent) || 0;
              const finalPrice = Math.round(
                disc > 0 ? product.price_naira * (1 - disc / 100) : product.price_naira
              );
              return (
                <article
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div
                      onClick={() => onViewProduct(product)}
                      className="h-52 bg-slate-50 p-4 flex items-center justify-center cursor-pointer border-b border-slate-100"
                    >
                      <img
                        src={product.image_url || FALLBACK_WELLNESS_IMG}
                        alt={`${product.name} – Herbal Dietary Supplement`}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_WELLNESS_IMG;
                        }}
                      />
                    </div>
                    <div className="p-5 space-y-2.5">
                      <p className="text-xs text-slate-500">
                        {product.nafdac_no ? `NAFDAC Reg: ${product.nafdac_no}` : 'Herbal Supplement'}
                      </p>
                      <h3
                        onClick={() => onViewProduct(product)}
                        className="text-base font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {sanitizeAdText(product.short_desc)}
                      </p>
                      <div className="pt-2 flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                          ₦{finalPrice.toLocaleString()}
                        </span>
                        {disc > 0 && (
                          <span className="text-xs text-slate-400 line-through tabular-nums">
                            ₦{Math.round(product.price_naira).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => onOrderProduct(product, 1)}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Order Supplement (POD)
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. How Ordering & Pay on Delivery Works */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Simple &amp; Transparent Fulfillment
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How Nationwide Pay on Delivery Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-sm font-bold text-emerald-700">01. Place Your Order Online</p>
              <h3 className="text-lg font-bold text-slate-900">Select Bundle &amp; Delivery Address</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose your preferred supplement course above and provide your delivery address and active phone number—no card details or upfront online payment required.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-emerald-700">02. Order Confirmation &amp; Dispatch</p>
              <h3 className="text-lg font-bold text-slate-900">24–48 Hour Regional Courier</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our fulfillment desk confirms your delivery schedule by phone and dispatches your sealed order from our nearest regional hub across Nigeria.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-emerald-700">03. Doorstep Inspection &amp; Payment</p>
              <h3 className="text-lg font-bold text-slate-900">Inspect Before You Pay</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Verify the intact tamper-evident seals and product labels when our dispatch rider arrives, then complete payment via cash or bank transfer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Customer Service & Delivery Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Verified Buyer Feedback
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              What Customers Say About Our Supplements &amp; Service
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Individual experiences vary. Dietary supplements are intended to support general wellness alongside a balanced diet and healthy lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CUSTOMER_REVIEWS.map((review, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, sIdx) => (
                    <Star key={sIdx} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">"{review.quote}"</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                <p className="font-bold text-slate-900">{review.name}</p>
                <p>
                  {review.location} · {review.bundle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Clear answers regarding supplement quality, delivery timelines, and usage guidance.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Are GHT supplements registered with NAFDAC?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Yes. Our herbal and nutritional dietary supplements distributed under {CONFIG.company.name} {CONFIG.company.subtitle} carry NAFDAC registration numbers and tamper-evident factory seals that you can verify directly upon delivery.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Do I pay anything online before receiving my order?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No upfront payment is required when you choose Pay on Delivery (POD). Our dispatch rider brings your order directly to your home or office within 24–48 hours in major cities, and you pay cash or transfer upon receiving and inspecting your package.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Can I take these herbal supplements alongside my regular doctor's routine?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our products are plant-based nutritional supplements intended to support general wellness. If you are pregnant, nursing, managing a diagnosed medical condition, or taking prescription medication, please consult your physician or licensed healthcare provider before starting any new dietary supplement, and never discontinue prescribed medication without medical advice.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Mandatory Regulatory Health Disclaimer & Merchant Transparency Block */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 md:p-10 space-y-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-slate-700 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                Important Health &amp; Dietary Supplement Disclaimer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All products presented on this page are herbal and nutritional dietary supplements distributed by an authorized distributor of {CONFIG.company.name} {CONFIG.company.subtitle}. These statements and products are intended to support general wellness and nutrition and are <strong className="text-slate-800">not intended to diagnose, treat, cure, or prevent any disease</strong>. Content on this website is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or hospital care. Individual results vary based on consistency, diet, and personal health factors. Always consult a qualified doctor or healthcare professional before using any dietary supplement.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-600">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-700" /> Merchant Identity &amp; Location
              </p>
              <p>{CONFIG.company.name} {CONFIG.company.subtitle}</p>
              <p>{CONFIG.company.address}</p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Phone size={15} className="text-emerald-700" /> Customer Support Desk
              </p>
              <p>Tel / WhatsApp: {CONFIG.company.phone}</p>
              <p className="flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${CONFIG.company.email}`} className="text-emerald-700 hover:underline">
                  {CONFIG.company.email}
                </a>
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Scale size={15} className="text-emerald-700" /> Legal &amp; Store Policies
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-emerald-700">
                <a
                  href="/privacy-policy"
                  onClick={(e) => handlePolicyLinkClick(e, 'privacy-policy')}
                  className="hover:underline"
                >
                  Privacy Policy
                </a>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <a
                  href="/terms-of-service"
                  onClick={(e) => handlePolicyLinkClick(e, 'terms-of-service')}
                  className="hover:underline"
                >
                  Terms &amp; Shipping Policy
                </a>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <a
                  href="/return-policy"
                  onClick={(e) => handlePolicyLinkClick(e, 'return-policy')}
                  className="hover:underline"
                >
                  Return &amp; Exchange Policy
                </a>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <a
                  href="/about"
                  onClick={(e) => handlePolicyLinkClick(e, 'about')}
                  className="hover:underline"
                >
                  About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
