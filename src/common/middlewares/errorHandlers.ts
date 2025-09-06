import type { Request, Response, NextFunction } from "express";
import { ApiError, ValidationError } from "@errors/ApiErrors";
import { createErrorResponse } from "../types/ApiResponse";
import HttpStatusCodes from "@constants/HttpStatusCodes";
import logger from "@utils/logger";
import { ZodError } from "zod";

/**
 * Global error handling middleware
 * Should be placed after all routes and other middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error (but don't expose it to users)
  logger.err(
    `Error occurred: ${err.message} | URL: ${req.method} ${req.url} | IP: ${req.ip}`
  );

  // Handle ValidationError (from our custom validation middleware)
  if (err instanceof ValidationError) {
    const response = createErrorResponse(
      "Validation failed",
      "VALIDATION_ERROR",
      err.details
    );
    res.status(HttpStatusCodes.BAD_REQUEST).json(response);
    return;
  }

  // Handle ZodError (in case it somehow gets through)
  if (err instanceof ZodError) {
    const validationErrors = err.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
    }));

    const response = createErrorResponse(
      "Validation failed",
      "VALIDATION_ERROR",
      { errors: validationErrors }
    );
    res.status(HttpStatusCodes.BAD_REQUEST).json(response);
    return;
  }

  // If it's an ApiError, handle it appropriately
  if (err instanceof ApiError) {
    const response = createErrorResponse(err.message, err.code, err.details);
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle other known error types
  if (err.name === "CastError") {
    const response = createErrorResponse("Invalid ID format", "INVALID_ID");
    res.status(HttpStatusCodes.BAD_REQUEST).json(response);
    return;
  }

  // Handle JSON parsing errors
  if (err.name === "SyntaxError" && "body" in err) {
    const response = createErrorResponse("Invalid JSON format", "INVALID_JSON");
    res.status(HttpStatusCodes.BAD_REQUEST).json(response);
    return;
  }

  // Default to 500 server error (don't expose internal details in production)
  const response = createErrorResponse(
    "Internal server error",
    "INTERNAL_SERVER_ERROR",
    process.env.NODE_ENV === "development"
      ? { error: err.message, stack: err.stack }
      : undefined
  );
  res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(response);
};

/**
 * 404 Not Found middleware
 * Should be placed after all routes but before error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response = createErrorResponse(
    `Route ${req.method} ${req.path} not found`,
    "ROUTE_NOT_FOUND"
  );
  res.status(HttpStatusCodes.NOT_FOUND).json(response);
};

/**
 * Method not allowed handler
 * Useful for handling unsupported HTTP methods on existing routes
 */
export const methodNotAllowedHandler = (allowedMethods: string[]) => {
  return (req: Request, res: Response): void => {
    res.set("Allow", allowedMethods.join(", "));
    const response = createErrorResponse(
      `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(
        ", "
      )}`,
      "METHOD_NOT_ALLOWED"
    );
    res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json(response);
  };
};

/**
 * Async handler wrapper to catch async errors
 * Use this to wrap async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
