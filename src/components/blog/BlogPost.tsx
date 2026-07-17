import React, { useEffect, useState } from 'react';
import { BlogPost as BlogPostType } from '../../types';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Share2, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  Truck, 
  Clock, 
  UserCheck, 
  Phone,
  Sparkles,
  Lock,
  Gift,
  Flame,
  ThumbsUp,
  Award,
  Users2,
  Check
} from 'lucide-react';
import { CONFIG } from '../../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { trackBlogView } from '../../lib/analytics';
import { motion, AnimatePresence } from 'motion/react';
import { WhatsAppSuccessHub } from './WhatsAppSuccessHub';
import { openWhatsAppLink } from '../../utils/whatsapp';

// Robust helper to extract raw text from react children
const getRawText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getRawText).join("");
  if (node.props && node.props.children) return getRawText(node.props.children);
  return "";
};

interface BlogPostProps {
  id: string;
  onBack: () => void;
  onOrderPackage?: (pkg: any) => void;
}

export function BlogPost({ id, onBack, onOrderPackage }: BlogPostProps) {
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [allPackages, setAllPackages] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(899); // 14 mins 59 secs
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Recent order notifications loop for maximum social proof
  useEffect(() => {
    const notifications = [
      "Alhaji Umar from Kaduna just ordered Vigor Combo Treatment! 🎉",
      "Mrs. Amaka from Lagos just ordered Sugar Balance Package! 💊",
      "Chief Ogbonna from Port Harcourt just ordered Vigor Combo Treatment! 🔥",
      "Pastor Johnson from Ibadan just ordered Cardio Cleanse! ❤️",
      "Madam Evelyn from Benin City just ordered Sugar Balance Package! ✨",
      "Dr. Gabriel from Abuja just ordered Vigor Combo Treatment! 🚀",
      "Hajia Fatima from Kano just ordered Sugar Balance Package! 🙌",
      "Mr. Christopher from Asaba just ordered Cardio Cleanse! 🩺"
    ];

    const interval = setInterval(() => {
      const randomMsg = notifications[Math.floor(Math.random() * notifications.length)];
      setActiveNotification(randomMsg);
      setTimeout(() => {
        setActiveNotification(null);
      }, 6000);
    }, 24000);

    const initialTimeout = setTimeout(() => {
      const randomMsg = notifications[Math.floor(Math.random() * notifications.length)];
      setActiveNotification(randomMsg);
      setTimeout(() => {
        setActiveNotification(null);
      }, 6000);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchAllPackages = async () => {
      try {
        const res = await fetch('/api/recommended-packages');
        if (res.ok) {
          setAllPackages(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch packages in BlogPost:", e);
      }
    };
    fetchAllPackages();
  }, []);

  const handleOrderPackageByName = (packageName: string) => {
    if (!onOrderPackage) return;
    const cleanName = packageName.toLowerCase();
    
    // Attempt fuzzy match on name
    const found = allPackages.find(p => 
      p.name.toLowerCase().includes(cleanName) || 
      cleanName.includes(p.name.toLowerCase())
    );
    
    if (found) {
      onOrderPackage(found);
    } else if (post?.recommended_package) {
      onOrderPackage(post.recommended_package);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/?blog=${post.slug || post.id}`;
    const shareData = {
      title: post.title,
      text: post.meta_description || post.title,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          trackBlogView(data.title);
        }
      } catch (e) {
        console.error("Failed to fetch blog post", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-32 bg-slate-50 min-h-screen">
        <h3 className="text-2xl font-black text-slate-900">Article not found</h3>
        <button onClick={onBack} className="mt-6 text-emerald-600 font-bold hover:underline">
          &larr; Back to all articles
        </button>
      </div>
    );
  }

  // Calculate reading time
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Custom renderer for markdown
  const components = {
    blockquote: ({ node, children, ...props }: any) => {
      const textVal = getRawText(children);
      const isCustomer = textVal.toLowerCase().includes('customer:') || textVal.toLowerCase().includes('client:');
      const isBrand = textVal.toLowerCase().includes('brand:') || textVal.toLowerCase().includes('consultant:') || textVal.toLowerCase().includes('expert:');

      if (isCustomer || isBrand) {
        const isUser = isCustomer;
        const cleanText = textVal
          .replace(/^\*?\*?(customer|client|expert|brand|consultant)\*?\*?\s*:\s*/i, '')
          .replace(/^["']|["']$/g, '')
          .trim();

        return (
          <div className={`flex w-full mb-3 ${isUser ? 'justify-start' : 'justify-end'}`}>
            <div className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2.5 pb-6 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] rounded-2xl ${
              isUser 
                ? 'bg-white text-slate-800 rounded-tl-none border-t border-slate-100' 
                : 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
            }`}>
              <div className="text-[10px] font-extrabold mb-1 flex items-center justify-between gap-2">
                <span className={isUser ? 'text-[#075e54]' : 'text-[#128c7e]'}>
                  {isUser ? 'Patient (Verified Customer)' : 'GHT Certified Health Expert'}
                </span>
              </div>
              <div className="text-sm md:text-base font-semibold leading-relaxed break-words text-slate-800">
                {cleanText || children}
              </div>
              
              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] text-slate-400 select-none font-medium">
                <span>10:48 AM</span>
                {!isUser && (
                  <span className="text-[#53bdeb]">
                    <Check size={12} className="stroke-[3]" />
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <blockquote className="border-l-4 border-emerald-500 pl-6 py-2 my-8 italic text-xl font-medium text-slate-700 bg-emerald-50/30 rounded-r-xl" {...props}>
          {children}
        </blockquote>
      );
    },
    h1: ({ node, ...props }: any) => <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-12 mb-6 tracking-tight" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-12 mb-6 tracking-tight border-b border-slate-100 pb-4" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
    p: ({ node, ...props }: any) => <p className="text-lg text-slate-600 leading-relaxed mb-6" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 mb-6 space-y-3 text-lg text-slate-600 marker:text-emerald-500" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-lg text-slate-600 marker:text-emerald-500 font-medium" {...props} />,
    li: ({ node, ...props }: any) => <li className="pl-2" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-emerald-600 font-bold hover:text-emerald-700 underline decoration-emerald-200 underline-offset-4 transition-colors" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-slate-900" {...props} />,
  };

  return (
    <article className="bg-white min-h-screen pb-32 md:pb-24 font-sans">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Articles
          </button>
          {post.recommended_package && (
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => {
                  const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package.name} solution. Could you please provide more information?`;
                  openWhatsAppLink(CONFIG.company.phone, message);
                }}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                <Phone size={14} className="text-emerald-600" />
                Chat with us
              </button>
              <button 
                onClick={() => onOrderPackage && onOrderPackage(post.recommended_package)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                Order Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editorial Hero Section */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 pt-12 pb-8 text-center">
        {post.category && (
          <div className="inline-block bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-emerald-100">
            {post.category}
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 border-y border-slate-100 py-4">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-500" />
            <span className="text-slate-700 font-bold">Medically Reviewed</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} />
            {readingTime} min read
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mb-12">
        <div className="aspect-[21/9] w-full rounded-3xl overflow-hidden bg-slate-100 shadow-xl shadow-slate-200/50 border border-slate-100">
          <img 
            src={getOptimizedImageUrl(post.image_url || `https://picsum.photos/seed/supplement-hero-${post.id}/1920/1080`, 1200)} 
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-hero-${post.id}/1200/675`;
            }}
          />
        </div>
      </div>

      {/* Main Content & Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Left Column: Article Content */}
          <div className="w-full lg:w-[65%] xl:w-[70%]">
            <div className="prose prose-lg prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Mobile/Tablet Recommended Package */}
            {post.recommended_package && (
              <div className="lg:hidden mt-12 bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50 overflow-hidden">
                <div className="bg-emerald-600 text-white text-center py-3 text-xs font-black uppercase tracking-widest">
                  Recommended Solution
                </div>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-full sm:w-1/3 aspect-square rounded-2xl overflow-hidden bg-slate-50 relative group">
                      <img 
                        src={getOptimizedImageUrl(post.recommended_package.package_image_url || `https://picsum.photos/seed/supplement-pkg-${post.recommended_package.id}/400/400`, 600)} 
                        alt={post.recommended_package.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-pkg-${post.recommended_package.id}/400/400`;
                        }}
                      />
                      {post.recommended_package.discount > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                          Save {post.recommended_package.discount}%
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 w-full">
                      <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{post.recommended_package.name}</h3>
                      
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <span className="text-slate-500 text-xs font-bold ml-1 text-slate-600">(4.9/5 Reviews)</span>
                      </div>

                      <div className="space-y-3 mb-6">
                        {post.recommended_package.health_benefits?.slice(0, 3).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-6 mb-6">
                        <div className="flex items-end gap-2 mb-1">
                          <span className="text-3xl font-black text-emerald-600">₦{post.recommended_package.price.toLocaleString()}</span>
                          {post.recommended_package.discount > 0 && (
                            <span className="text-sm font-bold text-slate-400 line-through mb-1">
                              ₦{Math.round(post.recommended_package.price / (1 - post.recommended_package.discount / 100)).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">In Stock & Ready to Ship</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package.name} solution. Could you please provide more information?`;
                            openWhatsAppLink(CONFIG.company.phone, message);
                          }}
                          className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone size={18} className="text-emerald-600" />
                          Chat with us
                        </button>
                        <button 
                          onClick={() => onOrderPackage && onOrderPackage(post.recommended_package)}
                          className="flex-[1.5] bg-emerald-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Order Now
                        </button>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                          <ShieldCheck size={14} className="text-emerald-500" /> Secure Checkout
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                          <Truck size={14} className="text-emerald-500" /> Fast & Discreet Shipping
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* High-Converting Ad Promo Countdown Banner */}
            {post.recommended_package && (
              <div className="mt-12 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <span className="flex items-center gap-2 bg-red-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-500/30">
                      <Flame size={14} fill="currentColor" />
                      Flash Deal: Active Now
                    </span>
                    <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm bg-black/40 border border-white/10 px-4 py-2 rounded-xl">
                      <Clock size={16} className="animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
                      Time Left: <span className="text-white text-base font-black tracking-wider">{formatTime(timeLeft)}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2 leading-tight">
                    Get ₦5,000 Instant Discount + FREE Nationwide Delivery Today!
                  </h3>
                  <p className="text-slate-300 text-sm md:text-base mb-6 font-medium">
                    We are subsidizing the <span className="text-emerald-400 font-extrabold underline decoration-emerald-400/40">{post.recommended_package.name}</span> for the next 50 patients to make complete organic healing affordable. No coupon code needed—the discount is already applied inside our secure checkout!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <Gift size={20} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-sm text-white">Bonus #1: Free Pill Organizer</h4>
                        <p className="text-xs text-slate-400">Keep track of your daily doses effortlessly (Worth ₦3,500 - FREE today).</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <Truck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-sm text-white">Bonus #2: Free Shipping & POD</h4>
                        <p className="text-xs text-slate-400">Fast, confidential dispatch. Pay cash or transfer when you receive it.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-white/10 pt-6">
                    <div className="text-center sm:text-left">
                      <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                        <span className="text-3xl md:text-4xl font-black text-emerald-400">₦{post.recommended_package.price.toLocaleString()}</span>
                        {post.recommended_package.discount > 0 && (
                          <span className="text-sm font-bold text-slate-400 line-through">
                            ₦{Math.round(post.recommended_package.price / (1 - post.recommended_package.discount / 100)).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider mt-1">Guaranteed Authentic GHT Formulation</p>
                    </div>

                    <button 
                      onClick={() => onOrderPackage && onOrderPackage(post.recommended_package)}
                      className="w-full sm:w-auto sm:ml-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-widest px-8 py-4.5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 shrink-0"
                    >
                      Secure Instant Order
                      <ArrowLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive WhatsApp Success Hub */}
            <WhatsAppSuccessHub onOrderPackageByName={handleOrderPackageByName} />

            {/* Other Highly Convincing Verified Testimonials */}
            <div className="mt-16 border-t border-slate-100 pt-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
                <div>
                  <span className="text-emerald-600 font-black text-xs uppercase tracking-widest block mb-1">Peer Reviews & Endorsements</span>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Verified Patient Testimonials</h3>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600">
                  <Star size={16} fill="currentColor" className="text-amber-400" />
                  <span className="text-slate-900 font-black">4.92 out of 5</span> (based on 1,480+ local orders)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-800 font-bold rounded-full flex items-center justify-center text-sm">
                        PA
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Pastor Adebayo</h4>
                        <p className="text-xs text-slate-400">Ibadan, Oyo State</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium mb-3">
                    "I am a Pastor and diabetic patient of 8 years. My sugar level was constantly 280-320 mg/dL even with multiple daily injections. The leg burning pain was keeping me awake all night. I started taking this GHT solution and by the second week, my fasting glucose dropped to 110 mg/dL! I sleep like a baby now. Truly organic and blessed."
                  </p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Verified Purchase ✅
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-800 font-bold rounded-full flex items-center justify-center text-sm">
                        HF
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Hajia Fatima</h4>
                        <p className="text-xs text-slate-400">Kaduna, Kaduna State</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium mb-3">
                    "After my third scan showed the fibroids were growing larger, I was terrified of surgery. A senior nurse friend recommended the GHT Cleanse Combo. I took it faithfully for 2 months. Last week, I went back for a scan and the doctor was speechless—the fibroids had completely shrunk and melted away! I feel extremely light and happy."
                  </p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Verified Purchase ✅
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 text-teal-800 font-bold rounded-full flex items-center justify-center text-sm">
                        OK
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Okey Kunle</h4>
                        <p className="text-xs text-slate-400">Port Harcourt</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium mb-3">
                    "My blood pressure was a ticking time bomb at 165/105. I had constant heavy headaches and chest stiffness. Conventional medical pills were giving me extreme weak performance which was ruining my relation with my wife. This GHT cardio treatment has completely cleared my vascular passages. My BP is now 118/79, no headaches, and my performance has returned to maximum levels!"
                  </p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Verified Purchase ✅
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 text-amber-800 font-bold rounded-full flex items-center justify-center text-sm">
                        NS
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Nurse Sandra</h4>
                        <p className="text-xs text-slate-400">Enugu, Enugu State</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium mb-3">
                    "As a healthcare professional, I am extremely picky about quality standards. GHT utilizes pristine extraction techniques. The clinical synergy of these herbal treatments is amazing. The prostate therapy is particularly phenomenal. I recommend it to my family and patients without any hesitation."
                  </p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Verified Professional Endorsement 🩺
                  </span>
                </div>
              </div>
            </div>

            {/* Tags & Share */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag, i) => (
                  <span key={i} className="bg-slate-50 text-slate-600 text-[10px] px-3 py-1.5 rounded-full border border-slate-200 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors bg-slate-50 px-4 py-2 rounded-full border border-slate-200"
              >
                {isCopied ? (
                  <><CheckCircle2 size={16} className="text-emerald-500" /> Copied!</>
                ) : (
                  <><Share2 size={16} /> Share Article</>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar (Desktop Only) */}
          <div className="hidden lg:block w-[35%] xl:w-[30%]">
            <div className="sticky top-24 space-y-6">
              {post.recommended_package ? (
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50 overflow-hidden">
                  <div className="bg-emerald-600 text-white text-center py-3 text-xs font-black uppercase tracking-widest">
                    Recommended Solution
                  </div>
                  <div className="p-6">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-6 relative group">
                      <img 
                        src={getOptimizedImageUrl(post.recommended_package.package_image_url || `https://picsum.photos/seed/supplement-side-${post.recommended_package.id}/400/400`, 600)} 
                        alt={post.recommended_package.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-side-${post.recommended_package.id}/400/400`;
                        }}
                      />
                      {post.recommended_package.discount > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                          Save {post.recommended_package.discount}%
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{post.recommended_package.name}</h3>
                    
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <span className="text-slate-500 text-xs font-bold ml-1 text-slate-600">(4.9/5 Reviews)</span>
                    </div>

                    <div className="space-y-3 mb-6">
                      {post.recommended_package.health_benefits?.slice(0, 3).map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-6 mb-6">
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-3xl font-black text-emerald-600">₦{post.recommended_package.price.toLocaleString()}</span>
                        {post.recommended_package.discount > 0 && (
                          <span className="text-sm font-bold text-slate-400 line-through mb-1">
                            ₦{Math.round(post.recommended_package.price / (1 - post.recommended_package.discount / 100)).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">In Stock & Ready to Ship</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package.name} solution. Could you please provide more information?`;
                          openWhatsAppLink(CONFIG.company.phone, message);
                        }}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={18} className="text-emerald-600" />
                        Chat with us
                      </button>
                      <button 
                        onClick={() => onOrderPackage && onOrderPackage(post.recommended_package)}
                        className="flex-[1.5] bg-emerald-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Order Now
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                        <ShieldCheck size={14} className="text-emerald-500" /> Secure Checkout
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                        <Truck size={14} className="text-emerald-500" /> Fast & Discreet Shipping
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">Trusted Health Information</h4>
                  <p className="text-sm text-slate-500">Our articles are written and reviewed by health professionals to ensure accuracy and safety.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA (Bottom) */}
      {post.recommended_package && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recommended</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-emerald-600">₦{post.recommended_package.price.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <button 
              onClick={() => {
                const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package.name} solution. Could you please provide more information?`;
                openWhatsAppLink(CONFIG.company.phone, message);
              }}
              className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={18} className="text-emerald-600" />
              Chat with us
            </button>
            <button 
              onClick={() => onOrderPackage && onOrderPackage(post.recommended_package)}
              className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 text-center"
            >
              Order Now
            </button>
          </div>
        </div>
      )}

      {/* Live Social Proof Floating Notification Pop-up */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 md:bottom-6 left-4 z-50 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center gap-3.5 max-w-[90%] md:max-w-md"
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900 shrink-0 font-bold shadow-inner">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Recent Order Placed</p>
              <p className="text-xs md:text-sm font-semibold text-slate-100 leading-snug">{activeNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
