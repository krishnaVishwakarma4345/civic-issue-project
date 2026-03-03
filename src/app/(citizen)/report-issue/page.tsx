"use client";

import React, { useState, useCallback } from "react";
import { useRouter }                    from "next/navigation";
import { useForm }                      from "react-hook-form";
import { zodResolver }                  from "@hookform/resolvers/zod";
import { MapPin, Loader2, CheckCircle2, Navigation, ImageIcon } from "lucide-react";
import { useIssues }      from "@/hooks/useIssues";
import { useGeolocation } from "@/hooks/useGeolocation";
import PageHeader         from "@/components/layout/PageHeader";
import { Card }           from "@/components/ui/Card";
import Input              from "@/components/ui/Input";
import Textarea           from "@/components/ui/Textarea";
import Select             from "@/components/ui/Select";
import Button             from "@/components/ui/Button";
import Alert              from "@/components/ui/Alert";
import ImageUploader      from "@/components/issues/ImageUploader";
import { createIssueSchema, type CreateIssueFormData } from "@/lib/utils/validators";
import { CATEGORIES }     from "@/lib/constants/categories";
import { PRIORITIES }     from "@/lib/constants/priorities";
import { cn }             from "@/lib/utils/cn";
import type { IssueLocation } from "@/types/issue";

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }));
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p.value, label: p.label }));

const FORM_STEPS = [
  { id: 1, label: "Issue Details",   icon: "📝" },
  { id: 2, label: "Location",        icon: "📍" },
  { id: 3, label: "Review & Submit", icon: "✅" },
];

const TOTAL_STEPS = 3;

