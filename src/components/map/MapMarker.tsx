/**
 * MapMarker utility — creates typed Leaflet DivIcon markers
 * for use in MapView and LocationPicker.
 */

import L                   from "leaflet";
import { MAP_MARKER_COLORS, createMarkerSVG } from "@/styles/mapStyles";
import type { IssueStatus }  from "@/types/issue";

export const createIssueMarkerIcon = (status: IssueStatus): L.DivIcon => {
  const color = MAP_MARKER_COLORS[status] ?? "#6b7280";
  const svg   = createMarkerSVG(color);

  return L.divIcon({
    html:        svg,
    className:   "civic-issue-marker",
    iconSize:    [24, 32],
    iconAnchor:  [12, 32],
    popupAnchor: [0, -34],
  });
};

export const createUserLocationIcon = (): L.DivIcon => {
  return L.divIcon({
    html: `
      <div style="
        width: 16px; height: 16px; border-radius: 50%;
        background: #3b82f6; border: 3px solid white;
        box-shadow: 0 0 0 3px #3b82f640;
      "></div>
    `,
    className:   "user-location-marker",
    iconSize:    [16, 16],
    iconAnchor:  [8, 8],
  });
};