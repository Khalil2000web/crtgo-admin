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
  Save,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { getPublicMenuUrl } from "../lib/urls";
import { useConfirm } from "../components/ConfirmProvider";
import ImageUploadField from "../components/ImageUploadField";
import WorkingHoursEditor, {
  getDefaultWorkingHours,
} from "../components/WorkingHoursEditor";
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

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      slug,
      address,
      phone,
      whatsapp,
      instagram,
      facebook,
      tiktok,
      working_hours,
      business_id,
      businesses (
        id,
        name,
        slug
      ),
      menu_versions (
        id,
        name,
        status,
        template_id,
        description_ar,
        cover_url,
        logo_url,
        primary_color,
        background_color,
        text_color,
        sections (
          id,
          name_ar,
          sort_order,
          items (
            id,
            name_ar,
            description_ar,
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

export default function MenuEditorPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [sectionName, setSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [sectionModal, setSectionModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [deletingSectionId, setDeletingSectionId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [togglingItemId, setTogglingItemId] = useState(null);

  const {
    data: branch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branch-menu", branchId],
    queryFn: () => loadBranch(branchId),
  });

  const menu = useMemo(() => {
    return (
      branch?.menu_versions?.find((item) => item.status === "active") ||
      branch?.menu_versions?.[0] ||
      null
    );
  }, [branch]);

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

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["branch-menu", branchId] });
  }

  async function addSection(e) {
    e.preventDefault();
    setAddingSection(true);

    try {
      if (!menu?.id) throw new Error("Menu not found.");
      if (!sectionName.trim()) throw new Error("Section name is required.");

      const { error } = await supabase.from("sections").insert({
        menu_version_id: menu.id,
        name_ar: sectionName.trim(),
        sort_order: sections.length + 1,
      });

      if (error) throw error;

      setSectionName("");
      toast.success("Section added");
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to add section");
    } finally {
      setAddingSection(false);
    }
  }

  async function deleteSection(section) {
    const ok = await confirm({
      title: "Delete section?",
      message: `This will delete "${section.name_ar}" and all items inside it.`,
      confirmText: "Delete section",
      danger: true,
    });

    if (!ok) return;

    setDeletingSectionId(section.id);

    try {
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
      <main className="h-full overflow-y-auto p-5">
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
      <main className="p-5">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error.message}
        </p>
      </main>
    );
  }

  if (!branch || !menu) {
    return (
      <main className="p-5">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          Menu not found.
        </p>
      </main>
    );
  }

  const publicUrl = getPublicMenuUrl(branch.businesses.slug, branch.slug);

  return (
    <main className="h-full overflow-y-auto">
      <PageHeader
        eyebrow="Menu Editor"
        title={branch.name}
        subtitle={publicUrl}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
            >
              <ExternalLink size={17} />
              Open Public Menu
            </a>

            <Button onClick={() => setSettingsOpen(true)}>
              <Save size={17} />
              Settings
            </Button>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <Stat label="Sections" value={sections.length} />
          </Card>

          <Card className="p-4">
            <Stat label="Items" value={allItems.length} />
          </Card>

          <Card className="p-4">
            <Stat label="Available" value={availableItems.length} />
          </Card>

          <Card className="p-4">
            <Stat label="Hidden" value={hiddenItems.length} />
          </Card>

          <Card className="p-4">
            <Stat label="No images" value={itemsWithoutImages.length} />
          </Card>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
          <aside className="h-fit rounded-[28px] border border-white/10 bg-[#111111] p-5">
            <h2 className="text-xl font-black">Add Section</h2>

            <form onSubmit={addSection} className="mt-4 grid gap-3">
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="مثلاً: بيتزا"
                dir="rtl"
              />

              <Button
                loading={addingSection}
                loadingText="Adding section..."
                disabled={!sectionName.trim()}
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
                Add images to menu items for a better public menu experience.
              </p>
            </div>
          </aside>

          <div className="grid gap-5">
            {sections.length ? (
              sections.map((section) => (
                <section
                  key={section.id}
                  className="rounded-[28px] border border-white/10 bg-[#111111] p-5"
                >
                  <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2
                        className="text-2xl font-black tracking-[-0.04em]"
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
                        onClick={() => setSectionModal(section)}
                      >
                        <Pencil size={15} />
                        Rename
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={deletingSectionId === section.id}
                        loadingText="Deleting..."
                        onClick={() => deleteSection(section)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </Button>

                      <Button
                        type="button"
                        size="sm"
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
                          className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-3"
                        >
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-white/30">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImagePlus size={22} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h3
                                  className="truncate text-lg font-black"
                                  dir="rtl"
                                >
                                  {item.name_ar}
                                </h3>

                                <p
                                  className="mt-1 line-clamp-2 max-w-2xl text-sm font-bold text-white/40"
                                  dir="rtl"
                                >
                                  {item.description_ar || "No description"}
                                </p>
                              </div>

                              <p className="shrink-0 text-lg font-black text-[#ff7a00]">
                                ₪{Number(item.price || 0).toFixed(2)}
                              </p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={togglingItemId === item.id}
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
                                onClick={() =>
                                  setItemModal({ section, item })
                                }
                              >
                                Edit
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                loading={deletingItemId === item.id}
                                loadingText="Deleting..."
                                onClick={() => deleteItem(item)}
                              >
                                Delete
                              </Button>
                            </div>
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
        onClose={() => setItemModal(null)}
        onDone={() => {
          setItemModal(null);
          refresh();
        }}
      />

      <MenuSettingsModal
        open={settingsOpen}
        branch={branch}
        menu={menu}
        onClose={() => setSettingsOpen(false)}
        onDone={() => {
          setSettingsOpen(false);
          refresh();
        }}
      />
    </main>
  );
}

function SectionRenameModal({ section, onClose, onDone }) {
  const [name, setName] = useState(section?.name_ar || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(section?.name_ar || "");
  }, [section]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      if (!name.trim()) throw new Error("Section name is required.");

      const { error } = await supabase
        .from("sections")
        .update({ name_ar: name.trim() })
        .eq("id", section.id);

      if (error) throw error;

      toast.success("Section renamed");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to rename section");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(section)} title="Rename Section" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Section name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            dir="rtl"
            placeholder="اسم القسم"
          />
        </Field>

        <Button loading={saving} loadingText="Saving..." disabled={!name.trim()}>
          Save name
        </Button>
      </form>
    </Modal>
  );
}

function ItemModal({ data, onClose, onDone }) {
  const [loading, setLoading] = useState(false);

  const section = data?.section;
  const item = data?.item;

  const [form, setForm] = useState({
    name_ar: item?.name_ar || "",
    description_ar: item?.description_ar || "",
    price: item?.price ?? "",
    image_url: item?.image_url || "",
    is_available: item?.is_available ?? true,
  });

  if (!data) return null;

  const hasImage = Boolean(form.image_url);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name_ar: form.name_ar.trim(),
        description_ar: form.description_ar.trim() || null,
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
        <Field label="Arabic name">
          <Input
            required
            value={form.name_ar}
            onChange={(e) => updateField("name_ar", e.target.value)}
            placeholder="اسم الصنف"
            dir="rtl"
          />
        </Field>

        <Field label="Arabic description">
          <Textarea
            value={form.description_ar}
            onChange={(e) => updateField("description_ar", e.target.value)}
            placeholder="وصف قصير"
            dir="rtl"
          />
        </Field>

        <Field label="Price">
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            placeholder="25"
            dir="ltr"
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
          <span>{form.is_available ? "Item is available" : "Item is hidden"}</span>

          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => updateField("is_available", e.target.checked)}
          />
        </label>

        <Button
          loading={loading}
          loadingText={item ? "Saving item..." : "Creating item..."}
          disabled={!form.name_ar.trim()}
        >
          {item ? "Save Item" : "Create Item"}
        </Button>
      </form>
    </Modal>
  );
}

function MenuSettingsModal({ open, menu, branch, onClose, onDone }) {
  const [loading, setLoading] = useState(false);

  const initialForm = useMemo(() => {
    return {
      menu_name: menu?.name || "Main Menu",
      description_ar: menu?.description_ar || "",
      logo_url: menu?.logo_url || "",
      cover_url: menu?.cover_url || "",
      primary_color: menu?.primary_color || "#ff7a00",
      background_color: menu?.background_color || "#090909",
      text_color: menu?.text_color || "#ffffff",

      branch_name: branch?.name || "",
      address: branch?.address || "",
      phone: branch?.phone || "",
      whatsapp: branch?.whatsapp || "",
      instagram: branch?.instagram || "",
      facebook: branch?.facebook || "",
      tiktok: branch?.tiktok || "",
      working_hours: {
        ...getDefaultWorkingHours(),
        ...(branch?.working_hours || {}),
      },
    };
  }, [menu, branch]);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (open) setForm(initialForm);
  }, [open, initialForm]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function discardChanges() {
    setForm(initialForm);
    toast.success("Changes discarded");
  }

  async function submit(e) {
    e.preventDefault();

    if (!dirty) return;

    setLoading(true);

    try {
      const { error: menuError } = await supabase
        .from("menu_versions")
        .update({
          name: form.menu_name.trim() || "Main Menu",
          description_ar: form.description_ar.trim() || null,
          logo_url: form.logo_url.trim() || null,
          cover_url: form.cover_url.trim() || null,
          primary_color: form.primary_color,
          background_color: form.background_color,
          text_color: form.text_color,
        })
        .eq("id", menu.id);

      if (menuError) throw menuError;

      const { error: branchError } = await supabase
        .from("branches")
        .update({
          name: form.branch_name.trim() || branch.name,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram: form.instagram.trim() || null,
          facebook: form.facebook.trim() || null,
          tiktok: form.tiktok.trim() || null,
          working_hours: form.working_hours,
        })
        .eq("id", branch.id);

      if (branchError) throw branchError;

      toast.success("Settings saved");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Menu & Branch Settings"
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={submit} className="grid gap-5">
        <Card className="p-5">
          <h3 className="text-xl font-black">General</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Menu name">
              <Input
                value={form.menu_name}
                onChange={(e) => updateField("menu_name", e.target.value)}
                placeholder="Main Menu"
              />
            </Field>

            <Field label="Branch name">
              <Input
                value={form.branch_name}
                onChange={(e) => updateField("branch_name", e.target.value)}
                placeholder="Main Branch"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Arabic menu description">
              <Textarea
                value={form.description_ar}
                onChange={(e) =>
                  updateField("description_ar", e.target.value)
                }
                placeholder="وصف قصير للقائمة"
                dir="rtl"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-xl font-black">Contact & Social</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Address">
              <Input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Street, city..."
              />
            </Field>

            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="0500000000"
                dir="ltr"
              />
            </Field>

            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="972500000000"
                dir="ltr"
              />
            </Field>

            <Field label="Instagram">
              <Input
                value={form.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                placeholder="@restaurant"
                dir="ltr"
              />
            </Field>

            <Field label="Facebook">
              <Input
                value={form.facebook}
                onChange={(e) => updateField("facebook", e.target.value)}
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
            </Field>

            <Field label="TikTok">
              <Input
                value={form.tiktok}
                onChange={(e) => updateField("tiktok", e.target.value)}
                placeholder="@restaurant"
                dir="ltr"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-xl font-black">Images</h3>

          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <ImageUploadField
              label="Logo"
              value={form.logo_url}
              onChange={(url) => updateField("logo_url", url)}
              folder="menu-logo"
              hint={
                form.logo_url
                  ? "Logo is added. Change or delete it."
                  : "Add a logo for the public menu header."
              }
            />

            <ImageUploadField
              label="Cover image"
              value={form.cover_url}
              onChange={(url) => updateField("cover_url", url)}
              folder="menu-cover"
              hint={
                form.cover_url
                  ? "Cover image is added. Change or delete it."
                  : "Add a cover image for the public menu hero."
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-xl font-black">Appearance</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Primary color">
              <Input
                type="color"
                value={form.primary_color}
                onChange={(e) => updateField("primary_color", e.target.value)}
              />
            </Field>

            <Field label="Background">
              <Input
                type="color"
                value={form.background_color}
                onChange={(e) =>
                  updateField("background_color", e.target.value)
                }
              />
            </Field>

            <Field label="Text">
              <Input
                type="color"
                value={form.text_color}
                onChange={(e) => updateField("text_color", e.target.value)}
              />
            </Field>
          </div>

          <div
            className="mt-5 rounded-[24px] border border-white/10 p-5"
            style={{
              backgroundColor: form.background_color,
              color: form.text_color,
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
              Preview
            </p>

            <h4 className="mt-3 text-2xl font-black">{form.menu_name}</h4>

            <p className="mt-2 text-sm font-bold opacity-65" dir="rtl">
              {form.description_ar || "وصف القائمة سيظهر هنا"}
            </p>

            <button
              type="button"
              className="mt-4 rounded-2xl px-4 py-2 text-sm font-black"
              style={{
                backgroundColor: form.primary_color,
                color: "#000000",
              }}
            >
              Example button
            </button>
          </div>
        </Card>

        <WorkingHoursEditor
          value={form.working_hours}
          onChange={(hours) => updateField("working_hours", hours)}
        />

        <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-white/10 bg-[#111111]/95 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={`text-sm font-black ${
                dirty ? "text-[#ffbd7c]" : "text-green-200"
              }`}
            >
              {dirty ? "You have unsaved changes" : "Everything saved"}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!dirty || loading}
                onClick={discardChanges}
              >
                Discard
              </Button>

              <Button
                type="submit"
                loading={loading}
                loadingText="Saving settings..."
                disabled={!dirty}
              >
                Save settings
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}