export const cleanDomain = (raw) => {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/g, "")
    .toLowerCase();
};

export const generateEmbedCode = (domain) => {
  const d = cleanDomain(domain) || "YOUR_DOMAIN_HERE";
  return `<script>!function(){var s=document.createElement("script");s.src="https://cdn.swiftimpactsolutions.com/ada/loader.js";s.setAttribute("data-domain","${d}");s.async=!0;document.body.appendChild(s)}();</script>`;
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
