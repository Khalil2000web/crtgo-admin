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
    
    
    "dashboard.eyebrow": "Workspace",
"dashboard.title": "Businesses",
"dashboard.subtitle": "Manage every client, branch, and menu from one clean workspace.",
"dashboard.refresh": "Refresh",

"dashboard.ownerConsole": "Owner Console",
"dashboard.ownerConsoleText": "Manage billing, clients, notes, prices, and limits.",
"dashboard.open": "Open",

"dashboard.newBusiness": "New Business",
"dashboard.businesses": "Businesses",
"dashboard.branches": "Branches",
"dashboard.status": "Status",
"dashboard.activeWorkspace": "Active workspace",

"dashboard.searchPlaceholder": "Search businesses, branches, URLs...",
"dashboard.noResults": "No results found",
"dashboard.noResultsText": "Try searching with another business name, branch, or slug.",
"dashboard.createFirstBusiness": "Create your first business",
"dashboard.createFirstBusinessText": "CRTGO will create a business, a main branch, and a starter menu automatically.",

"dashboard.menu": "Menu",
"dashboard.mainMenu": "Main Menu",
"dashboard.openBusiness": "Open business",

"dashboard.newBusinessInfo": "CRTGO will also create the first branch and menu.",
"dashboard.businessName": "Business name",
"dashboard.businessSlug": "Business slug",
"dashboard.businessSlugHint": "This becomes the public URL.",
"dashboard.description": "Description",
"dashboard.branchName": "Branch name",
"dashboard.branchSlug": "Branch slug",
"dashboard.phone": "Phone",
"dashboard.whatsapp": "WhatsApp",
"dashboard.instagram": "Instagram",
"dashboard.creating": "Creating...",
"dashboard.createBusiness": "Create Business",

"status.active": "Active",
"status.archived": "Archived",
"status.paused": "Paused",
"status.trial": "Trial",
"status.past_due": "Past due",
"status.canceled": "Canceled",



"business.backToBusinesses": "Back to businesses",
"business.eyebrow": "Business",
"business.fallbackDescription": "Manage branches and menus.",
"business.public": "Public",
"business.settings": "Business Settings",
"business.editBusiness": "Edit Business",
"business.newBranch": "New Branch",
"business.branches": "Branches",
"business.active": "Active",
"business.status": "Status",
"business.menu": "Menu",
"business.template": "Template",
"business.languages": "Languages",
"business.qrScans": "QR scans",
"business.main": "Main",
"business.locked": "Locked",
"business.qrOn": "QR on",
"business.qrOff": "QR off",
"business.editMenu": "Edit Menu",
"business.appearance": "Appearance",
"business.qrCode": "QR Code",
"business.publicMenuLocked": "Public Menu Locked",
"business.openPublicMenu": "Open Public Menu",
"business.noBranches": "No branches yet",

"business.subscriptionLocked": "Subscription locked",
"business.billingError": "Billing error",
"business.branchLimitReached": "Branch limit reached",
"business.businessArchived": "Business archived",
"business.businessArchivedText": "This business is archived. Restore it from Business Settings before using it publicly.",

"business.settingsTitle": "Business Settings",
"business.editingLocked": "Business editing locked",
"business.businessName": "Business name",
"business.businessSlug": "Business slug",
"business.description": "Description",
"business.landingMode": "Landing mode",
"business.showBranchSelector": "Show branch selector page",
"business.redirectMainBranch": "Redirect to main branch",
"business.logo": "Business logo",
"business.logoHint": "This logo appears on the public business landing page.",
"business.cover": "Landing cover image",
"business.coverHint": "This cover appears on the branch selector page.",
"business.savingBusiness": "Saving business...",
"business.saveBusiness": "Save Business",
"business.restoring": "Restoring...",
"business.archiving": "Archiving...",
"business.restoreBusiness": "Restore Business",
"business.archiveBusiness": "Archive Business",
"business.dangerZone": "Danger zone",
"business.dangerText": "Deleting a business removes all branches, menus, sections, items, billing notes, and subscription history connected to it.",
"business.deleting": "Deleting...",
"business.deleteForever": "Delete Business Forever",

"branch.cannotCreate": "Cannot create branch",
"branch.name": "Branch name",
"branch.slug": "Branch slug",
"branch.address": "Address",
"branch.phone": "Phone",
"branch.whatsapp": "WhatsApp",
"branch.instagram": "Instagram",
"branch.creating": "Creating...",
"branch.create": "Create Branch",
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
    
    
    "dashboard.eyebrow": "مساحة العمل",
"dashboard.title": "المطاعم",
"dashboard.subtitle": "إدارة كل عميل، فرع، وقائمة من لوحة واحدة مرتبة.",
"dashboard.refresh": "تحديث",

"dashboard.ownerConsole": "لوحة المالك",
"dashboard.ownerConsoleText": "إدارة الاشتراكات، العملاء، الملاحظات، الأسعار، والحدود.",
"dashboard.open": "فتح",

