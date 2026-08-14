import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AdminI18nContext =
  createContext(null);

const STORAGE_KEY =
  "crtrgo-admin-language";

const LANGUAGES = {
  en: {
    code: "en",
    name: "English",
    dir: "ltr",
  },

  ar: {
    code: "ar",
    name: "العربية",
    dir: "rtl",
  },
};

const translations = {
  en: {
    brand: {
      admin: "Admin",
    },

    header: {
      language: "Language",
    },

    nav: {
      websites: "Websites",
      account: "Account",
      owner: "Owner Console",
      settings: "Settings",
      help: "Help",
      logout: "Log out",
    },

    auth: {
      loggedOut:
        "Logged out",

      logoutFailed:
        "Failed to log out",
    },

    common: {
      save:
        "Save",

      saving:
        "Saving...",

      cancel:
        "Cancel",

      discard:
        "Discard",

      delete:
        "Delete",

      edit:
        "Edit",

      create:
        "Create",

      close:
        "Close",

      active:
        "Active",

      archived:
        "Archived",

      draft:
        "Draft",

      syncing:
        "Syncing",

      refresh:
        "Refresh",

      search:
        "Search",

      back:
        "Back",

      loading:
        "Loading...",

      changesDiscarded:
        "Changes discarded",
    },

    project: {
      general:
        "General",

      menu:
        "Menu",

      appearance:
        "Appearance",

      hours:
        "Working Hours",

      languages:
        "Languages",

      websiteSettings:
        "Website Settings",

      websites:
        "Websites",

      newWebsite:
        "New Website",

      websiteName:
        "Website name",

      hostname:
        "Hostname",

      description:
        "Description",

      location:
        "Location",

      contactSocial:
        "Contact & Social",

      websiteStatus:
        "Website Status",

      saveChanges:
        "Save Changes",

      unsaved:
        "You have unsaved changes.",

      addSection:
        "Add Section",

      sectionName:
        "Section name",

      sections:
        "Sections",

      items:
        "Items",

      available:
        "Available",

      hidden:
        "Hidden",

      noImages:
        "No Images",

      notFound:
        "Website not found",
    },

    projectTabs: {
      general:
        "General",

      menu:
        "Menu",

      appearance:
        "Appearance",

      hours:
        "Working Hours",

      languages:
        "Languages",
    },

    languages: {
      subtitle:
        "Manage the languages and translations shown on this website.",

      websiteLanguages:
        "Website languages",

      websiteLanguagesHint:
        "Choose which languages visitors can use and select the default language.",

      enabled:
        "enabled",

      enable:
        "Enable",

      disable:
        "Disable",

      default:
        "Default language",

      makeDefault:
        "Make default",

      translations:
        "Translations",

      chooseLanguage:
        "Choose a language to edit its website, section, and item translations.",

      website:
        "Website",

      section:
        "Section",

      sectionName:
        "Section name",

      items:
        "Items",

      itemName:
        "Item name",

      keepOne:
        "At least one website language must remain enabled.",

      saved:
        "Languages saved",

      saveFailed:
        "Failed to save languages",

      loadFailed:
        "Failed to load languages",
    },

    workingHours: {
      title:
        "Working Hours",

      subtitle:
        "Set the opening and closing times for {name}.",

      schedule:
        "Weekly Schedule",

      scheduleHint:
        "Choose which days the website is open and set the opening and closing time for each day.",

      unsaved:
        "You have unsaved working-hours changes.",

      saved:
        "Working hours saved",

      saveFailed:
        "Failed to save working hours",
    },

    hoursEditor: {
      title:
        "Opening Hours",

      subtitle:
        "Set when your business opens and closes during the week.",

      open:
        "Open",

      closed:
        "Closed",

      opensAt:
        "Opens at",

      closesAt:
        "Closes at",

      everyday:
        "Every day",

      weekendClosed:
        "Weekend closed",

      applyPreset:
        "Apply preset",
    },

    days: {
      sun:
        "Sunday",

      mon:
        "Monday",

      tue:
        "Tuesday",

      wed:
        "Wednesday",

      thu:
        "Thursday",

      fri:
        "Friday",

      sat:
        "Saturday",
    },

    general: {
      subtitle:
        "Manage your website identity, hostname, contact information, and status.",

      openWebsite:
        "Open Website",

      backToWebsites:
        "Back to websites",

      generalHint:
        "Everything here belongs directly to this website.",

      identity:
        "Website identity",

      information:
        "Website information",

      publicUrl:
        "Public URL",

      locationPlaceholder:
        "Haifa, Israel",

      phone:
        "Phone",

      nameRequired:
        "Website name is required",

      hostnameRequired:
        "Hostname is required",

      hostnameTaken:
        "Another website already uses this hostname.",

      saved:
        "Website saved",

      saveFailed:
        "Failed to save website",

      archiveTitle:
        "Archive website?",

      archiveMessage:
        "This website will stop being publicly available.",

      archiveWebsite:
        "Archive Website",

      archivedSuccess:
        "Website archived",

      restoreTitle:
        "Restore website?",

      restoreMessage:
        "This website will become public again.",

      restoreWebsite:
        "Restore Website",

      restoredSuccess:
        "Website restored",

      statusFailed:
        "Failed to update website",

      dangerZone:
        "Danger Zone",

      dangerHint:
        "Deleting this website also deletes all sections and items.",

      deleteWebsite:
        "Delete Website",

      deleteTitle:
        "Delete website forever?",

      deleteMessage:
        "This deletes the website, every section, and every item inside it. This cannot be undone.",

      deleteForever:
        "Delete forever",

      deletedSuccess:
        "Website deleted",

      deleteFailed:
        "Failed to delete website",
    },

    appearance: {
      title:
        "Appearance",

      subtitle:
        "Customize the look and branding of the standard CRTRGO website.",

      preview:
        "Preview",

      images:
        "Images",

      imagesHint:
        "These images are used throughout the standard CRTRGO website.",

      logo:
        "Logo",

      logoHint:
        "Your business logo.",

      coverImage:
        "Cover image",

      coverHint:
        "The main cover image shown on the website.",

      favicon:
        "Favicon",

      faviconHint:
        "The small icon shown in the browser tab.",

      colors:
        "Colors",

      colorsHint:
        "Customize the main colors used throughout your website.",

      primaryColor:
        "Primary color",

      backgroundColor:
        "Background",

      textColor:
        "Text",

      unsaved:
        "You have unsaved appearance changes.",

      saved:
        "Appearance saved",

      saveFailed:
        "Failed to save appearance",
    },

    menuEditor: {
      eyebrow:
        "Menu Editor",

      subtitle:
        "Create and manage sections and items for this website.",

      addSectionHint:
        "Examples: burgers, drinks, desserts.",

      sectionPlaceholder:
        "Burgers",

      adding:
        "Adding...",

      item:
        "Item",

      noItems:
        "No items yet.",

      addFirstItem:
        "Add First Item",

      noSections:
        "No sections yet",

      noSectionsHint:
        "Add the first section to start building the menu.",

      sectionNameRequired:
        "Section name is required",

      sectionAdded:
        "Section added",

      sectionAddFailed:
        "Failed to add section",

      deleteSectionTitle:
        "Delete section?",

      deleteSectionMessage:
        'This deletes "{name}" and every item inside it.',

      deleteSection:
        "Delete section",

      sectionDeleted:
        "Section deleted",

      sectionDeleteFailed:
        "Failed to delete section",

      sectionSettings:
        "Section Settings",

      sectionSaved:
        "Section saved",

      sectionSaveFailed:
        "Failed to save section",

      sectionCover:
        "Section cover",

      saveSection:
        "Save Section",

      itemAvailable:
        "Item available",

      itemHidden:
        "Item hidden",

      itemUpdateFailed:
        "Failed to update item",

      deleteItemTitle:
        "Delete item?",

      deleteItemMessage:
        'This deletes "{name}".',

      deleteItem:
        "Delete item",

      itemDeleted:
        "Item deleted",

      itemDeleteFailed:
        "Failed to delete item",

      itemNameRequired:
        "Item name is required",

      itemUpdated:
        "Item updated",

      itemCreated:
        "Item created",

      itemSaveFailed:
        "Failed to save item",

      editItem:
        "Edit Item",

      newItem:
        "New Item",

      itemName:
        "Item name",

      price:
        "Price",

      itemImage:
        "Item image",

      itemIsAvailable:
        "Item is available",

      itemIsHidden:
        "Item is hidden",

      saveItem:
        "Save Item",

      createItem:
        "Create Item",

      sectionIcon:
        "Section icon",

      sectionIconHint:
        "This icon will appear next to the section name on the website.",

      noIcon:
        "None",

      crtrgoIcons:
        "CRTRGO Icons",

      symbols:
        "Symbols",

      preview:
        "Preview",

      iconPreviewHint:
        "This is how the icon will appear.",

      iconLabels: {
        utensils:
          "Food",

        pizza:
          "Pizza",

        sandwich:
          "Sandwich",

        drinks:
          "Drinks",

        coffee:
          "Coffee",

        dessert:
          "Dessert",

        icecream:
          "Ice Cream",

        salad:
          "Salad",

        soup:
          "Soup",

        meat:
          "Meat",

        fish:
          "Fish",
      },
    },

    dashboard: {
      workspace:
        "Workspace",

      subtitle:
        "Manage your CRTRGO websites from one workspace.",

      refreshed:
        "Workspace refreshed",

      searchPlaceholder:
        "Search websites...",

      loadFailed:
        "Failed to load websites",

      noResults:
        "No results found",

      noResultsHint:
        "Try searching with another name or hostname.",

      firstWebsite:
        "Create your first website",

      firstWebsiteHint:
        "Create your first CRTRGO website. You can add your menu, branding, contact information, and working hours after creation.",

      openWebsite:
        "Open Website",

      websiteNamePlaceholder:
        "Burger House",

      hostnameHint:
        "This becomes the public website address.",

      descriptionPlaceholder:
        "Short description...",

      notLoggedIn:
        "You are not logged in.",

      hostnameUsed:
        "This hostname is already being used.",

      created:
        "Website created",

      createFailed:
        "Failed to create website",

      creating:
        "Creating...",

      createWebsite:
        "Create Website",
    },

    authPage: {
      checkingSession:
        "Checking your session...",

      secureAdmin:
        "Secure CRTRGO Admin",

      heroTitle:
        "Build and manage your websites.",

      heroText:
        "Create fast CRTRGO websites, manage menus, branding, contact information, working hours, and languages from one place.",

      featureWebsites:
        "Manage all your websites",

      featureMenus:
        "Edit menus and content",

      featureBranding:
        "Control branding and appearance",

      welcome:
        "Welcome back",

      getStarted:
        "Get started",

      loginTitle:
        "Log in",

      signupTitle:
        "Create account",

      loginSubtitle:
        "Sign in to continue to your CRTRGO workspace.",

      signupSubtitle:
        "Create your CRTRGO account and start building your first website.",

      login:
        "Log in",

      signup:
        "Sign up",

      createAccount:
        "Create account",

      username:
        "Username",

      displayName:
        "Display name",

      displayNamePlaceholder:
        "Your name",

      email:
        "Email",

      password:
        "Password",

      showPassword:
        "Show password",

      hidePassword:
        "Hide password",

      pleaseWait:
        "Please wait...",

      footer:
        "CRTRGO Admin · Manage your websites from one workspace.",

      emailRequired:
        "Email is required.",

      passwordRequired:
        "Password is required.",

      passwordTooShort:
        "Password must be at least 6 characters.",

      usernameRequired:
        "Username is required.",

      displayNameRequired:
        "Display name is required.",

      usernameInvalid:
        "Username can only contain letters, numbers, periods, and underscores.",

      usernameTaken:
        "This username is already taken.",

      welcomeBack:
        "Welcome back",

      accountCreated:
        "Account created",

      invalidCredentials:
        "Incorrect email or password.",

      emailNotConfirmed:
        "Please confirm your email before logging in.",

      emailUsed:
        "An account already exists with this email.",

      somethingWentWrong:
        "Something went wrong.",
    },

    account: {
      eyebrow:
        "Profile",

      title:
        "Account",

      subtitle:
        "Manage your CRTRGO profile and account information.",

      backToWebsites:
        "Back to websites",

      ownerConsole:
        "Owner Console",

      ownerConsoleHint:
        "Manage platform administration and CRTRGO clients.",

      open:
        "Open",

      defaultName:
        "CRTRGO User",

      noEmail:
        "No email",

      userId:
        "User ID",

      username:
        "Username",

      notSet:
        "Not set",

      profileDetails:
        "Profile details",

      profileDetailsHint:
        "Update the information used for your CRTRGO account.",

      displayName:
        "Display name",

      displayNamePlaceholder:
        "Your name",

      email:
        "Email",

      emailHint:
        "Your login email cannot be changed here.",

      status:
        "Account status",

      statusHint:
        "Information about your CRTRGO account and access.",

      authProvider:
        "Auth provider",

      emailProvider:
        "Email",

      accountType:
        "Account type",

      platformAdmin:
        "Platform Admin",

      clientAccount:
        "Client",

      role:
        "Role",

      superAdmin:
        "Super Admin",

      websiteOwner:
        "Website Owner",

      unsaved:
        "You have unsaved account changes.",

      userNotFound:
        "User not found.",

      loadFailed:
        "Failed to load account",

      usernameRequired:
        "Username is required.",

      displayNameRequired:
        "Display name is required.",

      usernameInvalid:
        "Username can only contain letters, numbers, periods, and underscores.",

      usernameTaken:
        "This username is already taken.",

      updated:
        "Account updated",

      saveFailed:
        "Failed to save account",
    },
  },

  ar: {
    brand: {
      admin:
        "الإدارة",
    },

    header: {
      language:
        "اللغة",
    },

    nav: {
      websites:
        "المواقع",

      account:
        "الحساب",

      owner:
        "لوحة المالك",

      settings:
        "الإعدادات",

      help:
        "المساعدة",

      logout:
        "تسجيل الخروج",
    },

    auth: {
      loggedOut:
        "تم تسجيل الخروج",

      logoutFailed:
        "تعذر تسجيل الخروج",
    },

    common: {
      save:
        "حفظ",

      saving:
        "جارٍ الحفظ...",

      cancel:
        "إلغاء",

      discard:
        "تراجع",

      delete:
        "حذف",

      edit:
        "تعديل",

      create:
        "إنشاء",

      close:
        "إغلاق",

      active:
        "نشط",

      archived:
        "مؤرشف",

      draft:
        "مسودة",

      syncing:
        "جارٍ المزامنة",

      refresh:
        "تحديث",

      search:
        "بحث",

      back:
        "رجوع",

      loading:
        "جارٍ التحميل...",

      changesDiscarded:
        "تم التراجع عن التغييرات",
    },

    project: {
      general:
        "عام",

      menu:
        "القائمة",

      appearance:
        "المظهر",

      hours:
        "ساعات العمل",

      languages:
        "اللغات",

      websiteSettings:
        "إعدادات الموقع",

      websites:
        "المواقع",

      newWebsite:
        "موقع جديد",

      websiteName:
        "اسم الموقع",

      hostname:
        "اسم النطاق",

      description:
        "الوصف",

      location:
        "الموقع",

      contactSocial:
        "التواصل والحسابات",

      websiteStatus:
        "حالة الموقع",

      saveChanges:
        "حفظ التغييرات",

      unsaved:
        "لديك تغييرات غير محفوظة",

      addSection:
        "إضافة قسم",

      sectionName:
        "اسم القسم",

      sections:
        "الأقسام",

      items:
        "المنتجات",

      available:
        "متوفر",

      hidden:
        "مخفي",

      noImages:
        "بدون صور",

      notFound:
        "الموقع غير موجود",
    },

    projectTabs: {
      general:
        "عام",

      menu:
        "القائمة",

      appearance:
        "المظهر",

      hours:
        "ساعات العمل",

      languages:
        "اللغات",
    },

    languages: {
      subtitle:
        "إدارة اللغات والترجمات التي تظهر في هذا الموقع.",

      websiteLanguages:
        "لغات الموقع",

      websiteLanguagesHint:
        "اختر اللغات التي يمكن للزوار استخدامها وحدد اللغة الافتراضية.",

      enabled:
        "مفعّلة",

      enable:
        "تفعيل",

      disable:
        "إلغاء التفعيل",

      default:
        "اللغة الافتراضية",

      makeDefault:
        "تعيين كافتراضية",

      translations:
        "الترجمات",

      chooseLanguage:
        "اختر لغة لتعديل ترجمة الموقع والأقسام والمنتجات.",

      website:
        "الموقع",

      section:
        "القسم",

      sectionName:
        "اسم القسم",

      items:
        "المنتجات",

      itemName:
        "اسم المنتج",

      keepOne:
        "يجب إبقاء لغة واحدة على الأقل مفعّلة.",

      saved:
        "تم حفظ اللغات",

      saveFailed:
        "تعذر حفظ اللغات",

      loadFailed:
        "تعذر تحميل اللغات",
    },

    workingHours: {
      title:
        "ساعات العمل",

      subtitle:
        "حدد أوقات فتح وإغلاق {name}.",

      schedule:
        "جدول ساعات العمل",

      scheduleHint:
        "حدد الأيام التي يكون فيها الموقع مفتوحاً وأوقات الفتح والإغلاق لكل يوم.",

      unsaved:
        "لديك تغييرات غير محفوظة في ساعات العمل.",

      saved:
        "تم حفظ ساعات العمل",

      saveFailed:
        "تعذر حفظ ساعات العمل",
    },

    hoursEditor: {
      title:
        "أوقات الدوام",

      subtitle:
        "حدد أوقات فتح وإغلاق نشاطك التجاري خلال أيام الأسبوع.",

      open:
        "مفتوح",

      closed:
        "مغلق",

      opensAt:
        "يفتح الساعة",

      closesAt:
        "يغلق الساعة",

      everyday:
        "كل الأيام",

      weekendClosed:
        "عطلة نهاية الأسبوع مغلقة",

      applyPreset:
        "تطبيق",
    },

    days: {
      sun:
        "الأحد",

      mon:
        "الاثنين",

      tue:
        "الثلاثاء",

      wed:
        "الأربعاء",

      thu:
        "الخميس",

      fri:
        "الجمعة",

      sat:
        "السبت",
    },

    general: {
      subtitle:
        "إدارة هوية الموقع واسم النطاق ومعلومات التواصل وحالة الموقع.",

      openWebsite:
        "فتح الموقع",

      backToWebsites:
        "العودة إلى المواقع",

      generalHint:
        "جميع الإعدادات هنا تخص هذا الموقع مباشرة.",

      identity:
        "هوية الموقع",

      information:
        "معلومات الموقع",

      publicUrl:
        "رابط الموقع",

      locationPlaceholder:
        "حيفا، إسرائيل",

      phone:
        "رقم الهاتف",

      nameRequired:
        "اسم الموقع مطلوب",

      hostnameRequired:
        "اسم النطاق مطلوب",

      hostnameTaken:
        "يوجد موقع آخر يستخدم اسم النطاق هذا.",

      saved:
        "تم حفظ الموقع",

      saveFailed:
        "تعذر حفظ الموقع",

      archiveTitle:
        "أرشفة الموقع؟",

      archiveMessage:
        "سيتوقف الموقع عن الظهور للعامة.",

      archiveWebsite:
        "أرشفة الموقع",

      archivedSuccess:
        "تمت أرشفة الموقع",

      restoreTitle:
        "استعادة الموقع؟",

      restoreMessage:
        "سيصبح الموقع متاحاً للعامة مرة أخرى.",

      restoreWebsite:
        "استعادة الموقع",

      restoredSuccess:
        "تمت استعادة الموقع",

      statusFailed:
        "تعذر تحديث حالة الموقع",

      dangerZone:
        "منطقة الخطر",

      dangerHint:
        "حذف هذا الموقع سيؤدي أيضاً إلى حذف جميع الأقسام والمنتجات داخله.",

      deleteWebsite:
        "حذف الموقع",

      deleteTitle:
        "حذف الموقع نهائياً؟",

      deleteMessage:
        "سيتم حذف الموقع وجميع الأقسام والمنتجات الموجودة داخله نهائياً. لا يمكن التراجع عن هذا الإجراء.",

      deleteForever:
        "حذف نهائي",

      deletedSuccess:
        "تم حذف الموقع",

      deleteFailed:
        "تعذر حذف الموقع",
    },

    appearance: {
      title:
        "المظهر",

      subtitle:
        "خصص مظهر وهوية موقع CRTRGO الخاص بك.",

      preview:
        "معاينة",

      images:
        "الصور",

      imagesHint:
        "تُستخدم هذه الصور في أنحاء موقع CRTRGO الخاص بك.",

      logo:
        "الشعار",

      logoHint:
        "شعار نشاطك التجاري.",

      coverImage:
        "صورة الغلاف",

      coverHint:
        "صورة الغلاف الرئيسية التي تظهر في الموقع.",

      favicon:
        "أيقونة الموقع",

      faviconHint:
        "الأيقونة الصغيرة التي تظهر في تبويب المتصفح.",

      colors:
        "الألوان",

      colorsHint:
        "خصص الألوان الرئيسية المستخدمة في موقعك.",

      primaryColor:
        "اللون الرئيسي",

      backgroundColor:
        "لون الخلفية",

      textColor:
        "لون النص",

      unsaved:
        "لديك تغييرات غير محفوظة في المظهر.",

      saved:
        "تم حفظ إعدادات المظهر",

      saveFailed:
        "تعذر حفظ إعدادات المظهر",
    },

    menuEditor: {
      eyebrow:
        "محرر القائمة",

      subtitle:
        "أنشئ وأدر أقسام ومنتجات هذا الموقع.",

      addSectionHint:
        "مثال: برغر، مشروبات، حلويات.",

      sectionPlaceholder:
        "برغر",

      adding:
        "جارٍ الإضافة...",

      item:
        "منتج",

      noItems:
        "لا توجد منتجات بعد.",

      addFirstItem:
        "إضافة أول منتج",

      noSections:
        "لا توجد أقسام بعد",

      noSectionsHint:
        "أضف أول قسم لبدء إنشاء القائمة.",

      sectionNameRequired:
        "اسم القسم مطلوب",

      sectionAdded:
        "تمت إضافة القسم",

      sectionAddFailed:
        "تعذر إضافة القسم",

      deleteSectionTitle:
        "حذف القسم؟",

      deleteSectionMessage:
        'سيتم حذف "{name}" وجميع المنتجات الموجودة داخله.',

      deleteSection:
        "حذف القسم",

      sectionDeleted:
        "تم حذف القسم",

      sectionDeleteFailed:
        "تعذر حذف القسم",

      sectionSettings:
        "إعدادات القسم",

      sectionSaved:
        "تم حفظ القسم",

      sectionSaveFailed:
        "تعذر حفظ القسم",

      sectionCover:
        "غلاف القسم",

      saveSection:
        "حفظ القسم",

      itemAvailable:
        "المنتج متوفر",

      itemHidden:
        "تم إخفاء المنتج",

      itemUpdateFailed:
        "تعذر تحديث المنتج",

      deleteItemTitle:
        "حذف المنتج؟",

      deleteItemMessage:
        'سيتم حذف "{name}".',

      deleteItem:
        "حذف المنتج",

      itemDeleted:
        "تم حذف المنتج",

      itemDeleteFailed:
        "تعذر حذف المنتج",

      itemNameRequired:
        "اسم المنتج مطلوب",

      itemUpdated:
        "تم تحديث المنتج",

      itemCreated:
        "تم إنشاء المنتج",

      itemSaveFailed:
        "تعذر حفظ المنتج",

      editItem:
        "تعديل المنتج",

      newItem:
        "منتج جديد",

      itemName:
        "اسم المنتج",

      price:
        "السعر",

      itemImage:
        "صورة المنتج",

      itemIsAvailable:
        "المنتج متوفر",

      itemIsHidden:
        "المنتج مخفي",

      saveItem:
        "حفظ المنتج",

      createItem:
        "إنشاء المنتج",

      sectionIcon:
        "أيقونة القسم",

      sectionIconHint:
        "ستظهر هذه الأيقونة بجانب اسم القسم في الموقع.",

      noIcon:
        "بدون",

      crtrgoIcons:
        "أيقونات CRTRGO",

      symbols:
        "رموز",

      preview:
        "معاينة",

      iconPreviewHint:
        "هكذا ستظهر الأيقونة.",

      iconLabels: {
        utensils:
          "طعام",

        pizza:
          "بيتزا",

        sandwich:
          "ساندويش",

        drinks:
          "مشروبات",

        coffee:
          "قهوة",

        dessert:
          "حلويات",

        icecream:
          "آيس كريم",

        salad:
          "سلطات",

        soup:
          "شوربة",

        meat:
          "لحوم",

        fish:
          "أسماك",
      },
    },

    dashboard: {
      workspace:
        "مساحة العمل",

      subtitle:
        "أدر جميع مواقع CRTRGO الخاصة بك من مكان واحد.",

      refreshed:
        "تم تحديث مساحة العمل",

      searchPlaceholder:
        "البحث في المواقع...",

      loadFailed:
        "تعذر تحميل المواقع",

      noResults:
        "لم يتم العثور على نتائج",

      noResultsHint:
        "جرّب البحث باسم أو اسم نطاق آخر.",

      firstWebsite:
        "أنشئ موقعك الأول",

      firstWebsiteHint:
        "أنشئ أول موقع CRTRGO لك، ثم أضف القائمة والهوية ومعلومات التواصل وساعات العمل.",

      openWebsite:
        "فتح الموقع",

      websiteNamePlaceholder:
        "برغر هاوس",

      hostnameHint:
        "سيصبح هذا عنوان الموقع العام.",

      descriptionPlaceholder:
        "وصف مختصر...",

      notLoggedIn:
        "لم يتم تسجيل الدخول.",

      hostnameUsed:
        "اسم النطاق هذا مستخدم بالفعل.",

      created:
        "تم إنشاء الموقع",

      createFailed:
        "تعذر إنشاء الموقع",

      creating:
        "جارٍ الإنشاء...",

      createWebsite:
        "إنشاء الموقع",
    },

    authPage: {
      checkingSession:
        "جارٍ التحقق من الجلسة...",

      secureAdmin:
        "إدارة CRTRGO الآمنة",

      heroTitle:
        "أنشئ وأدر مواقعك بسهولة.",

      heroText:
        "أنشئ مواقع CRTRGO سريعة وأدر القوائم والهوية ومعلومات التواصل وساعات العمل واللغات من مكان واحد.",

      featureWebsites:
        "إدارة جميع مواقعك",

      featureMenus:
        "إدارة القوائم والمحتوى",

      featureBranding:
        "التحكم بالهوية والمظهر",

      welcome:
        "مرحباً بعودتك",

      getStarted:
        "ابدأ الآن",

      loginTitle:
        "تسجيل الدخول",

      signupTitle:
        "إنشاء حساب",

      loginSubtitle:
        "سجّل الدخول للمتابعة إلى مساحة عمل CRTRGO.",

      signupSubtitle:
        "أنشئ حساب CRTRGO وابدأ بإنشاء موقعك الأول.",

      login:
        "تسجيل الدخول",

      signup:
        "إنشاء حساب",

      createAccount:
        "إنشاء الحساب",

      username:
        "اسم المستخدم",

      displayName:
        "الاسم الظاهر",

      displayNamePlaceholder:
        "اسمك",

      email:
        "البريد الإلكتروني",

      password:
        "كلمة المرور",

      showPassword:
        "إظهار كلمة المرور",

      hidePassword:
        "إخفاء كلمة المرور",

      pleaseWait:
        "يرجى الانتظار...",

      footer:
        "إدارة CRTRGO · أدر جميع مواقعك من مساحة عمل واحدة.",

      emailRequired:
        "البريد الإلكتروني مطلوب.",

      passwordRequired:
        "كلمة المرور مطلوبة.",

      passwordTooShort:
        "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",

      usernameRequired:
        "اسم المستخدم مطلوب.",

      displayNameRequired:
        "الاسم الظاهر مطلوب.",

      usernameInvalid:
        "يمكن أن يحتوي اسم المستخدم على أحرف إنجليزية وأرقام ونقاط وشرطات سفلية فقط.",

      usernameTaken:
        "اسم المستخدم هذا مستخدم بالفعل.",

      welcomeBack:
        "مرحباً بعودتك",

      accountCreated:
        "تم إنشاء الحساب",

      invalidCredentials:
        "البريد الإلكتروني أو كلمة المرور غير صحيحة.",

      emailNotConfirmed:
        "يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول.",

      emailUsed:
        "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.",

      somethingWentWrong:
        "حدث خطأ ما.",
    },

    account: {
      eyebrow:
        "الملف الشخصي",

      title:
        "الحساب",

      subtitle:
        "أدر ملفك الشخصي ومعلومات حساب CRTRGO.",

      backToWebsites:
        "العودة إلى المواقع",

      ownerConsole:
        "لوحة المالك",

      ownerConsoleHint:
        "إدارة المنصة وعملاء CRTRGO.",

      open:
        "فتح",

      defaultName:
        "مستخدم CRTRGO",

      noEmail:
        "لا يوجد بريد إلكتروني",

      userId:
        "معرّف المستخدم",

      username:
        "اسم المستخدم",

      notSet:
        "غير محدد",

      profileDetails:
        "تفاصيل الملف الشخصي",

      profileDetailsHint:
        "عدّل المعلومات المستخدمة في حساب CRTRGO الخاص بك.",

      displayName:
        "الاسم الظاهر",

      displayNamePlaceholder:
        "اسمك",

      email:
        "البريد الإلكتروني",

      emailHint:
        "لا يمكن تغيير بريد تسجيل الدخول من هنا.",

      status:
        "حالة الحساب",

      statusHint:
        "معلومات عن حساب CRTRGO وصلاحيات الوصول.",

      authProvider:
        "طريقة تسجيل الدخول",

      emailProvider:
        "البريد الإلكتروني",

      accountType:
        "نوع الحساب",

      platformAdmin:
        "إدارة المنصة",

      clientAccount:
        "عميل",

      role:
        "الصلاحية",

      superAdmin:
        "مدير عام",

      websiteOwner:
        "مالك مواقع",

      unsaved:
        "لديك تغييرات غير محفوظة في الحساب.",

      userNotFound:
        "لم يتم العثور على المستخدم.",

      loadFailed:
        "تعذر تحميل الحساب",

      usernameRequired:
        "اسم المستخدم مطلوب.",

      displayNameRequired:
        "الاسم الظاهر مطلوب.",

      usernameInvalid:
        "يمكن أن يحتوي اسم المستخدم على أحرف إنجليزية وأرقام ونقاط وشرطات سفلية فقط.",

      usernameTaken:
        "اسم المستخدم هذا مستخدم بالفعل.",

      updated:
        "تم تحديث الحساب",

      saveFailed:
        "تعذر حفظ الحساب",
    },
  },
};