export default function ReportIssuePage() {
  const router                      = useRouter();
  const { submitIssue, submitting } = useIssues();
  const {
    location,
    loading:    geoLoading,
    error:      geoError,
    permission,
    getLocation,
    setManualLocation,
  } = useGeolocation();

  const [currentStep,       setCurrentStep]        = useState(1);
  const [submitSuccess,     setSubmitSuccess]       = useState(false);
  const [submitError,       setSubmitError]         = useState<string | null>(null);
  const [manualAddress,     setManualAddress]       = useState("");
  const [manualLocation,    setLocalManualLocation] = useState<IssueLocation | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls]   = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<CreateIssueFormData>({
    resolver:      zodResolver(createIssueSchema),
    defaultValues: { title: "", description: "", category: undefined, priority: undefined, address: "" },
    mode:          "onChange",
  });

  const watchedValues     = watch();
  const effectiveLocation = location ?? manualLocation;

  // ─── Image upload callback ─────────────────────────────────────────────────
  const handleUploadComplete = useCallback((newUrls: string[]) => {
    setUploadedImageUrls((prev) => [...prev, ...newUrls]);
  }, []);

  // ─── Step Navigation ───────────────────────────────────────────────────────
  // FIX: explicitly call e.preventDefault() + e.stopPropagation() so the
  // browser never treats these buttons as form submitters, regardless of
  // whether the Button component forwards the type prop to <button>.
  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const stepFields: Record<number, (keyof CreateIssueFormData)[]> = {
      1: ["title", "description", "category", "priority"],
      2: ["address"],
    };
    const fieldsToValidate = stepFields[currentStep] ?? [];
    const valid = fieldsToValidate.length === 0 ? true : await trigger(fieldsToValidate);
    if (!valid) return;

    if (currentStep === 2 && !effectiveLocation && manualAddress.trim() === "") {
      setSubmitError("Please detect your location or enter an address before continuing.");
      return;
    }

    setSubmitError(null);
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmitError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // ─── GPS Location ──────────────────────────────────────────────────────────
  const handleGetLocation = async () => {
    const loc = await getLocation();
    if (loc) {
      setManualAddress(loc.address);
      setValue("address", loc.address, { shouldValidate: true });
    }
  };

  // ─── Manual Address ────────────────────────────────────────────────────────
  const handleManualAddress = useCallback(
    (address: string) => {
      setManualAddress(address);
      setValue("address", address, { shouldValidate: true });
      if (address.trim()) {
        const loc: IssueLocation = { latitude: 20.5937, longitude: 78.9629, address };
        setLocalManualLocation(loc);
        setManualLocation(loc);
      } else {
        setLocalManualLocation(null);
      }
    },
    [setManualLocation, setValue]
  );

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CreateIssueFormData) => {
    const finalLocation = effectiveLocation;
    if (!finalLocation) {
      setSubmitError("Location is required. Please go back and add your location.");
      setCurrentStep(2);
      return;
    }

    setSubmitError(null);

    const result = await submitIssue(
      {
        title:       data.title,
        description: data.description,
        category:    data.category,
        priority:    data.priority,
        location:    finalLocation,
        images:      uploadedImageUrls,
      },
      []
    );

    if (result) {
      setSubmitSuccess(true);
      setTimeout(() => router.push(`/issues/${result.id}`), 2500);
    } else {
      setSubmitError("Submission failed. Please try again.");
    }
  };

  // ─── Success State ─────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Issue Reported!</h2>
          <p className="text-gray-500 text-sm mb-6">Redirecting to issue details...</p>
          <div className="flex items-center justify-center gap-2 text-primary-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Report a Civic Issue"
        subtitle="Fill in the details below to submit your civic complaint."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Report Issue" }]}
      />

      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <div className="flex items-center justify-between">
          {FORM_STEPS.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent   = step.id === currentStep;
            const isPending   = step.id > currentStep;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isCompleted && "bg-primary-600 text-white",
                    isCurrent   && "bg-primary-100 text-primary-700 ring-2 ring-primary-400 ring-offset-2",
                    isPending   && "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? <CheckCircle2 size={16} /> : step.icon}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isCurrent   && "text-primary-700",
                    isCompleted && "text-gray-600",
                    isPending   && "text-gray-400"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < FORM_STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    step.id < currentStep ? "bg-primary-400" : "bg-gray-100"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {submitError && (
        <Alert variant="error" onDismiss={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Step 1: Issue Details ─────────────────────────────────── */}
        {currentStep === 1 && (
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">📝</span>
              <h2 className="section-title">Issue Details</h2>
            </div>
            <div className="space-y-5">
              <Input
                label="Issue Title"
                placeholder="e.g. Large pothole on MG Road near bus stop"
                error={errors.title?.message}
                required
                hint="Be specific — include landmark or street name"
                {...register("title")}
              />
              <Textarea
                label="Description"
                placeholder="Describe the issue in detail — what is the problem, how severe is it, and how long has it existed?"
                error={errors.description?.message}
                required
                showCount
                maxLength={1000}
                value={watchedValues.description ?? ""}
                rows={5}
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
                  hint="How urgently does this need fixing?"
                  {...register("priority")}
                />
              </div>

              {watchedValues.category && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  {(() => {
                    const cat = CATEGORIES.find((c) => c.value === watchedValues.category);
                    return cat ? (
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">{cat.icon} {cat.label}:</span> {cat.description}
                      </p>
                    ) : null;
                  })()}
                </div>
              )}

              {/* ── Photo Upload ─────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon size={15} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Attach Photos</span>
                  <span className="text-xs text-gray-400">(optional, up to 5)</span>
                </div>
                <ImageUploader
                  onUploadComplete={handleUploadComplete}
                  maxFiles={5}
                  disabled={submitting}
                />
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 2: Location ──────────────────────────────────────── */}
        {currentStep === 2 && (
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">📍</span>
              <h2 className="section-title">Location</h2>
            </div>
            <div className="space-y-5">
              <div className="p-4 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 text-center">
                <Navigation size={24} className="text-primary-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800 mb-1">Use My Current Location</p>
                <p className="text-xs text-gray-500 mb-3">
                  We will automatically fill in your GPS coordinates and address
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={geoLoading}
                  onClick={handleGetLocation}
                  leftIcon={<Navigation size={14} />}
                >
                  {geoLoading ? "Detecting..." : "Detect My Location"}
                </Button>
                {permission === "denied" && (
                  <p className="text-xs text-red-500 mt-2">
                    Location access denied. Please enable GPS in browser settings.
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or enter manually</span>
                </div>
              </div>

              <Input
                label="Address / Landmark"
                placeholder="e.g. Near Shivaji Park, Dadar, Mumbai"
                value={manualAddress}
                onChange={(e) => handleManualAddress(e.target.value)}
                error={errors.address?.message}
                leftIcon={<MapPin size={16} />}
                required
                hint="Enter a specific address or nearby landmark"
              />

              {effectiveLocation && (
                <Alert variant="success" title="Location captured">
                  <p className="text-xs mt-0.5">{effectiveLocation.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {effectiveLocation.latitude.toFixed(5)}, {effectiveLocation.longitude.toFixed(5)}
                  </p>
                </Alert>
              )}

              {geoError && (
                <Alert variant="warning" title="Location issue">
                  {geoError}. You can still enter the address manually.
                </Alert>
              )}
            </div>
          </Card>
        )}

        {/* ── Step 3: Review & Submit ───────────────────────────────── */}
        {currentStep === 3 && (
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">✅</span>
              <h2 className="section-title">Review & Submit</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <ReviewRow label="Title"       value={watchedValues.title} />
                <ReviewRow label="Description" value={watchedValues.description} truncate />
                <ReviewRow
                  label="Category"
                  value={CATEGORIES.find((c) => c.value === watchedValues.category)?.label ?? watchedValues.category}
                />
                <ReviewRow
                  label="Priority"
                  value={PRIORITIES.find((p) => p.value === watchedValues.priority)?.label ?? watchedValues.priority}
                />
                <ReviewRow label="Location" value={effectiveLocation?.address ?? "Not captured"} />
                <ReviewRow
                  label="Photos"
                  value={
                    uploadedImageUrls.length > 0
                      ? `${uploadedImageUrls.length} photo${uploadedImageUrls.length !== 1 ? "s" : ""} attached`
                      : "No photos attached"
                  }
                />
              </div>

              {!effectiveLocation && (
                <Alert variant="warning" title="No location">
                  Please go back and add your location for faster processing.
                </Alert>
              )}

              <Alert variant="info">
                By submitting, this issue will be assigned to the relevant municipal department
                for review and resolution. You will receive notifications as it progresses.
              </Alert>
            </div>
          </Card>
        )}

        {/* ── Navigation Buttons ────────────────────────────────────── */}
        {/* FIX: use native <button type="button"> for Back and Next so the
            browser NEVER treats them as submit triggers — no dependency on
            how the Button wrapper component forwards the type prop.
            Only the final Submit uses the Button component with type="submit". */}
        <div className="flex items-center justify-between mt-4 gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              "px-4 py-2 rounded-lg border border-gray-200 bg-white",
              "text-sm font-medium text-gray-700 transition-all",
              "hover:bg-gray-50 hover:border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1",
              currentStep === 1 && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
          >
            Back
          </button>

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium
                         hover:bg-primary-700 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
            >
              Next
            </button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              leftIcon={<CheckCircle2 size={16} />}
              disabled={!effectiveLocation}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value, truncate = false }: { label: string; value?: string; truncate?: boolean }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 font-medium text-gray-500">{label}</span>
      <span className={cn("text-gray-900 flex-1", truncate && "line-clamp-2")}>{value || "—"}</span>
    </div>
  );
}