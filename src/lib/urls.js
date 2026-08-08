export function getPublicProjectUrl(slug) {
  const cleanSlug = String(slug || "")
    .trim()
    .toLowerCase();

  if (!cleanSlug) {
    return "";
  }

  const domain =
    import.meta.env.VITE_PUBLIC_SITE_DOMAIN ||
    "w.crtgo.com";

  if (domain.includes("localhost")) {
    return `http://${cleanSlug}.${domain}`;
  }

  return `https://${cleanSlug}.${domain}`;
}