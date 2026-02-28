"use client";

import React, { useEffect, useRef } from "react";
import L                            from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  TILE_LAYER_URL,
  TILE_LAYER_ATTRIBUTION,
  USER_LOCATION_ZOOM,
} from "@/styles/mapStyles";
import { reverseGeocode } from "@/lib/utils/geolocation";
import type { IssueLocation } from "@/types/issue";

interface LocationPickerProps {
  value?:    IssueLocation | null;
  onChange:  (location: IssueLocation) => void;
  height?:   string;
}

export default function LocationPicker({
  value,
  onChange,
  height = "300px",
}: LocationPickerProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center:  DEFAULT_MAP_CENTER,
      zoom:    DEFAULT_MAP_ZOOM,
    });

    L.tileLayer(TILE_LAYER_URL, {
      attribution: TILE_LAYER_ATTRIBUTION,
    }).addTo(map);

    // Click to pick location
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Move or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
        }).addTo(map);

        markerRef.current.on("dragend", async (ev: L.LeafletEvent) => {
          const pos     = (ev.target as L.Marker).getLatLng();
          const address = await reverseGeocode(pos.lat, pos.lng);
          onChange({ latitude: pos.lat, longitude: pos.lng, address });
        });
      }

      const address = await reverseGeocode(lat, lng);
      onChange({ latitude: lat, longitude: lng, address });
    });

    mapRef.current = map;

    // Show current value on mount
    if (value) {
      const marker = L.marker([value.latitude, value.longitude]).addTo(map);
      markerRef.current = marker;
      map.setView([value.latitude, value.longitude], USER_LOCATION_ZOOM);
    } else {
      // Try geolocation
      navigator.geolocation?.getCurrentPosition((pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], USER_LOCATION_ZOOM);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        ref={mapDivRef}
        style={{ height }}
        className="w-full rounded-xl border border-gray-200"
      />
      <p className="text-xs text-gray-400 mt-1.5">
        Click on the map to set the issue location, or drag the marker to adjust.
      </p>
    </div>
  );
}