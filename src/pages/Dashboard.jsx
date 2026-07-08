import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { getPublicMenuUrl } from "../lib/urls";
import { useAdminI18n } from "../lib/adminI18n";
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

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  return user;
}

async function loadOwnerStatus() {
  const user = await getCurrentUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return false;

  return Boolean(data);
}

async function loadBusinesses() {
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      logo_url,
      description,
      status,
      created_at,
      branches (
        id,
        name,
        slug,
        is_main,
        status,
        menu_versions (
          id,
          name,
          status
        )
      ),
      business_subscriptions (
        business_id,
        plan_id,
        status,
        billing_plans (
          id,
          name,
          limits
        )
      )
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function statusLabel(status, t) {
  const clean = status || "active";
  return t(`status.${clean}`, clean);
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { t, dir } = useAdminI18n();

  const [search, setSearch] = useState("");
  const [newBusinessOpen, setNewBusinessOpen] = useState(false);

  const {
    data: businesses = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["businesses"],
    queryFn: loadBusinesses,
  });

  const { data: isOwner = false } = useQuery({
    queryKey: ["owner-status"],
    queryFn: loadOwnerStatus,
  });

  const filteredBusinesses = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return businesses;

    return businesses.filter((business) =>
      [
        business.name,
        business.slug,
        business.description,
        ...(business.branches || []).map((branch) => branch.name),
        ...(business.branches || []).map((branch) => branch.slug),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [businesses, search]);

  const totalBranches = businesses.reduce(
    (total, business) => total + (business.branches?.length || 0),
    0
  );

  const searchIconPosition = dir === "rtl" ? "right-4" : "left-4";
  const searchPadding = dir === "rtl" ? "pr-11 pl-4" : "pl-11 pr-4";

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["businesses"] });
    queryClient.invalidateQueries({ queryKey: ["owner-status"] });
    toast.success("Workspace refreshed");
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] pb-20 text-white">
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={refresh}>
              <RefreshCw
                size={17}
                className={isFetching ? "animate-spin" : ""}
              />
              {t("dashboard.refresh")}
            </Button>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {isOwner && (
          <Link
            to="/owner"
            className="mb-4 flex items-center justify-between gap-4 rounded-[24px] border border-[#ff7a00]/20 bg-[#ff7a00]/10 p-4 transition hover:bg-[#ff7a00]/15"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff7a00] text-black">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-sm font-black text-[#ffbd7c]">
                  {t("dashboard.ownerConsole")}
                </p>

                <p className="mt-1 text-xs font-bold text-white/40">
                  {t("dashboard.ownerConsoleText")}
                </p>
              </div>
            </div>

            <p className="text-sm font-black text-[#ffbd7c]">
              {t("dashboard.open")}
            </p>
          </Link>
        )}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setNewBusinessOpen(true)}>
            <Plus size={17} />
            {t("dashboard.newBusiness")}
          </Button>
        </div>

        <div className="hidden gap-4 md:grid-cols-3">
          <Card className="p-5">
            <Stat label={t("dashboard.businesses")} value={businesses.length} />
          </Card>

          <Card className="p-5">
            <Stat label={t("dashboard.branches")} value={totalBranches} />
          </Card>

          <Card className="p-5">
            <Stat
              label={t("dashboard.status")}
              value={t("dashboard.activeWorkspace")}
            />
          </Card>
        </div>

        <Card className="p-3">
          <div className="relative">
            <Search
              size={17}
              className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 text-white/35`}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              dir="auto"
              className={`min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 ${searchPadding} text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-[#ff7a00]`}
            />
          </div>
        </Card>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {error.message}
          </p>
        )}

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} className="h-64" />
            ))}
          </div>
        ) : filteredBusinesses.length ? (
          <motion.div
            layout
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredBusinesses.map((business, index) => (
              <BusinessCard
                key={business.id}
                business={business}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={<Building2 size={38} />}
              title={
                search
                  ? t("dashboard.noResults")
                  : t("dashboard.createFirstBusiness")
              }
              text={
                search
                  ? t("dashboard.noResultsText")
                  : t("dashboard.createFirstBusinessText")
              }
              action={
                !search && (
                  <Button onClick={() => setNewBusinessOpen(true)}>
                    <Plus size={17} />
                    {t("dashboard.newBusiness")}
                  </Button>
                )
              }
            />
          </div>
        )}
      </section>

      <NewBusinessModal
        open={newBusinessOpen}
        onClose={() => setNewBusinessOpen(false)}
        onDone={() => {
          setNewBusinessOpen(false);
          queryClient.invalidateQueries({ queryKey: ["businesses"] });
        }}
      />
    </main>
  );
}

