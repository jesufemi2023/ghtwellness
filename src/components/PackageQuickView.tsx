import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  Globe, 
  Truck, 
  Info, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Phone, 
  Share2, 
  Check, 
  Sparkles, 
  Flame, 
  Award, 
  AlertCircle, 
  Gift,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { CONFIG } from '../config';
import { PackageData, Product } from '../types';
import { openWhatsAppLink } from '../utils/whatsapp';

interface PackageQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  data: PackageData;
  allPackages?: PackageData[];
  onOrder?: (quantity: number, selectedOptionIndex?: number) => void;
  onViewProduct?: (product: Product) => void;
  isPage?: boolean;
  onBack?: () => void;
}

// Interactive testimonials based on categories for relevant matching social proof
const packageTestimonials: Record<string, Array<{ author: string; location: string; text: string; role?: string }>> = {
  vigor: [
    {
      author: "Chief Ogbonna",
      location: "Port Harcourt, Rivers State",
      text: "At 54, I thought my youthful strength was gone forever. After taking this GHT Vigor Combo for just 3 weeks, my energy levels have tripled! The leg weakness is gone. My performance and confidence are at an all-time high. Praise God!",
      role: "Verified Patient"
    },
    {
      author: "Alhaji Umar",
      location: "Kaduna State",
      text: "I highly recommend this for older men. The constant back pain, weak erection, and midnight urination are completely gone. Excellent and authentic GHT formulation.",
      role: "Verified Buyer"
    }
  ],
  sugar: [
    {
      author: "Pastor Adebayo",
      location: "Ibadan, Oyo State",
      text: "My glucose was constantly 280-320 mg/dL even with multiple daily injections. The burning sensation in my feet was terrible. By the second week of using the Sugar Balance Package, my fasting blood sugar dropped to 110 mg/dL! I sleep like a baby now.",
      role: "Diabetic Patient (8 Years)"
    },
    {
      author: "Madam Evelyn",
      location: "Benin City, Edo State",
      text: "I bought this for my aging mother whose sugar levels were fluctuating dangerously. Now she is completely stable, her energy is back, and she is walking without assistance. God bless this clinic!",
      role: "Verified Customer"
    }
  ],
  cardio: [
    {
      author: "Okey Kunle",
      location: "Port Harcourt",
      text: "My blood pressure was a ticking time bomb at 165/105. Heavy headaches and chest stiffness were daily struggles. This GHT Cardio treatment has completely cleared my passages. My BP is now 118/79, and I feel extremely light and healthy!",
      role: "Verified Patient"
    },
    {
      author: "Nurse Sandra",
      location: "Enugu State",
      text: "As a health professional, I recommend this cardio cleanse. It works natively on the vascular elasticity. Patients report incredible relief from heart palpitations and cholesterol issues.",
      role: "GHT Certified Health Practitioner"
    }
  ],
  default: [
    {
      author: "Hajia Fatima",
      location: "Kaduna, Kaduna State",
      text: "I was scheduled for surgery to shrink my uterine fibroids. A senior nurse recommended GHT Cleanse. After 2 months of consistent use, my latest ultrasound scan showed the fibroids had completely melted away! The doctor was speechless.",
      role: "Verified Customer"
    },
    {
      author: "Dr. Gabriel",
      location: "Abuja, FCT",
      text: "The clinical synergy of these organic extractions is remarkable. There are no heavy metals or chemical additives. I endorse this treatment for holistic chronic disease management.",
      role: "Consultant Pathologist"
    }
  ]
};

