import React from "react";
import { 
  ShieldAlert, 
  RefreshCw, 
  Clock, 
  HelpCircle,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
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

interface ReturnPolicyProps {
  onNavigate: (tab: PolicyNavTab) => void;
}

export const ReturnPolicy: React.FC<ReturnPolicyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb / Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
              onClick={() => onNavigate("terms-of-service")}
              className="hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
            >
              Terms &amp; Shipping Policy
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold uppercase tracking-wider text-xs">
                <FileText size={14} />
                Returns, Inspection &amp; Exchanges
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Return &amp; Exchange Policy
              </h1>
              <p className="text-slate-500 text-sm">
                Official Merchant Policy · {CONFIG.company.name} {CONFIG.company.subtitle}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700 shrink-0">
              <RefreshCw size={32} />
            </div>
          </div>

          {/* Quick Policy Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3 text-emerald-700">
                <CheckCircle2 size={20} />
                <h3 className="font-bold text-slate-900">Zero-Risk Doorstep Inspection (POD)</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                With Pay on Delivery, you pay nothing online upfront. You inspect your package and factory safety seals upon arrival and may decline any damaged or unsealed item on the spot at zero cost.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3 text-amber-600">
                <ShieldAlert size={20} />
                <h3 className="font-bold text-slate-900">24-Hour Replacement &amp; Exchange</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                For hygiene and NAFDAC safety compliance on ingestible supplements, opened bottles cannot be resold. Verified transit-damaged or defective items reported within 24 hours receive a fresh replacement unit or equivalent product exchange.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Guidelines */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm space-y-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Policy Terms &amp; Conditions</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Clock size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">1. 24-Hour Defect Reporting Window</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Due to temperature and storage standards required for herbal dietary supplements, any post-delivery defect claim must be submitted to our support desk within 24 hours of confirmed delivery receipt.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">2. Eligible Transit Defects &amp; Immediate Examination</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Eligible defects cover spoilt or melted capsules, broken tamper-evident seals during transit, cracked bottles, leakage, or incorrect items shipped. Customers should examine their package in the presence of the dispatch rider upon arrival and immediately hand back any visibly broken or leaking bottle before completing payment.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">3. Replacement &amp; Exchange Resolution</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Once a defect or wrong-item claim is verified with photo/video proof:
                  <br />
                  • <span className="font-semibold text-slate-900">Identical Replacement:</span> We dispatch a fresh, sealed unit to replace the verified defective item.
                  <br />
                  • <span className="font-semibold text-slate-900">Product Exchange:</span> Unopened, factory-sealed items in original condition may be exchanged for another GHT supplement of equivalent value (or higher value by paying the price difference).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <RefreshCw size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">4. Return Dispatch Logistics</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  If we shipped an incorrect or transit-damaged item, we cover replacement dispatch coordination. For voluntary exchanges of unopened items that originally received free shipping, standard courier dispatch fees apply to the swap shipment.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <HelpCircle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">5. Final Sale Hygiene Standard on Opened Supplements</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  In accordance with NAFDAC consumer safety standards for ingestible herbal products, opened or partially consumed supplement bottles cannot be returned for cash refunds. If you prepay via bank transfer and cancel before dispatch, or if an ordered item is unavailable in regional stock, a full refund is processed promptly to your originating bank account.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to initiate return/exchange */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Need Help With an Order, Return, or Exchange?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Reach our customer care desk directly with your order phone number and a clear photo of the package seal so we can assist you immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <button
              onClick={() => {
                const message = "Hello SD GHT Health Care, I would like assistance regarding an order return or product exchange.";
                openWhatsAppLink(CONFIG.whatsapp.number, message);
              }}
              className="w-full sm:flex-1 h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Phone size={16} />
              WhatsApp Support ({CONFIG.company.phone})
            </button>
            
            <a
              href={`mailto:${CONFIG.company.email}`}
              className="w-full sm:flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Mail size={16} />
              {CONFIG.company.email}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
