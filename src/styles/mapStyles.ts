/**
 * Custom Leaflet marker colors by issue status
 */
export const MAP_MARKER_COLORS: Record<string, string> = {
  reported: "#ef4444",
  assigned: "#f97316",
  "in-progress": "#eab308",
  resolved: "#16a34a",
};

/**
 * Default map center — India (can be overridden with user location)
 */
export const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629];
export const DEFAULT_MAP_ZOOM = 5;
export const USER_LOCATION_ZOOM = 15;

/**
 * OpenStreetMap tile layer (free, no API key needed)
 */
export const TILE_LAYER_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Generate an SVG marker icon for Leaflet based on status color
 */
export const createMarkerSVG = (color: string): string => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 24 8 24s8-18.6 8-24c0-4.4-3.6-8-8-8z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="8" r="4" fill="white"/>
    </svg>
  `.trim();
};