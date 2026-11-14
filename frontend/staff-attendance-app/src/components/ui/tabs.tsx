import { cn } from "@/lib/cn";

type Tab<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 border-b border-navy-200">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
            active === tab.value
              ? "border-navy-900 text-navy-900"
              : "border-transparent text-navy-500 hover:text-navy-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}