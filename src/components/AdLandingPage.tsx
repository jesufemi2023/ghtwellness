import React, { useState } from 'react';
import { Product, PackageData } from '../types';
import { CONFIG } from '../config';
import { Testimonials } from './Testimonials';
import { openWhatsAppLink, cleanWhatsAppNumber } from '../utils/whatsapp';
import { 
  ShieldCheck, 
  Phone, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  Truck, 
  HeartHandshake, 
  Package as PackageIcon,
  Copy,
  Check,
  Share2,
  Star,
  Flame,
  Award
} from 'lucide-react';

interface AdLandingPageProps {
  products: Product[];
  packages: PackageData[];
  combos: PackageData[];
  onOrderProduct: (product: Product, quantity?: number) => void;
  onOrderPackage: (pkg: PackageData, type: 'package', quantity?: number, optionIdx?: number) => void;
  onViewProduct: (product: Product) => void;
  onViewPackage: (pkg: PackageData) => void;
}

export const AdLandingPage: React.FC<AdLandingPageProps> = ({
  products,
  packages,
  combos,
  onOrderProduct,
  onOrderPackage,
  onViewProduct,
  onViewPackage
}) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const whatsappNumber = cleanWhatsAppNumber(CONFIG.whatsapp.number);
  const adUrl = "https://ghtwellness.vercel.app/ad";

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const handleShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink(url, 'share-fallback');
    }
  };

  // Combine packages and combos into one unified "Health Packages & Combos" list
  const allPackagesAndCombos = [...packages, ...combos];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32">
      {/* Top Urgent Ad Banner with Urgency & Copy Link */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white py-3 px-4 text-center sticky top-0 z-50 shadow-2xl border-b-2 border-emerald-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-black tracking-wide">
          <div className="flex items-center gap-2">
            <span className="bg-white text-emerald-900 px-3 py-1 rounded-full text-xs uppercase tracking-widest animate-pulse shadow-sm flex items-center gap-1">
              <Flame size={14} className="text-red-500 fill-red-500" /> AD PROMO
            </span>
            <span>NATIONWIDE PAY ON DELIVERY (POD) — INSPECT BEFORE YOU PAY!</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyLink(adUrl, 'top-bar')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-black transition-all shadow-sm cursor-pointer border border-emerald-500/50"
            >
              {copiedLink === 'top-bar' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              {copiedLink === 'top-bar' ? 'Link Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => handleShare(adUrl, 'SD GHT Health Care Special Ad Offer')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-black transition-all shadow-sm cursor-pointer border border-slate-700"
            >
              <Share2 size={14} /> Share
            </button>
            <button 
              onClick={() => openWhatsAppLink(whatsappNumber, "Hello SD GHT Health Care, I saw your Ad and I want to order a health package.")}
              className="bg-white text-emerald-900 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-sm font-black cursor-pointer"
            >
              <Phone size={14} className="stroke-[3]" /> CHAT
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pt-10">

        {/* Highly Responsive, Aesthetic & Convincing Headline Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 p-6 sm:p-12 md:p-16 rounded-[32px] sm:rounded-[48px] border-2 border-emerald-500/40 shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg">
              <Sparkles size={18} className="text-emerald-400 animate-spin" />
              100% NAFDAC Approved Natural Health Packages • 15,000 Healed
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Regain Your Vitality & Freedom Naturally — <span className="text-emerald-400 italic font-serif">Trusted by Over 15,000 Seniors</span>
            </h1>
            
            <p className="text-base sm:text-xl text-slate-300 font-semibold max-w-3xl mx-auto leading-relaxed">
              Clinically formulated herbal solutions to normalize blood sugar, relieve joint stiffness, cleanse vital organs, and restore lifelong wellness with zero side effects.
            </p>

            {/* Trust Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left max-w-3xl mx-auto">
              <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-white">Free Nationwide Delivery</p>
                  <p className="text-[11px] text-slate-400 font-semibold">Delivered in 24-48 hours</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-white">Pay On Delivery (POD)</p>
                  <p className="text-[11px] text-slate-400 font-semibold">Inspect before you pay</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <HeartHandshake size={24} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-white">Free Medical Guidance</p>
                  <p className="text-[11px] text-slate-400 font-semibold">Talk to health experts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HEALTH PACKAGES & COMBOS (PRIMARY FOCUS) */}
        <div className="space-y-10">
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 p-6 md:p-10 rounded-3xl border-2 border-emerald-500/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/40">
                ★ RECOMMENDED TREATMENT REGIMENS (SPECIAL AD PRICING)
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Select Your Treatment Package
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-semibold max-w-2xl leading-relaxed">
                Choose from our verified multi-bottle health packages and value combos. Tap <span className="text-emerald-400 font-black">"ORDER NOW (POD)"</span> to place your order with zero upfront payment.
              </p>
            </div>
            <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-4 rounded-2xl text-center shrink-0 w-full md:w-auto">
              <span className="text-emerald-400 font-black text-xs uppercase tracking-wider block">Payment Option</span>
              <span className="text-white font-black text-base">Pay Cash / Transfer on Delivery</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPackagesAndCombos.map((pkg) => {
              const primaryOption = pkg.options?.[0] || { bottles: '1 Month Supply', price: pkg.price, products: [] };
              const imageUrl = pkg.package_image_url || 'https://picsum.photos/seed/health-pkg/800/600';
              return (
                <div 
                  key={pkg.id} 
                  className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between hover:border-emerald-400 transition-all group relative"
                >
                  <div className="absolute top-4 right-4 z-10 bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                    <Star size={12} className="fill-white" /> Best Seller
                  </div>

                  <div>
                    {/* Image header */}
                    <div className="relative h-64 sm:h-72 bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onViewPackage(pkg)}>
                      <img 
                        src={imageUrl} 
                        alt={pkg.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                          {pkg.name}
                        </h3>
                      </div>
                    </div>

                    {/* Body Description & Benefits */}
                    <div className="p-6 space-y-4">
                      <p className="text-sm sm:text-base text-slate-300 font-semibold line-clamp-3 leading-relaxed">
                        {pkg.description}
                      </p>

                      {pkg.health_benefits && pkg.health_benefits.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <p className="text-xs uppercase tracking-widest text-emerald-400 font-black">Key Benefits:</p>
                          <ul className="space-y-1.5">
                            {pkg.health_benefits.slice(0, 3).map((benefit, i) => (
                              <li key={i} className="text-xs sm:text-sm text-slate-300 font-bold flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-2">
                        <div className="text-xs text-slate-400 font-bold uppercase text-emerald-400">Package Price:</div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-white">
                            ₦{primaryOption.price.toLocaleString()}
                          </span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-black px-2.5 py-1 rounded-lg">
                            Free Shipping
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const message = `Hello SD GHT Health Care, I am interested in ${pkg.name}. I would like to chat with a health consultant first.`;
                          openWhatsAppLink(whatsappNumber, message);
                        }}
                        className="h-14 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95"
                      >
                        <Phone size={16} className="text-emerald-600 stroke-[3]" />
                        CHAT WITH US
                      </button>
                      <button
                        onClick={() => onOrderPackage(pkg, 'package', 1, 0)}
                        className="h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse border-b-4 border-emerald-900"
                      >
                        <ShoppingBag size={16} className="stroke-[3]" />
                        ORDER NOW (POD)
                      </button>
                    </div>
                    <button
                      onClick={() => onViewPackage(pkg)}
                      className="w-full text-center text-xs text-emerald-400 font-black hover:underline uppercase tracking-wider py-1.5 cursor-pointer"
                    >
                      View Full Package Details & Options →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



      </div>

      {/* Verified Patient Testimonial Banner */}
      <div className="max-w-5xl mx-auto px-4 mt-20">
        <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-teal-950 border-2 border-emerald-500/40 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/40">
            <Star size={14} className="fill-emerald-400 text-emerald-400" /> Verified Patient Success Story
          </div>
          <blockquote className="text-lg sm:text-2xl font-bold text-white italic max-w-3xl mx-auto leading-relaxed">
            "I ordered the complete health package last month for my blood sugar and joint pain. The delivery agent brought it to my house in Ibadan within 36 hours. I inspected it before paying. Today, my energy is back and my numbers are stable. Thank you SD GHT Health Care!"
          </blockquote>
          <div>
            <p className="font-black text-emerald-400 text-base">Elder Chief Adebayo (Age 68)</p>
            <p className="text-xs text-slate-400 font-semibold">Verified Patient • Ibadan, Nigeria</p>
          </div>
        </div>
      </div>

      {/* Full Testimonials Section from Home Page */}
      <div className="mt-16">
        <Testimonials isDark={true} />
      </div>

      {/* Frequently Asked Questions for Elderly & Adults */}
      <div className="max-w-4xl mx-auto px-4 mt-20 pt-16 border-t border-slate-800 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Frequently Asked Questions For Our Patients & Seniors
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Everything you need to know about our Pay on Delivery and natural health packages.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border-2 border-emerald-500/30 p-6 rounded-3xl space-y-3 shadow-xl">
            <h3 className="text-lg sm:text-xl font-black text-white">Q: How do I know which health package is best for my condition?</h3>
            <p className="text-sm sm:text-base text-slate-300 font-semibold leading-relaxed">
              You can instantly speak with our certified health consultants via WhatsApp by tapping any of the "Chat with Us" buttons. We will review your health needs and recommend the exact NAFDAC-approved package best suited for your complete recovery.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-white">Q: How does Pay on Delivery (POD) work?</h3>
            <p className="text-sm sm:text-base text-slate-300 font-semibold leading-relaxed">
              You place your order right here on this page, our dispatch delivery agent brings the package directly to your house or office anywhere in Nigeria within 24 to 48 hours, and you inspect your items before making payment in cash or bank transfer.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-white">Q: Are these supplements safe for elderly people with high blood pressure or diabetes?</h3>
            <p className="text-sm sm:text-base text-slate-300 font-semibold leading-relaxed">
              Yes! All our health packages are 100% natural, NAFDAC certified, and formulated specifically to support healthy blood sugar, blood pressure, and joint mobility without harsh chemical side effects. You can also chat with our free medical advisors anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
