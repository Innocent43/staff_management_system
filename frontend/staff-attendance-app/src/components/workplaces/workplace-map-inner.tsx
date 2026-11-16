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
      onLocationChange(
        event.latlng.lat,
        event.latlng.lng,
      );
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

  useEffect(() => {
    if (!position) return;

    map.setView(
      position,
      Math.max(map.getZoom(), 15),
      { animate: true },
    );
  }, [map, position?.[0], position?.[1]]);

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
        className: "stafftrack-map-marker",
        html: "<span></span>",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  const initialCenter: Position = position ?? [20, 0];

  return (
    <div className="relative overflow-hidden rounded-xl border border-navy-200">
      <MapContainer
        center={initialCenter}
        zoom={position ? 16 : 2}
        scrollWheelZoom
        className="h-[340px] w-full sm:h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
                  const marker = event.target;
                  const coordinates = marker.getLatLng();

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