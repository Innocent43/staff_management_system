"use client";

import dynamic from "next/dynamic";

type Props = {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onLocationChange: (latitude: number, longitude: number) => void;
};

const WorkplaceMapInner = dynamic(
  () => import("./workplace-map-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[340px] items-center justify-center rounded-xl border border-navy-200 bg-navy-50 sm:h-[400px]">
        <p className="text-sm text-navy-600">
          Loading workplace map...
        </p>
      </div>
    ),
  },
);

export function WorkplaceLocationMap(props: Props) {
  return <WorkplaceMapInner {...props} />;
}