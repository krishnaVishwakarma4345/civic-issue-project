import { IssueLocation } from "@/types/issue";

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Get the user's current GPS coordinates
 */
export const getCurrentPosition = (): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: "Geolocation is not supported by your browser",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = "Unable to retrieve location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable GPS permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }
        reject({ code: error.code, message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
};

/**
 * Reverse geocode coordinates to a human-readable address
 * Uses the free OpenStreetMap Nominatim API — no API key required
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "CivicIssueReportingApp/1.0",
        },
      }
    );

    if (!response.ok) throw new Error("Geocoding request failed");

    const data = await response.json();
    return data.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Get full location object from GPS coordinates
 */
export const getLocationFromCoords = async (
  latitude: number,
  longitude: number
): Promise<IssueLocation> => {
  const address = await reverseGeocode(latitude, longitude);
  return { latitude, longitude, address };
};

/**
 * Calculate straight-line distance between two coordinates in km
 */
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Forward geocode a manual address to coordinates
 * Uses the free OpenStreetMap Nominatim API — no API key required
 */
export const geocodeAddress = async (
  address: string
): Promise<IssueLocation | null> => {
  const query = address.trim();
  if (!query) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "CivicIssueReportingApp/1.0",
        },
      }
    );

    if (!response.ok) throw new Error("Address lookup failed");

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;

    if (!Array.isArray(data) || data.length === 0) return null;

    const top = data[0];
    const latitude = Number(top.lat);
    const longitude = Number(top.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      address: top.display_name?.trim() || query,
    };
  } catch {
    return null;
  }
};