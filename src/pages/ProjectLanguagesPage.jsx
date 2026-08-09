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
  Check,
  Languages,
  Save,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import ProjectTabs from "../components/ProjectTabs";

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


const WEBSITE_LANGUAGES = [
  {
    code: "ar",
    name: "العربية",
    englishName: "Arabic",
    dir: "rtl",
  },

  {
    code: "en",
    name: "English",
    englishName: "English",
    dir: "ltr",
  },

  {
    code: "he",
    name: "עברית",
    englishName: "Hebrew",
    dir: "rtl",
  },
];


async function loadProjectLanguages(
  projectId
) {
  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      location,
      status,
      enabled_languages,
      default_language,
      name_i18n,
      description_i18n,
      location_i18n
    `)
    .eq(
      "id",
      projectId
    )
    .single();

  if (projectError) {
    throw projectError;
  }


  const {
    data: sections,
    error: sectionsError,
  } = await supabase
    .from("sections")
    .select(`
      id,
      project_id,
      name,
      description,
      sort_order,
      name_i18n,
      description_i18n
    `)
    .eq(
      "project_id",
      projectId
    )
    .order(
      "sort_order",
      {
        ascending: true,
      }
    );

  if (sectionsError) {
    throw sectionsError;
  }


  const sectionIds =
    (sections || []).map(
      (section) =>
        section.id
    );


  let items = [];

  if (sectionIds.length) {
    const {
      data,
      error,
    } = await supabase
      .from("items")
      .select(`
        id,
        section_id,
        name,
        description,
        sort_order,
        name_i18n,
        description_i18n
      `)
      .in(
        "section_id",
        sectionIds
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    items = data || [];
  }


  return {
    project,

    sections:
      (sections || []).map(
        (section) => ({
          ...section,

          items:
            items.filter(
              (item) =>
                item.section_id ===
                section.id
            ),
        })
      ),
  };
}


function normalizeLanguages(
  value
) {
  if (!Array.isArray(value)) {
    return ["ar"];
  }

  const valid =
    value.filter(
      (code) =>
        WEBSITE_LANGUAGES.some(
          (language) =>
            language.code ===
            code
        )
    );

  return valid.length
    ? valid
    : ["ar"];
}


function buildForm(data) {
  const project =
    data?.project;

  const enabledLanguages =
    normalizeLanguages(
      project?.enabled_languages
    );

  const defaultLanguage =
    enabledLanguages.includes(
      project?.default_language
    )
      ? project.default_language
      : enabledLanguages[0];


  const sectionTranslations =
    {};

  const itemTranslations =
    {};


  for (
    const section of
    data?.sections || []
  ) {
    sectionTranslations[
      section.id
    ] = {
      name_i18n:
        section.name_i18n ||
        {},

      description_i18n:
        section.description_i18n ||
        {},
    };


    for (
      const item of
      section.items || []
    ) {
      itemTranslations[
        item.id
      ] = {
        name_i18n:
          item.name_i18n ||
          {},

        description_i18n:
          item.description_i18n ||
          {},
      };
    }
  }


  return {
    enabledLanguages,

    defaultLanguage,

    project: {
      name_i18n:
        project?.name_i18n ||
        {},

      description_i18n:
        project?.description_i18n ||
        {},

      location_i18n:
        project?.location_i18n ||
        {},
    },

    sections:
      sectionTranslations,

    items:
      itemTranslations,
  };
}


export default function ProjectLanguagesPage() {
  const {
    projectId,
  } = useParams();

  const {
    t,
    dir,
  } = useAdminI18n();

  const queryClient =
    useQueryClient();

  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState("ar");

  const [
    localForm,
    setLocalForm,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);


  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "project-languages",
      projectId,
    ],

    queryFn: () =>
      loadProjectLanguages(
        projectId
      ),

    enabled:
      Boolean(projectId),
  });


  const initialForm =
    useMemo(() => {
      if (!data) {
        return null;
      }

      return buildForm(data);
    }, [data]);


  const form =
    localForm ||
    initialForm;


  const dirty =
    Boolean(
      form &&
      initialForm &&
      JSON.stringify(form) !==
        JSON.stringify(
          initialForm
        )
    );


  useEffect(() => {
    if (!form) {
      return;
    }

    if (
      !form.enabledLanguages.includes(
        selectedLanguage
      )
    ) {
      setSelectedLanguage(
        form.defaultLanguage ||
          form.enabledLanguages[0]
      );
    }
  }, [
    form,
    selectedLanguage,
  ]);


  function updateForm(
    updater
  ) {
    setLocalForm(
      (current) => {
        const base =
          current ||
          structuredClone(
            initialForm
          );

        return updater(
          base
        );
      }
    );
  }


  function toggleLanguage(
    code
  ) {
    updateForm(
      (current) => {
        const enabled =
          current.enabledLanguages.includes(
            code
          );


        if (enabled) {
          /*
           * Never allow removing
           * the final language.
           */
          if (
            current
              .enabledLanguages
              .length === 1
          ) {
            toast.error(
              t(
                "languages.keepOne"
              )
            );

            return current;
          }


          const nextLanguages =
            current.enabledLanguages.filter(
              (item) =>
                item !== code
            );


          let nextDefault =
            current.defaultLanguage;

          if (
            nextDefault === code
          ) {
            nextDefault =
              nextLanguages[0];
          }


          return {
            ...current,

            enabledLanguages:
              nextLanguages,

            defaultLanguage:
              nextDefault,
          };
        }


        return {
          ...current,

          enabledLanguages: [
            ...current.enabledLanguages,
            code,
          ],
        };
      }
    );
  }


  function setDefaultLanguage(
    code
  ) {
    updateForm(
      (current) => ({
        ...current,

        defaultLanguage:
          code,
      })
    );

    setSelectedLanguage(
      code
    );
  }


  function updateProjectTranslation(
    field,
    language,
    value
  ) {
    updateForm(
      (current) => ({
        ...current,

        project: {
          ...current.project,

          [field]: {
            ...current
              .project[field],

            [language]:
              value,
          },
        },
      })
    );
  }


  function updateSectionTranslation(
    sectionId,
    field,
    language,
    value
  ) {
    updateForm(
      (current) => ({
        ...current,

        sections: {
          ...current.sections,

          [sectionId]: {
            ...current
              .sections[
                sectionId
              ],

            [field]: {
              ...current
                .sections[
                  sectionId
                ]?.[field],

              [language]:
                value,
            },
          },
        },
      })
    );
  }


  function updateItemTranslation(
    itemId,
    field,
    language,
    value
  ) {
    updateForm(
      (current) => ({
        ...current,

        items: {
          ...current.items,

          [itemId]: {
            ...current
              .items[
                itemId
              ],

            [field]: {
              ...current
                .items[
                  itemId
                ]?.[field],

              [language]:
                value,
            },
          },
        },
      })
    );
  }


  async function save() {
    if (
      !form ||
      !dirty
    ) {
      return;
    }

    setSaving(true);

    try {
      /*
       * PROJECT
       */

      const {
        error:
          projectError,
      } = await supabase
        .from("projects")
        .update({
          enabled_languages:
            form.enabledLanguages,

          default_language:
            form.defaultLanguage,

          name_i18n:
            form.project
              .name_i18n,

          description_i18n:
            form.project
              .description_i18n,

          location_i18n:
            form.project
              .location_i18n,
        })
        .eq(
          "id",
          projectId
        );

      if (projectError) {
        throw projectError;
      }


      /*
       * SECTIONS
       */

      const sectionUpdates =
        Object.entries(
          form.sections
        ).map(
          ([
            sectionId,
            translations,
          ]) =>
            supabase
              .from(
                "sections"
              )
              .update({
                name_i18n:
                  translations
                    .name_i18n,

                description_i18n:
                  translations
                    .description_i18n,
              })
              .eq(
                "id",
                sectionId
              )
        );


      const sectionResults =
        await Promise.all(
          sectionUpdates
        );


      const sectionError =
        sectionResults.find(
          (result) =>
            result.error
        )?.error;

      if (sectionError) {
        throw sectionError;
      }


      /*
       * ITEMS
       */

      const itemUpdates =
        Object.entries(
          form.items
        ).map(
          ([
            itemId,
            translations,
          ]) =>
            supabase
              .from(
                "items"
              )
              .update({
                name_i18n:
                  translations
                    .name_i18n,

                description_i18n:
                  translations
                    .description_i18n,
              })
              .eq(
                "id",
                itemId
              )
        );


      const itemResults =
        await Promise.all(
          itemUpdates
        );


      const itemError =
        itemResults.find(
          (result) =>
            result.error
        )?.error;

      if (itemError) {
        throw itemError;
      }


      toast.success(
        t(
          "languages.saved"
        )
      );


      setLocalForm(
        null
      );


      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "project-languages",
            projectId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "project",
            projectId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "project-menu",
            projectId,
          ],
        }),
      ]);
    } catch (error) {
      console.error(
        error
      );

      toast.error(
        error?.message ||
          t(
            "languages.saveFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  }


  if (isLoading) {
    return (
      <main
      dir={dir}
      className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />

        <SkeletonCard className="mt-5 h-[650px]" />
      </main>
    );
  }


  if (
    error ||
    !data ||
    !form
  ) {
    return (
      <main
      dir={dir}
      className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message ||
            t(
              "languages.loadFailed"
            )}
        </p>
      </main>
    );
  }


  const project =
    data.project;

  const activeLanguage =
    WEBSITE_LANGUAGES.find(
      (language) =>
        language.code ===
        selectedLanguage
    ) ||
    WEBSITE_LANGUAGES[0];


  return (
    <main
      dir={dir}
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#090909] pb-32 text-white"
    >
      <PageHeader
        eyebrow={t(
          "project.websiteSettings"
        )}
        title={t(
          "projectTabs.languages"
        )}
        subtitle={t(
          "languages.subtitle"
        )}
        action={
          <Button
            onClick={save}
            loading={saving}
            disabled={!dirty}
          >
            <Save
              size={17}
            />

            {t(
              "common.save"
            )}
          </Button>
        }
      />


      <ProjectTabs
        projectId={
          projectId
        }
      />


      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6">
        {/* ENABLED LANGUAGES */}

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Languages
                  size={20}
                  className="text-[#ff7a00]"
                />

                <h2 className="text-xl font-black">
                  {t(
                    "languages.websiteLanguages"
                  )}
                </h2>
              </div>

              <p className="mt-2 text-sm font-bold text-white/40">
                {t(
                  "languages.websiteLanguagesHint"
                )}
              </p>
            </div>

            <Badge tone="neutral">
              {
                form
                  .enabledLanguages
                  .length
              }{" "}
              {t(
                "languages.enabled"
              )}
            </Badge>
          </div>


          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {WEBSITE_LANGUAGES.map(
              (
                language
              ) => {
                const enabled =
                  form.enabledLanguages.includes(
                    language.code
                  );

                const isDefault =
                  form.defaultLanguage ===
                  language.code;

                return (
                  <div
                    key={
                      language.code
                    }
                    className={`rounded-[24px] border p-4 transition ${
                      enabled
                        ? "border-[#ff7a00]/35 bg-[#ff7a00]/[0.07]"
                        : "border-white/10 bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          dir={
                            language.dir
                          }
                          className="text-lg font-black"
                        >
                          {
                            language.name
                          }
                        </p>

                        <p className="mt-1 text-xs font-bold text-white/35">
                          {
                            language.englishName
                          }
                        </p>
                      </div>

                      {enabled && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00] text-black">
                          <Check
                            size={16}
                            strokeWidth={
                              3
                            }
                          />
                        </div>
                      )}
                    </div>


                    <div className="mt-5 grid gap-2">
                      <Button
                        type="button"
                        variant={
                          enabled
                            ? "secondary"
                            : "primary"
                        }
                        onClick={() =>
                          toggleLanguage(
                            language.code
                          )
                        }
                      >
                        {enabled
                          ? t(
                              "languages.disable"
                            )
                          : t(
                              "languages.enable"
                            )}
                      </Button>


                      {enabled && (
                        <button
                          type="button"
                          onClick={() =>
                            setDefaultLanguage(
                              language.code
                            )
                          }
                          className={`min-h-10 rounded-2xl border px-3 text-xs font-black transition ${
                            isDefault
                              ? "border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]"
                              : "border-white/10 text-white/40 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          {isDefault
                            ? t(
                                "languages.default"
                              )
                            : t(
                                "languages.makeDefault"
                              )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </Card>


        {/* LANGUAGE SELECTOR */}

        <Card className="p-5">
          <h2 className="text-xl font-black">
            {t(
              "languages.translations"
            )}
          </h2>

          <p className="mt-2 text-sm font-bold text-white/40">
            {t(
              "languages.chooseLanguage"
            )}
          </p>


          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {form.enabledLanguages.map(
              (code) => {
                const language =
                  WEBSITE_LANGUAGES.find(
                    (item) =>
                      item.code ===
                      code
                  );

                if (!language) {
                  return null;
                }

                const active =
                  selectedLanguage ===
                  code;

                return (
                  <button
                    key={
                      code
                    }
                    type="button"
                    onClick={() =>
                      setSelectedLanguage(
                        code
                      )
                    }
                    className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                      active
                        ? "bg-[#ff7a00] text-black"
                        : "border border-white/10 bg-white/[0.035] text-white/45 hover:text-white"
                    }`}
                  >
                    {
                      language.name
                    }
                  </button>
                );
              }
            )}
          </div>
        </Card>


        {/* PROJECT TRANSLATIONS */}

        <Card className="p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-white/30">
              {t(
                "languages.website"
              )}
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {project.name}
            </h2>
          </div>


          <div
            dir={
              activeLanguage.dir
            }
            className="mt-5 grid gap-4"
          >
            <TranslationField
              label={t(
                "project.websiteName"
              )}
              original={
                project.name
              }
            >
              <Input
                value={
                  form.project
                    .name_i18n?.[
                    selectedLanguage
                  ] || ""
                }
                onChange={(
                  event
                ) =>
                  updateProjectTranslation(
                    "name_i18n",
                    selectedLanguage,
                    event.target.value
                  )
                }
              />
            </TranslationField>


            <TranslationField
              label={t(
                "project.description"
              )}
              original={
                project.description
              }
            >
              <Textarea
                value={
                  form.project
                    .description_i18n?.[
                    selectedLanguage
                  ] || ""
                }
                onChange={(
                  event
                ) =>
                  updateProjectTranslation(
                    "description_i18n",
                    selectedLanguage,
                    event.target.value
                  )
                }
              />
            </TranslationField>


            <TranslationField
              label={t(
                "project.location"
              )}
              original={
                project.location
              }
            >
              <Input
                value={
                  form.project
                    .location_i18n?.[
                    selectedLanguage
                  ] || ""
                }
                onChange={(
                  event
                ) =>
                  updateProjectTranslation(
                    "location_i18n",
                    selectedLanguage,
                    event.target.value
                  )
                }
              />
            </TranslationField>
          </div>
        </Card>


        {/* SECTIONS + ITEMS */}

        {data.sections.map(
          (section) => (
            <Card
              key={
                section.id
              }
              className="p-5"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/30">
                  {t(
                    "languages.section"
                  )}
                </p>

                <h2 className="mt-2 text-xl font-black">
                  {
                    section.name
                  }
                </h2>
              </div>


              <div
                dir={
                  activeLanguage.dir
                }
                className="mt-5 grid gap-4"
              >
                <TranslationField
                  label={t(
                    "languages.sectionName"
                  )}
                  original={
                    section.name
                  }
                >
                  <Input
                    value={
                      form.sections?.[
                        section.id
                      ]?.name_i18n?.[
                        selectedLanguage
                      ] || ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateSectionTranslation(
                        section.id,
                        "name_i18n",
                        selectedLanguage,
                        event.target.value
                      )
                    }
                  />
                </TranslationField>


                <TranslationField
                  label={t(
                    "project.description"
                  )}
                  original={
                    section.description
                  }
                >
                  <Textarea
                    value={
                      form.sections?.[
                        section.id
                      ]
                        ?.description_i18n?.[
                        selectedLanguage
                      ] || ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateSectionTranslation(
                        section.id,
                        "description_i18n",
                        selectedLanguage,
                        event.target.value
                      )
                    }
                  />
                </TranslationField>
              </div>


              {section.items
                ?.length > 0 && (
                <div className="mt-7 border-t border-white/10 pt-5">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-white/30">
                    {t(
                      "languages.items"
                    )}
                  </p>


                  <div className="grid gap-4">
                    {section.items.map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                        >
                          <h3 className="font-black">
                            {
                              item.name
                            }
                          </h3>


                          <div
                            dir={
                              activeLanguage.dir
                            }
                            className="mt-4 grid gap-4 md:grid-cols-2"
                          >
                            <TranslationField
                              label={t(
                                "languages.itemName"
                              )}
                              original={
                                item.name
                              }
                            >
                              <Input
                                value={
                                  form.items?.[
                                    item.id
                                  ]?.name_i18n?.[
                                    selectedLanguage
                                  ] ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItemTranslation(
                                    item.id,
                                    "name_i18n",
                                    selectedLanguage,
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </TranslationField>


                            <TranslationField
                              label={t(
                                "project.description"
                              )}
                              original={
                                item.description
                              }
                            >
                              <Textarea
                                value={
                                  form.items?.[
                                    item.id
                                  ]
                                    ?.description_i18n?.[
                                    selectedLanguage
                                  ] ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItemTranslation(
                                    item.id,
                                    "description_i18n",
                                    selectedLanguage,
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </TranslationField>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        )}
      </section>


      {/* SAVE BAR */}

      {dirty && (
        <div className="fixed bottom-24 left-4 right-4 z-[80] rounded-[24px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:left-[22rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white/70">
              {t(
                "project.unsaved"
              )}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setLocalForm(
                    null
                  )
                }
                disabled={
                  saving
                }
              >
                {t(
                  "common.discard"
                )}
              </Button>

              <Button
                type="button"
                onClick={save}
                loading={
                  saving
                }
                loadingText={t(
                  "common.saving"
                )}
              >
                {t(
                  "project.saveChanges"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


function TranslationField({
  label,
  original,
  children,
}) {
  return (
    <Field
      label={
        label
      }
      hint={
        original
          ? `Original: ${original}`
          : undefined
      }
    >
      {children}
    </Field>
  );
}