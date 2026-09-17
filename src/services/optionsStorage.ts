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

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "options_storage.json");

let memoryStore: StorageSchema = {
  products: {},
  recommended_packages: {}
};

function ensureInitialized() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      memoryStore = {
        products: parsed.products || {},
        recommended_packages: parsed.recommended_packages || {}
      };
    } else {
      saveToDisk();
    }
  } catch (err) {
    console.error("[OptionsStorage] Error loading storage file:", err);
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err) {
    console.error("[OptionsStorage] Error saving storage file:", err);
  }
}

// Initialize on module load
ensureInitialized();

export class OptionsStorage {
  /**
   * Save options for a product or recommended package to persistent disk and memory.
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

    const storedItem: StoredItem = {
      id: String(id),
      code: code ? String(code).trim() : undefined,
      name: name ? String(name).trim() : undefined,
      options: cleanedOptions,
      updated_at: new Date().toISOString()
    };

    memoryStore[normalizedTable][String(id)] = storedItem;
    if (code) {
      memoryStore[normalizedTable][`code_${String(code).trim().toLowerCase()}`] = storedItem;
    }

    saveToDisk();

    // Also persist as a fallback to Supabase 'settings' table if available
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
        } catch (e) {
          // Silently ignore settings fallback write errors
        }
      })();
    }
  }

  /**
   * Get options for a given product or package by ID or code.
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
      // Also search by code property
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
   * Seamlessly attach persistent options to a single item if missing from DB.
   */
  static attachOptionsToItem<T extends Record<string, any>>(
    table: "products" | "recommended_packages",
    item: T
  ): T {
    if (!item || typeof item !== "object") return item;

    // Check if the item already has populated options
    const existingOptions = item.options;
    if (Array.isArray(existingOptions) && existingOptions.length > 0) {
      // Sync into memoryStore so disk has the latest copy
      OptionsStorage.saveOptions(
        table,
        item.id,
        existingOptions,
        item.product_code || item.package_code,
        item.name
      );
      return item;
    }

    // Otherwise, retrieve from storage
    const storedOptions = OptionsStorage.getOptions(
      table,
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
