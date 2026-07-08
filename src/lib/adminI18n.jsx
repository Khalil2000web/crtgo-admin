import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ADMIN_LANGUAGES = {
  en: {
    code: "en",
    label: "English",
    short: "EN",
    dir: "ltr",
  },
  ar: {
    code: "ar",
    label: "العربية",
    short: "AR",
    dir: "rtl",
  },
};

const DICTIONARY = {
  en: {
    "brand.admin": "Admin",

    "nav.businesses": "Businesses",
    "nav.account": "Account",
    "nav.settings": "Settings",
    "nav.help": "Help Center",
    "nav.ownerConsole": "Owner Console",
    "nav.logout": "Log out",

    "common.loading": "Loading...",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.open": "Open",

    "header.language": "Language",
  },

  ar: {
    "brand.admin": "لوحة التحكم",

    "nav.businesses": "المطاعم",
    "nav.account": "الحساب",
    "nav.settings": "الإعدادات",
    "nav.help": "مركز المساعدة",
    "nav.ownerConsole": "لوحة المالك",
    "nav.logout": "تسجيل الخروج",

    "common.loading": "جارٍ التحميل...",
    "common.save": "حفظ",
    "common.delete": "حذف",
    "common.cancel": "إلغاء",
    "common.edit": "تعديل",
    "common.open": "فتح",

    "header.language": "اللغة",
  },
};

const AdminI18nContext = createContext(null);

function getInitialLanguage() {
  if (typeof window === "undefined") return "en";

  const saved = localStorage.getItem("crtgo-admin-language");

  if (saved && ADMIN_LANGUAGES[saved]) {
    return saved;
  }

  return "en";
}

export function AdminI18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const meta = ADMIN_LANGUAGES[language] || ADMIN_LANGUAGES.en;

  useEffect(() => {
    localStorage.setItem("crtgo-admin-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = meta.dir;
  }, [language, meta.dir]);

  function setLanguage(nextLanguage) {
    if (!ADMIN_LANGUAGES[nextLanguage]) return;
    setLanguageState(nextLanguage);
  }

  function t(key, fallback = key) {
    return DICTIONARY[language]?.[key] || DICTIONARY.en?.[key] || fallback;
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      meta,
      dir: meta.dir,
      languages: Object.values(ADMIN_LANGUAGES),
      t,
    }),
    [language, meta]
  );

  return (
    <AdminI18nContext.Provider value={value}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  const context = useContext(AdminI18nContext);

  if (!context) {
    throw new Error("useAdminI18n must be used inside AdminI18nProvider");
  }

  return context;
}