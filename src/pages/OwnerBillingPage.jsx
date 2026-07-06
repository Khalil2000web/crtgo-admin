import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CreditCard,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { useConfirm } from "../components/ConfirmProvider";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  SkeletonCard,
  Textarea,
} from "../components/ui";
import OwnerPlansManager from "../components/OwnerPlansManager";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "past_due", label: "Past due" },
  { value: "paused", label: "Paused" },
  { value: "canceled", label: "Canceled" },
];

function byId(items = [], key = "id") {
  return new Map(items.map((item) => [item[key], item]));
}

function emptyToNull(value) {
  const clean = String(value || "").trim();
  return clean ? clean : null;
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amount, currency = "ILS") {
  if (amount === null || amount === undefined || amount === "") return "—";
  return `${Number(amount).toFixed(2)} ${currency}`;
}

function getStatusTone(status) {
  if (status === "active") return "success";
  if (status === "trial") return "neutral";
  if (status === "past_due") return "warning";
  if (status === "paused") return "warning";
  if (status === "canceled") return "danger";
  return "neutral";
}

async function loadOwnerBillingData() {
  const [plansRes, businessesRes] = await Promise.all([
    supabase
      .from("billing_plans")
      .select("*")
      .order("sort_order", { ascending: true }),

    supabase
      .from("businesses")
      .select("id, owner_id, name, slug, status, created_at, updated_at")
      .order("created_at", { ascending: false }),
  ]);

  if (plansRes.error) throw plansRes.error;
  if (businessesRes.error) throw businessesRes.error;

  const plans = plansRes.data || [];
  const businesses = businessesRes.data || [];

  const businessIds = businesses.map((business) => business.id);
  const ownerIds = [
    ...new Set(businesses.map((business) => business.owner_id).filter(Boolean)),
  ];

  const profilesPromise = ownerIds.length
    ? supabase
        .from("profiles")
        .select("id, email, username, display_name")
        .in("id", ownerIds)
    : Promise.resolve({ data: [], error: null });

  const subscriptionsPromise = businessIds.length
    ? supabase
        .from("business_subscriptions")
        .select(`
          business_id,
          plan_id,
          status,
          current_period_end,
          last_payment_amount,
          currency,
          payment_method,
          internal_note,
          updated_at,
          created_at,
          billing_plans (
            id,
            name,
            description,
            monthly_price,
            currency,
            limits
          )
        `)
        .in("business_id", businessIds)
    : Promise.resolve({ data: [], error: null });

  const notesPromise = businessIds.length
    ? supabase
        .from("client_notes")
        .select("*")
        .in("business_id", businessIds)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const eventsPromise = businessIds.length
    ? supabase
        .from("subscription_events")
        .select("*")
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(300)
    : Promise.resolve({ data: [], error: null });

  const branchesPromise = businessIds.length
    ? supabase
        .from("branches")
        .select("id, business_id, status")
        .in("business_id", businessIds)
    : Promise.resolve({ data: [], error: null });

  const [
    profilesRes,
    subscriptionsRes,
    notesRes,
    eventsRes,
    branchesRes,
  ] = await Promise.all([
    profilesPromise,
    subscriptionsPromise,
    notesPromise,
    eventsPromise,
    branchesPromise,
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (subscriptionsRes.error) throw subscriptionsRes.error;
  if (notesRes.error) throw notesRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (branchesRes.error) throw branchesRes.error;

  const profileMap = byId(profilesRes.data || []);
  const subscriptionMap = byId(subscriptionsRes.data || [], "business_id");

  const notesByBusiness = new Map();
  for (const note of notesRes.data || []) {
    const current = notesByBusiness.get(note.business_id) || [];
    current.push(note);
    notesByBusiness.set(note.business_id, current);
  }

  const eventsByBusiness = new Map();
  for (const event of eventsRes.data || []) {
    const current = eventsByBusiness.get(event.business_id) || [];
    current.push(event);
    eventsByBusiness.set(event.business_id, current);
  }

  const branchesByBusiness = new Map();
  for (const branch of branchesRes.data || []) {
    const current = branchesByBusiness.get(branch.business_id) || [];
    current.push(branch);
    branchesByBusiness.set(branch.business_id, current);
  }

  const clients = businesses.map((business) => {
    const owner = profileMap.get(business.owner_id) || null;
    const subscription = subscriptionMap.get(business.id) || null;

    return {
      business,
      owner,
      subscription,
      plan:
        subscription?.billing_plans ||
        plans.find((plan) => plan.id === subscription?.plan_id) ||
        plans.find((plan) => plan.id === "free") ||
        null,
      notes: notesByBusiness.get(business.id) || [],
      events: eventsByBusiness.get(business.id) || [],
      branches: branchesByBusiness.get(business.id) || [],
    };
  });

  return {
    plans,
    clients,
  };
}

export default function OwnerBillingPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const [planForm, setPlanForm] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    note: "",
    pinned: false,
  });
  const [editingNote, setEditingNote] = useState(null);

  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["owner-billing"],
    queryFn: loadOwnerBillingData,
  });

  const clients = data?.clients || [];
  const plans = data?.plans || [];

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return clients;

    return clients.filter((client) => {
      const business = client.business;
      const owner = client.owner;

      return [
        business.name,
        business.slug,
        business.status,
        owner?.email,
        owner?.username,
        owner?.display_name,
        client.subscription?.plan_id,
        client.subscription?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [clients, search]);

  const selectedClient = useMemo(() => {
    return (
      clients.find((client) => client.business.id === selectedBusinessId) ||
      filteredClients[0] ||
      clients[0] ||
      null
    );
  }, [clients, filteredClients, selectedBusinessId]);

  useEffect(() => {
    if (!selectedClient) return;

    setSelectedBusinessId(selectedClient.business.id);

    setPlanForm({
      plan_id: selectedClient.subscription?.plan_id || "free",
      status: selectedClient.subscription?.status || "active",
      current_period_end: selectedClient.subscription?.current_period_end
        ? selectedClient.subscription.current_period_end.slice(0, 10)
        : "",
      amount: selectedClient.subscription?.last_payment_amount ?? "",
      currency: selectedClient.subscription?.currency || "ILS",
      payment_method: selectedClient.subscription?.payment_method || "",
      note: "",
    });
  }, [selectedClient?.business?.id]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["owner-billing"] }),
      queryClient.invalidateQueries({ queryKey: ["owner-plans"] }),
    ]);
  }

  async function updatePlan(e) {
    e.preventDefault();

    if (!selectedClient || !planForm) return;

    const newPlan = plans.find((plan) => plan.id === planForm.plan_id);
    const oldPlan = selectedClient.subscription?.plan_id || "free";

    const ok = await confirm({
      title: "Update client plan?",
      message: `Change ${selectedClient.business.name} from ${oldPlan} to ${planForm.plan_id}. This will affect their limits immediately.`,
      confirmText: "Update plan",
      danger: planForm.status === "paused" || planForm.status === "canceled",
    });

    if (!ok) return;

    setUpdatingPlan(true);

    try {
      const { error } = await supabase.rpc("owner_set_business_plan", {
        p_business_id: selectedClient.business.id,
        p_plan_id: planForm.plan_id,
        p_status: planForm.status,
        p_current_period_end: planForm.current_period_end
          ? new Date(`${planForm.current_period_end}T23:59:59`).toISOString()
          : null,
        p_amount:
          planForm.amount === "" || planForm.amount === null
            ? null
            : Number(planForm.amount),
        p_currency: planForm.currency || "ILS",
        p_payment_method: emptyToNull(planForm.payment_method),
        p_note: emptyToNull(planForm.note),
      });

      if (error) throw error;

      toast.success(`Plan updated to ${newPlan?.name || planForm.plan_id}`);
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setUpdatingPlan(false);
    }
  }

  async function addNote(e) {
    e.preventDefault();

    if (!selectedClient) return;

    if (!noteForm.note.trim()) {
      toast.error("Note is required");
      return;
    }

    const ok = await confirm({
      title: "Add client note?",
      message: "This note will be saved privately for this client.",
      confirmText: "Add note",
    });

    if (!ok) return;

    setSavingNote(true);

    try {
      const { error } = await supabase.from("client_notes").insert({
        business_id: selectedClient.business.id,
        title: emptyToNull(noteForm.title),
        note: noteForm.note.trim(),
        pinned: Boolean(noteForm.pinned),
      });

      if (error) throw error;

      setNoteForm({
        title: "",
        note: "",
        pinned: false,
      });

      toast.success("Note added");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  }

  async function saveEditedNote(e) {
    e.preventDefault();

    if (!editingNote) return;

    if (!editingNote.note.trim()) {
      toast.error("Note is required");
      return;
    }

    const ok = await confirm({
      title: "Save note changes?",
      message: "This will update the private client note.",
      confirmText: "Save note",
    });

    if (!ok) return;

    setSavingNote(true);

    try {
      const { error } = await supabase
        .from("client_notes")
        .update({
          title: emptyToNull(editingNote.title),
          note: editingNote.note.trim(),
          pinned: Boolean(editingNote.pinned),
        })
        .eq("id", editingNote.id);

      if (error) throw error;

      setEditingNote(null);
      toast.success("Note updated");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update note");
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(note) {
    const ok = await confirm({
      title: "Delete note?",
      message: "This private note will be deleted forever.",
      confirmText: "Delete note",
      danger: true,
    });

    if (!ok) return;

    setDeletingNoteId(note.id);

    try {
      const { error } = await supabase
        .from("client_notes")
        .delete()
        .eq("id", note.id);

      if (error) throw error;

      toast.success("Note deleted");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete note");
    } finally {
      setDeletingNoteId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />

        <div className="mt-6 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <SkeletonCard className="h-[600px]" />
          <SkeletonCard className="h-[600px]" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Owner"
        title="Billing Control"
        subtitle="Manual plans, payment notes, limits, and client history."
        action={
          <Button type="button" variant="secondary" onClick={refresh}>
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
        <OwnerPlansManager />
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 pb-32 sm:px-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff7a00] text-black">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black">Clients</h2>
                <p className="text-sm font-bold text-white/35">
                  {clients.length} businesses
                </p>
              </div>
            </div>

            <label className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4">
              <Search size={17} className="text-white/30" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
              />
            </label>
          </Card>

          <div className="mt-4 grid gap-2">
            {filteredClients.map((client) => {
              const active = selectedClient?.business.id === client.business.id;

              return (
                <button
                  key={client.business.id}
                  type="button"
                  onClick={() => setSelectedBusinessId(client.business.id)}
                  className={`min-w-0 rounded-[22px] border p-4 text-start transition ${
                    active
                      ? "border-[#ff7a00]/60 bg-[#ff7a00]/10"
                      : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black">
                        {client.business.name}
                      </h3>

                      <p className="mt-1 truncate text-xs font-bold text-white/35">
                        {client.owner?.email || "No email"}
                      </p>
                    </div>

                    <Badge tone={getStatusTone(client.subscription?.status)}>
                      {client.subscription?.status || "active"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">
                      {client.subscription?.plan_id || "free"}
                    </p>

                    <p className="text-xs font-bold text-white/30">
                      {client.branches.length} branches
                    </p>
                  </div>
                </button>
              );
            })}

            {!filteredClients.length && (
              <Card className="p-6 text-center">
                <p className="text-sm font-bold text-white/35">
                  No clients found.
                </p>
              </Card>
            )}
          </div>
        </aside>

        {selectedClient ? (
          <section className="grid min-w-0 gap-5">
            <ClientHeader client={selectedClient} />

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="grid min-w-0 gap-5">
                <Card className="p-5">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black tracking-[-0.05em]">
                        Plan & Payment
                      </h2>

                      <p className="mt-1 text-sm font-bold text-white/35">
                        Update the client plan after receiving payment.
                      </p>
                    </div>

                    <CreditCard className="text-[#ff7a00]" size={24} />
                  </div>

                  {planForm && (
                    <form onSubmit={updatePlan} className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Plan">
                          <SelectBox
                            value={planForm.plan_id}
                            onChange={(value) =>
                              setPlanForm((current) => ({
                                ...current,
                                plan_id: value,
                              }))
                            }
                          >
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} — {plan.monthly_price ?? 0}{" "}
                                {plan.currency}
                              </option>
                            ))}
                          </SelectBox>
                        </Field>

                        <Field label="Status">
                          <SelectBox
                            value={planForm.status}
                            onChange={(value) =>
                              setPlanForm((current) => ({
                                ...current,
                                status: value,
                              }))
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </SelectBox>
                        </Field>

                        <Field label="Paid amount">
                          <Input
                            type="number"
                            step="0.01"
                            value={planForm.amount}
                            onChange={(e) =>
                              setPlanForm((current) => ({
                                ...current,
                                amount: e.target.value,
                              }))
                            }
                            placeholder="150"
                            dir="ltr"
                          />
                        </Field>

                        <Field label="Currency">
                          <Input
                            value={planForm.currency}
                            onChange={(e) =>
                              setPlanForm((current) => ({
                                ...current,
                                currency: e.target.value.toUpperCase(),
                              }))
                            }
                            placeholder="ILS"
                            dir="ltr"
                          />
                        </Field>

                        <Field label="Payment method">
                          <Input
                            value={planForm.payment_method}
                            onChange={(e) =>
                              setPlanForm((current) => ({
                                ...current,
                                payment_method: e.target.value,
                              }))
                            }
                            placeholder="Cash / PayPal / Bank transfer"
                          />
                        </Field>

                        <Field label="Paid until">
                          <Input
                            type="date"
                            value={planForm.current_period_end}
                            onChange={(e) =>
                              setPlanForm((current) => ({
                                ...current,
                                current_period_end: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>

                      <Field label="Plan update note">
                        <Textarea
                          value={planForm.note}
                          onChange={(e) =>
                            setPlanForm((current) => ({
                              ...current,
                              note: e.target.value,
                            }))
                          }
                          placeholder="Example: Paid ₪150 via PayPal on July 6."
                        />
                      </Field>

                      <Button
                        type="submit"
                        loading={updatingPlan}
                        loadingText="Updating plan..."
                      >
                        <Save size={16} />
                        Update plan
                      </Button>
                    </form>
                  )}
                </Card>

                <Card className="p-5">
                  <div className="mb-5">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">
                      Private Notes
                    </h2>

                    <p className="mt-1 text-sm font-bold text-white/35">
                      Notes are only visible to you.
                    </p>
                  </div>

                  <form onSubmit={addNote} className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                      <Field label="Title">
                        <Input
                          value={noteForm.title}
                          onChange={(e) =>
                            setNoteForm((current) => ({
                              ...current,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Payment / client / issue..."
                        />
                      </Field>

                      <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white/60">
                        <input
                          type="checkbox"
                          checked={noteForm.pinned}
                          onChange={(e) =>
                            setNoteForm((current) => ({
                              ...current,
                              pinned: e.target.checked,
                            }))
                          }
                        />
                        Pin
                      </label>
                    </div>

                    <Field label="Note">
                      <Textarea
                        value={noteForm.note}
                        onChange={(e) =>
                          setNoteForm((current) => ({
                            ...current,
                            note: e.target.value,
                          }))
                        }
                        placeholder="Write a private note about this client..."
                      />
                    </Field>

                    <Button
                      type="submit"
                      loading={savingNote && !editingNote}
                      loadingText="Adding note..."
                      disabled={!noteForm.note.trim()}
                    >
                      <Plus size={16} />
                      Add note
                    </Button>
                  </form>

                  <div className="mt-6 grid gap-3">
                    {selectedClient.notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={() => setEditingNote(note)}
                        onDelete={() => deleteNote(note)}
                        deleting={deletingNoteId === note.id}
                      />
                    ))}

                    {!selectedClient.notes.length && (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                        <p className="text-sm font-bold text-white/35">
                          No notes yet.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <aside className="grid h-fit min-w-0 gap-5 2xl:sticky 2xl:top-6">
                <PlanLimitsCard client={selectedClient} plans={plans} />
                <HistoryCard events={selectedClient.events} />
              </aside>
            </div>
          </section>
        ) : (
          <Card className="grid min-h-[500px] place-items-center p-8 text-center">
            <p className="text-sm font-bold text-white/35">
              Select a client to manage billing.
            </p>
          </Card>
        )}
      </section>

      <Modal
        open={Boolean(editingNote)}
        title="Edit Note"
        onClose={() => setEditingNote(null)}
      >
        {editingNote && (
          <form onSubmit={saveEditedNote} className="grid gap-4">
            <Field label="Title">
              <Input
                value={editingNote.title || ""}
                onChange={(e) =>
                  setEditingNote((current) => ({
                    ...current,
                    title: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Note">
              <Textarea
                value={editingNote.note}
                onChange={(e) =>
                  setEditingNote((current) => ({
                    ...current,
                    note: e.target.value,
                  }))
                }
              />
            </Field>

            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white/60">
              <input
                type="checkbox"
                checked={Boolean(editingNote.pinned)}
                onChange={(e) =>
                  setEditingNote((current) => ({
                    ...current,
                    pinned: e.target.checked,
                  }))
                }
              />
              Pin note
            </label>

            <Button
              type="submit"
              loading={savingNote}
              loadingText="Saving note..."
            >
              Save note
            </Button>
          </form>
        )}
      </Modal>
    </main>
  );
}

function ClientHeader({ client }) {
  const business = client.business;
  const owner = client.owner;
  const subscription = client.subscription;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff7a00]">
            Client Business
          </p>

          <h1 className="mt-2 break-words text-4xl font-black tracking-[-0.07em]">
            {business.name}
          </h1>

          <p className="mt-2 break-all text-sm font-bold text-white/35">
            {owner?.display_name || owner?.username || "Unknown owner"} ·{" "}
            {owner?.email || "No email"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={getStatusTone(subscription?.status)}>
            {subscription?.status || "active"}
          </Badge>

          <Badge tone="neutral">{subscription?.plan_id || "free"}</Badge>

          <Badge tone="neutral">{client.branches.length} branches</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoStat label="Business slug" value={business.slug} />
        <InfoStat
          label="Last payment"
          value={formatMoney(
            subscription?.last_payment_amount,
            subscription?.currency
          )}
        />
        <InfoStat
          label="Paid until"
          value={
            subscription?.current_period_end
              ? formatDate(subscription.current_period_end)
              : "—"
          }
        />
      </div>
    </Card>
  );
}

function InfoStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="mt-2 min-w-0 break-words text-sm font-black text-white/80">
        {value}
      </p>
    </div>
  );
}

function SelectBox({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-bold text-white outline-none transition focus:border-[#ff7a00]/50"
    >
      {children}
    </select>
  );
}

function PlanLimitsCard({ client, plans }) {
  const plan =
    client.plan ||
    plans.find((item) => item.id === client.subscription?.plan_id) ||
    null;

  const limits = plan?.limits || {};

  return (
    <Card className="p-5">
      <h2 className="text-2xl font-black tracking-[-0.05em]">
        Current Limits
      </h2>

      <p className="mt-1 text-sm font-bold text-white/35">
        These limits are enforced in the client dashboard.
      </p>

      <div className="mt-5 grid gap-2">
        <LimitRow label="Plan" value={plan?.name || "Free"} />
        <LimitRow
          label="Branches"
          value={`${client.branches.length} / ${limits.max_branches ?? "∞"}`}
        />
        <LimitRow label="Items" value={limits.max_items ?? "∞"} />
        <LimitRow
          label="Templates"
          value={(limits.templates || []).join(", ") || "—"}
        />
        <LimitRow
          label="Custom cover"
          value={limits.custom_cover ? "Allowed" : "Locked"}
        />
        <LimitRow
          label="Section pages"
          value={limits.section_pages === false ? "Locked" : "Allowed"}
        />
      </div>
    </Card>
  );
}

function LimitRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold">
      <span className="text-white/45">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function HistoryCard({ events }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.05em]">History</h2>

          <p className="mt-1 text-sm font-bold text-white/35">
            Plan changes are saved as audit history.
          </p>
        </div>

        <Clock size={23} className="text-[#ff7a00]" />
      </div>

      <div className="mt-5 grid gap-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-white/10 bg-black/25 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-black">
                {event.old_plan_id || "—"} → {event.new_plan_id || "—"}
              </p>

              <p className="shrink-0 text-xs font-bold text-white/30">
                {formatDate(event.created_at)}
              </p>
            </div>

            <p className="mt-1 text-xs font-bold text-white/35">
              Status: {event.old_status || "—"} → {event.new_status || "—"}
            </p>

            {(event.amount || event.payment_method) && (
              <p className="mt-2 text-xs font-bold text-white/45">
                {formatMoney(event.amount, event.currency)}
                {event.payment_method ? ` · ${event.payment_method}` : ""}
              </p>
            )}

            {event.note && (
              <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm font-bold leading-6 text-white/55">
                {event.note}
              </p>
            )}
          </div>
        ))}

        {!events.length && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm font-bold text-white/35">
              No plan history yet.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function NoteCard({ note, onEdit, onDelete, deleting }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black">
              {note.title || "Private note"}
            </h3>

            {note.pinned && <Badge tone="warning">Pinned</Badge>}
          </div>

          <p className="mt-1 text-xs font-bold text-white/30">
            Updated {formatDate(note.updated_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onEdit}>
            <Pencil size={14} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="danger"
            loading={deleting}
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-6 text-white/55">
        {note.note}
      </p>
    </div>
  );
}