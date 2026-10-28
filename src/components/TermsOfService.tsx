import React from "react";
import {
  ArrowLeft,
  Scale,
  Truck,
  CreditCard,
  ShieldAlert,
  PackageCheck,
  Mail,
  Phone,
  MapPin
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

interface TermsOfServiceProps {
  onNavigate: (tab: PolicyNavTab) => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onNavigate }) => {
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
              onClick={() => onNavigate("privacy-policy")}
              className="hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
            >
              Privacy Policy
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

        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Merchant Terms &amp; Fulfillment Standards
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Terms of Service &amp; Shipping Policy
          </h1>
          <p className="text-sm text-slate-500">
            Operated by Authorized Distributor Network of {CONFIG.company.name} {CONFIG.company.subtitle}
          </p>
          <p className="text-slate-600 text-base leading-relaxed pt-2">
            Welcome to GHT Wellness. By placing an order or using our website, you agree to the transparent commercial, shipping, payment, and supplement usage terms set forth below.
          </p>
        </div>

        {/* Main Terms */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <ShieldAlert size={20} className="text-amber-600 shrink-0" />
              <h2 className="text-xl font-bold">1. Dietary Supplement &amp; Medical Disclaimer</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              All products listed on this website are herbal and nutritional dietary supplements registered with NAFDAC for general wellness support. They are <strong className="text-slate-900">not</strong> prescription pharmaceuticals and are not intended to diagnose, treat, cure, or prevent any disease. Information provided on this website, in product guides, or during wellness consultations is for educational and nutritional support purposes only and does not substitute professional medical advice, diagnosis, or hospital care.
            </p>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Individual results vary depending on age, diet, consistency, and baseline health. Always consult your physician or licensed healthcare provider before starting any supplement, especially if you are pregnant, nursing, under 18, taking prescription medication, or managing a medical condition.
            </p>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <CreditCard size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">2. Transparent Pricing &amp; Payment Methods</h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 text-sm md:text-base">
              <li>
                <strong className="text-slate-900">Currency &amp; Full Price Clarity:</strong> All prices are displayed clearly in Nigerian Naira (₦) inclusive of applicable taxes. There are no hidden subscription charges or recurring billing traps.
              </li>
              <li>
                <strong className="text-slate-900">Pay on Delivery (POD):</strong> Customers across Nigeria may select Pay on Delivery at checkout with zero upfront payment. You inspect the intact manufacturer seals upon arrival and pay our dispatch agent via cash or instant bank transfer.
              </li>
              <li>
                <strong className="text-slate-900">Direct Bank Transfer:</strong> Customers who prefer to prepay via bank transfer may upload their transfer receipt during checkout for priority dispatch verification.
              </li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <Truck size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">3. Nationwide Shipping &amp; Delivery Timelines</h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 text-sm md:text-base">
              <li>
                <strong className="text-slate-900">Shipping Cost:</strong> Standard nationwide delivery across Nigeria is provided free of charge on eligible wellness packages and orders unless explicitly stated otherwise prior to order confirmation.
              </li>
              <li>
                <strong className="text-slate-900">Estimated Delivery Time:</strong> Orders to major metropolitan centers (Lagos, Abuja, Port Harcourt, Ibadan, Benin, Enugu, Kano, Kaduna, Abeokuta, etc.) are typically delivered within <strong className="text-slate-900">24 to 48 hours</strong> of phone confirmation. Outlying towns may require 2 to 4 business days.
              </li>
              <li>
                <strong className="text-slate-900">Order Confirmation:</strong> Please ensure your phone number is reachable after placing an order so our fulfillment desk and local dispatch rider can coordinate smooth doorstep delivery.
              </li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <PackageCheck size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">4. Inspection Upon Arrival, Returns &amp; Replacements</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              With Pay on Delivery, you have the right to inspect the outer packaging and factory safety seals when the rider arrives before completing payment. If any bottle is broken, leaking, or unsealed during transit, you may decline it on the spot at zero cost or request a free replacement within 24 hours under our{" "}
              <button
                onClick={() => onNavigate("return-policy")}
                className="text-emerald-700 font-semibold underline cursor-pointer"
              >
                Return &amp; Exchange Policy
              </button>.
            </p>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900">
              <Scale size={20} className="text-emerald-700 shrink-0" />
              <h2 className="text-xl font-bold">5. Governing Law &amp; Customer Support</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              These Terms of Service are governed by the laws of the Federal Republic of Nigeria. Any questions regarding product specifications, orders, or fulfillment can be directed to our customer support team below.
            </p>
          </section>
        </div>

        {/* Contact Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-700" /> Office &amp; Dispatch Hub
              </p>
              <p>{CONFIG.company.name} {CONFIG.company.subtitle}</p>
              <p>{CONFIG.company.address}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Phone size={15} className="text-emerald-700" /> Customer Care Line
              </p>
              <p>{CONFIG.company.phone}</p>
              <button
                onClick={() => openWhatsAppLink(CONFIG.whatsapp.number, "Hello SD GHT Health Care, I have an inquiry regarding your Terms & Shipping Policy.")}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Chat on WhatsApp →
              </button>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Mail size={15} className="text-emerald-700" /> Official Email
              </p>
              <a href={`mailto:${CONFIG.company.email}`} className="text-emerald-700 font-semibold hover:underline block">
                {CONFIG.company.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
