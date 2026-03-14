"use client";

import React, { useState, useCallback } from "react";
import { useForm }                       from "react-hook-form";
import { zodResolver }                   from "@hookform/resolvers/zod";
import { MapPin, Navigation, CheckCircle2 } from "lucide-react";
import Input           from "@/components/ui/Input";
import Textarea        from "@/components/ui/Textarea";
import Select          from "@/components/ui/Select";
import Button          from "@/components/ui/Button";
import Alert           from "@/components/ui/Alert";
import ImageUploader   from "./ImageUploader";
import {
  createIssueSchema,
  type CreateIssueFormData,
} from "@/lib/utils/validators";
import { CATEGORIES }  from "@/lib/constants/categories";
import { PRIORITIES }  from "@/lib/constants/priorities";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn }          from "@/lib/utils/cn";
import type { IssueLocation } from "@/types/issue";

// ─── Options ─────────────────────────────────────────────────

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c.value,
  label: `${c.icon} ${c.label}`,
}));

const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({
  value: p.value,
  label: p.label,
}));

// ─── Props ────────────────────────────────────────────────────

interface IssueFormProps {
  onSubmit:   (data: CreateIssueFormData, imageUrls: string[]) => Promise<void>;
  loading?:   boolean;
  error?:     string | null;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────

export default function IssueForm({
  onSubmit,
  loading   = false,
  error,
  className,
}: IssueFormProps) {
  const [imageUrls,     setImageUrls]     = useState<string[]>([]);
  const [manualAddress, setManualAddress] = useState("");

  const {
    location,
    loading:    geoLoading,
    error:      geoError,
    permission,
    getLocation,
    setManualLocation,
  } = useGeolocation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateIssueFormData>({
    resolver:      zodResolver(createIssueSchema),
    defaultValues: {
      title:       "",
      description: "",
      address:     "",
    },
    mode: "onChange",
  });

  const descriptionValue = watch("description", "");
  const categoryValue    = watch("category");

  // ─── Get Location ──────────────────────────────────────────

  const handleGetLocation = useCallback(async () => {
    const loc = await getLocation();
    if (loc) setManualAddress(loc.address);
  }, [getLocation]);

  const handleManualAddress = useCallback(
    (address: string) => {
      setManualAddress(address);
      const fallback: IssueLocation = {
        latitude:  20.5937,
        longitude: 78.9629,
        address,
      };
      setManualLocation(location ?? fallback);
    },
    [location, setManualLocation]
  );

  // ─── Submit ────────────────────────────────────────────────

  const handleFormSubmit = async (data: CreateIssueFormData) => {
    await onSubmit(data, imageUrls);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className={cn("space-y-6", className)}
    >
      {/* Global Error */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* ─── Issue Details ────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            1
          </span>
          Issue Details
        </p>

        <Input
          label="Title"
          placeholder="e.g. Large pothole on MG Road near bus stop"
          error={errors.title?.message}
          required
          hint="Be specific — include landmark or street name"
          {...register("title")}
        />

        <Textarea
          label="Description"
          placeholder="Describe the problem in detail..."
          error={errors.description?.message}
          required
          showCount
          maxLength={1000}
          value={descriptionValue}
          rows={4}
          {...register("description")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            placeholder="Select category"
            error={errors.category?.message}
            required
            {...register("category")}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            placeholder="Select priority"
            error={errors.priority?.message}
            required
            {...register("priority")}
          />
        </div>

        {/* Category hint */}
        {categoryValue && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
            {(() => {
              const cat = CATEGORIES.find((c) => c.value === categoryValue);
              return cat
                ? `${cat.icon} ${cat.label}: ${cat.description}`
                : null;
            })()}
          </div>
        )}
      </div>

      {/* ─── Location ─────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            2
          </span>
          Location
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            label="Address / Landmark"
            placeholder="e.g. Near Shivaji Park, Dadar"
            value={manualAddress}
            onChange={(e) => handleManualAddress(e.target.value)}
            leftIcon={<MapPin size={15} />}
            className="flex-1"
          />
          <div className="sm:pt-6">
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={geoLoading}
              onClick={handleGetLocation}
              leftIcon={<Navigation size={14} />}
            >
              Detect GPS
            </Button>
          </div>
        </div>

        {location && (
          <Alert variant="success">
            <p className="text-xs font-medium">Location captured:</p>
            <p className="text-xs mt-0.5 text-gray-600">{location.address}</p>
          </Alert>
        )}

        {geoError && (
          <Alert variant="warning">{geoError}</Alert>
        )}

        {permission === "denied" && (
          <p className="text-xs text-red-500">
            GPS access denied. Please enter address manually.
          </p>
        )}
      </div>

      {/* ─── Images ───────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            3
          </span>
          Photos{" "}
          <span className="text-xs font-normal text-gray-400">(optional)</span>
        </p>

        <ImageUploader
          onUploadComplete={(urls) => {
            setImageUrls((prev) => [...prev, ...urls].slice(0, 5));
          }}
          maxFiles={5}
          disabled={loading}
        />
      </div>

      {/* ─── Submit ───────────────────────────────────────── */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        leftIcon={<CheckCircle2 size={16} />}
      >
        {loading ? "Submitting..." : "Submit Report"}
      </Button>
    </form>
  );
}