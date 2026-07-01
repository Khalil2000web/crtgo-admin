import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Save } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import BranchTabs from "../components/BranchTabs";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  SkeletonCard,
} from "../components/ui";

const LANGUAGES = [
  {
    code: "ar",
    name: "Arabic",
    native: "العربية",
    recommended: true,
  },
  {
    code: "he",
    name: "Hebrew",
    native: "עברית",
    recommended: false,
  },
  {
    code: "en",
    name: "English",
    native: "English",
    recommended: false,
  },
];

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      business_id,
      menu_versions (
        id,
        status,
        enabled_languages,
        default_language
      )
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;
  return data;
}

export default function BranchLanguagesPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [localForm, setLocalForm] = useState(null);

  const { data: branch, isLoading, error } = useQuery({
    queryKey: ["branch-languages", branchId],
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
      enabled_languages: menu?.enabled_languages?.length
        ? menu.enabled_languages
        : ["ar"],
      default_language: menu?.default_language || "ar",
    };
  }, [menu]);

  const form = localForm || initialForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  function toggleLanguage(code) {
    const enabled = new Set(form.enabled_languages);

    if (enabled.has(code)) {
      if (enabled.size === 1) {
        toast.error("At least one language must stay enabled");
        return;
      }

      enabled.delete(code);
    } else {
      enabled.add(code);
    }

    let defaultLanguage = form.default_language;

    if (!enabled.has(defaultLanguage)) {
      defaultLanguage = Array.from(enabled)[0];
    }

    setLocalForm({
      enabled_languages: Array.from(enabled),
      default_language: defaultLanguage,
    });
  }

  function setDefaultLanguage(code) {
    if (!form.enabled_languages.includes(code)) {
      toast.error("Enable this language first");
      return;
    }

    setLocalForm({
      ...form,
      default_language: code,
    });
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
          enabled_languages: form.enabled_languages,
          default_language: form.default_language,
        })
        .eq("id", menu.id);

      if (error) throw error;

      toast.success("Languages saved");
      await queryClient.invalidateQueries({ queryKey: ["branch-languages", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["branch-menu", branchId] });
      setLocalForm(null);
    } catch (err) {
      toast.error(err.message || "Failed to save languages");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full overflow-y-auto p-5">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-[420px]" />
      </main>
    );
  }

  if (error || !menu) {
    return (
     <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message || "Menu not found"}
        </p>
      </main>
    );
  }

  return (
  <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Branch Settings"
        title="Languages"
        subtitle={`Choose which languages are active for ${branch.name}.`}
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

      <section className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <Card className="p-5">
          <h2 className="text-2xl font-black tracking-[-0.04em]">
            Active languages
          </h2>

          <p className="mt-2 text-sm font-bold leading-6 text-white/42">
            Arabic should stay the main language for now. Later we can add full
            translated fields for Hebrew and English.
          </p>

          <div className="mt-5 grid gap-3">
            {LANGUAGES.map((language) => {
              const enabled = form.enabled_languages.includes(language.code);
              const isDefault = form.default_language === language.code;

              return (
                <div
                  key={language.code}
                  className={`rounded-[24px] border p-4 transition ${
                    enabled
                      ? "border-[#ff7a00]/40 bg-[#ff7a00]/10"
                      : "border-white/10 bg-black/25"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black">
                          {language.name}
                        </h3>

                        <span className="text-sm font-bold text-white/45">
                          {language.native}
                        </span>

                        {language.recommended && (
                          <Badge tone="warning">Recommended</Badge>
                        )}

                        {isDefault && <Badge tone="success">Default</Badge>}
                      </div>

                      <p className="mt-2 text-sm font-bold text-white/40">
                        {enabled
                          ? "This language is visible on the public menu."
                          : "This language is currently disabled."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={enabled ? "secondary" : "primary"}
                        onClick={() => toggleLanguage(language.code)}
                      >
                        {enabled ? "Disable" : "Enable"}
                      </Button>

                      <Button
                        variant="secondary"
                        disabled={!enabled || isDefault}
                        onClick={() => setDefaultLanguage(language.code)}
                      >
                        <Check size={16} />
                        Set default
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved language changes
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