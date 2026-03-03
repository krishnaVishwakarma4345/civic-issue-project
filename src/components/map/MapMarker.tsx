import L from "leaflet";
import {
  MAP_MARKER_COLORS, createMarkerSVG,
  createPriorityMarkerSVG, createResolvedMarkerSVG,
} from "@/styles/mapStyles";
import type { IssueStatus, IssuePriority } from "@/types/issue";

export const createIssueMarkerIcon = (
  status: IssueStatus, priority: IssuePriority
): L.DivIcon => {
  const isResolved = status === "resolved";
  const svg = isResolved ? createResolvedMarkerSVG() : createPriorityMarkerSVG(priority);
  const sizeMap: Record<string, [number, number]> = {
    high: [28, 38], medium: [24, 34], low: [20, 28],
  };
  const [w, h] = isResolved ? [24, 32] : (sizeMap[priority] ?? [24, 32]);
  return L.divIcon({
    html: svg, className:   "leaflet-div-icon civic-issue-marker",
    iconSize: [w, h], iconAnchor: [w / 2, h], popupAnchor: [0, -(h + 2)],
  });
};

export const createUserLocationIcon = (): L.DivIcon =>
  L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px #3b82f640;"></div>`,
    className:  "leaflet-div-icon user-location-marker", iconSize: [16, 16], iconAnchor: [8, 8],
  });

export const createStatusMarkerIcon = (status: IssueStatus): L.DivIcon => {
  const color = MAP_MARKER_COLORS[status] ?? "#6b7280";
  return L.divIcon({
    html: createMarkerSVG(color), className: "civic-issue-marker",
    iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -34],
  });
};