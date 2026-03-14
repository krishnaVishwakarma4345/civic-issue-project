import { ZodSchema, ZodError } from "zod";
import { validationErrorResponse } from "./apiResponse";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";

// ─── Validate request body against a Zod schema ───────────────

export const validateBody = async <T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse<ApiResponse<never>> }
> => {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return {
        success: false,
        response: validationErrorResponse("Invalid JSON in request body."),
      };
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0];
      const message    = firstError
        ? `${firstError.path.join(".")}: ${firstError.message}`
        : "Validation failed.";
      return {
        success: false,
        response: validationErrorResponse(message),
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      response: validationErrorResponse("Request validation failed."),
    };
  }
};

// ─── Validate query params ────────────────────────────────────

export const getQueryParam = (
  url: string,
  param: string
): string | null => {
  try {
    const { searchParams } = new URL(url);
    return searchParams.get(param);
  } catch {
    return null;
  }
};

export const getQueryParams = (
  url: string,
  params: string[]
): Record<string, string | null> => {
  const result: Record<string, string | null> = {};
  try {
    const { searchParams } = new URL(url);
    params.forEach((p) => {
      result[p] = searchParams.get(p);
    });
  } catch {
    params.forEach((p) => { result[p] = null; });
  }
  return result;
};