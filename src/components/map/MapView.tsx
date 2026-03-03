"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, USER_LOCATION_ZOOM,
  TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION,
} from "@/styles/mapStyles";
import { createIssueMarkerIcon } from "@/components/map/MapMarker";
import type { Issue } from "@/types/issue";

interface MapViewProps {
  issues: Issue[];
  selectedIssue?: Issue | null;
  onIssueSelect?: (issue: Issue) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function MapView({
  issues, selectedIssue, onIssueSelect, center, zoom, height = "100%",
}: MapViewProps) {
  const mapRef     = useRef<L.Map | null>(null);
  const mapDivRef  = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, {
      center: center ?? DEFAULT_MAP_CENTER,
      zoom: zoom ?? DEFAULT_MAP_ZOOM,
      zoomControl: true, attributionControl: true,
    });
    L.tileLayer(TILE_LAYER_URL, { attribution: TILE_LAYER_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    if (!center) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], USER_LOCATION_ZOOM),
        () => {}
      );
    }
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      if (!issues.find((i) => i.id === id)) { marker.remove(); markersRef.current.delete(id); }
    });
    issues.forEach((issue) => {
      const { latitude, longitude } = issue.location;
      if (!latitude || !longitude) return;
      const icon = createIssueMarkerIcon(issue.status, issue.priority);
      if (markersRef.current.has(issue.id)) {
        const m = markersRef.current.get(issue.id)!;
        m.setLatLng([latitude, longitude]);
        m.setIcon(icon);
        m.unbindPopup();
        m.bindPopup(buildPopupHTML(issue), { maxWidth: 260, className: "civic-popup", closeButton: true });
      } else {
        const marker = L.marker([latitude, longitude], { icon })
          .addTo(map)
          .bindPopup(buildPopupHTML(issue), { maxWidth: 260, className: "civic-popup", closeButton: true });
        marker.on("click", () => onIssueSelect?.(issue));
        markersRef.current.set(issue.id, marker);
      }
    });
  }, [issues, onIssueSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssue) return;
    const { latitude, longitude } = selectedIssue.location;
    if (!latitude || !longitude) return;
    map.flyTo([latitude, longitude], 16, { animate: true, duration: 0.8 });
    markersRef.current.get(selectedIssue.id)?.openPopup();
  }, [selectedIssue]);

  return <div ref={mapDivRef} style={{ height }} className="w-full rounded-xl z-0" />;
}

function buildPopupHTML(issue: Issue): string {
  const pc: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" };
  const sc: Record<string, string> = { reported: "#ef4444", assigned: "#f97316", "in-progress": "#eab308", resolved: "#16a34a" };
  const sl: Record<string, string> = { reported: "Reported", assigned: "Assigned", "in-progress": "In Progress", resolved: "Resolved" };
  const c = pc[issue.priority] ?? "#6b7280";
  const s = sc[issue.status] ?? "#6b7280";
  return `<div style="font-family:Inter,sans-serif;min-width:200px;max-width:240px;">
    <p style="font-size:12px;font-weight:700;color:#111827;margin:0 0 4px;">${issue.title}</p>
    <p style="font-size:11px;color:#6b7280;margin:0 0 8px;">${issue.location.address}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;background:${c}20;color:${c};border:1px solid ${c}40;">
        <span style="width:6px;height:6px;border-radius:50%;background:${c};display:inline-block;margin-right:3px;"></span>
        ${(issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1))} Priority
      </span>
      <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;background:${s}20;color:${s};border:1px solid ${s}40;">
        ${sl[issue.status] ?? issue.status}
      </span>
    </div>
    <a href="/issues/${issue.id}" style="display:block;margin-top:10px;text-align:center;padding:6px;border-radius:8px;font-size:11px;font-weight:600;color:white;background:#16a34a;text-decoration:none;">View Details →</a>
  </div>`;
}