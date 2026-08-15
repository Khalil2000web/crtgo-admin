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
  ArrowRight,
  Building2,
  Globe2,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  UtensilsCrossed,
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


const COPY = {
  en: {
    eyebrow:
      "Carter Go Workspace",

    title:
      "Your businesses",

    subtitle:
      "One account for every business and every Carter Go service.",

    newBusiness:
      "New business",

    search:
      "Search businesses or services...",

    firstBusiness:
      "Create your first business",

    firstBusinessHint:
      "Your Carter Go services will live inside a business workspace.",

    noResults:
      "No businesses found",

    noResultsHint:
      "Try another search.",

    services:
      "Services",

    menu:
      "Menu",

    store:
      "Store",

    websites:
      "Websites",

    active:
      "Active",

    soon:
      "Soon",

    openBusiness:
      "Open business",

    refresh:
      "Refresh",

    refreshed:
      "Workspace refreshed.",

    createTitle:
      "Create a business",

    createSubtitle:
      "We'll create the business workspace and connect its first Menu service.",

    businessName:
      "Business name",

    menuAddress:
      "Menu address",

    addressHint:
      "This becomes the public menu address.",

    description:
      "Description",

    phone:
      "Phone",

    whatsapp:
      "WhatsApp",

    instagram:
      "Instagram",

    create:
      "Create business",

    creating:
      "Creating business...",

    created:
      "Business created.",

    failed:
      "Could not create the business.",

    loginRequired:
      "You are not signed in.",

    nameRequired:
      "Business name is required.",

    slugRequired:
      "A public menu address is required.",

    slugUsed:
      "That public menu address is already being used.",
  },


  ar: {
    eyebrow:
      "مساحة عمل Carter Go",

    title:
      "أعمالك",

    subtitle:
      "حساب واحد لكل أعمالك وكل خدمات Carter Go.",

    newBusiness:
      "عمل جديد",

    search:
      "ابحث في الأعمال أو الخدمات...",

    firstBusiness:
      "أنشئ أول عمل",

    firstBusinessHint:
      "خدمات Carter Go الخاصة بك ستعيش داخل مساحة عمل للنشاط.",

    noResults:
      "لم يتم العثور على أعمال",

    noResultsHint:
      "جرّب بحثاً آخر.",

    services:
      "الخدمات",

    menu:
      "القائمة",

    store:
      "المتجر",

    websites:
      "المواقع",

    active:
      "فعال",

    soon:
      "قريباً",

    openBusiness:
      "فتح العمل",

    refresh:
      "تحديث",

    refreshed:
      "تم تحديث مساحة العمل.",

    createTitle:
      "إنشاء عمل",

    createSubtitle:
      "سننشئ مساحة العمل ونربط أول خدمة قائمة بها.",

    businessName:
      "اسم العمل",

    menuAddress:
      "عنوان القائمة",

    addressHint:
      "سيصبح هذا هو عنوان القائمة العام.",

    description:
      "الوصف",

    phone:
      "الهاتف",

    whatsapp:
      "WhatsApp",

    instagram:
      "Instagram",

    create:
      "إنشاء العمل",

    creating:
      "جارٍ إنشاء العمل...",

    created:
      "تم إنشاء العمل.",

    failed:
      "تعذر إنشاء العمل.",

    loginRequired:
      "أنت غير مسجل الدخول.",

    nameRequired:
      "اسم العمل مطلوب.",

    slugRequired:
      "عنوان القائمة مطلوب.",

    slugUsed:
      "عنوان القائمة مستخدم بالفعل.",
  },
};


async function loadDashboard() {
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


  if (
    !user
  ) {
    return {
      user:
        null,

      workspaces:
        [],
    };
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "workspaces"
      )
      .select(`
        id,
        owner_id,
        name,
        created_at,
        updated_at,
        workspace_services (
          id,
          service_key,
          status
        ),
        projects (
          id,
          workspace_id,
          name,
          slug,
          status,
          description,
          logo_url
        )
      `)
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );


  if (
    error
  ) {
    throw error;
  }


  return {
    user,

    workspaces:
      (
        data ||
        []
      ).map(
        (
          workspace
        ) => ({
          ...workspace,

          workspace_services:
            Array.isArray(
              workspace.workspace_services
            )
              ? workspace.workspace_services
              : [],

          projects:
            Array.isArray(
              workspace.projects
            )
              ? workspace.projects
              : [],
        })
      ),
  };
}


