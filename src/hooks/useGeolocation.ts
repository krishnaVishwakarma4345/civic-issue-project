"use client";

import { useState, useCallback } from "react";
import {
  getCurrentPosition,
  getLocationFromCoords,
  GeolocationResult,
} from "@/lib/utils/geolocation";
import { IssueLocation } from "@/types/issue";

interface GeolocationState {
  location:    IssueLocation | null;
  coords:      GeolocationResult | null;
  loading:     boolean;
  error:       string | null;
  permission:  "idle" | "granted" | "denied" | "unavailable";
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location:   null,
    coords:     null,
    loading:    false,
    error:      null,
    permission: "idle",
  });

  const getLocation = useCallback(async (): Promise<IssueLocation | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const coords   = await getCurrentPosition();
      const location = await getLocationFromCoords(
        coords.latitude,
        coords.longitude
      );

      setState({
        location,
        coords,
        loading:    false,
        error:      null,
        permission: "granted",
      });

      return location;
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Failed to get location";

      const isDenied =
        typeof err === "object" && err !== null && "code" in err
          ? (err as { code: number }).code === 1
          : false;

      setState((prev) => ({
        ...prev,
        loading:    false,
        error:      message,
        permission: isDenied ? "denied" : "unavailable",
      }));

      return null;
    }
  }, []);

  const setManualLocation = useCallback(
    (location: IssueLocation) => {
      setState((prev) => ({
        ...prev,
        location,
        error:      null,
        permission: "granted",
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      location:   null,
      coords:     null,
      loading:    false,
      error:      null,
      permission: "idle",
    });
  }, []);

  return {
    ...state,
    getLocation,
    setManualLocation,
    reset,
  };
};