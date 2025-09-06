/**
 * Standard API response interface for consistent response structure
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: any;
    };
    timestamp: string;
}

/**
 * Success response helper
 */
export const createSuccessResponse = <T>(
    data: T,
    message: string = 'Success'
): ApiResponse<T> => ({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
});

/**
 * Error response helper
 */
export const createErrorResponse = (
    message: string,
    code: string = 'INTERNAL_ERROR',
    details?: any
): ApiResponse => ({
    success: false,
    message,
    error: {
        code,
        details
    },
    timestamp: new Date().toISOString()
});

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
