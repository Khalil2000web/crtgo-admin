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

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import {
  useConfirm,
} from "../components/ConfirmProvider";

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
  const {
    data,
    error,
  } = await supabase
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
    .eq(
      "id",
      projectId
    )
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
    (
      a,
      b
    ) =>
      Number(
        a.sort_order || 0
      ) -
      Number(
        b.sort_order || 0
      )
  );
}


export default function MenuEditorPage() {
  const {
    projectId,
  } = useParams();

  const {
    t,
    dir,
  } = useAdminI18n();

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

    enabled:
      Boolean(projectId),
  });


  const sections =
    useMemo(() => {
      return sortByOrder(
        project?.sections ||
          []
      ).map(
        (section) => ({
          ...section,

          items:
            sortByOrder(
              section.items ||
                []
            ),
        })
      );
    }, [
      project,
    ]);


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
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "project-menu",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-languages",
          projectId,
        ],
      }),
    ]);
  }


  async function addSection(
    event
  ) {
    event.preventDefault();

    const name =
      newSection.name.trim();

    if (!name) {
      toast.error(
        t(
          "menuEditor.sectionNameRequired"
        )
      );

      return;
    }


    setAddingSection(
      true
    );


    try {
      const {
        error,
      } = await supabase
        .from("sections")
        .insert({
          project_id:
            projectId,

          name,

          icon_type:
            newSection.icon_type,

          icon_value:
            newSection.icon_type ===
            "none"
              ? null
              : newSection.icon_value ||
                null,

          sort_order:
            sections.length +
            1,
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
        t(
          "menuEditor.sectionAdded"
        )
      );


      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "menuEditor.sectionAddFailed"
          )
      );
    } finally {
      setAddingSection(
        false
      );
    }
  }


  async function deleteSection(
    section
  ) {
    const ok =
      await confirm({
        title:
          t(
            "menuEditor.deleteSectionTitle"
          ),

        message:
          t(
            "menuEditor.deleteSectionMessage",
            {
              name:
                section.name,
            }
          ),

        confirmText:
          t(
            "menuEditor.deleteSection"
          ),

        danger:
          true,
      });


    if (!ok) {
      return;
    }


    setDeletingSectionId(
      section.id
    );


    try {
      const {
        error,
      } = await supabase
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
        t(
          "menuEditor.sectionDeleted"
        )
      );


      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "menuEditor.sectionDeleteFailed"
          )
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
      const {
        error,
      } = await supabase
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
          ? t(
              "menuEditor.itemHidden"
            )
          : t(
              "menuEditor.itemAvailable"
            )
      );


      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "menuEditor.itemUpdateFailed"
          )
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
    const ok =
      await confirm({
        title:
          t(
            "menuEditor.deleteItemTitle"
          ),

        message:
          t(
            "menuEditor.deleteItemMessage",
            {
              name:
                item.name,
            }
          ),

        confirmText:
          t(
            "menuEditor.deleteItem"
          ),

        danger:
          true,
      });


    if (!ok) {
      return;
    }


    setDeletingItemId(
      item.id
    );


    try {
      const {
        error,
      } = await supabase
        .from("items")
        .delete()
        .eq(
          "id",
          item.id
        );


      if (error) {
        throw error;
      }


      toast.success(
        t(
          "menuEditor.itemDeleted"
        )
      );


      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "menuEditor.itemDeleteFailed"
          )
      );
    } finally {
      setDeletingItemId(
        null
      );
    }
  }


  if (isLoading) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
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
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
          {error?.message ||
            t(
              "project.notFound"
            )}
        </p>
      </main>
    );
  }


  return (
    <main
      dir={dir}
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#090909] pb-32 text-white"
    >
      <PageHeader
        eyebrow={t(
          "menuEditor.eyebrow"
        )}
        title={
          project.name
        }
        subtitle={t(
          "menuEditor.subtitle"
        )}
      />


      <ProjectTabs
        projectId={
          projectId
        }
      />


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-black">
            {t(
              "project.menu"
            )}
          </h2>


          {isFetching && (
            <Badge tone="neutral">
              <Loader2
                size={13}
                className="animate-spin"
              />

              {t(
                "common.syncing"
              )}
            </Badge>
          )}
        </div>


        {/* STATS */}

        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card className="p-4">
            <Stat
              label={t(
                "project.sections"
              )}
              value={
                sections.length
              }
            />
          </Card>


          <Card className="p-4">
            <Stat
              label={t(
                "project.items"
              )}
              value={
                allItems.length
              }
            />
          </Card>


          <Card className="p-4">
            <Stat
              label={t(
                "project.available"
              )}
              value={
                availableItems.length
              }
            />
          </Card>


          <Card className="p-4">
            <Stat
              label={t(
                "project.hidden"
              )}
              value={
                hiddenItems.length
              }
            />
          </Card>


          <Card className="p-4">
            <Stat
              label={t(
                "project.noImages"
              )}
              value={
                itemsWithoutImages.length
              }
            />
          </Card>
        </div>


        <div className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* ADD SECTION */}

          <aside className="h-fit rounded-[28px] border border-white/10 bg-[#111111] p-5">
            <h2 className="text-xl font-black">
              {t(
                "project.addSection"
              )}
            </h2>


            <p className="mt-1 text-sm font-bold leading-6 text-white/40">
              {t(
                "menuEditor.addSectionHint"
              )}
            </p>


            <form
              onSubmit={
                addSection
              }
              className="mt-4 grid gap-4"
            >
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-white/30">
                  {t(
                    "project.sectionName"
                  )}
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
                    onChange={(
                      event
                    ) =>
                      setNewSection(
                        (
                          current
                        ) => ({
                          ...current,

                          name:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder={t(
                      "menuEditor.sectionPlaceholder"
                    )}
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
                    (
                      current
                    ) => ({
                      ...current,

                      icon_type:
                        type,

                      icon_value:
                        value,
                    })
                  )
                }
              />


              <Button
                type="submit"
                loading={
                  addingSection
                }
                loadingText={t(
                  "menuEditor.adding"
                )}
                disabled={
                  !newSection.name.trim()
                }
              >
                <Plus
                  size={16}
                />

                {t(
                  "project.addSection"
                )}
              </Button>
            </form>
          </aside>


          {/* SECTIONS */}

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

                      {/* SECTION HEADER */}

                      <div className="flex min-w-0 items-center gap-3">
                        {section.icon_type !==
                          "none" &&
                          section.icon_value && (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white">
                              <AdminSectionIcon
                                section={
                                  section
                                }
                              />
                            </div>
                          )}


                        <div className="min-w-0">
                          <h2 className="truncate text-2xl font-black">
                            {
                              section.name
                            }
                          </h2>


                          {section.description && (
                            <p className="mt-1 text-sm font-bold text-white/35">
                              {
                                section.description
                              }
                            </p>
                          )}
                        </div>
                      </div>


                      {/* SECTION ACTIONS */}

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
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

                          {t(
                            "common.edit"
                          )}
                        </Button>


                        <Button
                          type="button"
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
                          type="button"
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

                          {t(
                            "menuEditor.item"
                          )}
                        </Button>
                      </div>
                    </div>


                    {/* ITEMS */}

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

                                {/* IMAGE */}

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
                                      size={22}
                                    />
                                  )}
                                </div>


                                {/* INFO */}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
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


                                    <p
                                      className="shrink-0 text-lg font-black text-[#ff7a00]"
                                      dir="ltr"
                                    >
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
                                      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                                        item.is_available
                                          ? "bg-green-500/10 text-green-200 hover:bg-green-500/15"
                                          : "bg-red-500/10 text-red-200 hover:bg-red-500/15"
                                      }`}
                                    >
                                      {togglingItemId ===
                                      item.id ? (
                                        <Loader2
                                          size={14}
                                          className="animate-spin"
                                        />
                                      ) : item.is_available ? (
                                        t(
                                          "project.available"
                                        )
                                      ) : (
                                        t(
                                          "project.hidden"
                                        )
                                      )}
                                    </button>


                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        setItemModal({
                                          section,
                                          item,
                                        })
                                      }
                                    >
                                      {t(
                                        "common.edit"
                                      )}
                                    </Button>


                                    <Button
                                      type="button"
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
                                      {t(
                                        "common.delete"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          )
                        )}
                      </div>
                    ) : (

                      /* NO ITEMS */

                      <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/25 p-6 text-center">
                        <p className="text-sm font-bold text-white/40">
                          {t(
                            "menuEditor.noItems"
                          )}
                        </p>


                        <Button
                          type="button"
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

                          {t(
                            "menuEditor.addFirstItem"
                          )}
                        </Button>
                      </div>
                    )}
                  </section>
                )
              )
            ) : (

              /* NO SECTIONS */

              <EmptyState
                icon={
                  <Plus
                    size={38}
                  />
                }
                title={t(
                  "menuEditor.noSections"
                )}
                text={t(
                  "menuEditor.noSectionsHint"
                )}
              />
            )}
          </div>
        </div>
      </section>


      <SectionModal
        section={
          sectionModal
        }
        onClose={() =>
          setSectionModal(
            null
          )
        }
        onDone={() => {
          setSectionModal(
            null
          );

          refresh();
        }}
      />


      <ItemModal
        key={
          itemModal
            ? `${itemModal.section.id}-${itemModal.item?.id || "new"}`
            : "empty"
        }
        data={
          itemModal
        }
        onClose={() =>
          setItemModal(
            null
          )
        }
        onDone={() => {
          setItemModal(
            null
          );

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
  const {
    t,
  } = useAdminI18n();

  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    form,
    setForm,
  ] = useState({
    name: "",
    description: "",
    cover_url: "",
    icon_type: "none",
    icon_value: "",
  });


  useEffect(() => {
    setForm({
      name:
        section?.name ||
        "",

      description:
        section?.description ||
        "",

      cover_url:
        section?.cover_url ||
        "",

      icon_type:
        section?.icon_type ||
        "none",

      icon_value:
        section?.icon_value ||
        "",
    });
  }, [
    section,
  ]);


  if (!section) {
    return null;
  }


  async function submit(
    event
  ) {
    event.preventDefault();

    const name =
      form.name.trim();


    if (!name) {
      toast.error(
        t(
          "menuEditor.sectionNameRequired"
        )
      );

      return;
    }


    setSaving(true);


    try {
      const {
        error,
      } = await supabase
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
            form.icon_type ===
            "none"
              ? null
              : form.icon_value ||
                null,
        })
        .eq(
          "id",
          section.id
        );


      if (error) {
        throw error;
      }


      toast.success(
        t(
          "menuEditor.sectionSaved"
        )
      );


      onDone();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "menuEditor.sectionSaveFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <Modal
      open={Boolean(
        section
      )}
      title={t(
        "menuEditor.sectionSettings"
      )}
      onClose={
        onClose
      }
    >
      <form
        onSubmit={
          submit
        }
        className="grid gap-4"
      >
        <Field
          label={t(
            "project.sectionName"
          )}
        >
          <Input
            value={
              form.name
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  current
                ) => ({
                  ...current,

                  name:
                    event
                      .target
                      .value,
                })
              )
            }
          />
        </Field>


        <Field
          label={t(
            "project.description"
          )}
        >
          <Textarea
            value={
              form.description
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  current
                ) => ({
                  ...current,

                  description:
                    event
                      .target
                      .value,
                })
              )
            }
          />
        </Field>


        <SectionIconPicker
          type={
            form.icon_type
          }
          value={
            form.icon_value
          }
          onChange={(
            type,
            value
          ) =>
            setForm(
              (
                current
              ) => ({
                ...current,

                icon_type:
                  type,

                icon_value:
                  value,
              })
            )
          }
        />


        <ImageUploadField
          label={t(
            "menuEditor.sectionCover"
          )}
          value={
            form.cover_url
          }
          onChange={(
            url
          ) =>
            setForm(
              (
                current
              ) => ({
                ...current,

                cover_url:
                  url,
              })
            )
          }
          folder={`sections/${section.id}`}
        />


        <Button
          type="submit"
          loading={
            saving
          }
          loadingText={t(
            "common.saving"
          )}
          disabled={
            !form.name.trim()
          }
        >
          {t(
            "menuEditor.saveSection"
          )}
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
  const {
    t,
  } = useAdminI18n();

  const [
    loading,
    setLoading,
  ] = useState(false);


  const section =
    data?.section;


  const item =
    data?.item;


  const [
    form,
    setForm,
  ] = useState({
    name:
      item?.name || "",

    description:
      item?.description ||
      "",

    price:
      item?.price ?? "",

    image_url:
      item?.image_url ||
      "",

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
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }


  async function submit(
    event
  ) {
    event.preventDefault();

    const name =
      form.name.trim();


    if (!name) {
      toast.error(
        t(
          "menuEditor.itemNameRequired"
        )
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

        price:
          Number(
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
        const {
          error,
        } = await supabase
          .from("items")
          .update(
            payload
          )
          .eq(
            "id",
            item.id
          );


        if (error) {
          throw error;
        }


        toast.success(
          t(
            "menuEditor.itemUpdated"
          )
        );
      } else {
        const {
          error,
        } = await supabase
          .from("items")
          .insert({
            ...payload,

            section_id:
              section.id,

            sort_order:
              (section.items
                ?.length ||
                0) + 1,
          });


        if (error) {
          throw error;
        }


        toast.success(
          t(
            "menuEditor.itemCreated"
          )
        );
      }


      onDone();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "menuEditor.itemSaveFailed"
          )
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
          ? t(
              "menuEditor.editItem"
            )
          : t(
              "menuEditor.newItem"
            )
      }
      onClose={
        onClose
      }
    >
      <form
        onSubmit={
          submit
        }
        className="grid gap-4"
      >
        <Field
          label={t(
            "menuEditor.itemName"
          )}
        >
          <Input
            required
            value={
              form.name
            }
            onChange={(
              event
            ) =>
              updateField(
                "name",
                event.target.value
              )
            }
          />
        </Field>


        <Field
          label={t(
            "project.description"
          )}
        >
          <Textarea
            value={
              form.description
            }
            onChange={(
              event
            ) =>
              updateField(
                "description",
                event.target.value
              )
            }
          />
        </Field>


        <Field
          label={t(
            "menuEditor.price"
          )}
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            value={
              form.price
            }
            onChange={(
              event
            ) =>
              updateField(
                "price",
                event.target.value
              )
            }
            dir="ltr"
          />
        </Field>


        <ImageUploadField
          label={t(
            "menuEditor.itemImage"
          )}
          value={
            form.image_url
          }
          onChange={(
            url
          ) =>
            updateField(
              "image_url",
              url
            )
          }
          folder={`items/${section.id}`}
        />


        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-black">
          <span>
            {form.is_available
              ? t(
                  "menuEditor.itemIsAvailable"
                )
              : t(
                  "menuEditor.itemIsHidden"
                )}
          </span>


          <input
            type="checkbox"
            checked={
              form.is_available
            }
            onChange={(
              event
            ) =>
              updateField(
                "is_available",
                event.target.checked
              )
            }
          />
        </label>


        <Button
          type="submit"
          loading={
            loading
          }
          loadingText={t(
            "common.saving"
          )}
          disabled={
            !form.name.trim()
          }
        >
          {item
            ? t(
                "menuEditor.saveItem"
              )
            : t(
                "menuEditor.createItem"
              )}
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
  const {
    t,
  } = useAdminI18n();


  return (
    <div>
      <div>
        <p className="text-sm font-black text-white">
          {t(
            "menuEditor.sectionIcon"
          )}
        </p>


        <p className="mt-1 text-xs font-bold text-white/35">
          {t(
            "menuEditor.sectionIconHint"
          )}
        </p>
      </div>


      {/* TYPE */}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <IconTypeButton
          active={
            type === "none"
          }
          onClick={() =>
            onChange(
              "none",
              ""
            )
          }
        >
          {t(
            "menuEditor.noIcon"
          )}
        </IconTypeButton>


        <IconTypeButton
          active={
            type ===
            "lucide"
          }
          onClick={() =>
            onChange(
              "lucide",
              type ===
                "lucide"
                ? value
                : "utensils"
            )
          }
        >
          {t(
            "menuEditor.crtrgoIcons"
          )}
        </IconTypeButton>


        <IconTypeButton
          active={
            type ===
            "emoji"
          }
          onClick={() =>
            onChange(
              "emoji",
              type ===
                "emoji"
                ? value
                : "🍔"
            )
          }
        >
          {t(
            "menuEditor.symbols"
          )}
        </IconTypeButton>
      </div>


      {/* CRTRGO ICONS */}

      {type ===
        "lucide" && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-white/30">
            {t(
              "menuEditor.crtrgoIcons"
            )}
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
                  value ===
                  key;

                const translationKey =
                  `menuEditor.iconLabels.${key}`;

                const translated =
                  t(
                    translationKey
                  );

                const label =
                  translated ===
                  translationKey
                    ? config.label
                    : translated;


                return (
                  <button
                    key={
                      key
                    }
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
                        label
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

      {type ===
        "emoji" && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-white/30">
            {t(
              "menuEditor.symbols"
            )}
          </p>


          <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {SECTION_EMOJIS.map(
              (
                emoji
              ) => {
                const selected =
                  value ===
                  emoji;


                return (
                  <button
                    key={
                      emoji
                    }
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
                    {
                      emoji
                    }
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
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/30">
                {t(
                  "menuEditor.preview"
                )}
              </p>


              <p className="mt-1 text-sm font-bold text-white/60">
                {t(
                  "menuEditor.iconPreviewHint"
                )}
              </p>
            </div>


            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
              <SelectedSectionIcon
                type={
                  type
                }
                value={
                  value
                }
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
      onClick={
        onClick
      }
      className={`min-h-11 rounded-2xl border px-3 text-xs font-black transition ${
        active
          ? "border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]"
          : "border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {
        children
      }
    </button>
  );
}


function SelectedSectionIcon({
  type,
  value,
}) {
  if (
    type === "emoji"
  ) {
    return (
      <span className="text-2xl">
        {value}
      </span>
    );
  }


  if (
    type === "lucide"
  ) {
    const config =
      SECTION_ICONS[
        value
      ];


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
        {
          section.icon_value
        }
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