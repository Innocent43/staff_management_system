// type Props = { details: Record<string, unknown> | null };

// // unknown -> text we can show. Nested objects and lists become readable JSON.
// function display(value: unknown): string {
//   if (typeof value === "object" && value !== null) {
//     return JSON.stringify(value, null, 2);
//   }
//   return String(value);
// }

// export function CalculationDetails({ details }: Props) {
//   if (!details || Object.keys(details).length === 0) return null;

//   return (
//     // <details> is a built-in HTML "click to expand" box, with no JavaScript needed
//     <details className="rounded-xl border border-navy-200 bg-white p-4">
//       <summary className="cursor-pointer font-medium text-navy-900">
//         How this was calculated
//       </summary>

//       <dl className="mt-3 space-y-2 text-sm">
//         {Object.entries(details).map(([key, value]) => (
//           <div key={key} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
//             <dt className="capitalize text-navy-600">{key.replace(/_/g, " ")}</dt>
//             <dd className="whitespace-pre-wrap break-all text-navy-900">{display(value)}</dd>
//           </div>
//         ))}
//       </dl>
//     </details>
//   );
// }


type Props = { details: Record<string, unknown> | null };

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CalculationDetails({ details }: Props) {
  if (!details || Object.keys(details).length === 0) return null;

  const entries = Object.entries(details);
  const simpleEntries = entries.filter(
    ([, val]) => typeof val !== "object" || val === null
  );
  const nestedEntries = entries.filter(
    ([, val]) => typeof val === "object" && val !== null
  );

  return (
    <details className="rounded-xl border border-navy-200 bg-white p-4">
      <summary className="cursor-pointer font-medium text-navy-900">
        How this was calculated
      </summary>

      {/* Main Breakdown Table */}
      <dl className="mt-4 divide-y divide-navy-100 text-sm">
        {simpleEntries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between py-2.5"
          >
            <dt className="text-navy-600">{formatLabel(key)}</dt>
            <dd className="font-medium tabular-nums text-navy-900">
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>

      {/* Nested Objects (e.g. Rules) */}
      {nestedEntries.map(([key, value]) => (
        <div
          key={key}
          className="mt-4 rounded-lg border border-navy-100 bg-navy-50/50 p-3"
        >
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-500">
            Applied {formatLabel(key)}
          </h4>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
            {Object.entries(value as Record<string, unknown>).map(
              ([subKey, subVal]) => (
                <div
                  key={subKey}
                  className="flex items-center justify-between border-b border-navy-100/70 pb-1"
                >
                  <dt className="text-navy-600">{formatLabel(subKey)}</dt>
                  <dd className="font-medium text-navy-900">
                    {typeof subVal === "boolean"
                      ? subVal
                        ? "Yes"
                        : "No"
                      : String(subVal)}
                  </dd>
                </div>
              )
            )}
          </dl>
        </div>
      ))}
    </details>
  );
}
