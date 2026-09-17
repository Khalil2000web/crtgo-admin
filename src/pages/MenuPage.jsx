import { useEffect, useMemo, useState } from "react";
import { Globe2, ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { uploadProjectImage } from "../lib/uploads";

const LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "he", label: "العبرية" },
  { code: "en", label: "الإنجليزية" },
];

export default function MenuPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editingLanguage, setEditingLanguage] = useState("ar");

  async function load() {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: menuData, error: menuError } = await supabase
        .from("menus")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (menuError) throw menuError;
      setMenu(menuData || null);
      if (!menuData) return;

      const enabled = menuData.enabled_languages || [menuData.default_language || "ar"];
      setEditingLanguage(enabled.includes(menuData.default_language) ? menuData.default_language : enabled[0] || "ar");

      const { data: categoryRows, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("menu_id", menuData.id)
        .order("sort_order");

      if (categoryError) throw categoryError;
      const ids = (categoryRows || []).map((row) => row.id);
      let itemRows = [];

      if (ids.length) {
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .in("category_id", ids)
          .order("sort_order");
        if (error) throw error;
        itemRows = data || [];
      }

      setCategories((categoryRows || []).map((category) => ({
        ...category,
        items: itemRows.filter((item) => item.category_id === category.id),
      })));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const enabledLanguages = useMemo(
    () => menu?.enabled_languages || [menu?.default_language || "ar"],
    [menu]
  );

  function patchMenu(patch) {
    setMenu((current) => ({ ...current, ...patch }));
  }

  function patchMenuTranslation(field, language, value) {
    setMenu((current) => ({
      ...current,
      [field]: { ...(current?.[field] || {}), [language]: value },
    }));
  }

  function patchCategory(id, patch) {
    setCategories((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  function patchCategoryTranslation(id, field, language, value) {
    setCategories((rows) => rows.map((row) => row.id === id
      ? { ...row, [field]: { ...(row[field] || {}), [language]: value } }
      : row));
  }

  function patchItem(categoryId, itemId, patch) {
    setCategories((rows) => rows.map((row) => row.id === categoryId
      ? { ...row, items: row.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) }
      : row));
  }

  function patchItemTranslation(categoryId, itemId, field, language, value) {
    setCategories((rows) => rows.map((row) => row.id === categoryId
      ? {
          ...row,
          items: row.items.map((item) => item.id === itemId
            ? { ...item, [field]: { ...(item[field] || {}), [language]: value } }
            : item),
        }
      : row));
  }

  function toggleLanguage(code) {
    if (!menu) return;
    const current = new Set(enabledLanguages);

    if (current.has(code)) {
      if (current.size === 1) return toast.error("يجب اختيار لغة واحدة على الأقل.");
      current.delete(code);
    } else {
      current.add(code);
    }

    const next = LANGUAGES.map((language) => language.code).filter((language) => current.has(language));
    const defaultLanguage = next.includes(menu.default_language) ? menu.default_language : next[0];
    patchMenu({ enabled_languages: next, default_language: defaultLanguage });

    if (!next.includes(editingLanguage)) setEditingLanguage(defaultLanguage);
  }

  async function addCategory() {
    if (!menu) return;
    const initialName = "قسم جديد";
    const { data, error } = await supabase.from("categories").insert({
      menu_id: menu.id,
      name: initialName,
      name_i18n: { [menu.default_language || "ar"]: initialName },
      sort_order: categories.length,
    }).select().single();

    if (error) return toast.error(error.message);
    setCategories((rows) => [...rows, { ...data, items: [] }]);
  }

  async function addItem(category) {
    const initialName = "عنصر جديد";
    const { data, error } = await supabase.from("items").insert({
      category_id: category.id,
      name: initialName,
      name_i18n: { [menu.default_language || "ar"]: initialName },
      price: 0,
      sort_order: category.items.length,
    }).select().single();

    if (error) return toast.error(error.message);
    setCategories((rows) => rows.map((row) => row.id === category.id
      ? { ...row, items: [...row.items, data] }
      : row));
  }

  async function saveAll() {
    if (!menu) return;
    setSaving(true);

    try {
      const defaultLanguage = menu.default_language || "ar";
      const defaultName = menu.name_i18n?.[defaultLanguage] || menu.business_name || "مطعم";
      const defaultDescription = menu.description_i18n?.[defaultLanguage] || menu.description || null;
      const defaultLocation = menu.location_i18n?.[defaultLanguage] || menu.location || null;

      const { error: menuError } = await supabase.from("menus").update({
        business_name: defaultName,
        description: defaultDescription,
        location: defaultLocation,
        enabled_languages: menu.enabled_languages,
        default_language: defaultLanguage,
        name_i18n: menu.name_i18n || {},
        description_i18n: menu.description_i18n || {},
        location_i18n: menu.location_i18n || {},
        is_published: menu.is_published,
        published_at: menu.is_published ? (menu.published_at || new Date().toISOString()) : null,
      }).eq("id", menu.id);

      if (menuError) throw menuError;

      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
        const category = categories[categoryIndex];
        const categoryName = category.name_i18n?.[defaultLanguage] || category.name || "قسم";
        const categoryDescription = category.description_i18n?.[defaultLanguage] || category.description || null;

        const { error } = await supabase.from("categories").update({
          name: categoryName,
          description: categoryDescription,
          name_i18n: category.name_i18n || {},
          description_i18n: category.description_i18n || {},
          is_visible: category.is_visible,
          sort_order: categoryIndex,
        }).eq("id", category.id);

        if (error) throw error;

        for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
          const item = category.items[itemIndex];
          const itemName = item.name_i18n?.[defaultLanguage] || item.name || "عنصر";
          const itemDescription = item.description_i18n?.[defaultLanguage] || item.description || null;

          const { error: itemError } = await supabase.from("items").update({
            name: itemName,
            description: itemDescription,
            name_i18n: item.name_i18n || {},
            description_i18n: item.description_i18n || {},
            price: Number(item.price || 0),
            image_url: item.image_url || null,
            is_available: item.is_available,
            sort_order: itemIndex,
          }).eq("id", item.id);

          if (itemError) throw itemError;
        }
      }

      toast.success("تم حفظ القائمة بنجاح.");
      await supabase.functions.invoke("revalidate-public-menu", { body: {} }).catch(() => null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    if (!confirm("حذف هذا القسم وكل عناصره؟")) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) return toast.error(error.message);
    setCategories((rows) => rows.filter((row) => row.id !== category.id));
  }

  async function deleteItem(categoryId, itemId) {
    if (!confirm("حذف هذا العنصر؟")) return;
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) return toast.error(error.message);
    setCategories((rows) => rows.map((row) => row.id === categoryId
      ? { ...row, items: row.items.filter((item) => item.id !== itemId) }
      : row));
  }

  async function uploadItemImage(categoryId, itemId, file) {
    if (!file) return;
    try {
      const url = await uploadProjectImage(file, "items");
      patchItem(categoryId, itemId, { image_url: url });
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) return <Page><Loader2 className="animate-spin text-[#ff7a00]" /></Page>;
  if (!menu) return <Page><Empty /></Page>;

  return (
    <Page>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff7a00]">CRTGO MENU</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">إدارة القائمة</h1>
          <p className="mt-2 text-sm font-bold text-white/35">{menu.business_name}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={addCategory} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black">
            <Plus size={16} /> إضافة قسم
          </button>
          <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-4 py-3 text-sm font-black text-black disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ التغييرات
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[#ff7a00]"><Globe2 size={18} /><h2 className="text-lg font-black text-white">لغات القائمة</h2></div>
        <p className="mt-2 text-sm font-bold leading-6 text-white/35">اختر اللغات التي يستطيع الزبون التبديل بينها. يمكنك كتابة اسم ووصف مختلف لكل لغة.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => {
            const active = enabledLanguages.includes(language.code);
            return (
              <button key={language.code} onClick={() => toggleLanguage(language.code)} className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${active ? "border-[#ff7a00]/40 bg-[#ff7a00]/10 text-[#ff9a3c]" : "border-white/10 text-white/40"}`}>
                {language.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label="اللغة الأساسية">
            <select value={menu.default_language} onChange={(e) => patchMenu({ default_language: e.target.value })} className="input">
              {LANGUAGES.filter((language) => enabledLanguages.includes(language.code)).map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </Field>

          <Field label="حالة القائمة">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-black text-white/70">
              <input type="checkbox" checked={menu.is_published} onChange={(e) => patchMenu({ is_published: e.target.checked })} />
              {menu.is_published ? "منشورة للزبائن" : "غير منشورة"}
            </label>
          </Field>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-black">محتوى القائمة</h2>
            <p className="mt-2 text-sm font-bold text-white/35">اختر اللغة التي تريد تعديل نصوصها.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.filter((language) => enabledLanguages.includes(language.code)).map((language) => (
              <button key={language.code} onClick={() => setEditingLanguage(language.code)} className={`rounded-xl px-4 py-2 text-sm font-black ${editingLanguage === language.code ? "bg-white text-black" : "border border-white/10 text-white/45"}`}>
                {language.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label="اسم المطعم">
            <input value={menu.name_i18n?.[editingLanguage] || ""} onChange={(e) => patchMenuTranslation("name_i18n", editingLanguage, e.target.value)} className="input" />
          </Field>
          <Field label="الموقع">
            <input value={menu.location_i18n?.[editingLanguage] || ""} onChange={(e) => patchMenuTranslation("location_i18n", editingLanguage, e.target.value)} className="input" />
          </Field>
          <div className="lg:col-span-2">
            <Field label="وصف المطعم">
              <textarea value={menu.description_i18n?.[editingLanguage] || ""} onChange={(e) => patchMenuTranslation("description_i18n", editingLanguage, e.target.value)} className="input min-h-24 resize-y py-3" />
            </Field>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5">
        {categories.map((category) => (
          <section key={category.id} className="rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <input value={category.name_i18n?.[editingLanguage] || ""} onChange={(e) => patchCategoryTranslation(category.id, "name_i18n", editingLanguage, e.target.value)} placeholder="اسم القسم" className="min-w-0 flex-1 bg-transparent text-xl font-black outline-none" />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-black text-white/40"><input type="checkbox" checked={category.is_visible} onChange={(e) => patchCategory(category.id, { is_visible: e.target.checked })} /> ظاهر</label>
                <button onClick={() => deleteCategory(category)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/35 hover:text-red-400"><Trash2 size={15} /></button>
              </div>
            </div>

            <input value={category.description_i18n?.[editingLanguage] || ""} onChange={(e) => patchCategoryTranslation(category.id, "description_i18n", editingLanguage, e.target.value)} placeholder="وصف القسم" className="mt-3 w-full bg-transparent text-sm font-bold text-white/45 outline-none" />

            <div className="mt-5 grid gap-3">
              {category.items.map((item) => (
                <div key={item.id} className="grid gap-4 rounded-2xl border border-white/8 bg-black/20 p-4 xl:grid-cols-[90px_minmax(0,1fr)_130px_auto] xl:items-center">
                  <label className="grid h-[72px] w-[90px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-white/30">
                    {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={20} />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadItemImage(category.id, item.id, e.target.files?.[0])} />
                  </label>

                  <div>
                    <input value={item.name_i18n?.[editingLanguage] || ""} onChange={(e) => patchItemTranslation(category.id, item.id, "name_i18n", editingLanguage, e.target.value)} placeholder="اسم العنصر" className="w-full bg-transparent font-black outline-none" />
                    <input value={item.description_i18n?.[editingLanguage] || ""} onChange={(e) => patchItemTranslation(category.id, item.id, "description_i18n", editingLanguage, e.target.value)} placeholder="الوصف" className="mt-2 w-full bg-transparent text-sm font-bold text-white/35 outline-none" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/25">السعر</label>
                    <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => patchItem(category.id, item.id, { price: e.target.value })} className="input mt-1" />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black text-white/40"><input type="checkbox" checked={item.is_available} onChange={(e) => patchItem(category.id, item.id, { is_available: e.target.checked })} className="ml-2" />متوفر</label>
                    <button onClick={() => deleteItem(category.id, item.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/35 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}

              <button onClick={() => addItem(category)} className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm font-black text-white/45 hover:border-[#ff7a00]/40 hover:text-white">+ إضافة عنصر</button>
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-black text-white/45">{label}</span>{children}</label>;
}

function Page({ children }) {
  return <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}

function Empty() {
  return <div className="rounded-[26px] border border-white/10 bg-[#111] p-6"><h1 className="text-2xl font-black">لم يتم تفعيل قائمة لهذا الحساب بعد.</h1></div>;
}
