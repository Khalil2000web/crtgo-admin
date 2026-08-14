function getPublicMenuBaseUrl() {
  const value =
    import.meta.env.VITE_PUBLIC_MENU_BASE_URL ||
    import.meta.env.VITE_MENU_PUBLIC_BASE_URL ||
    "https://menu.crtrgo.com";

  return String(value).replace(/\/+$/, "");
}

export async function loadMenuTemplates() {
  const response = await fetch(
    `${getPublicMenuBaseUrl()}/api/menu-templates`
  );

  if (!response.ok) {
    throw new Error("Failed to load menu templates.");
  }

  const data = await response.json();

  return Array.isArray(data?.templates) ? data.templates : [];
}

export function normalizeTemplateId(value, templates = []) {
  const cleanValue = String(value || "classic")
    .trim()
    .toLowerCase();

  const directMatch = templates.find(
    (template) => template.id === cleanValue
  );

  if (directMatch) {
    return directMatch.id;
  }

  const aliasMatch = templates.find((template) =>
    template.aliases?.includes(cleanValue)
  );

  return aliasMatch?.id || "classic";
}