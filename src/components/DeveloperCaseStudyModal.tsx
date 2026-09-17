import React from 'react';
import { 
  Linkedin, 
  ExternalLink, 
  Code2, 
  Database, 
  Server, 
  Layers, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  Zap, 
  X, 
  Award,
  Terminal,
  Cpu
} from 'lucide-react';

interface DeveloperCaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperCaseStudyModal: React.FC<DeveloperCaseStudyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden flex-shrink-0">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Award size={13} /> Full-Stack Engineering Showcase
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              TypeScript &bull; React 19 &bull; Node.js &bull; Supabase
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Engineering & Architecture Case Study
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
            Designed, architected, and engineered end-to-end by <strong className="text-emerald-400 font-bold">Jesufemi Temitope Solomon</strong>.
          </p>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-800">
            <a 
              href="https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/" 
              target="_blank" 
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Linkedin size={16} /> View LinkedIn Profile
              <ExternalLink size={13} className="opacity-75" />
            </a>
            <a 
              href="mailto:ogungbetemitope@gmail.com" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              <Mail size={16} /> ogungbetemitope@gmail.com
            </a>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700">
          
          {/* Executive Overview */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">Project Brief & System Scope</h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              This application is an enterprise-ready, high-converting pharmaceutical and wellness e-commerce platform built for <strong>SD GHT Health Care Nig Ltd</strong>. It features a full-stack architecture combining a reactive TypeScript client, a secure server-side proxy layer, PostgreSQL/Supabase database integration, multi-channel transactional alerts (Telegram &amp; Gmail), and an administrative back-office.
            </p>
          </div>

          {/* Core Technical Highlights */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Key Engineering Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Database size={16} />
                  </div>
                  Resilient Multi-Tier Storage Engine
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineered <code>OptionsStorage</code>, a triple-tier persistence layer that synchronizes dynamic bottle variations, discount rules, and package combos across remote PostgreSQL, automated cloud settings fallback, and local disk serialization to guarantee zero data loss.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <Server size={16} />
                  </div>
                  Full-Stack Express API Proxy
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Implemented custom server endpoints in Node.js/Express with Vite middleware to sanitize requests, securely protect database keys, compute dynamic pricing server-side, and process administrative CRUD operations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Zap size={16} />
                  </div>
                  Real-time Multi-Channel Notifications
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Built an automated dispatch worker with <strong>Nodemailer</strong> (SMTP/Gmail) and <strong>Telegraf</strong> (Telegram Bot API) delivering instant, itemized order alerts to fulfillment managers with SKU formatting (e.g. <code>1x Reodoe(3)</code>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Layers size={16} />
                  </div>
                  Conversion-Focused Checkout Engine
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Crafted a high-converting, 3-step slide-over checkout drawer with real-time discount deduction, Pay-On-Delivery (POD) validation, instant WhatsApp merchant confirmation, and automated order receipt routing.
                </p>
              </div>

            </div>
          </div>

          {/* Technology Stack Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Architectural Technology Stack</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Frontend UI</span>
                <span className="text-slate-500">React 19, TypeScript, Tailwind CSS v4, Motion</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Backend Server</span>
                <span className="text-slate-500">Node.js, Express, TSX, Vite Middleware</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Database &amp; CDN</span>
                <span className="text-slate-500">Supabase PostgreSQL, Cloudinary Media CDN</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">Integrations</span>
                <span className="text-slate-500">Telegram Bot, Nodemailer, WhatsApp API, GA4</span>
              </div>
            </div>
          </div>

          {/* Verification & Code Review Checklist */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> What Employers &amp; Technical Interviewers Can Inspect
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-emerald-950 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Git Repository &amp; Commit History:</strong> Review clean TypeScript architecture, modular service separation, and schema definitions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Secure Backend Proxy:</strong> Verify that Supabase service keys, SMTP credentials, and Telegram tokens are isolated on the Node.js server.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Protected Admin Dashboard:</strong> Test the dynamic inventory editor, bottle option manager, and order dispatch workflow.</span>
              </li>
            </ul>
          </div>

          {/* Author Card Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Author &amp; Lead Engineer</p>
              <h4 className="text-base sm:text-lg font-black text-white">Jesufemi Temitope Solomon</h4>
              <p className="text-xs text-slate-300">Software Engineer &bull; Full-Stack TypeScript / Node.js Specialist</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a 
                href="https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/" 
                target="_blank" 
                rel="noreferrer noopener"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
              >
                <Linkedin size={15} /> Connect on LinkedIn
              </a>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-8 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Project: GHT Wellness E-Commerce Platform
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