function BusinessCard({ business, index }) {
  const { t } = useAdminI18n();

  const mainBranch =
    business.branches?.find((branch) => branch.is_main) ||
    business.branches?.[0];

  const activeMenu =
    mainBranch?.menu_versions?.find((menu) => menu.status === "active") ||
    mainBranch?.menu_versions?.[0];

  const subscription = Array.isArray(business.business_subscriptions)
    ? business.business_subscriptions[0]
    : business.business_subscriptions || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
    >
      <Link
        to={`/business/${business.id}`}
        className="group block min-h-64 rounded-[30px] border border-white/10 bg-[#111111]/95 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#ff7a00]/50 hover:bg-[#161616]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] text-[#ff7a00]">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={28} />
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge tone={business.status === "active" ? "success" : "neutral"}>
              {statusLabel(business.status, t)}
            </Badge>

            {subscription && (
              <Badge
                tone={
                  subscription.status === "active"
                    ? "neutral"
                    : subscription.status === "trial"
                      ? "neutral"
                      : "warning"
                }
              >
                {subscription.plan_id || "free"}
              </Badge>
            )}
          </div>
        </div>

        <h2 className="mt-7 truncate text-2xl font-black tracking-[-0.05em]">
          {business.name}
        </h2>

        <p className="mt-2 truncate text-sm font-bold text-white/35" dir="ltr">
          {mainBranch
            ? getPublicMenuUrl(business.slug, mainBranch.slug)
            : `menu.crtgo.com/${business.slug}`}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat
            label={t("dashboard.branches")}
            value={business.branches?.length || 0}
          />
          <Stat
            label={t("dashboard.menu")}
            value={activeMenu?.name || t("dashboard.mainMenu")}
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
            {t("dashboard.openBusiness")}
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

function NewBusinessModal({ open, onClose, onDone }) {
  const { t } = useAdminI18n();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    branchName: "Main Branch",
    branchSlug: "main",
    phone: "",
    whatsapp: "",
    instagram: "",
  });

  function updateField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "name") next.slug = slugify(value);
      if (key === "branchName") next.branchSlug = slugify(value) || "main";

      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("You are not logged in.");

      const businessName = form.name.trim();
      const businessSlug = slugify(form.slug);
      const branchName = form.branchName.trim() || "Main Branch";
      const branchSlug = slugify(form.branchSlug) || "main";

      if (!businessName) throw new Error("Business name is required.");
      if (!businessSlug) throw new Error("Business slug is required.");

      const { data: existing, error: existingError } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", businessSlug)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) throw new Error("This business slug already exists.");

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: businessName,
          slug: businessSlug,
          description: form.description.trim() || null,
          status: "active",
        })
        .select("*")
        .single();

      if (businessError) throw businessError;

      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .insert({
          business_id: business.id,
          name: branchName,
          slug: branchSlug,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram: form.instagram.trim() || null,
          is_main: true,
          status: "active",
        })
        .select("*")
        .single();

      if (branchError) throw branchError;

      const { error: menuError } = await supabase.from("menu_versions").insert({
        branch_id: branch.id,
        name: "Main Menu",
        status: "active",
        template_id: "classic",
        default_language: "ar",
        enabled_languages: ["ar"],
        primary_color: "#ff7a00",
        background_color: "#f7f4ef",
        text_color: "#111111",
      });

      if (menuError) throw menuError;

      toast.success("Business created");

      setForm({
        name: "",
        slug: "",
        description: "",
        branchName: "Main Branch",
        branchSlug: "main",
        phone: "",
        whatsapp: "",
        instagram: "",
      });

      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title={t("dashboard.newBusiness")} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/10 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-[#ffbd7c]">
            <Sparkles size={16} />
            {t("dashboard.newBusinessInfo")}
          </p>
        </div>

        <Field label={t("dashboard.businessName")}>
          <Input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Burger House"
          />
        </Field>

        <Field
          label={t("dashboard.businessSlug")}
          hint={t("dashboard.businessSlugHint")}
        >
          <Input
            required
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            onBlur={() => updateField("slug", slugify(form.slug))}
            placeholder="burger-house"
            dir="ltr"
          />
        </Field>

        <Field label={t("dashboard.description")}>
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short description..."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("dashboard.branchName")}>
            <Input
              value={form.branchName}
              onChange={(e) => updateField("branchName", e.target.value)}
              placeholder="Main Branch"
            />
          </Field>

          <Field label={t("dashboard.branchSlug")}>
            <Input
              value={form.branchSlug}
              onChange={(e) => updateField("branchSlug", e.target.value)}
              onBlur={() =>
                updateField("branchSlug", slugify(form.branchSlug) || "main")
              }
              placeholder="main"
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("dashboard.phone")}>
            <Input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="0500000000"
              dir="ltr"
            />
          </Field>

          <Field label={t("dashboard.whatsapp")}>
            <Input
              value={form.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              placeholder="972500000000"
              dir="ltr"
            />
          </Field>
        </div>

        <Field label={t("dashboard.instagram")}>
          <Input
            value={form.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            placeholder="@restaurant"
            dir="ltr"
          />
        </Field>

        <Button
          type="submit"
          loading={loading}
          loadingText={t("dashboard.creating")}
          disabled={!form.name.trim()}
          size="lg"
          className="mt-2"
        >
          {loading && <Loader2 size={17} className="animate-spin" />}
          {t("dashboard.createBusiness")}
        </Button>
      </form>
    </Modal>
  );
}