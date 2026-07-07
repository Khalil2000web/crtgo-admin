import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Globe2,
  Languages,
  Lock,
  Save,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import BranchTabs from "../components/BranchTabs";
import PlanLimitNotice from "../components/PlanLimitNotice";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
  Textarea,
} from "../components/ui";

import { useBusinessBilling } from "../hooks/useBusinessBilling";
import {
  canUseLanguage,
  getAllowedLanguages,
  getLimitMessage,
  isSubscriptionLocked,
} from "../lib/billing";

const LANGUAGES = [
  {
    code: "ar",
    name: "Arabic",
    native: "العربية",
    dir: "rtl",
    recommended: true,
  },
  {
    code: "he",
    name: "Hebrew",
    native: "עברית",
    dir: "rtl",
    recommended: false,
  },
  {
    code: "en",
    name: "English",
    native: "English",
    dir: "ltr",
    recommended: false,
  },
];

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      name_i18n,
      address,
      address_i18n,
      status,
      business_id,
      businesses (
        id,
        name,
        name_i18n,
        description,
        description_i18n
      ),
      menu_versions (
        id,
        name,
        name_i18n,
        status,
        description_ar,
        description_i18n,
        enabled_languages,
        default_language,
        sections (
          id,
          name_ar,
          name_i18n,
          sort_order,
          items (
            id,
            name_ar,
            name_i18n,
            description_ar,
            description_i18n,
            price,
            sort_order
          )
        )
      )
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;
  return data;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function asI18n(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? clone(value)
    : {};
}

function cleanI18n(value) {
  const source = asI18n(value);
  const next = {};

  Object.entries(source).forEach(([language, text]) => {
    const clean = String(text || "").trim();

    if (clean) {
      next[language] = clean;
    }
  });

  return next;
}

function sortByOrder(items = []) {
  return [...items].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sort_order))
      ? Number(a.sort_order)
      : 9999;
    const orderB = Number.isFinite(Number(b.sort_order))
      ? Number(b.sort_order)
      : 9999;

    return orderA - orderB;
  });
}

function getActiveMenu(branch) {
  return (
    branch?.menu_versions?.find((item) => item.status === "active") ||
    branch?.menu_versions?.[0] ||
    null
  );
}

function makeInitialForm(branch, menu) {
  const enabledLanguages = Array.isArray(menu?.enabled_languages)
    ? menu.enabled_languages.filter((code) =>
        LANGUAGES.some((language) => language.code === code)
      )
    : ["ar"];

  const finalEnabledLanguages = enabledLanguages.length
    ? enabledLanguages
    : ["ar"];

  const defaultLanguage =
    menu?.default_language && finalEnabledLanguages.includes(menu.default_language)
      ? menu.default_language
      : finalEnabledLanguages[0];

  const sections = sortByOrder(menu?.sections || []);

  return {
    enabled_languages: finalEnabledLanguages,
    default_language: defaultLanguage,

    business: {
      name_i18n: asI18n(branch?.businesses?.name_i18n),
      description_i18n: asI18n(branch?.businesses?.description_i18n),
    },

    branch: {
      name_i18n: asI18n(branch?.name_i18n),
      address_i18n: asI18n(branch?.address_i18n),
    },

    menu: {
      name_i18n: asI18n(menu?.name_i18n),
      description_i18n: asI18n(menu?.description_i18n),
    },

    sections: Object.fromEntries(
      sections.map((section) => [
        section.id,
        {
          name_i18n: asI18n(section.name_i18n),
        },
      ])
    ),

    items: Object.fromEntries(
      sections.flatMap((section) =>
        sortByOrder(section.items || []).map((item) => [
          item.id,
          {
            name_i18n: asI18n(item.name_i18n),
            description_i18n: asI18n(item.description_i18n),
          },
        ])
      )
    ),
  };
}

function getLanguageMeta(code) {
  return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
}

function countTranslations({ form, menu, language }) {
  if (!language || language === "ar") {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
    };
  }

  const sections = sortByOrder(menu?.sections || []);
  const items = sections.flatMap((section) => sortByOrder(section.items || []));

  const values = [
    form.business.name_i18n?.[language],
    form.business.description_i18n?.[language],
    form.branch.name_i18n?.[language],
    form.branch.address_i18n?.[language],
    form.menu.name_i18n?.[language],
    form.menu.description_i18n?.[language],
    ...sections.map(
      (section) => form.sections?.[section.id]?.name_i18n?.[language]
    ),
    ...items.flatMap((item) => [
      form.items?.[item.id]?.name_i18n?.[language],
      form.items?.[item.id]?.description_i18n?.[language],
    ]),
  ];

  const total = values.length;
  const completed = values.filter((value) => String(value || "").trim()).length;

  return {
    total,
    completed,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  };
}

