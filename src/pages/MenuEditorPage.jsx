import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { getPublicMenuUrl } from "../lib/urls";
import { slugify } from "../lib/slug";
import { useConfirm } from "../components/ConfirmProvider";
import BranchTabs from "../components/BranchTabs";
import ImageUploadField from "../components/ImageUploadField";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SkeletonCard,
  Stat,
  Textarea,
} from "../components/ui";

import { useBusinessBilling } from "../hooks/useBusinessBilling";
import {
  canCreateItem,
  getLimitMessage,
  isSubscriptionLocked,
} from "../lib/billing";
import PlanLimitNotice from "../components/PlanLimitNotice";


async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      slug,
      status,
      business_id,
      businesses (
        id,
        name,
        slug
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
          slug,
          cover_url,
          sort_order,
          items (
            id,
            name_ar,
            name_i18n,
            description_ar,
            description_i18n,
            price,
            image_url,
            is_available,
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

const LANGUAGE_META = {
  ar: {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    dir: "rtl",
  },
  he: {
    code: "he",
    label: "Hebrew",
    nativeLabel: "עברית",
    dir: "rtl",
  },
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    dir: "ltr",
  },
};

function normalizeEnabledLanguages(menu) {
  const enabled = Array.isArray(menu?.enabled_languages)
    ? menu.enabled_languages
    : ["ar"];

  const clean = enabled.filter((code) => LANGUAGE_META[code]);

  if (!clean.includes("ar")) clean.unshift("ar");

  return [...new Set(clean)];
}

function getExtraLanguages(menu) {
  return normalizeEnabledLanguages(menu).filter((code) => code !== "ar");
}

function cleanI18n(value) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return Object.fromEntries(
    Object.entries(source)
      .map(([key, text]) => [key, typeof text === "string" ? text.trim() : ""])
      .filter(([key, text]) => LANGUAGE_META[key] && text)
  );
}

function setI18nValue(source, language, value) {
  return {
    ...(source || {}),
    [language]: value,
  };
}