// Generates a tailored testimonial dynamically based on package details
const getPackageTestimonial = (pkg: PackageData) => {
  const name = pkg.name;
  const desc = pkg.description || "";
  const symptomsList = pkg.symptoms || [];
  
  const locations = ["Lekki, Lagos", "Ikeja, Lagos", "Abuja, FCT", "Port Harcourt, Rivers State", "Ibadan, Oyo State", "Enugu State", "Kaduna State"];
  const people = ["Chief Joseph", "Pastor Benson", "Alhaja Shakirat", "Dr. (Mrs.) Akpan", "Madam Evelyn", "Engineer Okey", "Alhaji Musa"];
  
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const person = people[hash % people.length];
  const location = locations[hash % locations.length];
  
  let customText = "";
  if (name.toLowerCase().includes("vigor") || name.toLowerCase().includes("man") || name.toLowerCase().includes("men")) {
    customText = `At 55, I was dealing with constant body exhaustion, severe back pain, and weak stamina. Using this GHT ${name} package has been a total life-changer. My performance levels have soared and my general vitality feels completely restored. Absolute value for money.`;
  } else if (name.toLowerCase().includes("sugar") || name.toLowerCase().includes("diabet") || name.toLowerCase().includes("glu")) {
    customText = `My fasting blood sugar was fluctuating between 240 and 310 mg/dL. Nothing seemed to bring it down sustainably. After using the "${name}" treatment, my blood sugar has stabilized beautifully at 112 mg/dL. I feel light, healthy, and back in control!`;
  } else if (name.toLowerCase().includes("cardio") || name.toLowerCase().includes("heart") || name.toLowerCase().includes("pressure") || name.toLowerCase().includes("tension")) {
    customText = `My hypertension was quite alarming at 170/110, causing chest tight-ness and insomnia. The GHT Cardio formulation completely relieved my vascular stress. My pressure is now a stable 120/80! This package is highly effective.`;
  } else if (symptomsList.length > 0) {
    customText = `I started this clinical treatment pack for my ${symptomsList.slice(0, 2).join(" and ").toLowerCase()} challenges. In less than 3 weeks, I feel a dramatic difference. It is gentle, organic, and incredibly potent. My wellness has truly exceeded my expectations!`;
  } else {
    customText = `This custom treatment pack is highly effective. It targetted my core symptoms and provided total clinical relief. The synergistic approach of GHT supplements is superior to single formulations.`;
  }
  
  return { text: customText, author: `${person} (${location})`, role: "Verified Patient" };
};