export default function BranchLanguagesPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [localForm, setLocalForm] = useState(null);
  const [activeTranslationLanguage, setActiveTranslationLanguage] =
    useState("he");
  const [search, setSearch] = useState("");

  const {
    data: branch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branch-languages", branchId],
    queryFn: () => loadBranch(branchId),
    enabled: Boolean(branchId),
  });

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(branch?.business_id);

  const menu = useMemo(() => getActiveMenu(branch), [branch]);

  const initialForm = useMemo(
    () => makeInitialForm(branch, menu),
    [branch, menu]
  );

  const form = localForm || initialForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const archived = branch?.status === "archived";
  const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));
  const allowedLanguages = billing ? getAllowedLanguages(billing) : [];
  const allowedLanguageSet = new Set(allowedLanguages);

  const locked =
    archived || billingLoading || Boolean(billingError) || subscriptionLocked;

  const lockMessage = archived
    ? "Restore this branch before editing languages."
    : billingLoading
      ? "Billing is still loading. Try again in a second."
      : billingError
        ? billingError.message
        : subscriptionLocked
          ? getLimitMessage("locked", billing)
          : "";

  const hasNoAllowedLanguages =
    Boolean(billing) && !locked && allowedLanguages.length === 0;

  const translationLanguages = LANGUAGES.filter(
    (language) =>
      language.code !== "ar" &&
      form.enabled_languages.includes(language.code) &&
      allowedLanguageSet.has(language.code)
  );

  const activeLanguage = translationLanguages.some(
    (language) => language.code === activeTranslationLanguage
  )
    ? activeTranslationLanguage
    : translationLanguages[0]?.code || null;

  const activeMeta = activeLanguage ? getLanguageMeta(activeLanguage) : null;

  const progress = countTranslations({
    form,
    menu,
    language: activeLanguage,
  });

  function updateForm(mutator) {
    setLocalForm((current) => {
      const next = clone(current || initialForm);
      mutator(next);
      return next;
    });
  }

  function toggleLanguage(code) {
    if (locked) {
      toast.error(lockMessage || "Language settings are locked.");
      return;
    }

    const currentlyEnabled = form.enabled_languages.includes(code);

    if (!currentlyEnabled && billing && !canUseLanguage(billing, code)) {
      toast.error(getLimitMessage("languages", billing));
      return;
    }

    updateForm((next) => {
      const enabled = new Set(next.enabled_languages);

      if (enabled.has(code)) {
        if (enabled.size === 1) {
          toast.error("At least one language must stay enabled");
          return;
        }

        enabled.delete(code);
      } else {
        enabled.add(code);
      }

      next.enabled_languages = Array.from(enabled);

      if (!next.enabled_languages.includes(next.default_language)) {
        next.default_language = next.enabled_languages[0];
      }

      const nextTranslationLanguage = next.enabled_languages.find(
        (language) => language !== "ar" && allowedLanguageSet.has(language)
      );

      if (nextTranslationLanguage) {
        setActiveTranslationLanguage(nextTranslationLanguage);
      }
    });
  }

  function setDefaultLanguage(code) {
    if (locked) {
      toast.error(lockMessage || "Language settings are locked.");
      return;
    }

    if (!form.enabled_languages.includes(code)) {
      toast.error("Enable this language first");
      return;
    }

    if (billing && !canUseLanguage(billing, code)) {
      toast.error(getLimitMessage("languages", billing));
      return;
    }

    updateForm((next) => {
      next.default_language = code;
    });
  }

  function updateBusinessField(field, language, value) {
    updateForm((next) => {
      next.business[field] = {
        ...(next.business[field] || {}),
        [language]: value,
      };
    });
  }

  function updateBranchField(field, language, value) {
    updateForm((next) => {
      next.branch[field] = {
        ...(next.branch[field] || {}),
        [language]: value,
      };
    });
  }

  function updateMenuField(field, language, value) {
    updateForm((next) => {
      next.menu[field] = {
        ...(next.menu[field] || {}),
        [language]: value,
      };
    });
  }

  function updateSectionField(sectionId, field, language, value) {
    updateForm((next) => {
      next.sections[sectionId] = {
        ...(next.sections[sectionId] || {}),
        [field]: {
          ...(next.sections[sectionId]?.[field] || {}),
          [language]: value,
        },
      };
    });
  }

  function updateItemField(itemId, field, language, value) {
    updateForm((next) => {
      next.items[itemId] = {
        ...(next.items[itemId] || {}),
        [field]: {
          ...(next.items[itemId]?.[field] || {}),
          [language]: value,
        },
      };
    });
  }

  function discard() {
    setLocalForm(null);
    toast.success("Changes discarded");
  }

  async function save() {
    if (!dirty || !menu || !branch) return;

    if (locked) {
      toast.error(lockMessage || "Language settings are locked.");
      return;
    }

    const invalidLanguages = form.enabled_languages.filter(
      (code) => billing && !canUseLanguage(billing, code)
    );

    if (invalidLanguages.length) {
      toast.error(
        `Your plan does not include: ${invalidLanguages.join(", ")}`
      );
      return;
    }

    if (!form.enabled_languages.includes(form.default_language)) {
      toast.error("Default language must be enabled.");
      return;
    }

    setSaving(true);

    try {
      const businessUpdate = supabase
        .from("businesses")
        .update({
          name_i18n: cleanI18n(form.business.name_i18n),
          description_i18n: cleanI18n(form.business.description_i18n),
        })
        .eq("id", branch.business_id);

      const branchUpdate = supabase
        .from("branches")
        .update({
          name_i18n: cleanI18n(form.branch.name_i18n),
          address_i18n: cleanI18n(form.branch.address_i18n),
        })
        .eq("id", branch.id);

      const menuUpdate = supabase
        .from("menu_versions")
        .update({
          enabled_languages: form.enabled_languages,
          default_language: form.default_language,
          name_i18n: cleanI18n(form.menu.name_i18n),
          description_i18n: cleanI18n(form.menu.description_i18n),
        })
        .eq("id", menu.id);

      const sectionUpdates = Object.entries(form.sections || {}).map(
        ([sectionId, payload]) =>
          supabase
            .from("sections")
            .update({
              name_i18n: cleanI18n(payload.name_i18n),
            })
            .eq("id", sectionId)
      );

      const itemUpdates = Object.entries(form.items || {}).map(
        ([itemId, payload]) =>
          supabase
            .from("items")
            .update({
              name_i18n: cleanI18n(payload.name_i18n),
              description_i18n: cleanI18n(payload.description_i18n),
            })
            .eq("id", itemId)
      );

      const results = await Promise.all([
        businessUpdate,
        branchUpdate,
        menuUpdate,
        ...sectionUpdates,
        ...itemUpdates,
      ]);

      const failed = results.find((result) => result.error);

      if (failed?.error) throw failed.error;

      toast.success("Languages and translations saved");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["branch-languages", branchId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["branch-menu", branchId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["branch-appearance", branchId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["business", branch.business_id],
        }),
      ]);

      setLocalForm(null);
    } catch (err) {
      toast.error(err.message || "Failed to save translations");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-[620px]" />
      </main>
    );
  }

  if (error || !branch || !menu) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message || "Menu not found"}
        </p>
      </main>
    );
  }

  const sections = sortByOrder(menu.sections || []);

  const filteredSections = sections.filter((section) => {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    const itemText = sortByOrder(section.items || [])
      .map((item) =>
        [
          item.name_ar,
          item.description_ar,
          form.items?.[item.id]?.name_i18n?.[activeLanguage],
          form.items?.[item.id]?.description_i18n?.[activeLanguage],
        ]
          .filter(Boolean)
          .join(" ")
      )
      .join(" ");

    return [
      section.name_ar,
      form.sections?.[section.id]?.name_i18n?.[activeLanguage],
      itemText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Branch Settings"
        title="Languages"
        subtitle={`Enable languages and translate menu content for ${branch.name}.`}
        action={
          <Button
            loading={saving}
            loadingText="Saving..."
            disabled={!dirty || locked || hasNoAllowedLanguages}
            onClick={save}
          >
            <Save size={17} />
            Save
          </Button>
        }
      />

      <BranchTabs branchId={branchId} />

      {locked && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
          <PlanLimitNotice title="Languages locked" text={lockMessage} />
        </section>
      )}

      {hasNoAllowedLanguages && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
          <PlanLimitNotice
            title="No languages available"
            text="This plan does not include any languages. Add at least Arabic to the plan from Owner Plans."
          />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="grid gap-5">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
                  <Globe2 size={24} className="text-[#ff7a00]" />
                  Active languages
                </h2>

                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-white/42">
                  Owner Plans controls which languages are available. Arabic
                  uses the main fields from the menu editor. Hebrew and English
                  use the translation fields below.
                </p>
              </div>

              {activeLanguage && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
                    {activeMeta?.name} progress
                  </p>

                  <p className="mt-2 text-2xl font-black text-white">
                    {progress.completed}/{progress.total}
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#ff7a00]"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              {LANGUAGES.map((language) => {
                const enabled = form.enabled_languages.includes(language.code);
                const isDefault = form.default_language === language.code;
                const languageAllowed = billing
                  ? canUseLanguage(billing, language.code)
                  : false;

                const planLocked = billing && !languageAllowed;

                return (
                  <div
                    key={language.code}
                    className={`rounded-[24px] border p-4 transition ${
                      enabled
                        ? "border-[#ff7a00]/40 bg-[#ff7a00]/10"
                        : "border-white/10 bg-black/25"
                    } ${locked ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black">
                            {language.name}
                          </h3>

                          <span className="text-sm font-bold text-white/45">
                            {language.native}
                          </span>

                          {language.recommended && (
                            <Badge tone="warning">Main</Badge>
                          )}

                          {isDefault && <Badge tone="success">Default</Badge>}

                          {planLocked && (
                            <Badge tone="danger">
                              <Lock size={12} />
                              Plan locked
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-bold text-white/40">
                          {planLocked
                            ? getLimitMessage("languages", billing)
                            : enabled
                              ? "This language is visible on the public menu."
                              : "This language is currently disabled."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={enabled ? "secondary" : "primary"}
                          disabled={locked || (!enabled && planLocked)}
                          onClick={() => toggleLanguage(language.code)}
                        >
                          {enabled ? "Disable" : "Enable"}
                        </Button>

                        <Button
                          variant="secondary"
                          disabled={
                            !enabled || isDefault || locked || planLocked
                          }
                          onClick={() => setDefaultLanguage(language.code)}
                        >
                          <Check size={16} />
                          Set default
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {translationLanguages.length > 0 ? (
            <>
              <Card className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
                      <Languages size={24} className="text-[#ff7a00]" />
                      Translations
                    </h2>

                    <p className="mt-2 text-sm font-bold leading-6 text-white/42">
                      Choose a language and add the public text for business,
                      branch, sections, and items.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {translationLanguages.map((language) => {
                      const active = activeLanguage === language.code;

                      return (
                        <button
                          key={language.code}
                          type="button"
                          onClick={() =>
                            setActiveTranslationLanguage(language.code)
                          }
                          className={`min-h-11 rounded-2xl border px-4 text-sm font-black transition ${
                            active
                              ? "border-[#ff7a00] bg-[#ff7a00] text-black"
                              : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                          }`}
                        >
                          {language.native}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4">
                  <Search size={18} className="text-white/30" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search sections or items..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
                  />
                </label>
              </Card>

              <Card className="p-5">
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  Business, branch, and menu text
                </h2>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <TranslationInput
                    label="Business name"
                    original={branch.businesses?.name}
                    value={form.business.name_i18n?.[activeLanguage] || ""}
                    language={activeLanguage}
                    disabled={locked}
                    onChange={(value) =>
                      updateBusinessField("name_i18n", activeLanguage, value)
                    }
                  />

                  <TranslationInput
                    label="Business description"
                    original={branch.businesses?.description}
                    value={
                      form.business.description_i18n?.[activeLanguage] || ""
                    }
                    language={activeLanguage}
                    multiline
                    disabled={locked}
                    onChange={(value) =>
                      updateBusinessField(
                        "description_i18n",
                        activeLanguage,
                        value
                      )
                    }
                  />

                  <TranslationInput
                    label="Branch name"
                    original={branch.name}
                    value={form.branch.name_i18n?.[activeLanguage] || ""}
                    language={activeLanguage}
                    disabled={locked}
                    onChange={(value) =>
                      updateBranchField("name_i18n", activeLanguage, value)
                    }
                  />

                  <TranslationInput
                    label="Branch address"
                    original={branch.address}
                    value={form.branch.address_i18n?.[activeLanguage] || ""}
                    language={activeLanguage}
                    disabled={locked}
                    onChange={(value) =>
                      updateBranchField("address_i18n", activeLanguage, value)
                    }
                  />

                  <TranslationInput
                    label="Menu name"
                    original={menu.name}
                    value={form.menu.name_i18n?.[activeLanguage] || ""}
                    language={activeLanguage}
                    disabled={locked}
                    onChange={(value) =>
                      updateMenuField("name_i18n", activeLanguage, value)
                    }
                  />

                  <TranslationInput
                    label="Menu description"
                    original={menu.description_ar}
                    value={form.menu.description_i18n?.[activeLanguage] || ""}
                    language={activeLanguage}
                    multiline
                    disabled={locked}
                    onChange={(value) =>
                      updateMenuField(
                        "description_i18n",
                        activeLanguage,
                        value
                      )
                    }
                  />
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  Sections and items
                </h2>

                <div className="mt-5 grid gap-5">
                  {filteredSections.map((section) => (
                    <section
                      key={section.id}
                      className="rounded-[28px] border border-white/10 bg-black/25 p-4"
                    >
                      <TranslationInput
                        label="Section name"
                        original={section.name_ar}
                        value={
                          form.sections?.[section.id]?.name_i18n?.[
                            activeLanguage
                          ] || ""
                        }
                        language={activeLanguage}
                        disabled={locked}
                        onChange={(value) =>
                          updateSectionField(
                            section.id,
                            "name_i18n",
                            activeLanguage,
                            value
                          )
                        }
                      />

                      <div className="mt-4 grid gap-3">
                        {sortByOrder(section.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[24px] border border-white/10 bg-[#111111] p-4"
                          >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-black text-white/60">
                                Item
                              </p>

                              <Badge tone="neutral">₪{item.price}</Badge>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-2">
                              <TranslationInput
                                label="Item name"
                                original={item.name_ar}
                                value={
                                  form.items?.[item.id]?.name_i18n?.[
                                    activeLanguage
                                  ] || ""
                                }
                                language={activeLanguage}
                                disabled={locked}
                                onChange={(value) =>
                                  updateItemField(
                                    item.id,
                                    "name_i18n",
                                    activeLanguage,
                                    value
                                  )
                                }
                              />

                              <TranslationInput
                                label="Item description"
                                original={item.description_ar}
                                value={
                                  form.items?.[item.id]?.description_i18n?.[
                                    activeLanguage
                                  ] || ""
                                }
                                language={activeLanguage}
                                multiline
                                disabled={locked}
                                onChange={(value) =>
                                  updateItemField(
                                    item.id,
                                    "description_i18n",
                                    activeLanguage,
                                    value
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Languages className="mx-auto text-[#ff7a00]" size={42} />

              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">
                No translation language enabled
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-white/42">
                Enable Hebrew or English above. If they are locked, allow them
                from Owner Plans first.
              </p>
            </Card>
          )}
        </div>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl lg:left-[19rem]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved language and translation changes
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={discard} disabled={saving}>
                Discard
              </Button>

              <Button
                onClick={save}
                loading={saving}
                loadingText="Saving..."
                disabled={locked}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TranslationInput({
  label,
  original,
  value,
  language,
  onChange,
  multiline = false,
  disabled = false,
}) {
  const meta = getLanguageMeta(language);
  const originalText = String(original || "").trim();

  return (
    <Field label={label}>
      <div className="grid gap-2 rounded-[22px] border border-white/10 bg-black/25 p-3">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/25">
            Main text
          </p>

          <p className="mt-1 text-sm font-bold leading-6 text-white/55">
            {originalText || "No main text"}
          </p>
        </div>

        {multiline ? (
          <Textarea
            value={value}
            disabled={disabled}
            dir={meta.dir}
            onChange={(event) => onChange(event.target.value)}
            placeholder={`Add ${meta.name} translation...`}
            rows={4}
          />
        ) : (
          <Input
            value={value}
            disabled={disabled}
            dir={meta.dir}
            onChange={(event) => onChange(event.target.value)}
            placeholder={`Add ${meta.name} translation...`}
          />
        )}
      </div>
    </Field>
  );
}