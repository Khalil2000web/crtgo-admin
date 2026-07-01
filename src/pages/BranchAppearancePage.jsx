import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import BranchTabs from "../components/BranchTabs";
import ImageUploadField from "../components/ImageUploadField";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
} from "../components/ui";

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      business_id,
      menu_versions (
        id,
        name,
        status,
        template_id,
        logo_url,
        cover_url,
        primary_color,
        background_color,
        text_color
      )
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;
  return data;
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Simple, clean menu layout.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Big visuals and bold sections.",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant layout for premium brands.",
  },
];

export default function BranchAppearancePage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [localForm, setLocalForm] = useState(null);

  const { data: branch, isLoading, error } = useQuery({
    queryKey: ["branch-appearance", branchId],
    queryFn: () => loadBranch(branchId),
  });

  const menu = useMemo(() => {
    return (
      branch?.menu_versions?.find((item) => item.status === "active") ||
      branch?.menu_versions?.[0] ||
      null
    );
  }, [branch]);

  const initialForm = useMemo(() => {
    return {
      template_id: menu?.template_id || "classic",
      logo_url: menu?.logo_url || "",
      cover_url: menu?.cover_url || "",
      primary_color: menu?.primary_color || "#ff7a00",
      background_color: menu?.background_color || "#090909",
      text_color: menu?.text_color || "#ffffff",
    };
  }, [menu]);

  const form = localForm || initialForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  function updateField(key, value) {
    setLocalForm((current) => ({
      ...(current || initialForm),
      [key]: value,
    }));
  }

  function discard() {
    setLocalForm(initialForm);
    toast.success("Changes discarded");
  }

  async function save() {
    if (!dirty) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("menu_versions")
        .update({
          template_id: form.template_id,
          logo_url: form.logo_url.trim() || null,
          cover_url: form.cover_url.trim() || null,
          primary_color: form.primary_color,
          background_color: form.background_color,
          text_color: form.text_color,
        })
        .eq("id", menu.id);

      if (error) throw error;

      toast.success("Appearance saved");
      await queryClient.invalidateQueries({ queryKey: ["branch-appearance", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["branch-menu", branchId] });
      setLocalForm(null);
    } catch (err) {
      toast.error(err.message || "Failed to save appearance");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full overflow-y-auto p-5">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-[620px]" />
      </main>
    );
  }

  if (error || !menu) {
    return (
      <main className="p-5">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message || "Menu not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto">
      <PageHeader
        eyebrow="Branch Settings"
        title="Appearance"
        subtitle={`Customize images, colors, and template for ${branch.name}.`}
        action={
          <Button
            loading={saving}
            loadingText="Saving..."
            disabled={!dirty}
            onClick={save}
          >
            <Save size={17} />
            Save
          </Button>
        }
      />

      <BranchTabs branchId={branchId} />

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-5">
            <Card className="p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Images
              </h2>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Colors
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
            </Card>

            <Card className="p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Template
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {TEMPLATES.map((template) => {
                  const active = form.template_id === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => updateField("template_id", template.id)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        active
                          ? "border-[#ff7a00] bg-[#ff7a00]/10"
                          : "border-white/10 bg-black/25 hover:border-white/20"
                      }`}
                    >
                      <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.04]" />

                      <h3 className="mt-4 text-lg font-black">
                        {template.name}
                      </h3>

                      <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                        {template.description}
                      </p>

                      <p
                        className={`mt-4 text-xs font-black uppercase tracking-[0.18em] ${
                          active ? "text-[#ffbd7c]" : "text-white/25"
                        }`}
                      >
                        {active ? "Selected" : "Choose"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="sticky top-24 h-fit overflow-hidden p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
              Live preview
            </p>

            <div
              className="mt-4 overflow-hidden rounded-[28px] border border-white/10"
              style={{
                backgroundColor: form.background_color,
                color: form.text_color,
              }}
            >
              <div className="h-36 bg-white/10">
                {form.cover_url ? (
                  <img
                    src={form.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-black opacity-40">
                    No cover image
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black opacity-40">Logo</span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black">{branch.name}</h3>
                    <p className="text-xs font-bold opacity-50">
                      {form.template_id} template
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-5 rounded-2xl px-4 py-2 text-sm font-black"
                  style={{
                    backgroundColor: form.primary_color,
                    color: "#000",
                  }}
                >
                  Example action
                </button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved appearance changes
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={discard} disabled={saving}>
                Discard
              </Button>

              <Button
                onClick={save}
                loading={saving}
                loadingText="Saving..."
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}