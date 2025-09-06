import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@errors/ApiErrors'
import { createErrorResponse } from '../types/ApiResponse'
import HttpStatusCodes from '@constants/HttpStatusCodes'
import logger from '@utils/logger'

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
    // Log the error
    logger.err(`Error occurred: ${err.message} | URL: ${req.method} ${req.url} | IP: ${req.ip}`);

    // If it's an ApiError, handle it appropriately
    if (err instanceof ApiError) {
        const response = createErrorResponse(err.message, err.code, err.details);
        res.status(err.statusCode).json(response);
        return;
    }

    // Handle specific known errors
    if (err.name === 'ValidationError') {
        const response = createErrorResponse('Validation failed', 'VALIDATION_ERROR', err.message);
        res.status(HttpStatusCodes.BAD_REQUEST).json(response);
        return;
    }

    if (err.name === 'CastError') {
        const response = createErrorResponse('Invalid ID format', 'INVALID_ID');
        res.status(HttpStatusCodes.BAD_REQUEST).json(response);
        return;
    }

    // Default to 500 server error
    const response = createErrorResponse(
        'Internal server error',
        'INTERNAL_SERVER_ERROR',
        process.env.NODE_ENV === 'development' ? err.stack : undefined
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
        'ROUTE_NOT_FOUND'
    );
    res.status(HttpStatusCodes.NOT_FOUND).json(response);
};

/**
 * Method not allowed handler
 * Useful for handling unsupported HTTP methods on existing routes
 */
export const methodNotAllowedHandler = (allowedMethods: string[]) => {
    return (req: Request, res: Response): void => {
        res.set('Allow', allowedMethods.join(', '));
        const response = createErrorResponse(
            `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
            'METHOD_NOT_ALLOWED'
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
