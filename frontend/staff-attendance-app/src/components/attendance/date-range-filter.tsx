import { INPUT_CLASS } from "@/components/ui/field";

type Props = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

export function DateRangeFilter({ from, to, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-40">
        <input
          type="date"
          value={from}
          max={to}
          // an empty value means the user cleared the box; we ignore it because
          // the backend requires both dates, and the input snaps back
          onChange={(e) => e.target.value && onChange(e.target.value, to)}
          className={INPUT_CLASS}
        />
      </div>
      <span className="text-sm text-navy-400">to</span>
      <div className="w-40">
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => e.target.value && onChange(from, e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}

// max={to} and min={from} stop the user picking a “from” date later than the “to” date. The && short-circuit means “only call onChange if the value is not empty.”