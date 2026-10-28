/**
 * Utility for Cloudinary & remote image URL handling.
 * Safely preserves Supabase Storage URLs, data URIs, and already-transformed Cloudinary URLs.
 */

export const getOptimizedImageUrl = (url: string, width: number = 800): string => {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Pass data URIs and Supabase Storage URLs directly without mutation
  if (trimmed.startsWith("data:") || trimmed.includes("supabase.co")) {
    return trimmed;
  }

  // Safely optimize standard Cloudinary upload URLs without double-injecting transformations
  if (trimmed.includes("cloudinary.com") && trimmed.includes("/upload/")) {
    const parts = trimmed.split("/upload/");
    if (parts.length === 2) {
      const rest = parts[1];
      // Only inject if the segment after /upload/ doesn't already contain transformations (e.g. f_auto, w_, c_)
      const firstSegment = rest.split("/")[0] || "";
      const alreadyTransformed =
        firstSegment.includes(",") ||
        /^(f_|q_|w_|h_|c_|ar_|g_|e_)/.test(firstSegment);

      if (!alreadyTransformed) {
        return `${parts[0]}/upload/f_auto,q_auto,w_${width}/${rest}`;
      }
      return trimmed;
    }
  }

  // Optimize Picsum placeholder URLs if ever used
  if (trimmed.includes("picsum.photos")) {
    const parts = trimmed.split("/");
    if (parts.length >= 6) {
      parts[parts.length - 2] = width.toString();
      parts[parts.length - 1] = Math.round(width * 0.75).toString();
      return parts.join("/");
    }
  }

  return trimmed;
};
