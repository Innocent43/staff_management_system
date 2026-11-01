import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

const highlights = [
  "Clock in and out with a QR scan",
  "Assign tasks and track progress",
  "Estimate wages from real attendance",
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-navy-950 px-6 py-5 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <p className="text-xl font-bold tracking-tight">{APP_NAME}</p>

        <div className="hidden lg:block">
          <h2 className="text-4xl font-bold leading-tight">
            Run your team without the paperwork.
          </h2>
          <ul className="mt-8 space-y-4 text-navy-200">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-navy-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-sm text-navy-400 lg:block">Built for growing businesses.</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
          <p className="mt-2 text-sm text-navy-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-navy-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}