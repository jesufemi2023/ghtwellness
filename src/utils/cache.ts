/**
 * Utility for managing local storage caching and synchronization.
 */

const CACHE_KEYS = {
  PRODUCTS: "ght_cache_products",
  PACKAGES: "ght_cache_packages",
  LAST_SYNC: "ght_cache_last_sync",
  METADATA: "ght_cache_metadata"
};

// Revalidate in background after 5 minutes even if app_metadata wasn't manually bumped
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

function stripOversizedDataUrisForStorage(data: any): any {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;
    const copy = { ...item };
    if (typeof copy.package_image_url === "string" && copy.package_image_url.startsWith("data:") && copy.package_image_url.length > 150_000) {
      // Fallback to first product's URL in localStorage cache only if quota would be exceeded
      copy.package_image_url = copy.products?.[0]?.image_url || "";
    }
    if (typeof copy.image_url === "string" && copy.image_url.startsWith("data:") && copy.image_url.length > 150_000) {
      copy.image_url = "";
    }
    return copy;
  });
}

export const CacheService = {
  /**
   * Saves data to local storage with a timestamp.
   * Never caches empty arrays for product/package catalogs, and gracefully handles QuotaExceededError.
   */
  save: (key: string, data: any) => {
    if (
      (key === CACHE_KEYS.PRODUCTS || key === CACHE_KEYS.PACKAGES) &&
      (!Array.isArray(data) || data.length === 0)
    ) {
      return;
    }

    const payload = {
      data,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // Handle 5MB localStorage quota limit when a record contains a multi-megabyte base64 data URI
      try {
        const compactPayload = {
          data: stripOversizedDataUrisForStorage(data),
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(compactPayload));
      } catch (retryErr) {
        console.warn("Cache Save Skipped (Storage Quota):", retryErr);
      }
    }
  },

  /**
   * Retrieves data from local storage. Returns null for empty catalog arrays so fresh fetch always runs.
   */
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const payload = JSON.parse(item);
      if (
        (key === CACHE_KEYS.PRODUCTS || key === CACHE_KEYS.PACKAGES) &&
        (!Array.isArray(payload?.data) || payload.data.length === 0)
      ) {
        return null;
      }
      return payload.data;
    } catch (e) {
      console.error("Cache Get Error:", e);
      return null;
    }
  },

  /**
   * Checks whether a cached key is older than maxAgeMs (defaults to 5 minutes).
   */
  isStale: (key: string, maxAgeMs: number = DEFAULT_MAX_AGE_MS): boolean => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return true;
      const payload = JSON.parse(item);
      if (!payload?.timestamp) return true;
      return Date.now() - Number(payload.timestamp) > maxAgeMs;
    } catch {
      return true;
    }
  },

  /**
   * Checks if the local cache is valid by comparing with remote metadata and cache age.
   */
  isCacheValid: async (): Promise<boolean> => {
    try {
      if (
        CacheService.isStale(CACHE_KEYS.PRODUCTS) ||
        CacheService.isStale(CACHE_KEYS.PACKAGES)
      ) {
        return false;
      }

      const res = await fetch("/api/sync-check");
      if (!res.ok) return false;

      const remoteMetadata = await res.json();
      const localMetadataStr = localStorage.getItem(CACHE_KEYS.METADATA);

      if (!localMetadataStr) {
        localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(remoteMetadata));
        return false;
      }

      const localMetadata = JSON.parse(localMetadataStr);

      if (remoteMetadata.last_updated !== localMetadata.last_updated) {
        localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(remoteMetadata));
        return false;
      }

      return true;
    } catch (e) {
      console.error("Sync Check Error:", e);
      return false;
    }
  },

  KEYS: CACHE_KEYS
};
