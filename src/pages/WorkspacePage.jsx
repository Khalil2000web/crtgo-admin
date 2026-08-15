import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import {
  supabase,
} from "../lib/supabase";

import {
  getPublicProjectUrl,
} from "../lib/urls";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import {
  Badge,
  Card,
  PageHeader,
  SkeletonCard,
} from "../components/ui";


const COPY = {
  en: {
    eyebrow:
      "Business workspace",

    subtitle:
      "Manage the CRTRGO services connected to this business.",

    back:
      "All businesses",

    overview:
      "Business overview",

    services:
      "Services",

    servicesHint:
      "Choose a service to manage it.",

    menu:
      "Menu",

    menuDescription:
      "Digital menu, restaurant information, languages, appearance and publishing.",

    store:
      "Store",

    storeDescription:
      "Products, checkout, orders and online selling.",

    websites:
      "Websites",

    websitesDescription:
      "Create and manage a full business website.",

    active:
      "Active",

    comingSoon:
      "Coming soon",

    setupNeeded:
      "Setup needed",

    manage:
      "Manage service",

    publicMenu:
      "Public menu",

    openPublic:
      "Open public menu",

    owner:
      "Owner",

    member:
      "Member",

    connectedServices:
      "Connected services",

    loadFailed:
      "Could not load this business workspace.",

    notFound:
      "Business workspace not found.",
  },


  ar: {
    eyebrow:
      "مساحة عمل النشاط",

    subtitle:
      "أدر خدمات CRTRGO المرتبطة بهذا النشاط.",

    back:
      "كل الأعمال",

    overview:
      "نظرة عامة",

    services:
      "الخدمات",

    servicesHint:
      "اختر خدمة لإدارتها.",

    menu:
      "القائمة",

    menuDescription:
      "القائمة الرقمية ومعلومات المطعم واللغات والمظهر والنشر.",

    store:
      "المتجر",

    storeDescription:
      "المنتجات والدفع والطلبات والبيع عبر الإنترنت.",

    websites:
      "المواقع",

    websitesDescription:
      "أنشئ وأدر موقعاً كاملاً للنشاط.",

    active:
      "فعال",

    comingSoon:
      "قريباً",

    setupNeeded:
      "يحتاج إعداد",

    manage:
      "إدارة الخدمة",

    publicMenu:
      "القائمة العامة",

    openPublic:
      "فتح القائمة العامة",

    owner:
      "المالك",

    member:
      "عضو",

    connectedServices:
      "الخدمات المرتبطة",

    loadFailed:
      "تعذر تحميل مساحة العمل.",

    notFound:
      "لم يتم العثور على مساحة العمل.",
  },
};