export default function Dashboard() {
  const {
    dir,
  } =
    useAdminI18n();


  const copy =
    dir ===
    "rtl"
      ? COPY.ar
      : COPY.en;


  const queryClient =
    useQueryClient();


  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );


  const [
    newBusinessOpen,
    setNewBusinessOpen,
  ] =
    useState(
      false
    );


  const {
    data,
    isLoading,
    error,
    isFetching,
  } =
    useQuery({
      queryKey: [
        "workspace-dashboard",
      ],

      queryFn:
        loadDashboard,
    });


  const workspaces =
    data?.workspaces ||
    [];


  const filtered =
    useMemo(
      () => {
        const q =
          search
            .trim()
            .toLowerCase();


        if (
          !q
        ) {
          return workspaces;
        }


        return workspaces.filter(
          (
            workspace
          ) =>
            [
              workspace.name,

              ...workspace
                .workspace_services
                .map(
                  (
                    service
                  ) =>
                    service.service_key
                ),

              ...workspace
                .projects
                .flatMap(
                  (
                    project
                  ) => [
                    project.name,
                    project.slug,
                    project.description,
                  ]
                ),
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase()
              .includes(
                q
              )
        );
      },
      [
        workspaces,
        search,
      ]
    );


  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: [
        "workspace-dashboard",
      ],
    });


    toast.success(
      copy.refreshed
    );
  }


  return (
    <main
      dir={dir}
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#090909] pb-24 text-white"
    >
      <PageHeader
        eyebrow={
          copy.eyebrow
        }
        title={
          copy.title
        }
        subtitle={
          copy.subtitle
        }
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

            {
              copy.refresh
            }
          </Button>
        }
      />


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Button
          onClick={() =>
            setNewBusinessOpen(
              true
            )
          }
        >
          <Plus
            size={17}
          />

          {
            copy.newBusiness
          }
        </Button>


        <div className="mt-5 rounded-[28px] border border-white/10 bg-[#111111] p-3">
          <div className="relative">
            <Search
              size={17}
              className={`absolute top-1/2 -translate-y-1/2 text-white/35 ${
                dir ===
                "rtl"
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
              placeholder={
                copy.search
              }
              className={`min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#ff7a00] ${
                dir ===
                "rtl"
                  ? "pl-4 pr-11"
                  : "pl-11 pr-4"
              }`}
            />
          </div>
        </div>


        {error && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {
              error.message
            }
          </p>
        )}


        {isLoading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length:
                6,
            }).map(
              (
                _,
                index
              ) => (
                <SkeletonCard
                  key={index}
                  className="h-80"
                />
              )
            )}
          </div>
        ) : filtered.length ? (
          <motion.div
            layout
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {filtered.map(
              (
                workspace,
                index
              ) => (
                <WorkspaceCard
                  key={
                    workspace.id
                  }
                  workspace={
                    workspace
                  }
                  index={
                    index
                  }
                  copy={
                    copy
                  }
                />
              )
            )}
          </motion.div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={
                <Building2
                  size={38}
                />
              }
              title={
                search
                  ? copy.noResults
                  : copy.firstBusiness
              }
              text={
                search
                  ? copy.noResultsHint
                  : copy.firstBusinessHint
              }
              action={
                !search && (
                  <Button
                    onClick={() =>
                      setNewBusinessOpen(
                        true
                      )
                    }
                  >
                    <Plus
                      size={17}
                    />

                    {
                      copy.newBusiness
                    }
                  </Button>
                )
              }
            />
          </div>
        )}
      </section>


      <NewBusinessModal
        open={
          newBusinessOpen
        }
        onClose={() =>
          setNewBusinessOpen(
            false
          )
        }
        copy={
          copy
        }
        onDone={() => {
          setNewBusinessOpen(
            false
          );


          queryClient.invalidateQueries({
            queryKey: [
              "workspace-dashboard",
            ],
          });
        }}
      />
    </main>
  );
}


function WorkspaceCard({
  workspace,
  index,
  copy,
}) {
  const services =
    workspace.workspace_services;


  const project =
    workspace.projects[0] ||
    null;


  const menuActive =
    services.some(
      (
        service
      ) =>
        service.service_key ===
          "menu" &&
        service.status ===
          "active"
    );


  return (
    <motion.article
      initial={{
        opacity:
          0,

        y:
          14,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      transition={{
        delay:
          index *
          0.03,

        duration:
          0.18,
      }}
      className="overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] shadow-xl shadow-black/20"
    >
      <Link
        to={`/workspace/${workspace.id}`}
        className="group block p-5 transition hover:bg-white/[0.02]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-[22px] border border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff8d22]">
            {project?.logo_url ? (
              <img
                src={
                  project.logo_url
                }
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2
                size={27}
              />
            )}
          </div>


          <ArrowRight
            size={18}
            className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#ff7a00]"
          />
        </div>


        <h2 className="mt-6 truncate text-2xl font-black tracking-[-0.05em]">
          {
            workspace.name
          }
        </h2>


        {project?.description && (
          <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-white/35">
            {
              project.description
            }
          </p>
        )}


        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
          {
            copy.services
          }
        </p>


        <div className="mt-3 grid gap-2">
          <MiniService
            icon={
              <UtensilsCrossed
                size={15}
              />
            }
            label={
              copy.menu
            }
            active={
              menuActive
            }
            activeLabel={
              copy.active
            }
            soonLabel={
              copy.soon
            }
          />

          <MiniService
            icon={
              <ShoppingBag
                size={15}
              />
            }
            label={
              copy.store
            }
            active={
              false
            }
            activeLabel={
              copy.active
            }
            soonLabel={
              copy.soon
            }
          />

          <MiniService
            icon={
              <Globe2
                size={15}
              />
            }
            label={
              copy.websites
            }
            active={
              false
            }
            activeLabel={
              copy.active
            }
            soonLabel={
              copy.soon
            }
          />
        </div>


        <div className="mt-5 border-t border-white/10 pt-4 text-xs font-black text-[#ff8d22]">
          {
            copy.openBusiness
          }
        </div>
      </Link>
    </motion.article>
  );
}


function MiniService({
  icon,
  label,
  active,
  activeLabel,
  soonLabel,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
      <span
        className={
          active
            ? "text-[#ff8d22]"
            : "text-white/20"
        }
      >
        {
          icon
        }
      </span>

      <span
        className={`min-w-0 flex-1 truncate text-xs font-black ${
          active
            ? "text-white/65"
            : "text-white/30"
        }`}
      >
        {
          label
        }
      </span>

      <Badge
        tone={
          active
            ? "success"
            : "neutral"
        }
      >
        {active
          ? activeLabel
          : soonLabel}
      </Badge>
    </div>
  );
}


function NewBusinessModal({
  open,
  onClose,
  onDone,
  copy,
}) {
  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );


  const [
    form,
    setForm,
  ] =
    useState({
      name:
        "",

      slug:
        "",

      description:
        "",

      phone:
        "",

      whatsapp:
        "",

      instagram:
        "",
    });


  function updateField(
    key,
    value
  ) {
    setForm(
      (
        current
      ) => {
        const next = {
          ...current,
          [key]:
            value,
        };


        if (
          key ===
          "name"
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


  function reset() {
    setForm({
      name:
        "",

      slug:
        "",

      description:
        "",

      phone:
        "",

      whatsapp:
        "",

      instagram:
        "",
    });
  }


  async function submit(
    event
  ) {
    event.preventDefault();


    if (
      loading
    ) {
      return;
    }


    setLoading(
      true
    );


    let workspaceId =
      null;


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


      if (
        !user
      ) {
        throw new Error(
          copy.loginRequired
        );
      }


      const name =
        form.name.trim();


      const slug =
        slugify(
          form.slug
        );


      if (
        !name
      ) {
        throw new Error(
          copy.nameRequired
        );
      }


      if (
        !slug
      ) {
        throw new Error(
          copy.slugRequired
        );
      }


      const {
        data:
          existing,

        error:
          existingError,
      } =
        await supabase
          .from(
            "projects"
          )
          .select(
            "id"
          )
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


      if (
        existing
      ) {
        throw new Error(
          copy.slugUsed
        );
      }


      const {
        data:
          workspace,

        error:
          workspaceError,
      } =
        await supabase
          .from(
            "workspaces"
          )
          .insert({
            owner_id:
              user.id,

            name,
          })
          .select(
            "id"
          )
          .single();


      if (
        workspaceError
      ) {
        throw workspaceError;
      }


      workspaceId =
        workspace.id;


      const {
        error:
          serviceError,
      } =
        await supabase
          .from(
            "workspace_services"
          )
          .insert({
            workspace_id:
              workspace.id,

            service_key:
              "menu",

            status:
              "active",
          });


      if (
        serviceError
      ) {
        throw serviceError;
      }


      const {
        error:
          projectError,
      } =
        await supabase
          .from(
            "projects"
          )
          .insert({
            owner_id:
              user.id,

            workspace_id:
              workspace.id,

            name,

            slug,

            description:
              form.description
                .trim() ||
              null,

            phone:
              form.phone
                .trim() ||
              null,

            whatsapp:
              form.whatsapp
                .trim() ||
              null,

            instagram:
              form.instagram
                .trim() ||
              null,

            status:
              "active",
          });


      if (
        projectError
      ) {
        throw projectError;
      }


      /*
       * Creation is now complete.
       * Don't allow later UI errors to
       * trigger workspace rollback.
       */
      workspaceId =
        null;


      toast.success(
        copy.created
      );


      reset();


      onDone();
    } catch (
      error
    ) {
      if (
        workspaceId
      ) {
        const {
          error:
            rollbackError,
        } =
          await supabase
            .from(
              "workspaces"
            )
            .delete()
            .eq(
              "id",
              workspaceId
            );


        if (
          rollbackError
        ) {
          console.error(
            "[CRTRGO] Workspace rollback failed:",
            rollbackError
          );
        }
      }


      toast.error(
        error?.message ||
          copy.failed
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  const previewUrl =
    form.slug
      ? getPublicProjectUrl(
          slugify(
            form.slug
          )
        )
      : "";


  return (
    <Modal
      open={open}
      title={
        copy.createTitle
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
        <p className="rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/10 p-4 text-xs font-bold leading-5 text-[#ffd0a3]/65">
          {
            copy.createSubtitle
          }
        </p>


        <Field
          label={
            copy.businessName
          }
        >
          <Input
            required
            disabled={
              loading
            }
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
            placeholder="Juicy Rest"
          />
        </Field>


        <Field
          label={
            copy.menuAddress
          }
          hint={
            previewUrl ||
            copy.addressHint
          }
        >
          <Input
            required
            disabled={
              loading
            }
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
            placeholder="juicy-rest"
            dir="ltr"
          />
        </Field>


        <Field
          label={
            copy.description
          }
        >
          <Textarea
            disabled={
              loading
            }
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


        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={
              copy.phone
            }
          >
            <Input
              disabled={
                loading
              }
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
              dir="ltr"
            />
          </Field>


          <Field
            label={
              copy.whatsapp
            }
          >
            <Input
              disabled={
                loading
              }
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
              dir="ltr"
            />
          </Field>
        </div>


        <Field
          label={
            copy.instagram
          }
        >
          <Input
            disabled={
              loading
            }
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
          size="lg"
          loading={
            loading
          }
          loadingText={
            copy.creating
          }
          disabled={
            loading ||
            !form.name.trim()
          }
        >
          <Plus
            size={17}
          />

          {
            copy.create
          }
        </Button>
      </form>
    </Modal>
  );
}