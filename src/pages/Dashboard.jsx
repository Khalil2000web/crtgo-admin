import {
  motion,
} from "framer-motion";

import {
  Link,
} from "react-router-dom";

import {
  useMemo,
  useState,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ArrowUpRight,
  Globe2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  slugify,
} from "../lib/slug";

import {
  getPublicProjectUrl,
} from "../lib/urls";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SkeletonCard,
  Textarea,
} from "../components/ui";


async function getCurrentUser() {
  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}


async function loadProjects() {
  const user =
    await getCurrentUser();

  if (!user) {
    return [];
  }


  const {
    data,
    error,
  } = await supabase
    .from("projects")
    .select(`
      id,
      owner_id,
      name,
      slug,
      status,
      description,
      logo_url,
      created_at,
      updated_at
    `)
    .eq(
      "owner_id",
      user.id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (error) {
    throw error;
  }


  return data || [];
}


export default function Dashboard() {
  const {
    t,
    dir,
  } = useAdminI18n();

  const queryClient =
    useQueryClient();


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    newProjectOpen,
    setNewProjectOpen,
  ] = useState(false);


  const {
    data: projects = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      "projects",
    ],

    queryFn:
      loadProjects,
  });


  const filteredProjects =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();


      if (!q) {
        return projects;
      }


      return projects.filter(
        (project) =>
          [
            project.name,
            project.slug,
            project.description,
            project.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
      );
    }, [
      projects,
      search,
    ]);


  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: [
        "projects",
      ],
    });


    toast.success(
      t(
        "dashboard.refreshed"
      )
    );
  }


  return (
    <main
      dir={dir}
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] pb-20 text-white"
    >
      <PageHeader
        eyebrow={t(
          "dashboard.workspace"
        )}
        title={t(
          "nav.websites"
        )}
        subtitle={t(
          "dashboard.subtitle"
        )}
        action={
          <Button
            variant="secondary"
            onClick={
              refresh
            }
          >
            <RefreshCw
              size={17}
              className={
                isFetching
                  ? "animate-spin"
                  : ""
              }
            />

            {t(
              "common.refresh"
            )}
          </Button>
        }
      />


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* NEW WEBSITE */}

        <div className="mb-4">
          <Button
            onClick={() =>
              setNewProjectOpen(
                true
              )
            }
          >
            <Plus
              size={17}
            />

            {t(
              "project.newWebsite"
            )}
          </Button>
        </div>


        {/* SEARCH */}

        <div className="rounded-[28px] border border-white/10 bg-[#111111] p-3">
          <div className="relative">
            <Search
              size={17}
              className={`absolute top-1/2 -translate-y-1/2 text-white/35 ${
                dir === "rtl"
                  ? "right-4"
                  : "left-4"
              }`}
            />


            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "dashboard.searchPlaceholder"
              )}
              className={`min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-[#ff7a00] ${
                dir === "rtl"
                  ? "pl-4 pr-11"
                  : "pl-11 pr-4"
              }`}
            />
          </div>
        </div>


        {/* ERROR */}

        {error && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {error?.message ||
              t(
                "dashboard.loadFailed"
              )}
          </p>
        )}


        {/* LOADING */}

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map(
              (
                _,
                index
              ) => (
                <SkeletonCard
                  key={
                    index
                  }
                  className="h-64"
                />
              )
            )}
          </div>
        ) : filteredProjects.length ? (

          /* WEBSITES */

          <motion.div
            layout
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredProjects.map(
              (
                project,
                index
              ) => (
                <ProjectCard
                  key={
                    project.id
                  }
                  project={
                    project
                  }
                  index={
                    index
                  }
                />
              )
            )}
          </motion.div>
        ) : (

          /* EMPTY */

          <div className="mt-6">
            <EmptyState
              icon={
                <Globe2
                  size={38}
                />
              }
              title={
                search
                  ? t(
                      "dashboard.noResults"
                    )
                  : t(
                      "dashboard.firstWebsite"
                    )
              }
              text={
                search
                  ? t(
                      "dashboard.noResultsHint"
                    )
                  : t(
                      "dashboard.firstWebsiteHint"
                    )
              }
              action={
                !search && (
                  <Button
                    onClick={() =>
                      setNewProjectOpen(
                        true
                      )
                    }
                  >
                    <Plus
                      size={17}
                    />

                    {t(
                      "project.newWebsite"
                    )}
                  </Button>
                )
              }
            />
          </div>
        )}
      </section>


      <NewProjectModal
        open={
          newProjectOpen
        }
        onClose={() =>
          setNewProjectOpen(
            false
          )
        }
        onDone={() => {
          setNewProjectOpen(
            false
          );

          queryClient.invalidateQueries({
            queryKey: [
              "projects",
            ],
          });
        }}
      />
    </main>
  );
}


