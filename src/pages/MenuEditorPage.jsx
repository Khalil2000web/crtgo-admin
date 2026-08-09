import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
} from "react-router-dom";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { useConfirm } from "../components/ConfirmProvider";
import ProjectTabs from "../components/ProjectTabs";
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

import {
  SECTION_EMOJIS,
  SECTION_ICONS,
} from "../lib/sectionIcons";

async function loadProjectMenu(
  projectId
) {
  const { data, error } =
    await supabase
      .from("projects")
      .select(`
        id,
        name,
        slug,
        status,
        enabled_languages,
        default_language,

sections (
  id,
  project_id,
  name,
  description,
  cover_url,
  icon_type,
  icon_value,
  sort_order,
  name_i18n,
  description_i18n,

          items (
            id,
            section_id,
            name,
            description,
            price,
            image_url,
            is_available,
            sort_order,
            name_i18n,
            description_i18n
          )
        )
      `)
      .eq("id", projectId)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

function sortByOrder(
  items = []
) {
  return [...items].sort(
    (a, b) =>
      Number(a.sort_order || 0) -
      Number(b.sort_order || 0)
  );
}

export default function MenuEditorPage() {
  const { projectId } =
    useParams();

  const queryClient =
    useQueryClient();

  const confirm =
    useConfirm();

const [
  newSection,
  setNewSection,
] = useState({
  name: "",
  icon_type: "none",
  icon_value: "",
});

  const [
    addingSection,
    setAddingSection,
  ] = useState(false);

  const [
    sectionModal,
    setSectionModal,
  ] = useState(null);

  const [
    itemModal,
    setItemModal,
  ] = useState(null);

  const [
    deletingSectionId,
    setDeletingSectionId,
  ] = useState(null);

  const [
    deletingItemId,
    setDeletingItemId,
  ] = useState(null);

  const [
    togglingItemId,
    setTogglingItemId,
  ] = useState(null);

  const {
    data: project,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      "project-menu",
      projectId,
    ],
    queryFn: () =>
      loadProjectMenu(
        projectId
      ),
    enabled: Boolean(projectId),
  });

  const sections =
    useMemo(() => {
      return sortByOrder(
        project?.sections || []
      ).map((section) => ({
        ...section,
        items: sortByOrder(
          section.items || []
        ),
      }));
    }, [project]);

  const allItems =
    sections.flatMap(
      (section) =>
        section.items || []
    );

  const availableItems =
    allItems.filter(
      (item) =>
        item.is_available
    );

  const hiddenItems =
    allItems.filter(
      (item) =>
        !item.is_available
    );

  const itemsWithoutImages =
    allItems.filter(
      (item) =>
        !item.image_url
    );

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: [
        "project-menu",
        projectId,
      ],
    });
  }

