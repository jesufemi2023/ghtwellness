import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Copy,
  Check,
  Plus,
  Minus,
  Upload,
  Lock,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';
import { PackageData, Product, PaymentMethod } from '../types';
import { CONFIG } from '../config';
import {
  trackOrderStart,
  trackOrderComplete,
  trackWhatsAppClick,
  trackAdBundleSelect,
} from '../lib/analytics';
import { openWhatsAppLink } from '../utils/whatsapp';
import {
  formatProductNameWithBottles,
  formatOptionProductList,
  formatOrderDisplayName,
  extractBottleCount,
} from '../utils/bottleFormatter';
import { sanitizeAdTitle } from '../utils/adCompliance';
import { getStoredAdAttribution } from '../utils/adAttribution';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import {
  computePackagePricing,
  computeProductPricing,
  resolveSingleOptionPricing,
  cleanBottleLabel,
} from '../utils/optionPricing';

const NIGERIAN_STATES = [
  'Lagos State',
  'FCT - Abuja',
  'Rivers State',
  'Oyo State',
  'Ogun State',
  'Delta State',
  'Edo State',
  'Anambra State',
  'Enugu State',
  'Kano State',
  'Kaduna State',
  'Abia State',
  'Adamawa State',
  'Akwa Ibom State',
  'Bauchi State',
  'Bayelsa State',
  'Benue State',
  'Borno State',
  'Cross River State',
  'Ebonyi State',
  'Ekiti State',
  'Gombe State',
  'Imo State',
  'Jigawa State',
  'Katsina State',
  'Kebbi State',
  'Kogi State',
  'Kwara State',
  'Nasarawa State',
  'Niger State',
  'Ondo State',
  'Osun State',
  'Plateau State',
  'Sokoto State',
  'Taraba State',
  'Yobe State',
  'Zamfara State',
];

export interface ExpressPodCheckoutProps {
  mode: 'modal' | 'inline';
  isOpen?: boolean;
  onClose?: () => void;
  allBundles: PackageData[];
  selectedItem: PackageData | Product;
  itemType: 'package' | 'product';
  selectedOptionIdx: number;
  initialQuantity?: number;
  distributorId?: string;
  onSelectBundle?: (pkg: PackageData, optIdx: number) => void;
  onOrderSuccess?: (
    fullName: string,
    itemName: string,
    quantity: number,
    totalPrice: number,
    deliveryDate: string,
    paymentMethod: string
  ) => void;
}

function getIsoDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export const ExpressPodCheckout: React.FC<ExpressPodCheckoutProps> = ({
  mode,
  isOpen = true,
  onClose,
  allBundles,
  selectedItem,
  itemType,
  selectedOptionIdx,
  initialQuantity = 1,
  distributorId,
  onSelectBundle,
  onOrderSuccess,
}) => {
  const [activeItem, setActiveItem] = useState<PackageData | Product>(selectedItem);
  const [activeType, setActiveType] = useState<'package' | 'product'>(itemType);
  const [activeOptIdx, setActiveOptIdx] = useState<number>(selectedOptionIdx);
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [imgStage, setImgStage] = useState<'optimized' | 'raw' | 'failed'>('optimized');

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryState, setDeliveryState] = useState('Lagos State');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState<'today' | 'tomorrow' | 'custom'>('tomorrow');
  const [customDate, setCustomDate] = useState(getIsoDateOffset(2));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pod');
  const [senderName, setSenderName] = useState('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const [bankSettings, setBankSettings] = useState({
    bank_name: CONFIG.company.bankDetails.bankName,
    account_number: CONFIG.company.bankDetails.accountNumber,
    account_name: CONFIG.company.bankDetails.accountName,
  });

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok && mounted) {
          const data = await res.json();
          setBankSettings((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // Fallback to CONFIG defaults silently
      }
    };
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveItem(selectedItem);
    setActiveType(itemType);
    setActiveOptIdx(selectedOptionIdx);
    setQuantity(initialQuantity);
    setImgStage('optimized');
    setSubmitError(null);
    setIsSuccess(false);
  }, [selectedItem, itemType, selectedOptionIdx, initialQuantity]);

  const itemOptions = activeItem.options || [];
  const parentDiscountPercent =
    activeType === 'package'
      ? Number((activeItem as PackageData).discount) || 0
      : Number((activeItem as Product).discount_percent) || 0;

  const computedPricing =
    activeType === 'package'
      ? computePackagePricing(activeItem as PackageData, activeOptIdx)
      : {
          ...computeProductPricing(activeItem as Product, activeOptIdx),
          includedList: [] as string[],
        };

  const activeOption = computedPricing.activeOption;
  const activeOptionLabel = activeOption ? cleanBottleLabel(activeOption.bottles) : '';
  const unitPrice = computedPricing.currentPrice;
  const unitRetailPrice = computedPricing.retailPrice;
  const totalPrice = unitPrice * quantity;
  const totalRetail = unitRetailPrice * quantity;
  const totalSavings = Math.max(0, totalRetail - totalPrice);

  const includedProducts = computedPricing.includedList;

  const rawImageUrl =
    activeType === 'package'
      ? (activeItem as PackageData).package_image_url?.trim() ||
        (activeItem as PackageData).products?.[0]?.image_url?.trim() ||
        ''
      : (activeItem as Product).image_url?.trim() || '';

  const optimizedImageUrl = rawImageUrl ? getOptimizedImageUrl(rawImageUrl, 700) : '';
  const previewImageUrl =
    imgStage === 'optimized'
      ? optimizedImageUrl || rawImageUrl
      : imgStage === 'raw'
        ? rawImageUrl
        : '';

  useEffect(() => {
    if (mode === 'modal' && isOpen) {
      trackOrderStart(activeItem.name, activeType, totalPrice);
    }
  }, [mode, isOpen, activeItem.name, activeType]);

  useEffect(() => {
    if (mode !== 'modal' || !isOpen || !onClose) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mode, isOpen, onClose]);

  if (mode === 'modal' && !isOpen) {
    return null;
  }

  const displayTitle =
    activeType === 'package' ? sanitizeAdTitle(activeItem.name) : activeItem.name;

  const resolvedDeliveryDate =
    deliveryWindow === 'today'
      ? getIsoDateOffset(0)
      : deliveryWindow === 'tomorrow'
        ? getIsoDateOffset(1)
        : customDate || getIsoDateOffset(1);

  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankSettings.account_number);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2200);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Receipt image must be smaller than 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `ad_receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const response = await fetch('/api/upload-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: reader.result,
            fileName,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || 'Could not upload receipt image.');
        }

        const { publicUrl } = await response.json();
        setPaymentReceiptUrl(publicUrl);
      } catch (err: any) {
        setUploadError(err?.message || 'Failed to upload receipt. You can still submit your order.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Could not read selected image file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name so our dispatch rider can identify you.';
    }
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10 || cleanDigits.length > 15) {
      errors.phoneNumber =
        'Enter a valid 10 or 11-digit phone or WhatsApp number (e.g. 0803 123 4567).';
    }
    if (!deliveryState) {
      errors.deliveryState = 'Please select your delivery state.';
    }
    if (streetAddress.trim().length < 5) {
      errors.streetAddress = 'Please enter your house or office street address.';
    }
    if (landmark.trim().length < 2) {
      errors.landmark = 'Please enter the nearest bus-stop, junction, or landmark.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateFields()) return;

    setIsSubmitting(true);
    try {
      const bottleNum = activeOption ? extractBottleCount(activeOption.bottles) : null;
      const formattedItemName = formatProductNameWithBottles(activeItem.name, bottleNum, quantity);

      let orderItems: any[] = [];
      if (activeType === 'package') {
        const pkg = activeItem as PackageData;
        if (activeOption) {
          const optProds =
            'products' in activeOption && Array.isArray(activeOption.products)
              ? formatOptionProductList(activeOption.products)
              : [];
          orderItems = [
            {
              id: pkg.id,
              name: formatProductNameWithBottles(pkg.name, bottleNum, 1),
              bottles: activeOptionLabel,
              quantity,
              price_at_time: unitPrice,
              is_package: true,
              package_name: pkg.name,
              package_price: unitPrice,
              included_products: optProds,
            },
          ];
        } else {
          orderItems = (pkg.products || []).map((p) => ({
            id: p.id,
            name: p.name,
            quantity,
            price_at_time: p.price_naira * (1 - (p.discount_percent || 0) / 100),
            is_package: true,
            package_name: pkg.name,
            package_price: unitPrice,
          }));
        }
      } else {
        const prod = activeItem as Product;
        orderItems = [
          {
            id: prod.id,
            name: formatProductNameWithBottles(prod.name, bottleNum, 1),
            quantity,
            price_at_time: unitPrice,
            is_package: false,
          },
        ];
      }

      let activeToken = '';
      try {
        activeToken = localStorage.getItem('ght_access_token') || '';
        if (!activeToken) {
          activeToken =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                  const r = (Math.random() * 16) | 0;
                  const v = c === 'x' ? r : (r & 0x3) | 0x8;
                  return v.toString(16);
                });
          localStorage.setItem('ght_access_token', activeToken);
        }
      } catch {
        activeToken = `ght-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }

      const payload = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        delivery_address: `${streetAddress.trim()}, ${deliveryState}`,
        landmark: landmark.trim(),
        delivery_date: resolvedDeliveryDate,
        payment_method: paymentMethod,
        payment_receipt_url: paymentReceiptUrl,
        sender_name: senderName.trim(),
        items: orderItems,
        total_amount: totalPrice,
        distributor_id: distributorId || CONFIG.defaults.distributorId,
        ad_attribution: getStoredAdAttribution(),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': activeToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody.error ||
            'We could not submit your order right now. Please try again or order via WhatsApp.'
        );
      }

      trackOrderComplete(activeItem.name, totalPrice);
      setIsSuccess(true);

      if (onOrderSuccess) {
        onOrderSuccess(
          fullName.trim(),
          formattedItemName,
          quantity,
          totalPrice,
          resolvedDeliveryDate,
          paymentMethod
        );
      }
    } catch (err: any) {
      setSubmitError(
        err?.message ||
          'Network connection interrupted. Please try submitting again or tap WhatsApp below.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    trackWhatsAppClick(mode === 'modal' ? 'Ad Express Modal' : 'Ad Inline Form');
    const itemDisplay = formatOrderDisplayName(
      displayTitle,
      quantity,
      activeOption ? activeOptionLabel : undefined
    );
    const msg = `Hello ${CONFIG.company.name}, I would like to confirm my Pay-on-Delivery order for ${itemDisplay} (₦${totalPrice.toLocaleString()}).${
      fullName ? `\nName: ${fullName}` : ''
    }${deliveryState ? `\nLocation: ${streetAddress ? `${streetAddress}, ` : ''}${deliveryState}` : ''}`;
    openWhatsAppLink(CONFIG.whatsapp.number, msg);
  };

  const formBody = isSuccess ? (
    <div className="p-6 sm:p-10 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]">
          Order Confirmed — Dispatch Scheduled
        </h3>
        <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
          Thank you, <strong className="text-[#0F1F18]">{fullName}</strong>. Our dispatch
          coordinator will call <strong className="text-[#0F1F18]">{phoneNumber}</strong> shortly to
          arrange doorstep delivery in <strong className="text-[#0F1F18]">{deliveryState}</strong>.
        </p>
      </div>
      <div className="bg-[#F6F8F7] border border-[#DDE5E0] rounded-xl p-5 max-w-md mx-auto text-left text-sm sm:text-base space-y-2 tabular-nums">
        <div className="flex justify-between gap-3">
          <span className="text-slate-600">Selected Pack</span>
          <span className="font-semibold text-[#0F1F18] text-right">
            {displayTitle} {activeOptionLabel ? `(${activeOptionLabel})` : ''}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-600">Amount Due on Delivery</span>
          <span className="font-bold text-[#047857]">₦{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-600">Doorstep Delivery</span>
          <span className="font-semibold text-[#047857]">FREE (₦0)</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleWhatsAppConfirm}
          className="w-full sm:w-auto min-h-[52px] px-7 py-3.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span>Confirm Dispatch via WhatsApp</span>
        </button>
        {mode === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[52px] px-6 py-3.5 rounded-xl border border-[#CBD5CF] text-slate-700 hover:bg-slate-50 font-semibold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  ) : (
    <form onSubmit={handleSubmitOrder} noValidate className="divide-y divide-[#E4EBE7]">
      {/* Selected Item Studio Summary */}
      <div className="p-5 sm:p-7 bg-[#F6F8F7] space-y-5">
        {mode === 'inline' && allBundles.length > 0 && (
          <div>
            <label
              htmlFor="inline-bundle-select"
              className="block text-sm font-semibold text-[#0F1F18] mb-2"
            >
              Select Wellness Pack to Dispatch
            </label>
            <select
              id="inline-bundle-select"
              value={activeType === 'package' ? activeItem.id : ''}
              onChange={(e) => {
                const chosen = allBundles.find((b) => b.id === e.target.value);
                if (chosen) {
                  const defaultIdx =
                    chosen.options && chosen.options.length > 0
                      ? Math.max(
                          0,
                          chosen.options.findIndex((o) =>
                            o.bottles.toLowerCase().includes('3 bottle')
                          )
                        )
                      : 0;
                  setActiveItem(chosen);
                  setActiveType('package');
                  setActiveOptIdx(defaultIdx);
                  setImgStage('optimized');
                  onSelectBundle?.(chosen, defaultIdx);
                }
              }}
              className="w-full min-h-[52px] px-4 py-3 text-base font-semibold text-[#0F1F18] bg-white border border-[#CBD5CF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-[#047857]"
            >
              {activeType === 'product' && (
                <option value="">Single Supplement: {activeItem.name}</option>
              )}
              {allBundles.map((b) => (
                <option key={b.id} value={b.id}>
                  {sanitizeAdTitle(b.name)} {b.package_code ? `(${b.package_code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prominent Visual Product Preview in Modal & Mobile */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-5 ${
            mode === 'inline' ? 'lg:hidden' : ''
          }`}
        >
          <div className="relative w-full sm:w-44 h-44 rounded-xl bg-white border border-[#DDE5E0] shrink-0 overflow-hidden">
            {previewImageUrl && imgStage !== 'failed' ? (
              <div className="absolute inset-2 flex items-center justify-center">
                <img
                  src={previewImageUrl}
                  alt={displayTitle}
                  loading="eager"
                  decoding="async"
                  onError={() => {
                    if (imgStage === 'optimized' && rawImageUrl && optimizedImageUrl !== rawImageUrl) {
                      setImgStage('raw');
                    } else {
                      setImgStage('failed');
                    }
                  }}
                  className="max-w-full max-h-full w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <ShieldCheck className="w-8 h-8 text-[#047857] mb-1" />
                <span className="text-xs font-semibold text-slate-700">{displayTitle}</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full space-y-2 text-center sm:text-left">
            <div className="text-xs font-medium text-[#047857]">
              NAFDAC Registered · Free Doorstep Delivery · Pay on Delivery
            </div>
            <h4 className="text-xl sm:text-2xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] leading-snug">
              {displayTitle}
            </h4>
            <div className="text-2xl font-extrabold text-[#0F1F18] tabular-nums">
              ₦{totalPrice.toLocaleString()}
              {totalSavings > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-400 line-through">
                  ₦{totalRetail.toLocaleString()}
                </span>
              )}
            </div>
            {totalSavings > 0 && (
              <div className="text-xs font-semibold text-[#047857]">
                You Save ₦{totalSavings.toLocaleString()} ({computedPricing.discount}% Off)
              </div>
            )}
          </div>
        </div>

        {/* Desktop Inline Title + Quantity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className={mode === 'inline' ? 'hidden lg:block' : 'hidden'}>
            <div className="text-xs font-medium text-[#047857]">
              NAFDAC Registered · Inspect Seals Before Paying
            </div>
            <h4 className="text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)] mt-0.5">
              {displayTitle}
            </h4>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-700">Quantity (Packs):</span>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg border border-[#CBD5CF] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-800 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-bold text-lg text-[#0F1F18] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-lg border border-[#CBD5CF] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-800 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {itemOptions.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-sm font-semibold text-[#0F1F18]">
              Select Bottle Pack &amp; Discounted Price:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {itemOptions.map((opt, idx) => {
                const isSelected = idx === activeOptIdx;
                const optPriceInfo = resolveSingleOptionPricing(opt, parentDiscountPercent);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveOptIdx(idx);
                      trackAdBundleSelect(
                        displayTitle,
                        optPriceInfo.label,
                        optPriceInfo.sellingPrice
                      );
                      if (activeType === 'package') {
                        onSelectBundle?.(activeItem as PackageData, idx);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer tabular-nums ${
                      isSelected
                        ? 'border-[#047857] bg-white ring-2 ring-[#047857]'
                        : 'border-[#D5DFDA] bg-white/85 hover:bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-sm font-bold whitespace-nowrap ${
                          isSelected ? 'text-[#047857]' : 'text-[#0F1F18]'
                        }`}
                      >
                        {optPriceInfo.label}
                      </span>
                      {optPriceInfo.discountPercent > 0 && (
                        <span className="text-xs font-bold text-[#047857]">
                          -{optPriceInfo.discountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <div className="text-sm font-extrabold text-[#0F1F18]">
                        ₦{optPriceInfo.sellingPrice.toLocaleString()}
                      </div>
                      {optPriceInfo.savings > 0 && (
                        <div className="text-[11px] text-slate-400 line-through">
                          ₦{optPriceInfo.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {includedProducts.length > 0 && (
          <p className="text-sm text-slate-700 leading-relaxed pt-1">
            <strong className="text-[#0F1F18]">Included Bottles: </strong>
            {includedProducts.join(' · ')}
          </p>
        )}
      </div>

      {/* Customer Delivery Inputs */}
      <div className="p-5 sm:p-7 space-y-5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label
              htmlFor={`${mode}-full-name`}
              className="block text-sm font-semibold text-[#0F1F18] mb-1.5"
            >
              Recipient Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id={`${mode}-full-name`}
              type="text"
              autoComplete="name"
              placeholder="e.g. Chief Adebayo Ogunleye"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              className={`w-full min-h-[52px] px-4 py-3 text-base text-[#0F1F18] bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] ${
                fieldErrors.fullName ? 'border-red-500' : 'border-[#CBD5CF]'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${mode}-phone`}
              className="block text-sm font-semibold text-[#0F1F18] mb-1.5"
            >
              Active Phone / WhatsApp Number <span className="text-red-600">*</span>
            </label>
            <input
              id={`${mode}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 0803 123 4567"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (fieldErrors.phoneNumber)
                  setFieldErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              className={`w-full min-h-[52px] px-4 py-3 text-base text-[#0F1F18] bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] ${
                fieldErrors.phoneNumber ? 'border-red-500' : 'border-[#CBD5CF]'
              }`}
            />
            {fieldErrors.phoneNumber && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label
              htmlFor={`${mode}-state`}
              className="block text-sm font-semibold text-[#0F1F18] mb-1.5"
            >
              Delivery State <span className="text-red-600">*</span>
            </label>
            <select
              id={`${mode}-state`}
              value={deliveryState}
              onChange={(e) => setDeliveryState(e.target.value)}
              className="w-full min-h-[52px] px-4 py-3 text-base text-[#0F1F18] bg-white border border-[#CBD5CF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor={`${mode}-address`}
              className="block text-sm font-semibold text-[#0F1F18] mb-1.5"
            >
              House or Office Delivery Address <span className="text-red-600">*</span>
            </label>
            <input
              id={`${mode}-address`}
              type="text"
              autoComplete="street-address"
              placeholder="House number, street name, estate or area"
              value={streetAddress}
              onChange={(e) => {
                setStreetAddress(e.target.value);
                if (fieldErrors.streetAddress)
                  setFieldErrors((prev) => ({ ...prev, streetAddress: '' }));
              }}
              className={`w-full min-h-[52px] px-4 py-3 text-base text-[#0F1F18] bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] ${
                fieldErrors.streetAddress ? 'border-red-500' : 'border-[#CBD5CF]'
              }`}
            />
            {fieldErrors.streetAddress && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.streetAddress}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label
              htmlFor={`${mode}-landmark`}
              className="block text-sm font-semibold text-[#0F1F18] mb-1.5"
            >
              Nearest Bus-Stop / Landmark <span className="text-red-600">*</span>
            </label>
            <input
              id={`${mode}-landmark`}
              type="text"
              placeholder="e.g. Opposite Total Filling Station, Ikeja"
              value={landmark}
              onChange={(e) => {
                setLandmark(e.target.value);
                if (fieldErrors.landmark) setFieldErrors((prev) => ({ ...prev, landmark: '' }));
              }}
              className={`w-full min-h-[52px] px-4 py-3 text-base text-[#0F1F18] bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] ${
                fieldErrors.landmark ? 'border-red-500' : 'border-[#CBD5CF]'
              }`}
            />
            {fieldErrors.landmark && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.landmark}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F1F18] mb-1.5">
              Preferred Delivery Day
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'custom', label: 'Pick Date' },
                ] as const
              ).map((win) => (
                <button
                  key={win.id}
                  type="button"
                  onClick={() => setDeliveryWindow(win.id)}
                  className={`min-h-[52px] px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    deliveryWindow === win.id
                      ? 'border-[#047857] bg-[#EEF5F1] text-[#047857]'
                      : 'border-[#CBD5CF] bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {win.label}
                </button>
              ))}
            </div>
            {deliveryWindow === 'custom' && (
              <input
                type="date"
                min={getIsoDateOffset(0)}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-2.5 w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#0F1F18] bg-white border border-[#CBD5CF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            )}
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <span className="block text-sm font-semibold text-[#0F1F18]">Payment Method</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('pod')}
              className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                paymentMethod === 'pod'
                  ? 'border-[#047857] bg-[#F2F7F4] ring-1 ring-[#047857]'
                  : 'border-[#CBD5CF] bg-white hover:bg-slate-50'
              }`}
            >
              <Truck className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm sm:text-base font-bold text-[#0F1F18]">
                  Pay on Delivery (Recommended)
                </div>
                <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Inspect factory seals at your doorstep first, then pay via Transfer, POS, or Cash.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                paymentMethod === 'transfer'
                  ? 'border-[#047857] bg-[#F2F7F4] ring-1 ring-[#047857]'
                  : 'border-[#CBD5CF] bg-white hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm sm:text-base font-bold text-[#0F1F18]">
                  Direct Bank Transfer Now
                </div>
                <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Pay directly to official {CONFIG.company.name} corporate account.
                </div>
              </div>
            </button>
          </div>

          {paymentMethod === 'transfer' && (
            <div className="p-4 rounded-xl bg-[#F6F8F7] border border-[#DDE5E0] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    {bankSettings.bank_name}
                  </div>
                  <div className="text-lg font-bold text-[#0F1F18] tabular-nums">
                    {bankSettings.account_number}
                  </div>
                  <div className="text-xs font-medium text-slate-700">
                    {bankSettings.account_name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="px-4 py-2 rounded-lg border border-[#CBD5CF] bg-white hover:bg-slate-100 text-xs font-semibold text-[#0F1F18] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedBank ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#047857]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Account</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Sender Name on Transfer (Optional)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 text-sm text-[#0F1F18] bg-white border border-[#CBD5CF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]"
                />
                <label className="min-h-[48px] px-3.5 py-2.5 rounded-lg border border-dashed border-[#CBD5CF] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-[#047857] shrink-0" />
                  <span className="truncate">
                    {isUploading
                      ? 'Uploading receipt...'
                      : paymentReceiptUrl
                        ? 'Receipt Attached ✓'
                        : 'Attach Transfer Receipt (Optional)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
          )}
        </div>

        {/* Clean Unboxed Hairline Order Total Summary */}
        <div className="pt-4 border-t border-[#E4EBE7] space-y-2 tabular-nums">
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Regular Retail Value</span>
              <span className="line-through">₦{totalRetail.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base text-slate-600">
            <span>
              {displayTitle} {activeOptionLabel ? `(${activeOptionLabel})` : ''} × {quantity}
            </span>
            <span className="font-semibold text-[#0F1F18]">₦{totalPrice.toLocaleString()}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm text-[#047857] font-semibold">
              <span>Multi-Bottle Pack Savings ({computedPricing.discount}% Off)</span>
              <span>-₦{totalSavings.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base text-slate-600">
            <span>Nationwide Doorstep Delivery ({deliveryState})</span>
            <span className="font-semibold text-[#047857]">FREE (₦0)</span>
          </div>
          <div className="pt-3 border-t border-[#E4EBE7] flex justify-between items-baseline">
            <span className="text-base sm:text-lg font-bold text-[#0F1F18]">
              {paymentMethod === 'pod' ? 'Total Payable on Delivery' : 'Total Order Amount'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#047857]">
              ₦{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[58px] px-6 py-4 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white font-bold text-base sm:text-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer tabular-nums"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span>Scheduling Your Doorstep Dispatch...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  {paymentMethod === 'pod'
                    ? `Confirm Order — Pay ₦${totalPrice.toLocaleString()} on Delivery`
                    : `Submit Transfer Order — ₦${totalPrice.toLocaleString()}`}
                </span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 text-center">
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#047857]" />
              <span>Discreet Sealed Parcel</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Inspect NAFDAC Seals Before Payment</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleWhatsAppConfirm}
              className="text-[#047857] hover:text-[#065F46] font-semibold underline cursor-pointer"
            >
              Order via WhatsApp Instead
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  if (mode === 'inline') {
    return (
      <div className="bg-white border border-[#DDE5E0] rounded-2xl overflow-hidden">{formBody}</div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="express-pod-modal-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#DDE5E0] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-[#E4EBE7] flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3
              id="express-pod-modal-title"
              className="text-lg sm:text-xl font-bold text-[#0F1F18] font-[family-name:var(--font-editorial)]"
            >
              Express Doorstep Order
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              No online payment required · Inspect intact seals before paying
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close express checkout"
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto">{formBody}</div>
      </div>
    </div>
  );
};
