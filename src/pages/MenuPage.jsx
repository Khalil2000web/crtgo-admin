import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { uploadProjectImage } from "../lib/uploads";
import { useAdminI18n } from "../lib/adminI18n";

export default function MenuPage() {
  const { language } = useAdminI18n();
  const ar = language === "ar";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState(null);
  const [categories, setCategories] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const { data: menuData, error: menuError } = await supabase.from("menus").select("*").eq("owner_id", user.id).maybeSingle();
      if (menuError) throw menuError;
      setMenu(menuData || null);
      if (!menuData) return;

      const { data: categoryRows, error: categoryError } = await supabase.from("categories").select("*").eq("menu_id", menuData.id).order("sort_order");
      if (categoryError) throw categoryError;
      const ids = (categoryRows || []).map((row) => row.id);
      let itemRows = [];
      if (ids.length) {
        const { data, error } = await supabase.from("items").select("*").in("category_id", ids).order("sort_order");
        if (error) throw error;
        itemRows = data || [];
      }
      setCategories((categoryRows || []).map((category) => ({ ...category, items: itemRows.filter((item) => item.category_id === category.id) })));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function patchCategory(id, patch) {
    setCategories((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  }
  function patchItem(categoryId, itemId, patch) {
    setCategories((rows) => rows.map((row) => row.id === categoryId ? { ...row, items: row.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) } : row));
  }

  async function addCategory() {
    if (!menu) return;
    const { data, error } = await supabase.from("categories").insert({ menu_id: menu.id, name: ar ? "قسم جديد" : "New category", sort_order: categories.length }).select().single();
    if (error) return toast.error(error.message);
    setCategories((rows) => [...rows, { ...data, items: [] }]);
  }

  async function addItem(category) {
    const { data, error } = await supabase.from("items").insert({ category_id: category.id, name: ar ? "عنصر جديد" : "New item", price: 0, sort_order: category.items.length }).select().single();
    if (error) return toast.error(error.message);
    setCategories((rows) => rows.map((row) => row.id === category.id ? { ...row, items: [...row.items, data] } : row));
  }

  async function saveAll() {
    if (!menu) return;
    setSaving(true);
    try {
      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
        const category = categories[categoryIndex];
        const { error } = await supabase.from("categories").update({ name: category.name, description: category.description || null, is_visible: category.is_visible, sort_order: categoryIndex }).eq("id", category.id);
        if (error) throw error;
        for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
          const item = category.items[itemIndex];
          const { error: itemError } = await supabase.from("items").update({ name: item.name, description: item.description || null, price: Number(item.price || 0), image_url: item.image_url || null, is_available: item.is_available, sort_order: itemIndex }).eq("id", item.id);
          if (itemError) throw itemError;
        }
      }
      toast.success(ar ? "تم حفظ القائمة" : "Menu saved");
      await supabase.functions.invoke("revalidate-public-menu", { body: {} }).catch(() => null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    if (!confirm(ar ? "حذف هذا القسم وكل عناصره؟" : "Delete this category and all its items?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) return toast.error(error.message);
    setCategories((rows) => rows.filter((row) => row.id !== category.id));
  }

  async function deleteItem(categoryId, itemId) {
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) return toast.error(error.message);
    setCategories((rows) => rows.map((row) => row.id === categoryId ? { ...row, items: row.items.filter((item) => item.id !== itemId) } : row));
  }

  async function uploadItemImage(categoryId, itemId, file) {
    if (!file) return;
    try {
      const url = await uploadProjectImage(file, "items");
      patchItem(categoryId, itemId, { image_url: url });
    } catch (error) { toast.error(error.message); }
  }

  if (loading) return <Page><Loader2 className="animate-spin text-[#ff7a00]"/></Page>;
  if (!menu) return <Page><Empty ar={ar}/></Page>;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff7a00]">CRTGO MENU</p><h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">{ar ? "إدارة القائمة" : "Menu manager"}</h1><p className="mt-2 text-sm font-bold text-white/35">{menu.business_name}</p></div>
        <div className="flex gap-2"><button onClick={addCategory} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black"><Plus size={16}/>{ar ? "قسم" : "Category"}</button><button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-4 py-3 text-sm font-black text-black disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {ar ? "حفظ" : "Save"}</button></div>
      </div>

      <div className="mt-8 grid gap-5">
        {categories.map((category) => (
          <section key={category.id} className="rounded-[26px] border border-white/10 bg-[#111] p-5">
            <div className="flex items-center gap-3">
              <input value={category.name} onChange={(e) => patchCategory(category.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent text-xl font-black outline-none"/>
              <label className="flex items-center gap-2 text-xs font-black text-white/40"><input type="checkbox" checked={category.is_visible} onChange={(e) => patchCategory(category.id, { is_visible: e.target.checked })}/>{ar ? "ظاهر" : "Visible"}</label>
              <button onClick={() => deleteCategory(category)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/35 hover:text-red-400"><Trash2 size={15}/></button>
            </div>
            <input value={category.description || ""} onChange={(e) => patchCategory(category.id, { description: e.target.value })} placeholder={ar ? "وصف القسم" : "Category description"} className="mt-3 w-full bg-transparent text-sm font-bold text-white/45 outline-none"/>

            <div className="mt-5 grid gap-3">
              {category.items.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 md:grid-cols-[90px_minmax(0,1fr)_120px_auto] md:items-center">
                  <label className="grid h-[72px] w-[90px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-white/30">{item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover"/> : <ImagePlus size={20}/>}<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadItemImage(category.id, item.id, e.target.files?.[0])}/></label>
                  <div><input value={item.name} onChange={(e) => patchItem(category.id, item.id, { name: e.target.value })} className="w-full bg-transparent font-black outline-none"/><input value={item.description || ""} onChange={(e) => patchItem(category.id, item.id, { description: e.target.value })} placeholder={ar ? "الوصف" : "Description"} className="mt-2 w-full bg-transparent text-sm font-bold text-white/35 outline-none"/></div>
                  <div><label className="text-[10px] font-black text-white/25">{ar ? "السعر" : "Price"}</label><input type="number" min="0" step="0.01" value={item.price} onChange={(e) => patchItem(category.id, item.id, { price: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-black outline-none"/></div>
                  <div className="flex items-center gap-2"><label className="text-xs font-black text-white/40"><input type="checkbox" checked={item.is_available} onChange={(e) => patchItem(category.id, item.id, { is_available: e.target.checked })} className="me-2"/>{ar ? "متوفر" : "Available"}</label><button onClick={() => deleteItem(category.id, item.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/35 hover:text-red-400"><Trash2 size={15}/></button></div>
                </div>
              ))}
              <button onClick={() => addItem(category)} className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm font-black text-white/45 hover:border-[#ff7a00]/40 hover:text-white">+ {ar ? "إضافة عنصر" : "Add item"}</button>
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

function Page({ children }) { return <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">{children}</div>; }
function Empty({ ar }) { return <div className="rounded-[26px] border border-white/10 bg-[#111] p-6"><h1 className="text-2xl font-black">{ar ? "لم يتم تفعيل قائمة لهذا الحساب بعد." : "No menu has been provisioned for this account yet."}</h1></div>; }
