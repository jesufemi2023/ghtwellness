import fs from "fs";
import path from "path";

export interface BottleOption {
  bottles: string;
  price: number;
  discount?: number;
  products?: string[];
}

interface StoredItem {
  id: string;
  code?: string;
  name?: string;
  options: BottleOption[];
  updated_at: string;
}

interface StorageSchema {
  products: Record<string, StoredItem>;
  recommended_packages: Record<string, StoredItem>;
}

const IS_VERCEL = Boolean(process.env.VERCEL);
const SEED_STORAGE_FILE = path.resolve(process.cwd(), "data", "options_storage.json");
const WRITABLE_DATA_DIR = IS_VERCEL ? "/tmp" : path.resolve(process.cwd(), "data");
const WRITABLE_STORAGE_FILE = path.join(WRITABLE_DATA_DIR, "options_storage.json");

let memoryStore: StorageSchema = {
  products: {},
  recommended_packages: {}
};

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  try {
    // 1. Load bundled seed file first (works on both local dev and Vercel read-only /var/task/data)
    if (fs.existsSync(SEED_STORAGE_FILE)) {
      const raw = fs.readFileSync(SEED_STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      memoryStore = {
        products: { ...(parsed.products || {}) },
        recommended_packages: { ...(parsed.recommended_packages || {}) }
      };
    }

    // 2. Overlay any runtime writes stored in /tmp on Vercel (or local data dir)
    if (WRITABLE_STORAGE_FILE !== SEED_STORAGE_FILE && fs.existsSync(WRITABLE_STORAGE_FILE)) {
      const runtimeRaw = fs.readFileSync(WRITABLE_STORAGE_FILE, "utf-8");
      const runtimeParsed = JSON.parse(runtimeRaw);
      memoryStore = {
        products: { ...memoryStore.products, ...(runtimeParsed.products || {}) },
        recommended_packages: {
          ...memoryStore.recommended_packages,
          ...(runtimeParsed.recommended_packages || {})
        }
      };
    } else if (!IS_VERCEL && !fs.existsSync(SEED_STORAGE_FILE)) {
      saveToDisk();
    }
  } catch (err) {
    console.error("[OptionsStorage] Error loading storage file:", err);
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(WRITABLE_DATA_DIR)) {
      fs.mkdirSync(WRITABLE_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WRITABLE_STORAGE_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err) {
    console.error("[OptionsStorage] Error saving storage file:", err);
  }
}

function cacheInMemoryOnly(
  table: "products" | "recommended_packages",
  id: string,
  options: BottleOption[],
  code?: string,
  name?: string
) {
  if (!id) return;
  const storedItem: StoredItem = {
    id: String(id),
    code: code ? String(code).trim() : undefined,
    name: name ? String(name).trim() : undefined,
    options,
    updated_at: new Date().toISOString()
  };
  memoryStore[table][String(id)] = storedItem;
  if (code) {
    memoryStore[table][`code_${String(code).trim().toLowerCase()}`] = storedItem;
  }
}

// Initialize on module load
ensureInitialized();

export class OptionsStorage {
  /**
   * Save options for a product or recommended package to writable disk, memory, and Supabase settings backup.
   */
  static saveOptions(
    table: "products" | "recommended_packages",
    id: string,
    options: BottleOption[],
    code?: string,
    name?: string,
    supabaseClient?: any
  ): void {
    if (!id) return;
    ensureInitialized();

    const normalizedTable = table === "products" ? "products" : "recommended_packages";
    const cleanedOptions: BottleOption[] = Array.isArray(options) ? options : [];

    cacheInMemoryOnly(normalizedTable, id, cleanedOptions, code, name);
    saveToDisk();

    // Persist as a cloud backup to Supabase 'settings' table if available
    if (supabaseClient) {
      (async () => {
        try {
          const settingKey = `options_${normalizedTable}_${id}`;
          await supabaseClient.from("settings").upsert([
            {
              key: settingKey,
              value: JSON.stringify(cleanedOptions)
            }
          ]);
        } catch {
          // Silently ignore settings fallback write errors
        }
      })();
    }
  }

  /**
   * Get options for a given product or package by ID, code, or name.
   */
  static getOptions(
    table: "products" | "recommended_packages",
    id?: string,
    code?: string,
    name?: string
  ): BottleOption[] | null {
    ensureInitialized();
    const normalizedTable = table === "products" ? "products" : "recommended_packages";
    const tableData = memoryStore[normalizedTable] || {};

    if (id && tableData[String(id)] && tableData[String(id)].options) {
      return tableData[String(id)].options;
    }

    if (code) {
      const codeKey = `code_${String(code).trim().toLowerCase()}`;
      if (tableData[codeKey] && tableData[codeKey].options) {
        return tableData[codeKey].options;
      }
      for (const key in tableData) {
        const item = tableData[key];
        if (item.code && item.code.toLowerCase() === String(code).trim().toLowerCase()) {
          return item.options;
        }
      }
    }

    if (name) {
      for (const key in tableData) {
        const item = tableData[key];
        if (item.name && item.name.toLowerCase() === String(name).trim().toLowerCase()) {
          return item.options;
        }
      }
    }

    return null;
  }

  /**
   * Delete options for an item.
   */
  static deleteOptions(table: "products" | "recommended_packages", id: string): void {
    if (!id) return;
    ensureInitialized();
    const normalizedTable = table === "products" ? "products" : "recommended_packages";
    if (memoryStore[normalizedTable]) {
      delete memoryStore[normalizedTable][String(id)];
      saveToDisk();
    }
  }

  /**
   * Seamlessly attach persistent options to an array of items if missing from DB.
   */
  static attachOptionsToItems<T extends Record<string, any>>(
    table: "products" | "recommended_packages",
    items: T[]
  ): T[] {
    if (!Array.isArray(items)) return items;
    ensureInitialized();

    return items.map((item) => OptionsStorage.attachOptionsToItem(table, item));
  }

  /**
   * Seamlessly attach persistent options to a single item without writing to disk on read requests.
   */
  static attachOptionsToItem<T extends Record<string, any>>(
    table: "products" | "recommended_packages",
    item: T
  ): T {
    if (!item || typeof item !== "object") return item;
    ensureInitialized();

    const normalizedTable = table === "products" ? "products" : "recommended_packages";
    const existingOptions = item.options;
    if (Array.isArray(existingOptions)) {
      cacheInMemoryOnly(
        normalizedTable,
        item.id,
        existingOptions,
        item.product_code || item.package_code,
        item.name
      );
      return item;
    }

    const storedOptions = OptionsStorage.getOptions(
      normalizedTable,
      item.id,
      item.product_code || item.package_code,
      item.name
    );

    if (storedOptions && storedOptions.length > 0) {
      return {
        ...item,
        options: storedOptions
      };
    }

    return {
      ...item,
      options: item.options || []
    };
  }
}
