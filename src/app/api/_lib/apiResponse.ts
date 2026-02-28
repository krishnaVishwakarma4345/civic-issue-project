import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";

// ─── Success Response ─────────────────────────────────────────

export const successResponse = <T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
};

// ─── Error Response ───────────────────────────────────────────

export const errorResponse = (
  error: string,
  status: number = 400
): NextResponse<ApiResponse<never>> => {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
};

// ─── Common Error Shortcuts ───────────────────────────────────

export const unauthorizedResponse = (
  message = "Unauthorized: Please log in."
) => errorResponse(message, 401);

export const forbiddenResponse = (
  message = "Forbidden: Insufficient permissions."
) => errorResponse(message, 403);

export const notFoundResponse = (
  message = "Resource not found."
) => errorResponse(message, 404);

export const serverErrorResponse = (
  message = "Internal server error. Please try again later."
) => errorResponse(message, 500);

export const validationErrorResponse = (
  message: string
) => errorResponse(message, 422);

// ─── Parse Auth Error Code ────────────────────────────────────

export const parseAuthError = (err: unknown): NextResponse<ApiResponse<never>> => {
  if (err instanceof Error) {
    if (err.message.startsWith("UNAUTHORIZED")) return unauthorizedResponse();
    if (err.message.startsWith("FORBIDDEN"))    return forbiddenResponse();
  }
  return serverErrorResponse();
};