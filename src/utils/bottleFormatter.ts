/**
 * Utility functions for formatting product names with quantity and bottle counts.
 * E.g., '1x Reodoe' with 3 bottles -> '1x Reodoe(3)'
 */

/**
 * Extracts a numeric or clean bottle count from a bottle string or number.
 * E.g., '3 Bottles' -> 3, '1 Bottle' -> 1, '2 Bottles (Full Month)' -> 2, 3 -> 3
 */
export function extractBottleCount(bottlesStr?: string | number | null): number | string | null {
  if (bottlesStr === undefined || bottlesStr === null || bottlesStr === '') return null;
  if (typeof bottlesStr === 'number') return bottlesStr;
  
  const str = String(bottlesStr).trim();
  const match = str.match(/\b(\d+)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return str;
}

/**
 * Formats a single product name with a quantity prefix and bottle count suffix.
 * E.g.
 * - ('Reodoe', '3 Bottles', 1) => '1x Reodoe(3)'
 * - ('1x Reodoe', '3 Bottles') => '1x Reodoe(3)'
 * - ('1x Reodoe(3)', '3 Bottles') => '1x Reodoe(3)'
 * - ('Reodoe (3 Bottles)', null, 1) => '1x Reodoe(3)'
 */
export function formatProductNameWithBottles(
  productName: string,
  bottleCountOrOption?: string | number | null,
  quantity: number = 1
): string {
  if (!productName) return '';

  let name = String(productName).trim();
  let explicitQuantity = quantity;

  // Check if productName already starts with a quantity prefix like '1x ' or '2x '
  const qtyMatch = name.match(/^(\d+)\s*x\s*(.+)$/i);
  if (qtyMatch) {
    explicitQuantity = parseInt(qtyMatch[1], 10) || quantity;
    name = qtyMatch[2].trim();
  }

  // Check if name already has a bottle number suffix like '(3)' or '(3 Bottles)' or '(3 bottles)'
  const bottleMatch = name.match(/\s*\((?:(\d+)\s*(?:bottles?)?|([^)]+))\)$/i);
  let bottleCount = extractBottleCount(bottleCountOrOption);

  if (bottleMatch) {
    // If the name already had '(3)' or '(3 Bottles)', use that bottle count if none provided
    if (!bottleCount) {
      bottleCount = bottleMatch[1] ? parseInt(bottleMatch[1], 10) : bottleMatch[2];
    }
    // Remove the trailing parentheses from the base name so we can reformat cleanly
    name = name.replace(/\s*\([^)]+\)$/, '').trim();
  }

  const bottleSuffix = bottleCount !== null && bottleCount !== undefined ? `(${bottleCount})` : '';
  const qtyPrefix = explicitQuantity ? `${explicitQuantity}x ` : '';

  return `${qtyPrefix}${name}${bottleSuffix}`;
}

/**
 * Formats an array of included products for a package or package option.
 * E.g., ['1x Reodoe', '1x Prostbeta'] with '3 Bottles' -> ['1x Reodoe(3)', '1x Prostbeta(3)']
 */
export function formatOptionProductList(
  products: string[],
  optionBottles?: string | number | null
): string[] {
  if (!Array.isArray(products)) return [];
  const bottleCount = extractBottleCount(optionBottles);

  return products.map((p) => {
    if (!p) return '';
    return formatProductNameWithBottles(p, bottleCount, 1);
  });
}

/**
 * Formats an item title for order receipts, WhatsApp messages, and notifications.
 * E.g., ('Reodoe', 1, '3 Bottles') => '1x Reodoe(3)'
 */
export function formatOrderDisplayName(
  itemName: string,
  quantity: number = 1,
  optionBottles?: string | number | null
): string {
  return formatProductNameWithBottles(itemName, optionBottles, quantity);
}