async function loadWorkspace(
  workspaceId
) {
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
      "Authentication required."
    );
  }


  const {
    data:
      workspace,

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
          workspace_id,
          service_key,
          status,
          created_at,
          updated_at
        ),
        projects (
          id,
          owner_id,
          workspace_id,
          name,
          slug,
          status,
          description,
          logo_url,
          created_at,
          updated_at
        )
      `)
      .eq(
        "id",
        workspaceId
      )
      .single();


  if (
    error
  ) {
    throw error;
  }


  return {
    user,
    workspace: {
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
    },
  };
}


export default function WorkspacePage() {
  const {
    workspaceId,
  } =
    useParams();


  const {
    dir,
  } =
    useAdminI18n();


  const copy =
    dir ===
    "rtl"
      ? COPY.ar
      : COPY.en;


  const {
    data,
    isLoading,
    error,
    isFetching,
  } =
    useQuery({
      queryKey: [
        "workspace",
        workspaceId,
      ],

      queryFn:
        () =>
          loadWorkspace(
            workspaceId
          ),

      enabled:
        Boolean(
          workspaceId
        ),
    });


  if (
    isLoading
  ) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <SkeletonCard className="h-36" />

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </main>
    );
  }


  if (
    error ||
    !data?.workspace
  ) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message ||
            copy.notFound}
        </p>
      </main>
    );
  }


  const {
    workspace,
    user,
  } =
    data;


  const services =
    workspace.workspace_services;


  const projects =
    workspace.projects;


  const menuService =
    services.find(
      (
        service
      ) =>
        service.service_key ===
        "menu"
    );


  const menuProject =
    projects[0] ||
    null;


  const menuActive =
    menuService?.status ===
      "active" &&
    Boolean(
      menuProject
    );


  const activeServiceCount =
    services.filter(
      (
        service
      ) =>
        service.status ===
        "active"
    ).length;


  const isOwner =
    workspace.owner_id ===
    user.id;


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
          workspace.name
        }
        subtitle={
          copy.subtitle
        }
        action={
          isFetching ? (
            <Badge tone="neutral">
              <Loader2
                size={13}
                className="animate-spin"
              />

              ...
            </Badge>
          ) : null
        }
      />


      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">

        <Link
          to="/"
          className="inline-flex items-center gap-2 py-2 text-sm font-black text-white/40 transition hover:text-white"
        >
          <ArrowLeft
            size={16}
            className={
              dir ===
              "rtl"
                ? "rotate-180"
                : ""
            }
          />

          {
            copy.back
          }
        </Link>


        {/* BUSINESS OVERVIEW */}

        <Card className="mt-5 overflow-hidden">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff8d22]">
                {menuProject
                  ?.logo_url ? (
                  <img
                    src={
                      menuProject.logo_url
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


              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black tracking-[-0.05em]">
                  {
                    workspace.name
                  }
                </h2>


                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="neutral">
                    {isOwner
                      ? copy.owner
                      : copy.member}
                  </Badge>


                  <Badge tone="success">
                    <CheckCircle2
                      size={13}
                    />

                    {activeServiceCount}{" "}
                    {
                      copy.connectedServices
                    }
                  </Badge>
                </div>
              </div>
            </div>


            {menuProject?.description && (
              <p className="max-w-xl text-sm font-bold leading-6 text-white/35 sm:text-end">
                {
                  menuProject.description
                }
              </p>
            )}
          </div>
        </Card>


        {/* SERVICES HEADER */}

        <div className="mt-8">
          <h2 className="text-3xl font-black tracking-[-0.05em]">
            {
              copy.services
            }
          </h2>

          <p className="mt-1 text-sm font-bold text-white/35">
            {
              copy.servicesHint
            }
          </p>
        </div>


        {/* SERVICES GRID */}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* MENU */}

          <ServiceCard
            icon={
              <UtensilsCrossed
                size={25}
              />
            }
            title={
              copy.menu
            }
            description={
              copy.menuDescription
            }
            status={
              menuActive
                ? copy.active
                : copy.setupNeeded
            }
            active={
              menuActive
            }
            href={
              menuActive
                ? `/project/${menuProject.id}/general`
                : null
            }
            actionLabel={
              copy.manage
            }
          >
            {menuProject && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/25">
                  {
                    copy.publicMenu
                  }
                </p>


                <a
                  href={getPublicProjectUrl(
                    menuProject.slug
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                  className="mt-2 flex min-w-0 items-center justify-between gap-3 text-[#ff8d22]"
                >
                  <span
                    dir="ltr"
                    className="min-w-0 truncate text-xs font-black"
                  >
                    {getPublicProjectUrl(
                      menuProject.slug
                    )}
                  </span>


                  <ArrowUpRight
                    size={15}
                    className="shrink-0"
                  />
                </a>
              </div>
            )}
          </ServiceCard>


          {/* STORE */}

          <ServiceCard
            icon={
              <ShoppingBag
                size={25}
              />
            }
            title={
              copy.store
            }
            description={
              copy.storeDescription
            }
            status={
              copy.comingSoon
            }
          />


          {/* WEBSITES */}

          <ServiceCard
            icon={
              <Globe2
                size={25}
              />
            }
            title={
              copy.websites
            }
            description={
              copy.websitesDescription
            }
            status={
              copy.comingSoon
            }
          />
        </div>
      </section>
    </main>
  );
}


function ServiceCard({
  icon,
  title,
  description,
  status,
  active = false,
  href = null,
  actionLabel = "",
  children = null,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex size-14 items-center justify-center rounded-[20px] border ${
            active
              ? "border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff8d22]"
              : "border-white/10 bg-white/[0.035] text-white/25"
          }`}
        >
          {
            icon
          }
        </div>


        <Badge
          tone={
            active
              ? "success"
              : "neutral"
          }
        >
          {
            status
          }
        </Badge>
      </div>


      <h3
        className={`mt-6 text-2xl font-black tracking-[-0.04em] ${
          active
            ? "text-white"
            : "text-white/50"
        }`}
      >
        {
          title
        }
      </h3>


      <p className="mt-2 min-h-[72px] text-sm font-bold leading-6 text-white/35">
        {
          description
        }
      </p>


      {
        children
      }


      {href && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-black text-[#ff8d22]">
          <span>
            {
              actionLabel
            }
          </span>

          <ArrowRight
            size={17}
          />
        </div>
      )}
    </>
  );


  if (
    href
  ) {
    return (
      <Link
        to={href}
        className="group block rounded-[30px] border border-white/10 bg-[#111111] p-5 transition hover:-translate-y-1 hover:border-[#ff7a00]/35 hover:bg-[#151515]"
      >
        {
          content
        }
      </Link>
    );
  }


  return (
    <div className="rounded-[30px] border border-white/[0.07] bg-[#111111]/70 p-5 opacity-75">
      {
        content
      }
    </div>
  );
}