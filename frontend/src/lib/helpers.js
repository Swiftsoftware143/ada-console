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
