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
  Sparkles,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { getPublicMenuUrl } from "../lib/urls";
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

async function loadBusinesses() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      )
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export default function Dashboard() {
  const queryClient = useQueryClient();

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

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["businesses"] });
    toast.success("Workspace refreshed");
  }

  return (
     <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white pb-20">
      <PageHeader
        eyebrow="Workspace"
        title="Businesses"
        subtitle="Manage every client, branch, and menu from one clean workspace."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={refresh}>
              <RefreshCw size={17} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </Button>

          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        
        <div className="flex flex-col gap-2 mb-4 sm:flex-row">
                <Button onClick={() => setNewBusinessOpen(true)}>
              <Plus size={17} />
              New Business
            </Button>
        </div>
        
        <div className="hidden gap-4 md:grid-cols-3">
          <Card className="p-5">
            <Stat label="Businesses" value={businesses.length} />
          </Card>

          <Card className="p-5">
            <Stat label="Branches" value={totalBranches} />
          </Card>

          <Card className="p-5">
            <Stat label="Status" value="Active workspace" />
          </Card>
        </div>

        <Card className="p-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search businesses, branches, URLs..."
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-11 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-[#ff7a00]"
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
              title={search ? "No results found" : "Create your first business"}
              text={
                search
                  ? "Try searching with another business name, branch, or slug."
                  : "CRTGO will create a business, a main branch, and a starter menu automatically."
              }
              action={
                !search && (
                  <Button onClick={() => setNewBusinessOpen(true)}>
                    <Plus size={17} />
                    New Business
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
  const mainBranch =
    business.branches?.find((branch) => branch.is_main) ||
    business.branches?.[0];

  const activeMenu =
    mainBranch?.menu_versions?.find((menu) => menu.status === "active") ||
    mainBranch?.menu_versions?.[0];

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

          <Badge tone={business.status === "active" ? "success" : "neutral"}>
            {business.status || "active"}
          </Badge>
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
          <Stat label="Branches" value={business.branches?.length || 0} />
          <Stat label="Menu" value={activeMenu?.name || "Main Menu"} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
            Open business
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
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You are not logged in.");

      const businessName = form.name.trim();
      const businessSlug = slugify(form.slug);
      const branchName = form.branchName.trim() || "Main Branch";
      const branchSlug = slugify(form.branchSlug) || "main";

      if (!businessName) throw new Error("Business name is required.");
      if (!businessSlug) throw new Error("Business slug is required.");

      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", businessSlug)
        .maybeSingle();

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
        background_color: "#090909",
        text_color: "#ffffff",
      });

      if (menuError) throw menuError;

      toast.success("Business created");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="New Business" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/10 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-[#ffbd7c]">
            <Sparkles size={16} />
            CRTGO will also create the first branch and menu.
          </p>
        </div>

        <Field label="Business name">
          <Input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Burger House"
          />
        </Field>

        <Field label="Business slug" hint="This becomes the public URL.">
          <Input
            required
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            placeholder="burger-house"
            dir="ltr"
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short description..."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Branch name">
            <Input
              value={form.branchName}
              onChange={(e) => updateField("branchName", e.target.value)}
              placeholder="Main Branch"
            />
          </Field>

          <Field label="Branch slug">
            <Input
              value={form.branchSlug}
              onChange={(e) => updateField("branchSlug", e.target.value)}
              placeholder="main"
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <Field label="Instagram">
          <Input
            value={form.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            placeholder="@restaurant"
            dir="ltr"
          />
        </Field>

        <Button
          loading={loading}
          loadingText="Creating..."
          disabled={!form.name.trim()}
          size="lg"
          className="mt-2"
        >
          {loading && <Loader2 size={17} className="animate-spin" />}
          Create Business
        </Button>
      </form>
    </Modal>
  );
}