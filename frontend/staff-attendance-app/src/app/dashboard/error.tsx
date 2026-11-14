"use client"; // Next.js requires error pages to be client components

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error); // visible in DevTools while developing
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-navy-900">Something went wrong</h1>
      <p className="text-sm text-navy-600">
        This page ran into an unexpected problem. Your data is safe. Try again, and if it keeps
        happening, go back to the home page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}