function getNestedValue(
  object,
  path
) {
  return path
    .split(".")
    .reduce(
      (
        current,
        key
      ) =>
        current?.[key],
      object
    );
}

export function AdminI18nProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return "en";
    }

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    return LANGUAGES[saved]
      ? saved
      : "en";
  });

  const languageMeta =
    LANGUAGES[language] ||
    LANGUAGES.en;

  useEffect(() => {
    document.documentElement.lang =
      languageMeta.code;

    document.documentElement.dir =
      languageMeta.dir;
  }, [
    languageMeta.code,
    languageMeta.dir,
  ]);

  function setLanguage(
    code
  ) {
    if (
      !LANGUAGES[code]
    ) {
      return;
    }

    setLanguageState(
      code
    );

    localStorage.setItem(
      STORAGE_KEY,
      code
    );
  }

  function t(
    key,
    variables = {}
  ) {
    const translated =
      getNestedValue(
        translations[
          language
        ],
        key
      );

    const english =
      getNestedValue(
        translations.en,
        key
      );

    let value =
      translated ??
      english ??
      key;

    if (
      typeof value !==
      "string"
    ) {
      return value;
    }

    for (
      const [
        variable,
        replacement,
      ] of Object.entries(
        variables
      )
    ) {
      value =
        value.replaceAll(
          `{${variable}}`,
          String(
            replacement ??
              ""
          )
        );
    }

    return value;
  }

  const value =
    useMemo(
      () => ({
        language,
        setLanguage,
        dir:
          languageMeta.dir,
        t,
      }),
      [
        language,
        languageMeta.dir,
      ]
    );

  return (
    <AdminI18nContext.Provider
      value={
        value
      }
    >
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  const context =
    useContext(
      AdminI18nContext
    );

  if (!context) {
    throw new Error(
      "useAdminI18n must be used inside AdminI18nProvider"
    );
  }

  return context;
}