export default function MenuEditorPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [sectionName, setSectionName] = useState("");
  const [sectionNameI18n, setSectionNameI18n] = useState({});
  const [addingSection, setAddingSection] = useState(false);

  const [sectionModal, setSectionModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);

  const [deletingSectionId, setDeletingSectionId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [togglingItemId, setTogglingItemId] = useState(null);

  const {
    data: branch,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["branch-menu", branchId],
    queryFn: () => loadBranch(branchId),
    enabled: Boolean(branchId),
  });

  const menu = useMemo(() => {
    return (
      branch?.menu_versions?.find((item) => item.status === "active") ||
      branch?.menu_versions?.[0] ||
      null
    );
  }, [branch]);

  const enabledLanguages = useMemo(() => normalizeEnabledLanguages(menu), [menu]);
  const extraLanguages = useMemo(() => getExtraLanguages(menu), [menu]);


  const sections = useMemo(() => {
    return [...(menu?.sections || [])]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((section) => ({
        ...section,
        items: [...(section.items || [])].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        ),
      }));
  }, [menu]);

  const allItems = sections.flatMap((section) => section.items || []);
  const availableItems = allItems.filter((item) => item.is_available);
  const hiddenItems = allItems.filter((item) => !item.is_available);
  const itemsWithoutImages = allItems.filter((item) => !item.image_url);

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(branch?.business_id);

  const itemCount = allItems.length;
  const locked = Boolean(billing && isSubscriptionLocked(billing));
  const itemLimitReached = Boolean(
    billing && !canCreateItem(billing, itemCount)
  );
  const archived = branch?.status === "archived";

  const itemCreateBlocked =
    billingLoading || Boolean(billingError) || locked || itemLimitReached;

  const itemDisabledMessage = billingLoading
    ? "Billing is still loading. Try again in a second."
    : billingError
      ? billingError.message
      : locked
        ? getLimitMessage("locked", billing)
        : getLimitMessage("items", billing);

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: ["branch-menu", branchId],
    });

    if (branch?.business_id) {
      await queryClient.invalidateQueries({
        queryKey: ["business-billing", branch.business_id],
      });
    }
  }


  async function addSection(e) {
  e.preventDefault();

  if (!sectionName.trim()) return;

  if (locked) {
    toast.error(getLimitMessage("locked", billing));
    return;
  }

  if (archived) {
    toast.error("Restore this branch before editing.");
    return;
  }

  setAddingSection(true);

  try {
    if (!menu?.id) throw new Error("Menu not found.");

    const sectionSlug = slugify(sectionName);

    if (!sectionSlug) {
      throw new Error("Section slug is required.");
    }

    const { data: duplicateSection, error: duplicateError } = await supabase
      .from("sections")
      .select("id")
      .eq("menu_version_id", menu.id)
      .eq("slug", sectionSlug)
      .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (duplicateSection) {
      throw new Error("A section with this slug already exists.");
    }

    const { error } = await supabase.from("sections").insert({
      menu_version_id: menu.id,
      name_ar: sectionName.trim(),
      name_i18n: cleanI18n(sectionNameI18n),
      slug: sectionSlug,
      cover_url: null,
      sort_order: sections.length + 1,
    });

    if (error) throw error;

    setSectionName("");
    setSectionNameI18n({});
    toast.success("Section added");
    refresh();
  } catch (err) {
    toast.error(err.message || "Failed to add section");
  } finally {
    setAddingSection(false);
  }
}

  async function deleteSection(section) {
    if (locked) {
      toast.error(getLimitMessage("locked", billing));
      return;
    }

    if (archived) {
      toast.error("Restore this branch before editing.");
      return;
    }

    const ok = await confirm({
      title: "Delete section?",
      message: `This will delete "${section.name_ar}" and all items inside it.`,
      confirmText: "Delete section",
      danger: true,
    });

    if (!ok) return;

    setDeletingSectionId(section.id);

    try {
      if (section.items?.length) {
        const itemIds = section.items.map((item) => item.id);

        const { error: itemsError } = await supabase
          .from("items")
          .delete()
          .in("id", itemIds);

        if (itemsError) throw itemsError;
      }

      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", section.id);

      if (error) throw error;

      toast.success("Section deleted");
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete section");
    } finally {
      setDeletingSectionId(null);
    }
  }

  async function toggleItem(item) {
    if (locked) {
      toast.error(getLimitMessage("locked", billing));
      return;
    }

    if (archived) {
      toast.error("Restore this branch before editing.");
      return;
    }

    setTogglingItemId(item.id);

    try {
      const { error } = await supabase
        .from("items")
        .update({ is_available: !item.is_available })
        .eq("id", item.id);

      if (error) throw error;

      toast.success(item.is_available ? "Item hidden" : "Item available");
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update item");
    } finally {
      setTogglingItemId(null);
    }
  }

  async function deleteItem(item) {
    if (locked) {
      toast.error(getLimitMessage("locked", billing));
      return;
    }

    if (archived) {
      toast.error("Restore this branch before editing.");
      return;
    }

    const ok = await confirm({
      title: "Delete item?",
      message: `This will delete "${item.name_ar}".`,
      confirmText: "Delete item",
      danger: true,
    });

    if (!ok) return;

    setDeletingItemId(item.id);

    try {
      const { error } = await supabase.from("items").delete().eq("id", item.id);

      if (error) throw error;

      toast.success("Item deleted");
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete item");
    } finally {
      setDeletingItemId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />

        <div className="mt-6 grid gap-5">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error.message}
        </p>
      </main>
    );
  }

  if (!branch || !menu) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          Menu not found.
        </p>
      </main>
    );
  }

  const publicUrl = getPublicMenuUrl(branch.businesses?.slug, branch.slug);

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Menu Editor"
        title={branch.name}
        subtitle={publicUrl}
      />

      <BranchTabs branchId={branchId} />

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-5 sm:px-6">
        {locked && (
          <PlanLimitNotice
            title="Subscription locked"
            text={getLimitMessage("locked", billing)}
          />
        )}

        {billingError && (
          <PlanLimitNotice title="Billing error" text={billingError.message} />
        )}

        {itemLimitReached && !locked && (
          <PlanLimitNotice
            title="Item limit reached"
            text={getLimitMessage("items", billing)}
          />
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
          >
            <ExternalLink size={17} />
            Open Public Menu
          </a>

          <Link
            to={`/branch/${branchId}/general`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-4 text-sm font-black text-black transition hover:bg-white"
          >
            <Settings size={17} />
            Branch Settings
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em]">
              {menu.name || "Main Menu"}
            </h2>

            <p className="mt-1 text-sm font-bold text-white/35">
              Add sections and items for this branch menu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {archived && <Badge tone="warning">Archived branch</Badge>}

            {isFetching && (
              <Badge tone="neutral">
                <Loader2 size={13} className="animate-spin" />
                Syncing
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card className="min-w-0 p-4">
            <Stat label="Sections" value={sections.length} />
          </Card>

          <Card className="min-w-0 p-4">
            <Stat label="Items" value={allItems.length} />
          </Card>

          <Card className="min-w-0 p-4">
            <Stat label="Available" value={availableItems.length} />
          </Card>

          <Card className="min-w-0 p-4">
            <Stat label="Hidden" value={hiddenItems.length} />
          </Card>

          <Card className="min-w-0 p-4">
            <Stat label="No images" value={itemsWithoutImages.length} />
          </Card>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 rounded-[28px] border border-white/10 bg-[#111111] p-5">
            <h2 className="text-xl font-black">Add Section</h2>

            <p className="mt-1 text-sm font-bold leading-6 text-white/40">
              Sections are groups like pizza, drinks, burgers, desserts.
            </p>

            <form onSubmit={addSection} className="mt-4 grid gap-3">
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="مثلاً: بيتزا"
                dir="rtl"
              />

              <TranslationInputGroup
  title="Section translations"
  languages={extraLanguages}
  value={sectionNameI18n}
  onChange={setSectionNameI18n}
  fieldLabel="Section name"
/>

              <Button
                type="submit"
                loading={addingSection}
                loadingText="Adding section..."
                disabled={
                  !sectionName.trim() ||
                  archived ||
                  locked ||
                  Boolean(billingError)
                }
              >
                <Plus size={16} />
                Add Section
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-[#ff7a00]/15 bg-[#ff7a00]/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffbd7c]">
                Menu health
              </p>

              <p className="mt-3 text-sm font-bold leading-6 text-white/55">
                Add images and descriptions to items for a better public menu.
              </p>
            </div>

            {archived && (
              <div className="mt-4 rounded-2xl border border-yellow-400/15 bg-yellow-500/10 p-4">
                <p className="text-sm font-black text-yellow-100">
                  This branch is archived.
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-yellow-100/55">
                  Restore it from Branch Settings before editing.
                </p>
              </div>
            )}
          </aside>

          <div className="grid min-w-0 gap-5">
            {sections.length ? (
              sections.map((section) => (
                <section
                  key={section.id}
                  className="min-w-0 rounded-[28px] border border-white/10 bg-[#111111] p-5"
                >
                  <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2
                        className="truncate text-2xl font-black tracking-[-0.04em]"
                        dir="rtl"
                      >
                        {section.name_ar}
                      </h2>

                      <p className="mt-1 text-sm font-bold text-white/35">
                        {section.items?.length || 0} items
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={archived || locked}
                        onClick={() => setSectionModal(section)}
                      >
                        <Pencil size={15} />
                        Settings
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={deletingSectionId === section.id}
                        loadingText="Deleting..."
                        disabled={archived || locked}
                        onClick={() => deleteSection(section)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={archived || itemCreateBlocked}
                        onClick={() => setItemModal({ section, item: null })}
                      >
                        <Plus size={15} />
                        Item
                      </Button>
                    </div>
                  </div>

                  {section.items?.length ? (
                    <div className="mt-4 grid gap-3">
                      {section.items.map((item) => (
                        <article
                          key={item.id}
                          className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-black/25 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex h-27 w-27 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-white/30">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt="Image"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImagePlus size={22} />
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                              <h3 className="text-lg font-black" dir="rtl">
                                {item.name_ar}
                              </h3>

                              <p
                                className="mt-1 line-clamp-2 text-sm font-bold text-white/40"
                                dir="rtl"
                              >
                                {item.description_ar || "No description"}
                              </p>

                              <p className="shrink-0 text-right text-lg font-black text-[#ff7a00]">
                                ₪{Number(item.price || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap justify-center gap-3">
                            <button
                              type="button"
                              disabled={
                                togglingItemId === item.id || archived || locked
                              }
                              onClick={() => toggleItem(item)}
                              className={`inline-flex min-h-8 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black disabled:opacity-50 ${
                                item.is_available
                                  ? "bg-green-500/10 text-green-200"
                                  : "bg-red-500/10 text-red-200"
                              }`}
                            >
                              {togglingItemId === item.id && (
                                <Loader2 size={13} className="animate-spin" />
                              )}

                              {item.is_available ? "Available" : "Hidden"}
                            </button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={archived || locked}
                              onClick={() => setItemModal({ section, item })}
                            >
                              Edit
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              loading={deletingItemId === item.id}
                              loadingText="Deleting..."
                              disabled={archived || locked}
                              onClick={() => deleteItem(item)}
                            >
                              Delete
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/25 p-6 text-center">
                      <p className="text-sm font-bold text-white/40">
                        No items yet.
                      </p>

                      <Button
                        type="button"
                        className="mt-4"
                        disabled={archived || itemCreateBlocked}
                        onClick={() => setItemModal({ section, item: null })}
                      >
                        <Plus size={16} />
                        Add first item
                      </Button>
                    </div>
                  )}
                </section>
              ))
            ) : (
              <EmptyState
                icon={<Plus size={38} />}
                title="No sections yet"
                text="Add your first section from the left panel. Sections hold items like burgers, drinks, desserts, and more."
              />
            )}
          </div>
        </div>
      </section>

<SectionRenameModal
  section={sectionModal}
  menuId={menu.id}
  enabledLanguages={enabledLanguages}
  locked={locked}
  lockedMessage={getLimitMessage("locked", billing)}
  onClose={() => setSectionModal(null)}
  onDone={() => {
    setSectionModal(null);
    refresh();
  }}
/>

<ItemModal
  key={
    itemModal
      ? `${itemModal.section.id}-${itemModal.item?.id || "new"}`
      : "empty"
  }
  data={itemModal}
  enabledLanguages={enabledLanguages}
  locked={locked}
  itemLimitReached={itemLimitReached}
  disabledMessage={itemDisabledMessage}
  onClose={() => setItemModal(null)}
  onDone={() => {
    setItemModal(null);
    refresh();
  }}
/>
    </main>
  );
}


function SectionRenameModal({
  section,
  menuId,
  enabledLanguages,
  locked,
  lockedMessage,
  onClose,
  onDone,
}) {
  const extraLanguages = enabledLanguages.filter((code) => code !== "ar");

  const [form, setForm] = useState({
    name_ar: section?.name_ar || "",
    name_i18n: section?.name_i18n || {},
    slug: section?.slug || "",
    cover_url: section?.cover_url || "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name_ar: section?.name_ar || "",
      name_i18n: section?.name_i18n || {},
      slug: section?.slug || "",
      cover_url: section?.cover_url || "",
    });
  }, [section]);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(e) {
    e.preventDefault();

    if (!section) return;

    if (locked) {
      toast.error(lockedMessage || "Editing is locked.");
      return;
    }

    const cleanName = form.name_ar.trim();
    const cleanSlug = slugify(form.slug || form.name_ar);

    if (!cleanName) {
      toast.error("Section name is required");
      return;
    }

    if (!cleanSlug) {
      toast.error("Section slug is required");
      return;
    }

    setSaving(true);

    try {
      const { data: duplicateSection, error: duplicateError } = await supabase
        .from("sections")
        .select("id")
        .eq("menu_version_id", menuId)
        .eq("slug", cleanSlug)
        .neq("id", section.id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicateSection) {
        throw new Error("Another section already uses this slug.");
      }

      const { error } = await supabase
        .from("sections")
        .update({
          name_ar: cleanName,
          name_i18n: cleanI18n(form.name_i18n),
          slug: cleanSlug,
          cover_url: form.cover_url.trim() || null,
        })
        .eq("id", section.id);

      if (error) throw error;

      toast.success("Section saved");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(section)} title="Section Settings" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        {locked && (
          <PlanLimitNotice title="Editing locked" text={lockedMessage} />
        )}

        <Field label="Arabic section name">
          <Input
            value={form.name_ar}
            onChange={(e) => updateField("name_ar", e.target.value)}
            dir="rtl"
            placeholder="اسم القسم"
          />
        </Field>

        <TranslationInputGroup
          title="Section translations"
          languages={extraLanguages}
          value={form.name_i18n}
          onChange={(next) => updateField("name_i18n", next)}
          fieldLabel="Section name"
        />

        <Field label="Section slug">
          <Input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            onBlur={() => updateField("slug", slugify(form.slug))}
            dir="ltr"
            placeholder="breakfast"
          />
        </Field>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
            Public section URL
          </p>

          <p
            className="mt-2 break-all text-sm font-black text-[#ff7a00]"
            dir="ltr"
          >
            /{slugify(form.slug || form.name_ar)}
          </p>
        </div>

        <ImageUploadField
          label="Section cover image"
          value={form.cover_url}
          onChange={(url) => updateField("cover_url", url)}
          folder="sections"
          hint="This image appears on the public section card. If empty, the first item image will be used."
        />

        <Button
          type="submit"
          loading={saving}
          loadingText="Saving..."
          disabled={!form.name_ar.trim() || locked}
        >
          Save section
        </Button>
      </form>
    </Modal>
  );
}


function ItemModal({
  data,
  enabledLanguages,
  locked,
  itemLimitReached,
  disabledMessage,
  onClose,
  onDone,
}) {
  const extraLanguages = enabledLanguages.filter((code) => code !== "ar");

  const [loading, setLoading] = useState(false);

  const section = data?.section;
  const item = data?.item;

  const [form, setForm] = useState({
    name_ar: item?.name_ar || "",
    name_i18n: item?.name_i18n || {},
    description_ar: item?.description_ar || "",
    description_i18n: item?.description_i18n || {},
    price: item?.price ?? "",
    image_url: item?.image_url || "",
    is_available: item?.is_available ?? true,
  });

  if (!data) return null;

  const hasImage = Boolean(form.image_url?.trim());
  const isNewItem = !item?.id;
  const blocked = locked || (isNewItem && itemLimitReached);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    if (blocked) {
      toast.error(disabledMessage || "This action is not available.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name_ar: form.name_ar.trim(),
        name_i18n: cleanI18n(form.name_i18n),
        description_ar: form.description_ar.trim() || null,
        description_i18n: cleanI18n(form.description_i18n),
        price: Number(form.price || 0),
        image_url: form.image_url.trim() || null,
        is_available: Boolean(form.is_available),
      };

      if (!payload.name_ar) throw new Error("Item name is required.");

      if (item?.id) {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", item.id);

        if (error) throw error;

        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("items").insert({
          ...payload,
          section_id: section.id,
          sort_order: (section.items?.length || 0) + 1,
        });

        if (error) throw error;

        toast.success("Item created");
      }

      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={true} title={item ? "Edit Item" : "New Item"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        {blocked && (
          <PlanLimitNotice
            title={locked ? "Editing locked" : "Item limit reached"}
            text={disabledMessage}
          />
        )}

        <Field label="Arabic item name">
          <Input
            required
            value={form.name_ar}
            onChange={(e) => updateField("name_ar", e.target.value)}
            placeholder="اسم الصنف"
            dir="rtl"
          />
        </Field>

        <TranslationInputGroup
          title="Item name translations"
          languages={extraLanguages}
          value={form.name_i18n}
          onChange={(next) => updateField("name_i18n", next)}
          fieldLabel="Item name"
        />

        <Field label="Arabic description">
          <Textarea
            value={form.description_ar}
            onChange={(e) => updateField("description_ar", e.target.value)}
            placeholder="وصف قصير"
            dir="rtl"
          />
        </Field>

        <TranslationTextareaGroup
          title="Description translations"
          languages={extraLanguages}
          value={form.description_i18n}
          onChange={(next) => updateField("description_i18n", next)}
          fieldLabel="Item description"
        />

        <Field label="Price">
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            placeholder="25"
            dir="rtl"
          />
        </Field>

        <ImageUploadField
          label="Item image"
          value={form.image_url}
          onChange={(url) => updateField("image_url", url)}
          folder="items"
          hint={
            hasImage
              ? "This image will appear on the public menu."
              : "Add a photo to make this item look better."
          }
        />

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-black">
          <span>
            {form.is_available ? "Item is available" : "Item is hidden"}
          </span>

          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => updateField("is_available", e.target.checked)}
          />
        </label>

        <Button
          type="submit"
          loading={loading}
          loadingText={item ? "Saving item..." : "Creating item..."}
          disabled={!form.name_ar.trim() || blocked}
        >
          {item ? "Save Item" : "Create Item"}
        </Button>
      </form>
    </Modal>
  );
}


function TranslationInputGroup({
  title,
  languages,
  value,
  onChange,
  fieldLabel,
}) {
  if (!languages?.length) return null;

  return (
    <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
        {title}
      </p>

      {languages.map((language) => {
        const meta = LANGUAGE_META[language];

        return (
          <Field key={language} label={`${fieldLabel} · ${meta.label}`}>
            <Input
              value={value?.[language] || ""}
              onChange={(e) =>
                onChange(setI18nValue(value, language, e.target.value))
              }
              placeholder={`${fieldLabel} in ${meta.nativeLabel}`}
              dir={meta.dir}
            />
          </Field>
        );
      })}
    </div>
  );
}

function TranslationTextareaGroup({
  title,
  languages,
  value,
  onChange,
  fieldLabel,
}) {
  if (!languages?.length) return null;

  return (
    <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
        {title}
      </p>

      {languages.map((language) => {
        const meta = LANGUAGE_META[language];

        return (
          <Field key={language} label={`${fieldLabel} · ${meta.label}`}>
            <Textarea
              value={value?.[language] || ""}
              onChange={(e) =>
                onChange(setI18nValue(value, language, e.target.value))
              }
              placeholder={`${fieldLabel} in ${meta.nativeLabel}`}
              dir={meta.dir}
            />
          </Field>
        );
      })}
    </div>
  );
}