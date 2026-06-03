import { supabase } from "@/lib/supabase";

export const cleanDomain = (raw) => {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/g, "")
    .toLowerCase();
};

// Cache for CDN domain to avoid repeated API calls
let cachedCdnDomain = null;
let cachedCdnDomainExpiry = null;
const CACHE_DURATION_MS = 60000; // 1 minute cache

export const getCdnDomain = async () => {
  // Return cached value if still valid
  if (cachedCdnDomain && cachedCdnDomainExpiry && Date.now() < cachedCdnDomainExpiry) {
    return cachedCdnDomain;
  }

  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "cdn_domain")
      .maybeSingle();

    if (error || !data) {
      // Fallback to default if settings table doesn't exist or no value
      cachedCdnDomain = "https://adaswift.netlify.app";
    } else {
      cachedCdnDomain = data.value;
    }
  } catch (e) {
    // Fallback on any error
    cachedCdnDomain = "https://adaswift.netlify.app";
  }

  cachedCdnDomainExpiry = Date.now() + CACHE_DURATION_MS;
  return cachedCdnDomain;
};

// Synchronous version for components that can't use async (uses cached value)
export const getCachedCdnDomain = () => {
  return cachedCdnDomain || "https://adaswift.netlify.app";
};

// Preload the CDN domain on app init
export const preloadCdnDomain = async () => {
  await getCdnDomain();
};

export const generateEmbedCode = (domain, cdnDomain) => {
  const d = cleanDomain(domain) || "YOUR_DOMAIN_HERE";
  // Use provided CDN domain, or fall back to cached, then default
  const cdn = cdnDomain || getCachedCdnDomain();
  return `<script>!function(){var s=document.createElement("script");s.src="${cdn}/loader.js?v=2";s.setAttribute("data-domain","${d}");s.async=!0;document.body.appendChild(s)}();</script>`;
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export const isThisMonth = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCFullYear() === now.getUTCFullYear()
  );
};

export const sortByKey = (list, key, dir) => {
  return [...list].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const cmp = av > bv ? 1 : -1;
    return dir === "asc" ? cmp : -cmp;
  });
};

export const filterClients = (list, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.name?.toLowerCase().includes(q) ||
      c.domain?.toLowerCase().includes(q) ||
      c.plan_tier?.toLowerCase().includes(q)
  );
};