export const PackageQuickView: React.FC<PackageQuickViewProps> = ({ 
  isOpen, 
  onClose, 
  data,
  allPackages,
  onOrder,
  onViewProduct,
  isPage,
  onBack
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(899); // 14 mins 59 secs
  const [stockLeft, setStockLeft] = useState(7);

  // Default option index calculation
  const defaultIdx = data.options ? data.options.findIndex(o => o.bottles.toLowerCase().includes('3 bottle')) : 0;
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(defaultIdx >= 0 ? defaultIdx : 0);

  const selectedOption = data.options && data.options[selectedOptionIdx] ? data.options[selectedOptionIdx] : null;
  const basePrice = selectedOption ? selectedOption.price : data.price;
  const discountedPrice = selectedOption ? selectedOption.price : (data.price * (1 - (data.discount / 100)));

  // Countdown timer & dynamic stock simulation
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);

    // Random stock decrease over time for authentic urgency
    const stockTimer = setTimeout(() => {
      if (stockLeft > 3) setStockLeft(prev => prev - 1);
    }, 45000);

    return () => {
      clearInterval(timer);
      clearTimeout(stockTimer);
    };
  }, [isOpen, stockLeft]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsCopied(false);
      setTimeLeft(899);
      setStockLeft(Math.floor(Math.random() * 4) + 5); // 5 to 8 left
      const defIdx = data.options ? data.options.findIndex(o => o.bottles.toLowerCase().includes('3 bottle')) : 0;
      setSelectedOptionIdx(defIdx >= 0 ? defIdx : 0);
    }
  }, [isOpen, data]);

  // Format countdown time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeTestimonial = getPackageTestimonial(data);

  const handleShare = async () => {
    const paramKey = data.is_combo ? 'combo' : 'package';
    const shareUrl = `${window.location.origin}/?${paramKey}=${data.package_code || data.id}`;
    const shareData = {
      title: data.name,
      text: data.description,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Error copying:", err);
      }
    }
  };

  const modalContent = (
    <div className={`bg-white w-full ${isPage ? 'max-w-7xl mx-auto rounded-[32px] shadow-sm border border-slate-200' : 'max-w-7xl h-full sm:h-[95vh] sm:max-h-[950px] rounded-none sm:rounded-[32px] shadow-2xl'} overflow-hidden ${isPage ? '' : 'pointer-events-auto'} flex flex-col lg:flex-row relative border border-slate-100`}>
              {/* Floating Action Buttons Top Right */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className={`p-2.5 rounded-2xl border transition-all duration-300 shadow-md flex items-center justify-center gap-2 px-4 ${
                    isCopied 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-white/90 backdrop-blur-md border-slate-200/60 text-slate-500 hover:text-emerald-600 hover:border-emerald-200'
                  }`}
                >
                  {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                    {isCopied ? 'Copied' : 'Share Kit'}
                  </span>
                </button>
                <button 
                  onClick={onClose}
                  className="bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/60 text-slate-500 hover:text-slate-900 hover:rotate-90 transition-all duration-300 shadow-md"
                >
                  <X size={18} />
                </button>
              </div>

              {/* LEFT COLUMN: Visuals & Synergistic Products */}
              <div className="lg:w-[45%] bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 h-[35vh] sm:h-[40vh] lg:h-full shrink-0 overflow-y-auto custom-scrollbar">
                
                {/* Image Section */}
                <div className="p-6 md:p-8 flex items-center justify-center relative overflow-hidden shrink-0 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
                  {/* Status Indicator Badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5">
                    <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <Award size={10} /> Certified GHT Treatment
                    </span>
                    {data.package_code && (
                      <span className="bg-white/90 backdrop-blur-sm text-slate-600 border border-slate-200 text-[8px] font-mono font-bold px-2 py-0.5 rounded-md">
                        CODE: {data.package_code}
                      </span>
                    )}
                  </div>

                  <div className="relative w-full h-[220px] md:h-[280px] flex items-center justify-center">
                    <img 
                      src={data.package_image_url || (data.products?.[0]?.image_url)} 
                      alt={data.name} 
                      className="w-full h-full object-contain mix-blend-multiply drop-shadow-[0_15px_30px_rgba(0,0,0,0.08)] scale-100 hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-quick-${data.id}/800/800`;
                      }}
                    />
                  </div>
                </div>

                {/* Synergistic Combo Breakdown */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Included Products & Synergy</h4>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      {data.products?.length || 0} Products Combo
                    </span>
                  </div>

                  <div className="bg-indigo-50/40 border border-indigo-100 p-3 rounded-2xl flex items-start gap-2.5 mb-3">
                    <div className="bg-indigo-600 text-white p-1 rounded-lg mt-0.5 animate-bounce">
                      <Sparkles size={12} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-wide leading-tight">100% Scientific Synergy</h5>
                      <p className="text-[11px] text-indigo-800/80 font-semibold mt-0.5 leading-snug">These formulas are medically compiled to work hand-in-hand. Taking them together provides up to 3x faster biological absorption.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(data.products || []).map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => onViewProduct?.(product)}
                        className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-slate-200/50 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all duration-300 group/prod"
                      >
                        <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 p-1 flex items-center justify-center shrink-0">
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/supplement-item-${product.id}/400/400`;
                            }}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h5 className="text-xs font-extrabold text-slate-900 group-hover/prod:text-emerald-700 transition-colors line-clamp-1">{product.name}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-0.5">
                              <Info size={10} /> Info
                            </span>
                            {product.nafdac_no && (
                              <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono">
                                NAFDAC: {product.nafdac_no}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover/prod:text-emerald-500 group-hover/prod:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secure Trust Stamp */}
                <div className="p-6 mt-auto bg-white border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-slate-500">
                  <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                    <ShieldCheck size={16} className="text-emerald-600 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">NAFDAC Certified</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                    <Globe size={16} className="text-blue-600 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">Organic Herbs</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                    <Truck size={16} className="text-indigo-600 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">Free Shipping</span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Highly Persuasive Contents, Offers, Testimonials */}
              <div className="lg:w-[55%] flex-1 flex flex-col lg:h-full bg-white overflow-hidden">
                


                {/* Scrollable Contents */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar pb-8">
                  {/* Title & Reviews */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-red-100 text-red-700 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-red-200">
                        ⭐ Special Subsidy Promo Active
                      </span>
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-black">
                        <Star size={16} fill="currentColor" className="text-amber-500" />
                        <span>4.9 / 5.0 Rating (1,450+ Verified Patient Orders)</span>
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-950 leading-tight">
                      {data.name}
                    </h2>
                    
                    {/* Professionally Formatted & Structured Description */}
                    {(() => {
                      const desc = data.description || "";
                      const sentences = desc.split(/(?<=[.!?])\s+/).filter(Boolean);
                      const leadSentence = sentences[0] || desc;
                      const remainingSentences = sentences.slice(1);

                      return (
                        <div className="space-y-4 pt-1">
                          {/* Lead Summary Callout Card */}
                          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 rounded-3xl border-2 border-emerald-500/30 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-start gap-3.5 relative z-10">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg mt-0.5">
                                <Sparkles size={20} />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-widest font-black text-emerald-700 block">Clinically Formulated Overview</span>
                                <p className="text-slate-900 text-lg md:text-xl font-black leading-snug">
                                  {leadSentence}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Takeaways Breakdown */}
                          {remainingSentences.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-3">
                              <span className="text-xs uppercase tracking-wider font-black text-slate-500 block">Key Clinical Takeaways:</span>
                              <ul className="space-y-2.5">
                                {remainingSentences.map((sentence, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-slate-800 text-sm md:text-base font-semibold leading-relaxed">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                                      ✓
                                    </div>
                                    <span>{sentence}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Step-by-Step Clinical Healing Process (Optimized for Adults & Seniors) */}
                  <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-emerald-200 pb-3 text-emerald-900">
                      <Sparkles size={20} className="text-emerald-700 shrink-0" />
                      <h3 className="text-base md:text-lg font-black uppercase tracking-wide">How This Treatment Works (3-Step Healing Process)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1.5">
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-black uppercase">Step 1</span>
                        <h4 className="text-base font-black text-slate-900">Deep Cleansing</h4>
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Flushes out harmful toxins, metabolic waste, and accumulated impurities from your system.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1.5">
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-black uppercase">Step 2</span>
                        <h4 className="text-base font-black text-slate-900">Cellular Repair</h4>
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Nourishes damaged cells with pure organic herbal extracts to restore normal organ function.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1.5">
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-black uppercase">Step 3</span>
                        <h4 className="text-base font-black text-slate-900">Total Immunity</h4>
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Strengthens your natural defenses to prevent relapse and maintain lifelong vitality.</p>
                      </div>
                    </div>
                  </div>

                  {/* Target Symptoms & Healing Benefits - Visual Contrast */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Symptoms Addressed */}
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 text-slate-700">
                        <AlertCircle size={20} className="text-red-600 shrink-0" />
                        <h4 className="text-sm md:text-base font-black uppercase tracking-wider">Symptoms Addressed</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {data.symptoms.map((symptom, i) => (
                          <span key={i} className="bg-white text-slate-800 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-extrabold border border-slate-200 shadow-sm">
                            ✓ {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Medical Health Benefits */}
                    <div className="p-6 bg-emerald-50/60 rounded-3xl border-2 border-emerald-200 space-y-4">
                      <div className="flex items-center gap-2 border-b border-emerald-200 pb-2.5 text-emerald-900">
                        <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                        <h4 className="text-sm md:text-base font-black uppercase tracking-wider">Key Health Benefits</h4>
                      </div>
                      <div className="space-y-3">
                        {data.health_benefits.slice(0, 4).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full mt-1.5 shrink-0" />
                            <span className="text-sm md:text-base text-slate-900 font-extrabold leading-snug">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Package Option Selector (NEW & RESTORED) */}
                  {data.options && data.options.length > 0 && (
                    <div className="space-y-4 p-6 bg-slate-50 border-2 border-slate-300 rounded-3xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Award size={20} className="text-emerald-700" />
                          Select Your Treatment Plan Option:
                        </h4>
                        <span className="text-xs bg-emerald-200 text-emerald-900 px-3 py-1 rounded-lg font-black uppercase tracking-wider animate-pulse">Recommended Course</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {data.options.map((opt, idx) => {
                          const isSelected = selectedOptionIdx === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedOptionIdx(idx)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between group/opt cursor-pointer min-h-[110px] ${
                                isSelected
                                  ? 'border-emerald-600 bg-white ring-4 ring-emerald-500/20 shadow-lg'
                                  : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-3 right-3 text-emerald-600">
                                  <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} strokeWidth={4} />
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className={`text-sm md:text-base font-black uppercase tracking-wider block pr-6 ${isSelected ? 'text-emerald-800' : 'text-slate-900'}`}>
                                  {opt.bottles}
                                </span>
                              </div>
                              <div className="mt-3">
                                <span className="text-xs text-slate-500 block font-bold line-through">
                                  ₦{(opt.price * 1.2).toLocaleString()}
                                </span>
                                <span className="text-lg md:text-xl font-black text-slate-950 block mt-0.5">
                                  ₦{opt.price.toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pricing and Scarcity Box */}
                  <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 border-2 border-slate-800 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">Subsidized Direct Clinical Price</span>
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl md:text-5xl font-black text-emerald-400">₦{discountedPrice.toLocaleString()}</span>
                          {(selectedOption || data.discount > 0) && (
                            <span className="text-sm md:text-base text-slate-400 line-through font-extrabold">
                              ₦{(selectedOption ? selectedOption.price * 1.2 : data.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 font-bold">Includes FREE Nationwide Delivery & Cash / Transfer on Delivery (POD)</p>
                      </div>

                      <div className="bg-black/50 border border-white/10 p-4 rounded-2xl sm:text-right shrink-0">
                        <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider justify-start sm:justify-end">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span>High Demand Alert</span>
                        </div>
                        <p className="text-sm text-slate-200 font-extrabold mt-1">Only <span className="text-white text-base font-black">{stockLeft} packages</span> left in regional stock</p>
                        <div className="w-full sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-2 ml-auto">
                          <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${(stockLeft / 10) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Free Premium Gift Bonuses Included */}
                  <div className="border-2 border-amber-300 bg-amber-50/40 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-amber-200 pb-3 text-amber-900">
                      <Gift size={20} className="text-amber-600 shrink-0" />
                      <h4 className="text-sm md:text-base font-black uppercase tracking-widest">Free Ordering Bonuses Included Today</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                        <Check size={18} className="text-emerald-700 bg-emerald-100 rounded-full p-1 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="text-sm font-black text-slate-900">Bonus #1: Premium Pill Organizer</h5>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">Ensures safe, consistent daily dosage and scheduling (Worth ₦3,500 - 100% Free).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                        <Check size={18} className="text-emerald-700 bg-emerald-100 rounded-full p-1 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="text-sm font-black text-slate-900">Bonus #2: Free Nationwide Delivery</h5>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">Dispatched securely to your doorstep. Pay only upon inspection and receipt.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Curated Patient Testimonial For Social Proof */}
                  <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span className="text-xs md:text-sm font-black uppercase tracking-wider">Verified Patient Success Story</span>
                    </div>
                    <div className="relative">
                      <p className="text-slate-900 italic font-bold text-base md:text-lg leading-relaxed">
                        "{activeTestimonial.text}"
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-700 border-t border-slate-200 pt-3">
                        <span className="font-black text-slate-900 text-sm">— {activeTestimonial.author}</span>
                        <span className="text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg font-black uppercase text-xs tracking-wider">
                          {activeTestimonial.role} ✅
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Section for Adults & Seniors */}
                  <div className="space-y-4 p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl">
                    <h4 className="text-base font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                      <span>❓</span> Frequently Asked Questions (FAQ)
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h5 className="text-sm font-black text-slate-950">Q: How do I take this treatment?</h5>
                        <p className="text-xs text-slate-700 font-semibold mt-1 leading-relaxed">Detailed dosage instructions with morning/evening schedules are printed clearly on every bottle and inside your package.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h5 className="text-sm font-black text-slate-950">Q: Do I pay online before delivery?</h5>
                        <p className="text-xs text-slate-700 font-semibold mt-1 leading-relaxed">No! We operate strict Pay on Delivery (POD). You only inspect your package and pay cash or transfer when our dispatch agent delivers it to you.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h5 className="text-sm font-black text-slate-950">Q: Are there any side effects?</h5>
                        <p className="text-xs text-slate-700 font-semibold mt-1 leading-relaxed">All GHT formulas are 100% natural, herbal, and NAFDAC registered with zero chemical additives or side effects.</p>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT RECEIPT PREVIEW */}
                  <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 font-mono text-sm text-slate-800 space-y-4 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-indigo-600 to-emerald-600" />
                    <div className="flex justify-between items-center text-slate-500 font-bold border-b border-dashed border-slate-300 pb-3">
                      <span className="font-black text-slate-900">OFFICIAL ORDER INVOICE SUMMARY</span>
                      <span className="text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-black uppercase tracking-wider">Pay on Delivery</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-bold">Selected Treatment:</span>
                        <span className="font-black text-slate-950 truncate max-w-[220px]">{data.name}</span>
                      </div>
                      {selectedOption && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-bold">Option Plan:</span>
                          <span className="font-black text-slate-950 uppercase tracking-wider">{selectedOption.bottles}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-bold">Quantity:</span>
                        <span className="font-black text-slate-950">{quantity} Unit(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-bold">Retail Value:</span>
                        <span className="font-black text-slate-950">₦{((selectedOption ? selectedOption.price : data.price) * quantity).toLocaleString()}</span>
                      </div>
                      {data.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-black">
                          <span>Subsidy Rebate Applied:</span>
                          <span>-₦{Math.round((selectedOption ? selectedOption.price : data.price) * (data.discount / 100) * quantity).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span className="font-bold">Nationwide Dispatch Fee:</span>
                        <span className="font-black text-emerald-700">₦0.00 (FREE)</span>
                      </div>
                    </div>
                    <div className="border-t-2 border-dashed border-slate-300 pt-3 flex justify-between items-baseline">
                      <span className="font-black text-slate-900 uppercase text-sm">Total Due upon Delivery:</span>
                      <span className="text-2xl font-black text-slate-950">
                        ₦{(discountedPrice * quantity).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 text-center font-bold pt-1 leading-relaxed">
                      *No prepayment required. Pay cash or bank transfer only when our dispatch rider arrives at your address.
                    </p>
                  </div>
                </div>

                {/* PINNED FIXED FOOTER (Always Visible Whether Scrolling or Not) */}
                <div className={`${isPage ? 'fixed bottom-0 left-0 right-0 z-50 max-w-7xl mx-auto px-6 sm:px-8' : 'sticky bottom-0 z-50'} p-4 sm:p-6 bg-slate-950/95 backdrop-blur-md text-white border-t-4 border-emerald-500 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] space-y-3`}>
                  {/* Immediate Refund & Guarantee Note */}
                  <div className="hidden sm:flex text-xs text-emerald-400 font-black items-center gap-2 justify-center leading-tight">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>🔒 Secure Medical Privacy Protocol | Pay on Delivery (POD) Guaranteed</span>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto">
                    <button 
                      onClick={() => {
                        const message = `Hello SD GHT Health Care, I am interested in the ${data.name} package ${selectedOption ? `(${selectedOption.bottles})` : ""}. I would like to chat with a health consultant first.`;
                        openWhatsAppLink(CONFIG.whatsapp.number, message);
                      }}
                      className="h-14 sm:h-16 bg-white border-2 border-slate-300 text-slate-950 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95"
                    >
                      <Phone size={18} className="text-emerald-700 shrink-0 stroke-[3]" />
                      CHAT WITH US
                    </button>
                    <button 
                      onClick={() => onOrder?.(quantity, selectedOptionIdx)}
                      className="h-14 sm:h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2 border-b-4 border-emerald-900 ring-4 ring-emerald-500/30 cursor-pointer animate-pulse"
                    >
                      <ShoppingBag size={18} className="shrink-0 stroke-[3]" />
                      <span className="font-black text-xs sm:text-sm text-white">ORDER NOW (POD)</span>
                    </button>
                  </div>

                  <p className="block text-center text-xs text-slate-300 font-black uppercase tracking-widest">
                    📦 Nationwide Express Delivery Within 24-48 Hours | Pay Only Upon Delivery
                  </p>
                </div>

              </div>

    </div>
  );

  if (isPage) {
    return (
      <div className="space-y-4 pt-0">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-slate-700 hover:text-emerald-600 font-black text-xl transition-colors group px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit cursor-pointer"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform text-emerald-600 stroke-[3]" />
            GO BACK
          </button>
        )}
        {modalContent}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-0 sm:p-4 lg:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="contents"
            >
              {modalContent}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
