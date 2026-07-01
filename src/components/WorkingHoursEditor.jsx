import { Clock } from "lucide-react";

const DAYS = [
  { key: "sun", label: "Sunday" },
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
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

export default function WorkingHoursEditor({ value, onChange }) {
  const hours = {
    ...getDefaultWorkingHours(),
    ...(value || {}),
  };

  function updateDay(dayKey, updates) {
    onChange({
      ...hours,
      [dayKey]: {
        ...hours[dayKey],
        ...updates,
      },
    });
  }

  function setEverydayOpen() {
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
    onChange({
      ...hours,
      fri: { ...hours.fri, open: false },
      sat: { ...hours.sat, open: false },
    });
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-black/25 p-4">
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
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/55 transition hover:text-white"
          >
            Everyday
          </button>

          <button
            type="button"
            onClick={setWeekendClosed}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/55 transition hover:text-white"
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
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_auto_auto_auto]"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(dayValue.open)}
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
                disabled={!dayValue.open}
                onChange={(e) => updateDay(day.key, { from: e.target.value })}
                className="min-h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none disabled:opacity-35"
              />

              <input
                type="time"
                value={dayValue.to || "22:00"}
                disabled={!dayValue.open}
                onChange={(e) => updateDay(day.key, { to: e.target.value })}
                className="min-h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none disabled:opacity-35"
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