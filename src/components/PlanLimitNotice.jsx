import { Lock } from "lucide-react";

export default function PlanLimitNotice({ title, text }) {
  return (
    <div className="rounded-[22px] border border-yellow-400/15 bg-yellow-500/10 p-4">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-yellow-400/15 text-yellow-100">
          <Lock size={18} />
        </div>

        <div>
          <p className="text-sm font-black text-yellow-100">
            {title}
          </p>

          {text && (
            <p className="mt-1 text-sm font-bold leading-6 text-yellow-100/55">
              {text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}