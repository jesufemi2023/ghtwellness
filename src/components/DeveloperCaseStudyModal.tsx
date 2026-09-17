import React, { useState, useEffect } from 'react';
import { 
  Linkedin, 
  ExternalLink, 
  Database, 
  Server, 
  Layers, 
  Mail, 
  Zap, 
  X, 
  Award,
  Camera,
  Upload,
  UserCheck,
  Check,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { CONFIG } from '../config';

interface DeveloperCaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  onPhotoUpdate?: (url: string) => void;
}

export const DeveloperCaseStudyModal: React.FC<DeveloperCaseStudyModalProps> = ({ 
  isOpen, 
  onClose,
  currentPhotoUrl,
  onPhotoUpdate
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('developer_photo_url') : null;
    return currentPhotoUrl || ((saved && saved.length > 5) ? saved : '') || '';
  });
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check server status on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/developer-photo-status')
        .then(res => res.json())
        .then(data => {
          if (data && data.exists && data.url) {
            setPhotoUrl(data.url);
            setImgError(false);
            localStorage.setItem('developer_photo_url', data.url);
            if (onPhotoUpdate) onPhotoUpdate(data.url);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentPhotoUrl) {
      setPhotoUrl(currentPhotoUrl);
      setImgError(false);
    }
  }, [currentPhotoUrl]);

  if (!isOpen) return null;

  const handleSavePhotoUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setPhotoUrl(trimmed);
    setImgError(false);
    localStorage.setItem('developer_photo_url', trimmed);
    if (onPhotoUpdate) onPhotoUpdate(trimmed);
    setIsEditingPhoto(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // If it's a base64 data URL, persist directly to server disk
    if (trimmed.startsWith('data:image')) {
      setIsUploading(true);
      try {
        const res = await fetch('/api/developer-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: trimmed })
        });
        const data = await res.json();
        if (data.success && data.url) {
          setPhotoUrl(data.url);
          localStorage.setItem('developer_photo_url', data.url);
          if (onPhotoUpdate) onPhotoUpdate(data.url);
        }
      } catch (err) {
        console.warn("Could not persist to server disk:", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload an image smaller than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleSavePhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const hasCustomPhoto = Boolean(photoUrl && photoUrl.length > 5 && !imgError);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden flex-shrink-0">
          <div className="absolute -right-12 -top-12 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-16 w-56 h-56 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer z-10"
          >
            <X size={20} />
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Award size={13} /> Engineering Showcase &amp; Architecture Study
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-emerald-400 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Open for Full-Stack / Lead Roles
            </span>
          </div>

          {/* Profile Header with Prominent Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2">
            
            {/* Avatar container */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-400 shadow-2xl flex items-center justify-center relative ring-4 ring-emerald-500/20">
                {hasCustomPhoto ? (
                  <img 
                    src={photoUrl} 
                    alt={CONFIG.developer.name} 
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">JS</span>
                    <span className="text-[9px] uppercase font-bold text-slate-300 mt-0.5">Solomon</span>
                  </div>
                )}
              </div>

              {/* Edit Photo Trigger Button */}
              <label 
                className="absolute -bottom-1.5 -right-1.5 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg transition-all hover:scale-110 cursor-pointer flex items-center justify-center"
                title="Select your photo (e.g. tope-pics.jpg)"
              >
                <Camera size={15} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {CONFIG.developer.name}
                </h2>
                <span title="Verified Lead Engineer" className="inline-flex text-emerald-400">
                  <UserCheck size={20} />
                </span>
              </div>
              <p className="text-emerald-400 font-bold text-sm sm:text-base mt-0.5">
                {CONFIG.developer.role}
              </p>
              <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed mt-1.5 max-w-xl">
                Full-stack system architect with deep expertise in scalable TypeScript web systems, reactive UI architectures, micro-services, resilient multi-tier data layers, and automated transactional infrastructure.
              </p>
            </div>
          </div>

          {/* Prominent Direct Photo Uploader Banner */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                <ImageIcon size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Developer Headshot</span>
                  {hasCustomPhoto ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Upload Your Photo</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-300">
                  {hasCustomPhoto ? "Your picture is live across the header, badges, and case study." : "Select your picture from your device to display your real photo."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all hover:scale-102 cursor-pointer">
                <Upload size={14} />
                <span>{isUploading ? "Saving..." : "Upload Photo (e.g. tope-pics.jpg)"}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </label>

              <button 
                type="button"
                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-600 transition-colors cursor-pointer"
              >
                URL
              </button>
            </div>
          </div>

          {/* Optional URL input toggle */}
          {isEditingPhoto && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 flex gap-2 animate-fadeIn">
              <input 
                type="url"
                placeholder="Paste direct image URL (e.g., https://...)..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleSavePhotoUrl(inputUrl)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Apply URL
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <Check size={14} /> Real developer photo successfully saved and applied!
            </div>
          )}

          {/* Quick Links & CTA Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-800">
            <a 
              href={CONFIG.developer.linkedin} 
              target="_blank" 
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Linkedin size={16} /> Connect on LinkedIn
              <ExternalLink size={13} className="opacity-75" />
            </a>
            <a 
              href={`mailto:${CONFIG.developer.email}?subject=Full-Stack%20Engineering%20Opportunity`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <Mail size={16} /> Contact Developer Directly
            </a>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700">
          
          {/* Executive Overview */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">Project Brief &amp; Executive Summary</h3>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              This application is a production-grade, high-performance pharmaceutical and wellness e-commerce platform custom-engineered for <strong>SD GHT Health Care Nig Ltd</strong>. Spearheaded and implemented end-to-end by <strong>Jesufemi Temitope Solomon</strong>, it combines a responsive TypeScript client, a hardened Node.js/Express API proxy layer, dynamic multi-tier persistence, real-time multi-channel notification dispatch (Telegram Bot &amp; Nodemailer SMTP), and a comprehensive back-office operations dashboard.
            </p>
          </div>

          {/* Core Technical Highlights */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Architectural Innovations &amp; Engineering Prowess</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Database size={16} />
                  </div>
                  Resilient Multi-Tier Storage Engine
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Architected <code>OptionsStorage</code>, a fault-tolerant triple-tier data layer that synchronizes dynamic bottle variations, discount matrixes, and value bundles across remote PostgreSQL/Supabase, automated cloud settings fallback, and local disk serialization to eliminate data loss and downtime.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <Server size={16} />
                  </div>
                  Secure Full-Stack Node.js API Proxy
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Designed dedicated server-side Express API routes to compute pricing, isolate database credentials and private tokens away from client browsers, and process administrative inventory controls with robust validation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Zap size={16} />
                  </div>
                  Automated Multi-Channel Dispatch Worker
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Integrated real-time order dispatch workers using <strong>Telegraf (Telegram Bot API)</strong> and <strong>Nodemailer (SMTP/Gmail)</strong> to deliver immediate, itemized fulfillment alerts with SKU precision (e.g. <code>1x Reodoe(3)</code>) within seconds of purchase.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Layers size={16} />
                  </div>
                  High-Converting Reactive Checkout System
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineered a friction-free slide-over checkout drawer featuring instant discount recalculation, Pay-On-Delivery validation, automated WhatsApp merchant notification, and instant invoice generation.
                </p>
              </div>

            </div>
          </div>

          {/* Technology Stack Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Architectural Technology Stack</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Frontend Layer</span>
                <span className="text-slate-500">React 19, TypeScript, Tailwind CSS v4, Motion, Lucide</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Backend Infrastructure</span>
                <span className="text-slate-500">Node.js, Express, TSX, Vite Middleware Proxy</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Database &amp; Persistence</span>
                <span className="text-slate-500">Supabase PostgreSQL, Triple-Tier OptionsStorage</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Services &amp; APIs</span>
                <span className="text-slate-500">Telegram Bot, Nodemailer, WhatsApp API, Cloudinary</span>
              </div>
            </div>
          </div>

          {/* Business & Technical Value Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp size={18} />
              <span>Production Impact &amp; Engineering Standards</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-emerald-400 text-xl font-black mb-1">Zero Downtime</div>
                <div className="text-xs text-slate-300 leading-snug">Multi-tier fallback ensures catalog and checkout remain fully functional even during upstream network dropouts.</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-blue-400 text-xl font-black mb-1">&lt; 100ms</div>
                <div className="text-xs text-slate-300 leading-snug">Optimized bundle size and fast in-memory SKU resolution deliver lightning-fast page responsiveness on mobile devices.</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-purple-400 text-xl font-black mb-1">100% Type-Safe</div>
                <div className="text-xs text-slate-300 leading-snug">Strict TypeScript typing across frontend state, backend controllers, and data models to prevent runtime exceptions.</div>
              </div>
            </div>
          </div>

          {/* Author Card Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-400 shrink-0 flex items-center justify-center ring-4 ring-emerald-500/20">
                {hasCustomPhoto ? (
                  <img 
                    src={photoUrl} 
                    alt={CONFIG.developer.name} 
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-emerald-400 font-black text-lg">JS</span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block mb-0.5">Primary Architect &amp; Software Engineer</span>
                <h4 className="text-lg sm:text-xl font-black text-white">{CONFIG.developer.name}</h4>
                <p className="text-xs text-slate-300">{CONFIG.developer.role}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Contact: {CONFIG.developer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a 
                href={CONFIG.developer.linkedin} 
                target="_blank" 
                rel="noreferrer noopener"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-emerald-500/25 cursor-pointer"
              >
                <Linkedin size={16} /> Connect on LinkedIn
              </a>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-8 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Architected by {CONFIG.developer.name} &bull; SD GHT Health Care Enterprise
          </span>
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