"dashboard.newBusiness": "مطعم جديد",
"dashboard.businesses": "المطاعم",
"dashboard.branches": "الفروع",
"dashboard.status": "الحالة",
"dashboard.activeWorkspace": "مساحة عمل نشطة",

"dashboard.searchPlaceholder": "ابحث عن مطعم، فرع، أو رابط...",
"dashboard.noResults": "لا توجد نتائج",
"dashboard.noResultsText": "جرّب البحث باسم مطعم، فرع، أو رابط آخر.",
"dashboard.createFirstBusiness": "أنشئ أول مطعم",
"dashboard.createFirstBusinessText": "سيقوم CRTGO بإنشاء المطعم، الفرع الرئيسي، وقائمة مبدئية تلقائيًا.",

"dashboard.menu": "القائمة",
"dashboard.mainMenu": "القائمة الرئيسية",
"dashboard.openBusiness": "فتح المطعم",

"dashboard.newBusinessInfo": "سيقوم CRTGO أيضًا بإنشاء أول فرع وقائمة.",
"dashboard.businessName": "اسم المطعم",
"dashboard.businessSlug": "رابط المطعم",
"dashboard.businessSlugHint": "هذا سيكون جزءًا من الرابط العام.",
"dashboard.description": "الوصف",
"dashboard.branchName": "اسم الفرع",
"dashboard.branchSlug": "رابط الفرع",
"dashboard.phone": "الهاتف",
"dashboard.whatsapp": "واتساب",
"dashboard.instagram": "إنستغرام",
"dashboard.creating": "جارٍ الإنشاء...",
"dashboard.createBusiness": "إنشاء المطعم",

"status.active": "نشط",
"status.archived": "مؤرشف",
"status.paused": "متوقف",
"status.trial": "تجريبي",
"status.past_due": "متأخر",
"status.canceled": "ملغي",



"business.backToBusinesses": "الرجوع للمطاعم",
"business.eyebrow": "مطعم",
"business.fallbackDescription": "إدارة الفروع والقوائم.",
"business.public": "عام",
"business.settings": "إعدادات المطعم",
"business.editBusiness": "تعديل المطعم",
"business.newBranch": "فرع جديد",
"business.branches": "الفروع",
"business.active": "نشط",
"business.status": "الحالة",
"business.menu": "القائمة",
"business.template": "القالب",
"business.languages": "اللغات",
"business.qrScans": "مسحات QR",
"business.main": "رئيسي",
"business.locked": "مقفل",
"business.qrOn": "QR مفعل",
"business.qrOff": "QR متوقف",
"business.editMenu": "تعديل القائمة",
"business.appearance": "المظهر",
"business.qrCode": "رمز QR",
"business.publicMenuLocked": "القائمة العامة مقفلة",
"business.openPublicMenu": "فتح القائمة العامة",
"business.noBranches": "لا توجد فروع بعد",

"business.subscriptionLocked": "الاشتراك مقفل",
"business.billingError": "خطأ في الاشتراك",
"business.branchLimitReached": "تم الوصول لحد الفروع",
"business.businessArchived": "المطعم مؤرشف",
"business.businessArchivedText": "هذا المطعم مؤرشف. قم باستعادته من إعدادات المطعم قبل ظهوره للعامة.",

"business.settingsTitle": "إعدادات المطعم",
"business.editingLocked": "تعديل المطعم مقفل",
"business.businessName": "اسم المطعم",
"business.businessSlug": "رابط المطعم",
"business.description": "الوصف",
"business.landingMode": "طريقة عرض صفحة المطعم",
"business.showBranchSelector": "عرض صفحة اختيار الفروع",
"business.redirectMainBranch": "التحويل للفرع الرئيسي",
"business.logo": "شعار المطعم",
"business.logoHint": "يظهر هذا الشعار في صفحة المطعم العامة.",
"business.cover": "صورة الغلاف",
"business.coverHint": "تظهر هذه الصورة في صفحة اختيار الفروع.",
"business.savingBusiness": "جارٍ حفظ المطعم...",
"business.saveBusiness": "حفظ المطعم",
"business.restoring": "جارٍ الاستعادة...",
"business.archiving": "جارٍ الأرشفة...",
"business.restoreBusiness": "استعادة المطعم",
"business.archiveBusiness": "أرشفة المطعم",
"business.dangerZone": "منطقة خطرة",
"business.dangerText": "حذف المطعم سيزيل كل الفروع، القوائم، الأقسام، الأصناف، ملاحظات الاشتراك، وسجل الاشتراك المرتبط به.",
"business.deleting": "جارٍ الحذف...",
"business.deleteForever": "حذف المطعم نهائيًا",

"branch.cannotCreate": "لا يمكن إنشاء فرع",
"branch.name": "اسم الفرع",
"branch.slug": "رابط الفرع",
"branch.address": "العنوان",
"branch.phone": "الهاتف",
"branch.whatsapp": "واتساب",
"branch.instagram": "إنستغرام",
"branch.creating": "جارٍ الإنشاء...",
"branch.create": "إنشاء الفرع",
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