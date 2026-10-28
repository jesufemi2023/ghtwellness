import { PackageData, Product } from '../types';
import { formatOptionProductList } from './bottleFormatter';

export interface ResolvedOptionPrice {
  label: string;
  sellingPrice: number;
  originalPrice: number;
  discountPercent: number;
  savings: number;
}

/**
 * Normalizes bottle option labels (fixes minor DB typos such as "Bootles" -> "Bottles"
 * and provides a sensible "1 Bottle" label if blank).
 */
export function cleanBottleLabel(rawLabel?: string): string {
  if (!rawLabel || !rawLabel.trim()) return '1 Bottle';
  return rawLabel
    .trim()
    .replace(/bootles/gi, 'Bottles')
    .replace(/bootle/gi, 'Bottle');
}

/**
 * Computes discounted selling price, crossed-out original retail price, and discount percentage
 * for a single bottle option.
 *
 * Rules matching AdminDashboard & Supabase package records:
 * 1. If `opt.discount > 0` was explicitly entered on the option, `opt.price` is the base price
 *    and `sellingPrice = round(opt.price * (1 - opt.discount / 100))`.
 * 2. If `opt.discount` is omitted/0 while the parent package/product has `parentDiscount > 0`
 *    (e.g., P001 15% off where 3 Bottles `opt.price = 59500` vs `pkg.price = 70000`),
 *    `opt.price` is already the discounted customer selling price, and its pre-discount retail
 *    value is `round((opt.price / (1 - parentDiscount / 100)) / 100) * 100`.
 */
export function resolveSingleOptionPricing(
  opt: { bottles?: string; price: number; discount?: number },
  parentDiscountPercent: number = 0
): ResolvedOptionPrice {
  const rawPrice = Number(opt.price) || 0;
  const explicitOptDiscount = Number(opt.discount) || 0;
  const fallbackParentDiscount =
    parentDiscountPercent > 0 && parentDiscountPercent < 95 ? Number(parentDiscountPercent) : 0;

  if (explicitOptDiscount > 0 && explicitOptDiscount < 95) {
    const sellingPrice = Math.round(rawPrice * (1 - explicitOptDiscount / 100));
    const originalPrice = rawPrice;
    return {
      label: cleanBottleLabel(opt.bottles),
      sellingPrice,
      originalPrice,
      discountPercent: explicitOptDiscount,
      savings: Math.max(0, originalPrice - sellingPrice),
    };
  }

  if (fallbackParentDiscount > 0 && rawPrice > 0) {
    const sellingPrice = rawPrice;
    const rawOriginal = sellingPrice / (1 - fallbackParentDiscount / 100);
    const originalPrice = Math.max(sellingPrice, Math.round(rawOriginal / 100) * 100);
    return {
      label: cleanBottleLabel(opt.bottles),
      sellingPrice,
      originalPrice,
      discountPercent: fallbackParentDiscount,
      savings: Math.max(0, originalPrice - sellingPrice),
    };
  }

  return {
    label: cleanBottleLabel(opt.bottles),
    sellingPrice: rawPrice,
    originalPrice: rawPrice,
    discountPercent: 0,
    savings: 0,
  };
}

export function computePackagePricing(pkg: PackageData, optIdx: number) {
  const activeOption =
    pkg.options && pkg.options.length > 0
      ? pkg.options[Math.min(Math.max(0, optIdx), pkg.options.length - 1)] || pkg.options[0]
      : null;

  const pkgDiscount = Number(pkg.discount) || 0;

  let currentPrice = 0;
  let retailPrice = 0;
  let discount = 0;

  if (activeOption) {
    const resolved = resolveSingleOptionPricing(activeOption, pkgDiscount);
    currentPrice = resolved.sellingPrice;
    retailPrice = resolved.originalPrice;
    discount = resolved.discountPercent;
  } else {
    retailPrice = Number(pkg.price) || 0;
    discount = pkgDiscount;
    currentPrice =
      discount > 0 ? Math.round(retailPrice * (1 - discount / 100)) : retailPrice;
  }

  const savings = Math.max(0, retailPrice - currentPrice);

  const includedList =
    activeOption && Array.isArray(activeOption.products) && activeOption.products.length > 0
      ? formatOptionProductList(activeOption.products)
      : (pkg.products || []).map((p) => p.name);

  return {
    activeOption,
    discount,
    retailPrice,
    currentPrice,
    savings,
    includedList,
  };
}

export function computeProductPricing(prod: Product, optIdx: number) {
  const activeOption =
    prod.options && prod.options.length > 0
      ? prod.options[Math.min(Math.max(0, optIdx), prod.options.length - 1)] || prod.options[0]
      : null;

  const prodDiscount = Number(prod.discount_percent) || 0;

  if (activeOption) {
    const resolved = resolveSingleOptionPricing(activeOption, prodDiscount);
    return {
      activeOption,
      discount: resolved.discountPercent,
      retailPrice: resolved.originalPrice,
      currentPrice: resolved.sellingPrice,
      savings: resolved.savings,
    };
  }

  const retailPrice = Number(prod.price_naira) || 0;
  const discount = prodDiscount;
  const currentPrice =
    discount > 0 ? Math.round(retailPrice * (1 - discount / 100)) : retailPrice;

  return {
    activeOption: null,
    discount,
    retailPrice,
    currentPrice,
    savings: Math.max(0, retailPrice - currentPrice),
  };
}
