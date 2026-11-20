
"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";

import { Field, INPUT_CLASS } from "@/components/ui/field";
import { searchWorkplaceAddresses } from "@/services/workplaces";
import { getErrorMessage } from "@/lib/errors";
import type { AddressSuggestion } from "@/types/workplaces";

type Props = {
  onSelect: (latitude: number, longitude: number,address: string,) => void;
};

export function WorkplaceAddressSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(true);

  useEffect(() => {
    const searchQuery = query.trim();

    if (!searchEnabled || searchQuery.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    let active = true;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchWorkplaceAddresses(searchQuery);

        if (!active) return;

        setSuggestions(response.suggestions);
        setHasSearched(true);
      } catch (err) {
        if (!active) return;

        setSuggestions([]);
        setError(getErrorMessage(err));
        setHasSearched(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, searchEnabled]);

  function handleChange(value: string) {
    setQuery(value);
    setSearchEnabled(true);
    setSuggestions([]);
    setError(null);
    setHasSearched(false);
  }

  function handleSelect(suggestion: AddressSuggestion) {
    setQuery(suggestion.formatted);
    setSearchEnabled(false);
    setSuggestions([]);
    setError(null);

    onSelect(suggestion.latitude, suggestion.longitude, suggestion.formatted,);
  }

  return (
    <Field label="Search workplace address">
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-400" />

          <input
            type="text"
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="Enter a street, building, city or address..."
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            className={`${INPUT_CLASS} pl-10 pr-10`}
          />

          {loading && (
            <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-navy-500" />
          )}
        </div>

        {suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-navy-200 bg-white shadow-lg"
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-navy-50"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-navy-500" />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-navy-900">
                      {suggestion.address_line1 || suggestion.formatted}
                    </span>

                    {suggestion.address_line2 && (
                      <span className="mt-0.5 block text-xs text-navy-500">
                        {suggestion.address_line2}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1 text-sm text-danger-700">
          {error}
        </p>
      )}

      {hasSearched && !loading && !error && suggestions.length === 0 && (
        <p className="mt-1 text-sm text-navy-500">
          No matching addresses found. Try a different search.
        </p>
      )}

      <p className="mt-1 text-xs text-navy-500">
        Search for an address, then select a suggestion to position the map.
      </p>
    </Field>
  );
}