async function addSection(e) {
  e.preventDefault();

  const name =
    newSection.name.trim();

  if (!name) {
    return;
  }

  setAddingSection(true);

  try {
    const { error } =
      await supabase
        .from("sections")
        .insert({
          project_id:
            projectId,

          name,

          icon_type:
            newSection.icon_type,

          icon_value:
            newSection.icon_type === "none"
              ? null
              : newSection.icon_value || null,

          sort_order:
            sections.length + 1,
        });

    if (error) {
      throw error;
    }

    setNewSection({
      name: "",
      icon_type: "none",
      icon_value: "",
    });

    toast.success(
      "Section added"
    );

    await refresh();
  } catch (err) {
    toast.error(
      err.message ||
        "Failed to add section"
    );
  } finally {
    setAddingSection(false);
  }
}

  async function deleteSection(
    section
  ) {
    const ok = await confirm({
      title: "Delete section?",
      message: `This deletes "${section.name}" and every item inside it.`,
      confirmText:
        "Delete section",
      danger: true,
    });

    if (!ok) {
      return;
    }

    setDeletingSectionId(
      section.id
    );

    try {
      /*
       * items.section_id uses ON DELETE CASCADE.
       */
      const { error } =
        await supabase
          .from("sections")
          .delete()
          .eq(
            "id",
            section.id
          );

      if (error) {
        throw error;
      }

      toast.success(
        "Section deleted"
      );

      await refresh();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to delete section"
      );
    } finally {
      setDeletingSectionId(
        null
      );
    }
  }

  async function toggleItem(
    item
  ) {
    setTogglingItemId(
      item.id
    );

    try {
      const { error } =
        await supabase
          .from("items")
          .update({
            is_available:
              !item.is_available,
          })
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      toast.success(
        item.is_available
          ? "Item hidden"
          : "Item available"
      );

      await refresh();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to update item"
      );
    } finally {
      setTogglingItemId(
        null
      );
    }
  }

  async function deleteItem(
    item
  ) {
    const ok = await confirm({
      title: "Delete item?",
      message: `This deletes "${item.name}".`,
      confirmText:
        "Delete item",
      danger: true,
    });

    if (!ok) {
      return;
    }

    setDeletingItemId(
      item.id
    );

    try {
      const { error } =
        await supabase
          .from("items")
          .delete()
          .eq("id", item.id);

      if (error) {
        throw error;
      }

      toast.success(
        "Item deleted"
      );

      await refresh();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to delete item"
      );
    } finally {
      setDeletingItemId(
        null
      );
    }
  }

  if (isLoading) {
    return (
      <main className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-[600px]" />
      </main>
    );
  }

  if (
    error ||
    !project
  ) {
    return (
      <main className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
          {error?.message ||
            "Website not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#090909] pb-32 text-white">
      <PageHeader
        eyebrow="Menu Editor"
        title={project.name}
        subtitle="Create sections and items for this website."
      />

      <ProjectTabs
        projectId={projectId}
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black">
            Menu
          </h2>

          {isFetching && (
            <Badge tone="neutral">
              <Loader2
                size={13}
                className="animate-spin"
              />
              Syncing
            </Badge>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card className="p-4">
            <Stat
              label="Sections"
              value={
                sections.length
              }
            />
          </Card>

          <Card className="p-4">
            <Stat
              label="Items"
              value={
                allItems.length
              }
            />
          </Card>

          <Card className="p-4">
            <Stat
              label="Available"
              value={
                availableItems.length
              }
            />
          </Card>

          <Card className="p-4">
            <Stat
              label="Hidden"
              value={
                hiddenItems.length
              }
            />
          </Card>

          <Card className="p-4">
            <Stat
              label="No Images"
              value={
                itemsWithoutImages.length
              }
            />
          </Card>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[28px] border border-white/10 bg-[#111111] p-5">
            <h2 className="text-xl font-black">
              Add Section
            </h2>

            <p className="mt-1 text-sm font-bold leading-6 text-white/40">
              Examples: burgers, drinks, desserts.
            </p>

<form
  onSubmit={addSection}
  className="mt-4 grid gap-4"
>
  <div>
    <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-white/30">
      SECTION NAME
    </p>

    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-3">
      {newSection.icon_type !==
        "none" &&
        newSection.icon_value && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white">
            <SelectedSectionIcon
              type={
                newSection.icon_type
              }
              value={
                newSection.icon_value
              }
            />
          </div>
        )}

      <input
        value={
          newSection.name
        }
        onChange={(e) =>
          setNewSection(
            (current) => ({
              ...current,
              name:
                e.target.value,
            })
          )
        }
        placeholder="Burgers"
        className="min-h-12 w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
      />
    </div>
  </div>

  <SectionIconPicker
    type={
      newSection.icon_type
    }
    value={
      newSection.icon_value
    }
    onChange={(
      type,
      value
    ) =>
      setNewSection(
        (current) => ({
          ...current,
          icon_type: type,
          icon_value: value,
        })
      )
    }
  />

  <Button
    type="submit"
    loading={
      addingSection
    }
    loadingText="Adding..."
    disabled={
      !newSection.name.trim()
    }
  >
    <Plus size={16} />

    Add Section
  </Button>
</form>
          </aside>

          <div className="grid gap-5">
            {sections.length ? (
              sections.map(
                (section) => (
                  <section
                    key={
                      section.id
                    }
                    className="rounded-[28px] border border-white/10 bg-[#111111] p-5"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
<div className="flex items-center gap-3">
  {section.icon_type !==
    "none" &&
    section.icon_value && (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white">
        <AdminSectionIcon
          section={section}
        />
      </div>
    )}

  <div className="min-w-0">
    <h2 className="truncate text-2xl font-black">
      {section.name}
    </h2>

    {section.description && (
      <p className="mt-1 text-sm font-bold text-white/35">
        {section.description}
      </p>
    )}
  </div>
</div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setSectionModal(
                              section
                            )
                          }
                        >
                          <Pencil
                            size={15}
                          />
                          Edit
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          loading={
                            deletingSectionId ===
                            section.id
                          }
                          onClick={() =>
                            deleteSection(
                              section
                            )
                          }
                        >
                          <Trash2
                            size={15}
                          />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() =>
                            setItemModal({
                              section,
                              item: null,
                            })
                          }
                        >
                          <Plus
                            size={15}
                          />
                          Item
                        </Button>
                      </div>
                    </div>

                    {section.items
                      ?.length ? (
                      <div className="mt-4 grid gap-3">
                        {section.items.map(
                          (item) => (
                            <article
                              key={
                                item.id
                              }
                              className="rounded-2xl border border-white/10 bg-black/25 p-3"
                            >
                              <div className="flex gap-4">
                                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-white/30">
                                  {item.image_url ? (
                                    <img
                                      src={
                                        item.image_url
                                      }
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImagePlus
                                      size={
                                        22
                                      }
                                    />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-lg font-black">
                                        {
                                          item.name
                                        }
                                      </h3>

                                      {item.description && (
                                        <p className="mt-1 line-clamp-2 text-sm font-bold text-white/40">
                                          {
                                            item.description
                                          }
                                        </p>
                                      )}
                                    </div>

                                    <p className="shrink-0 text-lg font-black text-[#ff7a00]">
                                      ₪
                                      {Number(
                                        item.price ||
                                          0
                                      ).toFixed(
                                        2
                                      )}
                                    </p>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={
                                        togglingItemId ===
                                        item.id
                                      }
                                      onClick={() =>
                                        toggleItem(
                                          item
                                        )
                                      }
                                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                                        item.is_available
                                          ? "bg-green-500/10 text-green-200"
                                          : "bg-red-500/10 text-red-200"
                                      }`}
                                    >
                                      {item.is_available
                                        ? "Available"
                                        : "Hidden"}
                                    </button>

                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        setItemModal(
                                          {
                                            section,
                                            item,
                                          }
                                        )
                                      }
                                    >
                                      Edit
                                    </Button>

                                    <Button
                                      variant="danger"
                                      size="sm"
                                      loading={
                                        deletingItemId ===
                                        item.id
                                      }
                                      onClick={() =>
                                        deleteItem(
                                          item
                                        )
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/25 p-6 text-center">
                        <p className="text-sm font-bold text-white/40">
                          No items yet.
                        </p>

                        <Button
                          className="mt-4"
                          onClick={() =>
                            setItemModal({
                              section,
                              item: null,
                            })
                          }
                        >
                          <Plus
                            size={16}
                          />
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </section>
                )
              )
            ) : (
              <EmptyState
                icon={
                  <Plus
                    size={38}
                  />
                }
                title="No sections yet"
                text="Add the first section to start building the menu."
              />
            )}
          </div>
        </div>
      </section>

      <SectionModal
        section={sectionModal}
        onClose={() =>
          setSectionModal(null)
        }
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
        onClose={() =>
          setItemModal(null)
        }
        onDone={() => {
          setItemModal(null);
          refresh();
        }}
      />
    </main>
  );
}

function SectionModal({
  section,
  onClose,
  onDone,
}) {
  const [saving, setSaving] =
    useState(false);

const [form, setForm] =
  useState({
    name: "",
    description: "",
    cover_url: "",
    icon_type: "none",
    icon_value: "",
  });

useEffect(() => {
  setForm({
    name:
      section?.name || "",

    description:
      section?.description || "",

    cover_url:
      section?.cover_url || "",

    icon_type:
      section?.icon_type ||
      "none",

    icon_value:
      section?.icon_value ||
      "",
  });
}, [section]);

  if (!section) {
    return null;
  }

  async function submit(e) {
    e.preventDefault();

    const name =
      form.name.trim();

    if (!name) {
      toast.error(
        "Section name is required"
      );

      return;
    }

    setSaving(true);

    try {
const { error } =
  await supabase
    .from("sections")
    .update({
      name,

      description:
        form.description.trim() ||
        null,

      cover_url:
        form.cover_url.trim() ||
        null,

      icon_type:
        form.icon_type,

      icon_value:
        form.icon_type === "none"
          ? null
          : form.icon_value || null,
    })
          .eq(
            "id",
            section.id
          );

      if (error) {
        throw error;
      }

      toast.success(
        "Section saved"
      );

      onDone();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to save section"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(section)}
      title="Section Settings"
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        className="grid gap-4"
      >
        <Field label="Section name">
          <Input
            value={form.name}
            onChange={(e) =>
              setForm(
                (current) => ({
                  ...current,
                  name:
                    e.target.value,
                })
              )
            }
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={
              form.description
            }
            onChange={(e) =>
              setForm(
                (current) => ({
                  ...current,
                  description:
                    e.target.value,
                })
              )
            }
          />
        </Field>

                <SectionIconPicker
  type={form.icon_type}
  value={form.icon_value}
  onChange={(type, value) =>
    setForm((current) => ({
      ...current,
      icon_type: type,
      icon_value: value,
    }))
  }
/>

        <ImageUploadField
          label="Section cover"
          value={
            form.cover_url
          }
          onChange={(url) =>
            setForm(
              (current) => ({
                ...current,
                cover_url: url,
              })
            )
          }
          folder={`sections/${section.id}`}
        />

        <Button
          type="submit"
          loading={saving}
          disabled={
            !form.name.trim()
          }
        >
          Save Section
        </Button>
      </form>
    </Modal>
  );
}

function ItemModal({
  data,
  onClose,
  onDone,
}) {
  const [loading, setLoading] =
    useState(false);

  const section =
    data?.section;

  const item =
    data?.item;

  const [form, setForm] =
    useState({
      name:
        item?.name || "",
      description:
        item?.description ||
        "",
      price:
        item?.price ?? "",
      image_url:
        item?.image_url || "",
      is_available:
        item?.is_available ??
        true,
    });

  if (!data) {
    return null;
  }

  function updateField(
    key,
    value
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(e) {
    e.preventDefault();

    const name =
      form.name.trim();

    if (!name) {
      toast.error(
        "Item name is required."
      );

      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        description:
          form.description.trim() ||
          null,
        price: Number(
          form.price || 0
        ),
        image_url:
          form.image_url.trim() ||
          null,
        is_available:
          Boolean(
            form.is_available
          ),
      };

      if (item?.id) {
        const { error } =
          await supabase
            .from("items")
            .update(payload)
            .eq(
              "id",
              item.id
            );

        if (error) {
          throw error;
        }

        toast.success(
          "Item updated"
        );
      } else {
        const { error } =
          await supabase
            .from("items")
            .insert({
              ...payload,
              section_id:
                section.id,
              sort_order:
                (section.items
                  ?.length || 0) +
                1,
            });

        if (error) {
          throw error;
        }

        toast.success(
          "Item created"
        );
      }

      onDone();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to save item"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      title={
        item
          ? "Edit Item"
          : "New Item"
      }
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        className="grid gap-4"
      >
        <Field label="Item name">
          <Input
            required
            value={form.name}
            onChange={(e) =>
              updateField(
                "name",
                e.target.value
              )
            }
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={
              form.description
            }
            onChange={(e) =>
              updateField(
                "description",
                e.target.value
              )
            }
          />
        </Field>

        <Field label="Price">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) =>
              updateField(
                "price",
                e.target.value
              )
            }
            dir="ltr"
          />
        </Field>

        <ImageUploadField
          label="Item image"
          value={
            form.image_url
          }
          onChange={(url) =>
            updateField(
              "image_url",
              url
            )
          }
          folder={`items/${section.id}`}
        />

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-black">
          <span>
            {form.is_available
              ? "Item is available"
              : "Item is hidden"}
          </span>

          <input
            type="checkbox"
            checked={
              form.is_available
            }
            onChange={(e) =>
              updateField(
                "is_available",
                e.target.checked
              )
            }
          />
        </label>

        <Button
          type="submit"
          loading={loading}
          disabled={
            !form.name.trim()
          }
        >
          {item
            ? "Save Item"
            : "Create Item"}
        </Button>
      </form>
    </Modal>
  );
}


function SectionIconPicker({
  type,
  value,
  onChange,
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">
            أيقونة القسم
          </p>

          <p className="mt-1 text-xs font-bold text-white/35">
            ستظهر بجانب اسم القسم في الموقع.
          </p>
        </div>
      </div>

      {/* TYPE */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <IconTypeButton
          active={type === "none"}
          onClick={() =>
            onChange(
              "none",
              ""
            )
          }
        >
          بدون
        </IconTypeButton>

        <IconTypeButton
          active={
            type === "lucide"
          }
          onClick={() =>
            onChange(
              "lucide",
              type === "lucide"
                ? value
                : "utensils"
            )
          }
        >
          أيقونات CRTGO
        </IconTypeButton>

        <IconTypeButton
          active={
            type === "emoji"
          }
          onClick={() =>
            onChange(
              "emoji",
              type === "emoji"
                ? value
                : "🍔"
            )
          }
        >
          رموز
        </IconTypeButton>
      </div>

      {/* CRTGO ICONS */}
      {type === "lucide" && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-white/30">
            CRTGO ICONS
          </p>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Object.entries(
              SECTION_ICONS
            ).map(
              ([
                key,
                config,
              ]) => {
                const Icon =
                  config.icon;

                const selected =
                  value === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onChange(
                        "lucide",
                        key
                      )
                    }
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center transition ${
                      selected
                        ? "border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]"
                        : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                    />

                    <span className="max-w-full truncate text-[10px] font-black">
                      {
                        config.label
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* EMOJIS */}
      {type === "emoji" && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-white/30">
            SYMBOLS
          </p>

          <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {SECTION_EMOJIS.map(
              (emoji) => {
                const selected =
                  value === emoji;

                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      onChange(
                        "emoji",
                        emoji
                      )
                    }
                    className={`flex aspect-square items-center justify-center rounded-2xl border text-xl transition ${
                      selected
                        ? "border-[#ff7a00] bg-[#ff7a00]/10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {type !== "none" &&
        value && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/30">
                PREVIEW
              </p>

              <p className="mt-1 text-sm font-bold text-white/60">
                هكذا ستظهر الأيقونة
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
              <SelectedSectionIcon
                type={type}
                value={value}
              />
            </div>
          </div>
        )}
    </div>
  );
}

function IconTypeButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-2xl border px-3 text-xs font-black transition ${
        active
          ? "border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]"
          : "border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}


function SelectedSectionIcon({
  type,
  value,
}) {
  if (type === "emoji") {
    return (
      <span className="text-2xl">
        {value}
      </span>
    );
  }

  if (type === "lucide") {
    const config =
      SECTION_ICONS[value];

    if (!config) {
      return null;
    }

    const Icon =
      config.icon;

    return (
      <Icon
        size={23}
        strokeWidth={2}
      />
    );
  }

  return null;
}

function AdminSectionIcon({
  section,
}) {
  if (
    section.icon_type ===
    "emoji"
  ) {
    return (
      <span className="text-xl leading-none">
        {section.icon_value}
      </span>
    );
  }

  if (
    section.icon_type ===
    "lucide"
  ) {
    const config =
      SECTION_ICONS[
        section.icon_value
      ];

    if (!config) {
      return null;
    }

    const Icon =
      config.icon;

    return (
      <Icon
        size={21}
        strokeWidth={2}
      />
    );
  }

  return null;
}

