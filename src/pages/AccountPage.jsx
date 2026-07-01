import { useEffect, useMemo, useState } from "react";
import { Mail, Save, UserCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
  Stat,
} from "../components/ui";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
  });

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User not found.");

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, username, display_name, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const finalProfile =
        profileData || {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || "",
          display_name: user.user_metadata?.display_name || "",
        };

      setProfile(finalProfile);

      setForm({
        username: finalProfile.username || "",
        display_name: finalProfile.display_name || "",
        email: finalProfile.email || user.email || "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  }

  const initialForm = useMemo(() => {
    return {
      username: profile?.username || "",
      display_name: profile?.display_name || "",
      email: profile?.email || user?.email || "",
    };
  }, [profile, user]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function discard() {
    setForm(initialForm);
    toast.success("Changes discarded");
  }

  async function saveAccount(e) {
    e.preventDefault();

    if (!dirty) return;

    setSaving(true);

    try {
      const username = form.username.trim().toLowerCase();
      const displayName = form.display_name.trim();

      if (!username) throw new Error("Username is required.");
      if (!displayName) throw new Error("Display name is required.");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        username,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          username,
          display_name: displayName,
        },
      });

      if (metadataError) throw metadataError;

      toast.success("Account updated");
      await loadAccount();
    } catch (err) {
      toast.error(err.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="h-full overflow-y-auto p-5">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-96" />
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto">
      <PageHeader
        eyebrow="Profile"
        title="Account"
        subtitle="Manage your CRTGO owner profile and workspace identity."
        action={
          <Button
            onClick={saveAccount}
            loading={saving}
            loadingText="Saving..."
            disabled={!dirty}
          >
            <Save size={17} />
            Save
          </Button>
        }
      />

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/10 bg-white/[0.04] text-[#ff7a00]">
              <UserCircle2 size={46} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-3xl font-black tracking-[-0.05em]">
                {form.display_name || "CRTGO Owner"}
              </h2>

              <p className="mt-2 flex items-center gap-2 truncate text-sm font-bold text-white/40">
                <Mail size={16} />
                {form.email || "No email"}
              </p>
            </div>
          </div>

<div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
  <Stat label="User ID" value={user?.id || "Loading..."} />
  <Stat label="Username" value={form.username || "Not set"} />
</div>
        </Card>

        <form onSubmit={saveAccount} className="mt-5 grid gap-5">
          <Card className="p-5">
            <h3 className="text-2xl font-black tracking-[-0.04em]">
              Profile details
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <Input
                  value={form.display_name}
                  onChange={(e) => updateField("display_name", e.target.value)}
                  placeholder="Khalil"
                />
              </Field>

              <Field label="Username">
                <Input
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="khaliil"
                  dir="ltr"
                />
              </Field>

              <Field label="Email">
                <Input value={form.email} disabled dir="ltr" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-2xl font-black tracking-[-0.04em]">
              Account status
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Stat label="Auth provider" value="Email" />
              <Stat label="Plan" value="Trial" />
              <Stat label="Role" value="Owner" />
            </div>
          </Card>
        </form>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved account changes
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={discard}
                disabled={saving}
              >
                Discard
              </Button>

              <Button
                type="button"
                onClick={saveAccount}
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