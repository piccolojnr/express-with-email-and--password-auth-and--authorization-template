import type { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger'

/**
 * Request logging middleware
 * Logs incoming requests with timing
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const { method, url, ip } = req;

    // Log the incoming request
    logger.info(`${method} ${url} - ${ip}`);

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        logger.info(`${method} ${url} - ${statusCode} - ${duration}ms`);
    });

    next();
};

/**
 * CORS middleware for API
 */
export const corsHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }

    next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};

/**
 * Request timeout middleware
 */
export const timeoutHandler = (timeout: number = 30000) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        res.setTimeout(timeout, () => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Request timeout',
                    error: { code: 'REQUEST_TIMEOUT' },
                    timestamp: new Date().toISOString()
                });
            }
        });
        next();
    };
};
