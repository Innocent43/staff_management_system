
"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type Props = {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onLocationChange: (latitude: number, longitude: number) => void;
};

type Position = [number, number];

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: Props["onLocationChange"];
}) {
  useMapEvents({
    click(event) {
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapCenterUpdater({
  position,
}: {
  position: Position | null;
}) {
  const map = useMap();

  const latitude = position?.[0] ?? null;
  const longitude = position?.[1] ?? null;

  useEffect(() => {
    if (latitude === null || longitude === null) return;

    map.setView(
      [latitude, longitude],
      Math.max(map.getZoom(), 15),
      { animate: true },
    );
  }, [map, latitude, longitude]);

  return null;
}

// Leaflet can initialize while its parent dialog is hidden.
// ResizeObserver detects when the dialog becomes visible and
// tells Leaflet to recalculate the map dimensions.
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });

    observer.observe(container);

    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);

  return null;
}

export default function WorkplaceMapInner({
  latitude,
  longitude,
  radius,
  onLocationChange,
}: Props) {
  const position: Position | null =
    latitude !== null && longitude !== null
      ? [latitude, longitude]
      : null;

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #0f766e;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 6px rgba(0,0,0,0.4);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-navy-200">
      <MapContainer
        center={position ?? [20, 0]}
        zoom={position ? 16 : 2}
        scrollWheelZoom
        className="h-[340px] w-full sm:h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapResizeHandler />

        <MapClickHandler onLocationChange={onLocationChange} />

        <MapCenterUpdater position={position} />

        {position && (
          <>
            <Circle
              center={position}
              radius={radius}
              pathOptions={{
                color: "#16977e",
                fillColor: "#27b99a",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />

            <Marker
              position={position}
              draggable
              icon={markerIcon}
              eventHandlers={{
                dragend(event) {
                  const coordinates = event.target.getLatLng();

                  onLocationChange(
                    coordinates.lat,
                    coordinates.lng,
                  );
                },
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
