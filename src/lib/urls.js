const DEFAULT_PUBLIC_MENU_BASE_URL =
  "https://menu.crtrgo.com";


function normalizeBaseUrl(
  value
) {
  const baseUrl =
    String(
      value ||
        DEFAULT_PUBLIC_MENU_BASE_URL
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );


  if (
    baseUrl.startsWith(
      "http://"
    ) ||
    baseUrl.startsWith(
      "https://"
    )
  ) {
    return baseUrl;
  }


  if (
    baseUrl.includes(
      "localhost"
    )
  ) {
    return `http://${baseUrl}`;
  }


  return `https://${baseUrl}`;
}


export function getPublicProjectUrl(
  slug
) {
  const cleanSlug =
    String(
      slug ||
        ""
    )
      .trim()
      .toLowerCase();


  if (
    !cleanSlug
  ) {
    return "";
  }


  const baseUrl =
    normalizeBaseUrl(
      import.meta.env
        .VITE_PUBLIC_MENU_BASE_URL
    );


  return `${baseUrl}/${encodeURIComponent(
    cleanSlug
  )}`;
}