import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "./button";
type Props = {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
};

export function Pager({ page, hasNext, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <Button disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-4" /> Previous
      </Button>
      <span className="text-sm text-navy-500">Page {page + 1}</span>
      <Button disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Next <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}