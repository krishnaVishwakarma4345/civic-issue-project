// src/styles/mapStyles.ts

/** Status colors — used for popup badges only */
export const MAP_MARKER_COLORS: Record<string, string> = {
  reported:      "#ef4444",
  assigned:      "#f97316",
  "in-progress": "#eab308",
  resolved:      "#16a34a",
};

/** Priority pin colors for active (non-resolved) issues */
export const MAP_PRIORITY_COLORS: Record<string, string> = {
  high:   "#ef4444", // red
  medium: "#f59e0b", // amber
  low:    "#3b82f6", // blue
};

export const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629];
export const DEFAULT_MAP_ZOOM   = 5;
export const USER_LOCATION_ZOOM = 15;

export const TILE_LAYER_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Priority SVG pins for active issues.
 * FIX: wrapped in a positioned <div> so Leaflet's divIcon renders the SVG
 * correctly — without a wrapper, Leaflet ignores the SVG dimensions and
 * shows its default empty square div instead.
 *
 * high   — large red pin with "!" (28x38)
 * medium — medium amber pin with ring dot (24x34)
 * low    — small blue pin (20x28)
 */
export const createPriorityMarkerSVG = (priority: string): string => {
  const color = MAP_PRIORITY_COLORS[priority] ?? "#6b7280";

  if (priority === "high") {
    return `
      <div style="width:28px;height:38px;display:flex;align-items:flex-end;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 38" width="28" height="38" style="display:block;overflow:visible;">
          <path d="M14 0C8.5 0 4 4.5 4 10c0 6.5 10 28 10 28S24 16.5 24 10c0-5.5-4.5-10-10-10z"
                fill="${color}" stroke="white" stroke-width="2"/>
          <rect x="12.5" y="5" width="3" height="8" rx="1.5" fill="white"/>
          <circle cx="14" cy="16" r="1.8" fill="white"/>
        </svg>
      </div>`.trim();
  }

  if (priority === "medium") {
    return `
      <div style="width:24px;height:34px;display:flex;align-items:flex-end;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="24" height="34" style="display:block;overflow:visible;">
          <path d="M12 0C7.1 0 3 4.1 3 9c0 5.8 9 25 9 25s9-19.2 9-25C21 4.1 16.9 0 12 0z"
                fill="${color}" stroke="white" stroke-width="1.8"/>
          <circle cx="12" cy="9" r="4" fill="white"/>
          <circle cx="12" cy="9" r="2" fill="${color}"/>
        </svg>
      </div>`.trim();
  }

  // low
  return `
    <div style="width:20px;height:28px;display:flex;align-items:flex-end;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 28" width="20" height="28" style="display:block;overflow:visible;">
        <path d="M10 0C6.1 0 3 3.1 3 7c0 4.6 7 21 7 21s7-16.4 7-21C17 3.1 13.9 0 10 0z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="10" cy="7" r="3" fill="white"/>
      </svg>
    </div>`.trim();
};

/** Green checkmark pin for resolved issues */
export const createResolvedMarkerSVG = (): string => {
  return `
    <div style="width:24px;height:32px;display:flex;align-items:flex-end;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32" style="display:block;overflow:visible;">
        <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 24 8 24s8-18.6 8-24c0-4.4-3.6-8-8-8z"
              fill="#16a34a" stroke="white" stroke-width="1.5"/>
        <polyline points="8,8 11,11.5 16,6" fill="none" stroke="white" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`.trim();
};

/** Legacy generic pin — kept for LocationPicker backward compat */
export const createMarkerSVG = (color: string): string => {
  return `
    <div style="width:24px;height:32px;display:flex;align-items:flex-end;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32" style="display:block;overflow:visible;">
        <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 24 8 24s8-18.6 8-24c0-4.4-3.6-8-8-8z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="8" r="4" fill="white"/>
      </svg>
    </div>`.trim();
};