import React from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  Cookie,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileText
} from "lucide-react";
import { CONFIG } from "../config";
import { openWhatsAppLink } from "../utils/whatsapp";

type PolicyNavTab =
  | "home"
  | "ad"
  | "products"
  | "recommended"
  | "combo"
  | "return-policy"
  | "privacy-policy"
  | "terms-of-service";

interface PrivacyPolicyProps {
  onNavigate: (tab: PolicyNavTab) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => onNavigate("home")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Store
          </button>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <button
              onClick={() => onNavigate("terms-of-service")}
              className="hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
            >
              Terms of Service
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate("return-policy")}
              className="hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
            >
              Return &amp; Exchange Policy
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Data Protection &amp; Customer Privacy
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">
            Effective Entity: {CONFIG.company.name} {CONFIG.company.subtitle} · Applies to ghtwellness.vercel.app
          </p>
          <p className="text-slate-600 text-base leading-relaxed pt-2">
            {CONFIG.company.name} {CONFIG.company.subtitle} ("GHT Wellness", "we", "our", or "us") respects your privacy and is committed to protecting the personal information you share when browsing our website, requesting wellness guidance, or ordering herbal dietary supplements. This Privacy Policy explains what data we collect, how we use and safeguard it, and your rights under applicable data protection regulations including the Nigeria Data Protection Regulation (NDPR).
          </p>
        </div>

        {/* Policy Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <Eye size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">1. Information We Collect</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              We only collect information reasonably required to fulfill your supplement orders, arrange nationwide delivery, and provide responsive customer care:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 text-sm md:text-base">
              <li>
                <strong className="text-slate-900">Order &amp; Delivery Details:</strong> Your full name, phone number, street delivery address, nearest landmark, preferred delivery date, and selected payment method (Pay on Delivery or Bank Transfer).
              </li>
              <li>
                <strong className="text-slate-900">Payment Verification (Optional):</strong> If you choose direct bank transfer, we collect the sender name and payment receipt image solely to reconcile your order. We do not collect or store debit/credit card numbers or banking PINs.
              </li>
              <li>
                <strong className="text-slate-900">Voluntary Wellness Inquiries:</strong> Information you voluntarily share via our consultation form or WhatsApp support channel so our product specialists can suggest appropriate nutritional supplements.
              </li>
              <li>
                <strong className="text-slate-900">Technical &amp; Usage Data:</strong> Anonymous session identifiers, device type, browser information, and page interaction events used to maintain site reliability and measure advertising performance.
              </li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <Lock size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">2. How We Use Your Information</h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 text-sm md:text-base">
              <li>To process, confirm, and dispatch your herbal supplement orders to your designated address across Nigeria.</li>
              <li>To enable our regional logistics and dispatch riders to contact you prior to doorstep delivery and Pay-on-Delivery inspection.</li>
              <li>To respond to customer service inquiries, order status checks, and defective-product replacement requests.</li>
              <li>To improve website usability, product availability, and advertising relevance.</li>
            </ul>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              We <strong className="text-slate-900">never sell, rent, or trade</strong> your personal contact information or wellness inquiries to third-party data brokers or unauthorized marketers.
            </p>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <Cookie size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">3. Cookies, Analytics &amp; Google Ads Measurement</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Our website uses essential local storage tokens (to let you view your own order status securely) as well as measurement cookies from Google Analytics and Google Ads (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">gtag.js</code>). These tags help us understand aggregate visitor traffic and measure whether an advertisement led to a completed order on our website.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 text-sm md:text-base">
              <li>Third-party vendors, including Google, use cookies to serve and measure ads based on a user's prior visits to this website or other websites.</li>
              <li>We do not use sensitive health categories to build personalized remarketing lists in violation of Google Ads Healthcare and Personalized Advertising policies.</li>
              <li>You may opt out of personalized advertising cookies at any time by visiting <a href="https://adssettings.google.com" target="_blank" rel="noreferrer noopener" className="text-emerald-700 font-semibold underline">Google Ads Settings</a> or adjusting your browser's cookie controls.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <ShieldCheck size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">4. Data Security &amp; Retention</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              All communications between your browser and our platform are encrypted over HTTPS/TLS. Order records are stored in access-controlled databases restricted to authorized fulfillment personnel. We retain order records only as long as necessary to complete delivery, honor our replacement policy, and comply with statutory accounting obligations.
            </p>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <UserCheck size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">5. Your Privacy Rights</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              You have the right to request access to the personal data we hold about your orders, request correction of inaccurate delivery details, or request deletion of your personal record. To exercise any of these rights, contact our support desk using the verified merchant details below.
            </p>
          </section>
        </div>

        {/* Contact Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-900">
            <FileText size={18} className="text-emerald-700" />
            <h2 className="text-lg font-bold">Merchant Data Controller &amp; Contact Desk</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-700" /> Registered Business
              </p>
              <p>{CONFIG.company.name} {CONFIG.company.subtitle}</p>
              <p>{CONFIG.company.address}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Phone size={15} className="text-emerald-700" /> Telephone / WhatsApp
              </p>
              <p>{CONFIG.company.phone}</p>
              <button
                onClick={() => openWhatsAppLink(CONFIG.whatsapp.number, "Hello SD GHT Health Care, I have a question regarding your Privacy Policy.")}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Message Support Desk →
              </button>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Mail size={15} className="text-emerald-700" /> Email Support
              </p>
              <a href={`mailto:${CONFIG.company.email}`} className="text-emerald-700 font-semibold hover:underline block">
                {CONFIG.company.email}
              </a>
              <p className="text-xs text-slate-500">Response within 24 business hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
