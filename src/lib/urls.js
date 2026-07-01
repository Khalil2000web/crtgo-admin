export function getPublicMenuUrl(businessSlug, branchSlug) {
  const base = import.meta.env.VITE_MENU_DOMAIN || "https://menu.crtgo.com";
  return `${base}/${businessSlug}/${branchSlug}`;
}