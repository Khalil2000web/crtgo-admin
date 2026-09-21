import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  Palette,
  Save,
  Store,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { uploadProjectImage } from "../lib/uploads";

const CURRENCIES = ["ILS", "USD", "EUR"];

export default function RestaurantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [menu, setMenu] = useState(null);

  async function load() {
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setMenu(data || null);
    } catch (error) {
      toast.error(error?.message || "تعذر تحميل إعدادات المطعم.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const publicUrl = useMemo(() => {
    const slug = String(menu?.slug || "").trim().toLowerCase();
    return slug ? `https://${slug}.crtrgo.com` : "";
  }, [menu?.slug]);

  function patch(patchValue) {
    setMenu((current) => ({ ...current, ...patchValue }));
  }

  async function uploadImage(field, folder, file) {
    if (!file) return;

    setUploading(field);

    try {
      const url = await uploadProjectImage(file, folder);
      patch({ [field]: url });
      toast.success(field === "logo_url" ? "تم رفع الشعار." : "تم رفع صورة الغلاف.");
    } catch (error) {
      toast.error(error?.message || "تعذر رفع الصورة.");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!menu) return;

    if (
      !isValidHex(menu.accent_color || "#ff7a00") ||
      !isValidHex(menu.background_color || "#f7f7f5") ||
      !isValidHex(menu.text_color || "#171717")
    ) {
      toast.error("تأكد من أن جميع الألوان بصيغة HEX صحيحة، مثل #ff7a00.");
      return;
    }

    const accentColor = normalizeColor(menu.accent_color, "#ff7a00");
    const backgroundColor = normalizeColor(menu.background_color, "#f7f7f5");
    const textColor = normalizeColor(menu.text_color, "#171717");

    setSaving(true);

    try {
      const { error } = await supabase
        .from("menus")
        .update({
          logo_url: cleanNullable(menu.logo_url),
          cover_url: cleanNullable(menu.cover_url),
          phone: cleanNullable(menu.phone),
          whatsapp: cleanNullable(menu.whatsapp),
          instagram: cleanNullable(menu.instagram),
          currency: menu.currency || "ILS",
          accent_color: accentColor,
          background_color: backgroundColor,
          text_color: textColor,
        })
        .eq("id", menu.id);

      if (error) throw error;

      setMenu((current) => ({
        ...current,
        accent_color: accentColor,
        background_color: backgroundColor,
        text_color: textColor,
      }));

      toast.success("تم حفظ إعدادات المطعم.");
      await supabase.functions
        .invoke("revalidate-public-menu", { body: {} })
        .catch(() => null);
    } catch (error) {
      toast.error(error?.message || "تعذر حفظ الإعدادات.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Page>
        <Loader2 className="animate-spin text-[#ff7a00]" />
      </Page>
    );
  }

  if (!menu) {
    return (
      <Page>
        <div className="rounded-[28px] border border-white/10 bg-[#111] p-6">
          <h1 className="text-2xl font-black">لا يوجد مطعم مرتبط بهذا الحساب.</h1>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-white/35">إعدادات المطعم</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">
            {menu.business_name}
          </h1>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white/35 transition hover:text-white/70"
            dir="ltr"
          >
            {publicUrl}
            <ExternalLink size={13} />
          </a>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving || Boolean(uploading)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-black text-black disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          حفظ
        </button>
      </div>

      <section className="mt-8 rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
        <SectionTitle icon={<ImagePlus size={19} />} title="الهوية والصور" />

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ImageField
            label="الشعار"
            description="يفضّل صورة مربعة واضحة."
            value={menu.logo_url}
            uploading={uploading === "logo_url"}
            aspectClass="aspect-square max-w-[220px]"
            onUpload={(file) => uploadImage("logo_url", "logos", file)}
            onRemove={() => patch({ logo_url: null })}
          />

          <ImageField
            label="صورة الغلاف"
            description="تظهر أعلى القائمة للزبائن."
            value={menu.cover_url}
            uploading={uploading === "cover_url"}
            aspectClass="aspect-[16/9]"
            onUpload={(file) => uploadImage("cover_url", "covers", file)}
            onRemove={() => patch({ cover_url: null })}
          />
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
        <SectionTitle icon={<Store size={19} />} title="التواصل" />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label="رقم الهاتف">
            <input
              value={menu.phone || ""}
              onChange={(event) => patch({ phone: event.target.value })}
              placeholder="+972..."
              className="input"
              dir="ltr"
            />
          </Field>

          <Field label="واتساب">
            <input
              value={menu.whatsapp || ""}
              onChange={(event) => patch({ whatsapp: event.target.value })}
              placeholder="+972..."
              className="input"
              dir="ltr"
            />
          </Field>

          <Field label="Instagram">
            <input
              value={menu.instagram || ""}
              onChange={(event) => patch({ instagram: event.target.value })}
              placeholder="@restaurant"
              className="input"
              dir="ltr"
            />
          </Field>

          <Field label="العملة">
            <select
              value={menu.currency || "ILS"}
              onChange={(event) => patch({ currency: event.target.value })}
              className="input"
              dir="ltr"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <p className="mt-4 text-xs font-bold leading-6 text-white/30">
          اسم المطعم، الوصف والموقع متعدد اللغات يتم تعديلهم من صفحة القائمة.
        </p>
      </section>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
        <SectionTitle icon={<Palette size={19} />} title="ألوان القائمة" />

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ColorField
            label="اللون الأساسي"
            value={menu.accent_color || "#ff7a00"}
            fallback="#ff7a00"
            onChange={(value) => patch({ accent_color: value })}
          />
          <ColorField
            label="الخلفية"
            value={menu.background_color || "#f7f7f5"}
            fallback="#f7f7f5"
            onChange={(value) => patch({ background_color: value })}
          />
          <ColorField
            label="لون النص"
            value={menu.text_color || "#171717"}
            fallback="#171717"
            onChange={(value) => patch({ text_color: value })}
          />
        </div>

        <div
          className="mt-6 overflow-hidden rounded-[26px] border p-5"
          style={{
            backgroundColor: normalizeColor(menu.background_color, "#f7f7f5") || "#f7f7f5",
            color: normalizeColor(menu.text_color, "#171717") || "#171717",
            borderColor: "rgba(255,255,255,.1)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black opacity-45">معاينة</p>
              <h3 className="mt-1 text-xl font-black">{menu.business_name}</h3>
              <p className="mt-2 text-sm font-bold opacity-55">
                هكذا تظهر ألوان المطعم الأساسية في القائمة.
              </p>
            </div>

            <span
              className="shrink-0 rounded-full px-4 py-2 text-sm font-black"
              style={{
                backgroundColor:
                  normalizeColor(menu.accent_color, "#ff7a00") || "#ff7a00",
                color: readableText(
                  normalizeColor(menu.accent_color, "#ff7a00") || "#ff7a00"
                ),
              }}
            >
              ₪42
            </span>
          </div>
        </div>
      </section>
    </Page>
  );
}

function ImageField({
  label,
  description,
  value,
  uploading,
  aspectClass,
  onUpload,
  onRemove,
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs font-bold text-white/30">{description}</p>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-[24px] border border-dashed border-white/15 bg-black/25 ${aspectClass}`}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full min-h-40 place-items-center text-white/20">
            <ImagePlus size={28} />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-black/65">
            <Loader2 className="animate-spin text-[#ff7a00]" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/65 transition hover:bg-white/[0.04] hover:text-white">
          <ImagePlus size={16} />
          {value ? "تغيير الصورة" : "رفع صورة"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              onUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>

        {value && (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-400/15 px-4 py-3 text-sm font-black text-red-300/70 transition hover:bg-red-400/[0.06] hover:text-red-200"
          >
            <Trash2 size={15} />
            إزالة
          </button>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, fallback, onChange }) {
  const color = normalizeColor(value, fallback) || fallback;

  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={color}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-14 cursor-pointer rounded-2xl border border-white/10 bg-black/20 p-1"
        />
        <input
          value={value || fallback}
          onChange={(event) => onChange(event.target.value)}
          className="input min-w-0 flex-1"
          dir="ltr"
          placeholder={fallback}
        />
      </div>
    </Field>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 text-[#ff7a00]">
      {icon}
      <h2 className="text-lg font-black text-white">{title}</h2>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-white/45">{label}</span>
      {children}
    </label>
  );
}

function Page({ children }) {
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}

function cleanNullable(value) {
  const clean = String(value || "").trim();
  return clean || null;
}

function isValidHex(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
}

function normalizeColor(value, fallback = null) {
  const clean = String(value || "").trim();
  if (isValidHex(clean)) return clean.toLowerCase();
  return fallback;
}

function readableText(hex) {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return "#111111";

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 165 ? "#111111" : "#ffffff";
}
