import HttpStatusCodes from "../constants/HttpStatusCodes";

/**
 * Base API Error class
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
        code: string = 'INTERNAL_ERROR',
        details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends ApiError {
    constructor(message: string = 'Bad Request', details?: any) {
        super(message, HttpStatusCodes.BAD_REQUEST, 'BAD_REQUEST', details);
    }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized', details?: any) {
        super(message, HttpStatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', details);
    }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden', details?: any) {
        super(message, HttpStatusCodes.FORBIDDEN, 'FORBIDDEN', details);
    }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends ApiError {
    constructor(message: string = 'Resource not found', details?: any) {
        super(message, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND', details);
    }
}

/**
 * 405 Method Not Allowed Error
 */
export class MethodNotAllowedError extends ApiError {
    constructor(message: string = 'Method not allowed', details?: any) {
        super(message, HttpStatusCodes.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED', details);
    }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends ApiError {
    constructor(message: string = 'Resource conflict', details?: any) {
        super(message, HttpStatusCodes.CONFLICT, 'CONFLICT', details);
    }
}

/**
 * 422 Unprocessable Entity Error
 */
export class ValidationError extends ApiError {
    constructor(message: string = 'Validation failed', details?: any) {
        super(message, 422, 'VALIDATION_ERROR', details);
    }
}

/**
 * 429 Too Many Requests Error
 */
export class TooManyRequestsError extends ApiError {
    constructor(message: string = 'Too many requests', details?: any) {
        super(message, 429, 'TOO_MANY_REQUESTS', details);
    }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
    constructor(message: string = 'Internal server error', details?: any) {
        super(message, HttpStatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', details);
    }
}

/**
 * 503 Service Unavailable Error
 */
export class ServiceUnavailableError extends ApiError {
    constructor(message: string = 'Service unavailable', details?: any) {
        super(message, 503, 'SERVICE_UNAVAILABLE', details);
    }
}
