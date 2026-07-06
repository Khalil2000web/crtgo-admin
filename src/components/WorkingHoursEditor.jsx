import { Clock, Lock } from "lucide-react";

const DAYS = [
  { key: "sun", label: "Sunday الاحد" },
  { key: "mon", label: "Monday الاثنين" },
  { key: "tue", label: "Tuesday الثلاثاء" },
  { key: "wed", label: "Wednesday الأربعاء" },
  { key: "thu", label: "Thursday الخميس" },
  { key: "fri", label: "Friday الجمعة" },
  { key: "sat", label: "Saturday السبت" },
];

export function getDefaultWorkingHours() {
  return {
    sun: { open: true, from: "09:00", to: "22:00" },
    mon: { open: true, from: "09:00", to: "22:00" },
    tue: { open: true, from: "09:00", to: "22:00" },
    wed: { open: true, from: "09:00", to: "22:00" },
    thu: { open: true, from: "09:00", to: "22:00" },
    fri: { open: true, from: "09:00", to: "22:00" },
    sat: { open: true, from: "09:00", to: "22:00" },
  };
}

export default function WorkingHoursEditor({
  value,
  onChange,
  disabled = false,
  disabledReason = "",
}) {
  const hours = {
    ...getDefaultWorkingHours(),
    ...(value || {}),
  };

  function updateDay(dayKey, updates) {
    if (disabled) return;

    onChange({
      ...hours,
      [dayKey]: {
        ...hours[dayKey],
        ...updates,
      },
    });
  }

  function setEverydayOpen() {
    if (disabled) return;

    const next = {};

    DAYS.forEach((day) => {
      next[day.key] = {
        open: true,
        from: "09:00",
        to: "22:00",
      };
    });

    onChange(next);
  }

  function setWeekendClosed() {
    if (disabled) return;

    onChange({
      ...hours,
      fri: { ...hours.fri, open: false },
      sat: { ...hours.sat, open: false },
    });
  }

  return (
    <section
      className={`rounded-[24px] border bg-black/25 p-4 ${
        disabled ? "border-yellow-400/20" : "border-white/10"
      }`}
    >
      {disabled && (
        <div className="mb-4 rounded-2xl border border-yellow-400/15 bg-yellow-500/10 p-4">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-yellow-400/15 text-yellow-100">
              <Lock size={17} />
            </div>

            <div>
              <p className="text-sm font-black text-yellow-100">
                Working hours locked
              </p>

              <p className="mt-1 text-xs font-bold leading-5 text-yellow-100/55">
                {disabledReason || "This setting is locked right now."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-white">
            <Clock size={16} className="text-[#ff7a00]" />
            Working hours
          </p>

          <p className="mt-1 text-xs font-bold text-white/35">
            Set opening and closing times for this branch.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={setEverydayOpen}
            disabled={disabled}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Everyday
          </button>

          <button
            type="button"
            onClick={setWeekendClosed}
            disabled={disabled}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Weekend closed
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {DAYS.map((day) => {
          const dayValue = hours[day.key] || {
            open: true,
            from: "09:00",
            to: "22:00",
          };

          return (
            <div
              key={day.key}
              className={`grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_auto_auto_auto] ${
                disabled ? "opacity-60" : ""
              }`}
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(dayValue.open)}
                  disabled={disabled}
                  onChange={(e) =>
                    updateDay(day.key, { open: e.target.checked })
                  }
                />

                <span className="text-sm font-black text-white">
                  {day.label}
                </span>
              </label>

              <input
                type="time"
                value={dayValue.from || "09:00"}
                disabled={disabled || !dayValue.open}
                onChange={(e) => updateDay(day.key, { from: e.target.value })}
                className="min-h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-35"
              />

              <input
                type="time"
                value={dayValue.to || "22:00"}
                disabled={disabled || !dayValue.open}
                onChange={(e) => updateDay(day.key, { to: e.target.value })}
                className="min-h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-35"
              />

              <span
                className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-black ${
                  dayValue.open
                    ? "bg-green-500/10 text-green-200"
                    : "bg-red-500/10 text-red-200"
                }`}
              >
                {dayValue.open ? "Open" : "Closed"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}