function ProjectCard({
  project,
  index,
}) {
  const {
    t,
  } = useAdminI18n();


  const publicUrl =
    getPublicProjectUrl(
      project.slug
    );


  function getStatusLabel() {
    if (
      project.status ===
      "active"
    ) {
      return t(
        "common.active"
      );
    }

    if (
      project.status ===
      "archived"
    ) {
      return t(
        "common.archived"
      );
    }

    if (
      project.status ===
      "draft"
    ) {
      return t(
        "common.draft"
      );
    }

    return project.status;
  }


  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          index *
          0.03,

        duration:
          0.18,
      }}
    >
      <Link
        to={`/project/${project.id}/general`}
        className="group block min-h-64 rounded-[30px] border border-white/10 bg-[#111111]/95 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#ff7a00]/50 hover:bg-[#161616]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] text-[#ff7a00]">
            {project.logo_url ? (
              <img
                src={
                  project.logo_url
                }
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Store
                size={28}
              />
            )}
          </div>


          <Badge
            tone={
              project.status ===
              "active"
                ? "success"
                : project.status ===
                    "archived"
                  ? "warning"
                  : "neutral"
            }
          >
            {getStatusLabel()}
          </Badge>
        </div>


        <h2 className="mt-7 truncate text-2xl font-black tracking-[-0.05em]">
          {project.name}
        </h2>


        <p
          className="mt-2 truncate text-sm font-bold text-white/35"
          dir="ltr"
        >
          {publicUrl}
        </p>


        {project.description && (
          <p className="mt-4 line-clamp-2 text-sm font-bold leading-6 text-white/40">
            {
              project.description
            }
          </p>
        )}


        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-black uppercase text-white/30">
            {t(
              "dashboard.openWebsite"
            )}
          </span>


          <ArrowUpRight
            size={19}
            className="text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#ff7a00]"
          />
        </div>
      </Link>
    </motion.div>
  );
}


function NewProjectModal({
  open,
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


  const [
    form,
    setForm,
  ] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    whatsapp: "",
    instagram: "",
  });


  function updateField(
    key,
    value
  ) {
    setForm(
      (current) => {
        const next = {
          ...current,
          [key]: value,
        };


        if (
          key === "name"
        ) {
          next.slug =
            slugify(
              value
            );
        }


        return next;
      }
    );
  }


  async function submit(
    event
  ) {
    event.preventDefault();

    setLoading(true);


    try {
      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();


      if (
        userError
      ) {
        throw userError;
      }


      if (!user) {
        throw new Error(
          t(
            "dashboard.notLoggedIn"
          )
        );
      }


      const name =
        form.name.trim();


      const slug =
        slugify(
          form.slug
        );


      if (!name) {
        throw new Error(
          t(
            "general.nameRequired"
          )
        );
      }


      if (!slug) {
        throw new Error(
          t(
            "general.hostnameRequired"
          )
        );
      }


      const {
        data:
          existing,

        error:
          existingError,
      } = await supabase
        .from("projects")
        .select("id")
        .ilike(
          "slug",
          slug
        )
        .maybeSingle();


      if (
        existingError
      ) {
        throw existingError;
      }


      if (existing) {
        throw new Error(
          t(
            "dashboard.hostnameUsed"
          )
        );
      }


      const {
        error:
          projectError,
      } = await supabase
        .from("projects")
        .insert({
          owner_id:
            user.id,

          name,

          slug,

          description:
            form.description.trim() ||
            null,

          phone:
            form.phone.trim() ||
            null,

          whatsapp:
            form.whatsapp.trim() ||
            null,

          instagram:
            form.instagram.trim() ||
            null,

          status:
            "active",
        });


      if (
        projectError
      ) {
        throw projectError;
      }


      toast.success(
        t(
          "dashboard.created"
        )
      );


      setForm({
        name: "",
        slug: "",
        description: "",
        phone: "",
        whatsapp: "",
        instagram: "",
      });


      onDone();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "dashboard.createFailed"
          )
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <Modal
      open={
        open
      }
      title={t(
        "project.newWebsite"
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
            "project.websiteName"
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
            placeholder={t(
              "dashboard.websiteNamePlaceholder"
            )}
          />
        </Field>


        <Field
          label={t(
            "project.hostname"
          )}
          hint={
            form.slug
              ? `${form.slug}.w.crtgo.com`
              : t(
                  "dashboard.hostnameHint"
                )
          }
        >
          <Input
            required
            value={
              form.slug
            }
            onChange={(
              event
            ) =>
              updateField(
                "slug",
                event.target.value
              )
            }
            onBlur={() =>
              updateField(
                "slug",
                slugify(
                  form.slug
                )
              )
            }
            placeholder="burger-house"
            dir="ltr"
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
            placeholder={t(
              "dashboard.descriptionPlaceholder"
            )}
          />
        </Field>


        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t(
              "general.phone"
            )}
          >
            <Input
              value={
                form.phone
              }
              onChange={(
                event
              ) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              placeholder="0500000000"
              dir="ltr"
            />
          </Field>


          <Field label="WhatsApp">
            <Input
              value={
                form.whatsapp
              }
              onChange={(
                event
              ) =>
                updateField(
                  "whatsapp",
                  event.target.value
                )
              }
              placeholder="972500000000"
              dir="ltr"
            />
          </Field>
        </div>


        <Field label="Instagram">
          <Input
            value={
              form.instagram
            }
            onChange={(
              event
            ) =>
              updateField(
                "instagram",
                event.target.value
              )
            }
            placeholder="@restaurant"
            dir="ltr"
          />
        </Field>


        <Button
          type="submit"
          loading={
            loading
          }
          loadingText={t(
            "dashboard.creating"
          )}
          disabled={
            loading ||
            !form.name.trim()
          }
          size="lg"
        >
          <Plus
            size={17}
          />

          {t(
            "dashboard.createWebsite"
          )}
        </Button>
      </form>
    </Modal>
  );
}