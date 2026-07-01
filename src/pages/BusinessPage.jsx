import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { getPublicMenuUrl } from "../lib/urls";
import Modal from "../components/Modal";
import { Field, Input } from "../components/Form";

async function loadBusiness(businessId) {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      logo_url,
      description,
      status,
      branches (
        id,
        name,
        slug,
        address,
        phone,
        whatsapp,
        instagram,
        facebook,
        tiktok,
        is_main,
        status,
        menu_versions (
          id,
          name,
          status
        )
      )
    `)
    .eq("id", businessId)
    .single();

  if (error) throw error;

  return data;
}

export default function BusinessPage() {
  const { businessId } = useParams();
  const queryClient = useQueryClient();

  const [newBranchOpen, setNewBranchOpen] = useState(false);

  const {
    data: business,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => loadBusiness(businessId),
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage message={error.message} />;
  }

  return (
 <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090909]/85 px-4 py-5 backdrop-blur-xl sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to businesses
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff7a00]">
              Business
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-[-0.06em]">
              {business.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-bold text-white/40">
              {business.description || "Manage branches and menus."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNewBranchOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 text-sm font-black text-black transition hover:bg-white"
          >
            <Plus size={17} />
            New Branch
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
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

              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black">
                  {business.name}
                </h2>

                <p className="mt-1 truncate text-sm font-bold text-white/35" dir="ltr">
                  {business.slug}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
                Branches
              </p>
              <p className="mt-1 text-2xl font-black">
                {business.branches?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-[-0.04em]">Branches</h2>
        </div>

        {business.branches?.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {business.branches.map((branch) => {
              const activeMenu =
                branch.menu_versions?.find((menu) => menu.status === "active") ||
                branch.menu_versions?.[0];

              const publicUrl = getPublicMenuUrl(business.slug, branch.slug);

              return (
                <article
                  key={branch.id}
                  className="group rounded-[28px] border border-white/10 bg-[#111111] p-5 transition hover:-translate-y-0.5 hover:border-[#ff7a00]/50 hover:bg-[#151515]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
                      <MapPin size={24} />
                    </div>

                    <Link
                      to={`/branch/${branch.id}/menu`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/35 transition hover:border-[#ff7a00]/50 hover:text-[#ff7a00]"
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>

                  <h3 className="mt-6 truncate text-2xl font-black tracking-[-0.04em]">
                    {branch.name}
                  </h3>

                  <p className="mt-2 truncate text-sm font-bold text-white/35" dir="ltr">
                    {publicUrl}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Info label="Menu" value={activeMenu?.name || "Main Menu"} />
                    <Info label="Status" value={branch.status || "active"} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/branch/${branch.id}/menu`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#ff7a00] px-4 text-sm font-black text-black transition hover:bg-white"
                    >
                      Edit Menu
                    </Link>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      <ExternalLink size={16} />
                      Public
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-5 rounded-[28px] border border-dashed border-white/10 bg-[#111111] p-10 text-center">
            <MapPin className="mx-auto text-[#ff7a00]" size={42} />

            <h3 className="mt-5 text-3xl font-black tracking-[-0.05em]">
              No branches yet
            </h3>

            <button
              type="button"
              onClick={() => setNewBranchOpen(true)}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 text-sm font-black text-black transition hover:bg-white"
            >
              <Plus size={17} />
              New Branch
            </button>
          </section>
        )}
      </section>

      <NewBranchModal
        open={newBranchOpen}
        business={business}
        onClose={() => setNewBranchOpen(false)}
        onDone={() => {
          setNewBranchOpen(false);
          queryClient.invalidateQueries({ queryKey: ["business", businessId] });
          queryClient.invalidateQueries({ queryKey: ["businesses"] });
        }}
      />
    </main>
  );
}

function NewBranchModal({ open, onClose, onDone, business }) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
  });

  function updateField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "name") {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const branchName = form.name.trim();
      const branchSlug = slugify(form.slug);

      if (!branchName) throw new Error("Branch name is required.");
      if (!branchSlug) throw new Error("Branch slug is required.");

      const { data: existingBranch } = await supabase
        .from("branches")
        .select("id")
        .eq("business_id", business.id)
        .eq("slug", branchSlug)
        .maybeSingle();

      if (existingBranch) {
        throw new Error("This branch slug already exists in this business.");
      }

      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .insert({
          business_id: business.id,
          name: branchName,
          slug: branchSlug,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram: form.instagram.trim() || null,
          is_main: false,
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

      toast.success("Branch created");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="New Branch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Branch name">
          <Input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Downtown Branch"
          />
        </Field>

        <Field label="Branch slug">
          <Input
            required
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            placeholder="downtown"
            dir="ltr"
          />
        </Field>

        <Field label="Address">
          <Input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Street, city..."
          />
        </Field>

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

        <button
          disabled={loading}
          className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] text-sm font-black text-black transition hover:bg-white disabled:opacity-50"
        >
          {loading && <Loader2 size={17} className="animate-spin" />}
          {loading ? "Creating..." : "Create Branch"}
        </button>
      </form>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function LoadingPage() {
  return (
    <main className="min-h-screen bg-[#090909] p-5 text-white">
      <div className="h-12 w-72 animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-[28px] bg-white/10"
          />
        ))}
      </div>
    </main>
  );
}

function ErrorPage({ message }) {
  return (
  <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
        {message}
      </p>
    </main>
  );
}