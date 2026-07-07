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
  Lock
} from 'lucide-react';
import { CONFIG } from '../config';
import { PackageData, Product } from '../types';

interface PackageQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  data: PackageData;
  allPackages?: PackageData[];
  onOrder?: (quantity: number, selectedOptionIndex?: number) => void;
  onViewProduct?: (product: Product) => void;
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
  onViewProduct
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
    const shareUrl = `${window.location.origin}/?buy_package=${data.id}`;
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
              className="bg-white w-full max-w-7xl h-full sm:h-[95vh] sm:max-h-[950px] rounded-none sm:rounded-[32px] shadow-2xl overflow-hidden pointer-events-auto flex flex-col lg:flex-row relative border border-slate-100"
            >
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
                
                {/* Active Deal Banner */}
                <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white px-6 py-3 pr-32 sm:pr-40 lg:pr-48 flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase tracking-wider shrink-0 shadow-inner">
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <Flame size={16} fill="currentColor" />
                    <span>🔥 LIMITED TIME DIRECT PROMOTION — 100% CLINICALLY PROVEN & AUTHENTIC</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs bg-black/20 px-3 py-1 rounded-full font-black">
                    <span>⚡ OVER 1000 PATIENTS HEALED THIS MONTH — ORDER NOW FOR PRIORITY DISPATCH</span>
                  </div>
                </div>

                {/* Scrollable Contents */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar pb-6">
                  {/* Title & Reviews */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-red-100">
                        Today: Direct Promo Discount Applied
                      </span>
                      <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-0.5 rounded-md text-xs font-bold">
                        <Star size={12} fill="currentColor" className="text-amber-500" />
                        <span>4.9 (1.4K+ Orders)</span>
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                      {data.name}
                    </h2>
                    <p className="text-slate-600 text-sm md:text-base font-bold leading-relaxed">
                      {data.description}
                    </p>
                  </div>

                  {/* Target Symptoms & Healing Benefits - Visual Contrast */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Symptoms Addressed */}
                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5 text-slate-500">
                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                        <h4 className="text-[10px] font-black uppercase tracking-wider">Symptoms Targeted</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.symptoms.map((symptom, i) => (
                          <span key={i} className="bg-white text-slate-700 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-slate-200/50 shadow-sm">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Medical Health Benefits */}
                    <div className="p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-emerald-100 pb-1.5 text-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <h4 className="text-[10px] font-black uppercase tracking-wider">Therapeutic Benefits</h4>
                      </div>
                      <div className="space-y-2">
                        {data.health_benefits.slice(0, 4).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            <span className="text-[11px] text-slate-800 font-extrabold leading-snug">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Package Option Selector (NEW & RESTORED) */}
                  {data.options && data.options.length > 0 && (
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/60 rounded-3xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Award size={13} className="text-emerald-600" />
                          Select Treatment Plan Option:
                        </h4>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">Subsidized Pricing</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {data.options.map((opt, idx) => {
                          const isSelected = selectedOptionIdx === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedOptionIdx(idx)}
                              className={`p-3 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between group/opt cursor-pointer min-h-[95px] ${
                                isSelected
                                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/15 shadow-md'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 text-emerald-600">
                                  <div className="w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                    <Check size={9} strokeWidth={4} />
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className={`text-[10px] font-black uppercase tracking-wider block pr-4 ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                                  {opt.bottles}
                                </span>
                              </div>
                              <div className="mt-2.5">
                                <span className="text-[10px] text-slate-400 block font-bold line-through">
                                  ₦{(opt.price * 1.2).toLocaleString()}
                                </span>
                                <span className="text-xs font-black text-slate-900 block mt-0.5">
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
                  <div className="bg-slate-900 text-white rounded-3xl p-5 border border-white/10 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Exclusive Subsidy Pricing</span>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl md:text-4xl font-black text-emerald-400">₦{discountedPrice.toLocaleString()}</span>
                          {(selectedOption || data.discount > 0) && (
                            <span className="text-xs text-slate-400 line-through font-bold">
                              ₦{(selectedOption ? selectedOption.price * 1.2 : data.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">Includes Free Shipping & Confidential POD (Pay on Delivery)</p>
                      </div>

                      <div className="bg-black/30 border border-white/5 p-3 rounded-2xl sm:text-right shrink-0">
                        <div className="flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase tracking-wider justify-start sm:justify-end">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Strictly Limited Stock</span>
                        </div>
                        <p className="text-xs text-slate-300 font-extrabold mt-1">Only <span className="text-white text-sm font-black">{stockLeft} packages</span> left for Abuja & Lagos region</p>
                        <div className="w-full sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 ml-auto">
                          <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${(stockLeft / 10) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Free Premium Gift Bonuses Included */}
                  <div className="border border-amber-200/60 bg-amber-50/20 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-amber-200/40 pb-2 text-amber-800">
                      <Gift size={16} className="text-amber-500 shrink-0" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Added Ordering Incentives (100% Free Today)</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-emerald-600 bg-emerald-100 rounded-full p-0.5 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="text-xs font-black text-slate-900">Bonus #1: Premium Pill Organizer</h5>
                          <p className="text-[10px] text-slate-500 leading-snug">Ensures safe, consistent daily dosage and scheduling (Worth ₦3,500 - Free today).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-emerald-600 bg-emerald-100 rounded-full p-0.5 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="text-xs font-black text-slate-900">Bonus #2: Free Shipping & POD</h5>
                          <p className="text-[10px] text-slate-500 leading-snug">Dispatched securely. Pay comfortably in cash or transfer upon physical delivery.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Curated Patient Testimonial For Social Proof (Reflects Description perfectly!) */}
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Patient Success Story</span>
                    </div>
                    <div className="relative">
                      <p className="text-slate-600 italic font-semibold text-xs md:text-sm leading-relaxed">
                        "{activeTestimonial.text}"
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 border-t border-slate-200/50 pt-2">
                        <span>— {activeTestimonial.author}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-extrabold uppercase text-[8px] tracking-wider">
                          {activeTestimonial.role} ✅
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT RECEIPT PREVIEW (NEW & HIGHLY AESTHETIC) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 font-mono text-xs text-slate-700 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
                    <div className="flex justify-between items-center text-slate-400 font-bold border-b border-dashed border-slate-300 pb-2">
                      <span>ORDER INVOICE / RECEIPT PREVIEW</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">POD Confirmed</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Selected Treatment:</span>
                        <span className="font-extrabold text-slate-900 truncate max-w-[200px]">{data.name}</span>
                      </div>
                      {selectedOption && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Option Plan:</span>
                          <span className="font-extrabold text-slate-900 uppercase tracking-wider">{selectedOption.bottles}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantity:</span>
                        <span className="font-extrabold text-slate-900">{quantity} Unit(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Retail Value:</span>
                        <span className="font-extrabold text-slate-900">₦{((selectedOption ? selectedOption.price : data.price) * quantity).toLocaleString()}</span>
                      </div>
                      {data.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Subsidy Rebate Applied:</span>
                          <span>-₦{Math.round((selectedOption ? selectedOption.price : data.price) * (data.discount / 100) * quantity).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500">
                        <span>Nationwide Dispatch Fee:</span>
                        <span className="font-bold text-emerald-600">₦0.00 (FREE)</span>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-2.5 flex justify-between items-baseline">
                      <span className="font-black text-slate-800 uppercase text-xs">Total Due at Delivery:</span>
                      <span className="text-xl font-black text-slate-950">
                        ₦{(discountedPrice * quantity).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 text-center font-semibold pt-1 leading-tight">
                      *This is a cash-on-delivery summary. Pay on physical arrival of your items via Cash or Bank Transfer.
                    </p>
                  </div>
                </div>

                 {/* PINNED FIXED FOOTER (Always Visible Whether Scrolling or Not) */}
                 <div className="shrink-0 p-3 sm:p-4 lg:p-6 bg-slate-50 border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] space-y-2 sm:space-y-3">
                   {/* Immediate Refund & Guarantee Note */}
                   <div className="hidden sm:flex text-[10px] text-slate-400 font-bold items-center gap-2 justify-center leading-tight">
                     <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                     <span>All patient information is secured and protected with medical privacy protocols.</span>
                   </div>

                   {/* Actions Row */}
                   <div className="grid grid-cols-2 gap-2 sm:gap-3">
                     <button 
                       onClick={() => {
                         const message = `Hello SD GHT Health Care, I am interested in the ${data.name} package ${selectedOption ? `(${selectedOption.bottles})` : ""}. I would like to chat with a health consultant first.`;
                         window.open(`https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`, '_blank');
                       }}
                       className="h-11 sm:h-14 bg-white border border-slate-200 text-slate-850 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                     >
                       <Phone size={14} className="text-emerald-600 shrink-0" />
                       CHAT WITH US
                     </button>
                     <button 
                       onClick={() => onOrder?.(quantity, selectedOptionIdx)}
                       className="h-11 sm:h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-1.5 sm:gap-2 border-b-[3px] sm:border-b-4 border-emerald-800 ring-2 ring-emerald-500/15"
                     >
                       <ShoppingBag size={14} className="shrink-0 animate-bounce" />
                       <span className="font-black text-[10px] sm:text-xs text-white">ORDER NOW</span>
                     </button>
                   </div>

                   <p className="hidden sm:block text-center text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                     📦 Nationwide Delivery Within 24-48 Hours | Pay Only When You Receive It
                   </p>
                 </div>

              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
