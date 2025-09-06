import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, notFoundHandler } from '@middlewares/errorHandlers'
import { requestLogger, securityHeaders, timeoutHandler } from '@middlewares/common'

// Import constants
import { ENV } from '@constants/env'
import Paths from '@constants/Paths'

// Import utilities
import logger from '@utils/logger'
import { createSuccessResponse } from '@src/common/types/ApiResponse'

// Import routes
import BaseRouter from '@routes/index'

// Load environment variables
dotenv.config();

/**
 * Create and configure Express application
 */
export const createServer = (): Express => {
    const app: Express = express();

    // Basic middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS
    app.use(cors({
        origin: ENV.NODE_ENV === 'production' ? false : true, // Configure based on environment
        credentials: true
    }));

    // Custom middleware
    app.use(requestLogger);
    app.use(securityHeaders);
    app.use(timeoutHandler(30000)); // 30 second timeout

    // Health check endpoint (outside API base path)
    app.get('/health', (req: Request, res: Response) => {
        const response = createSuccessResponse({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: ENV.NODE_ENV
        }, 'Service is healthy');

        res.status(200).json(response);
    });


    // Add APIs, must be after middleware
    app.use(Paths.Base, BaseRouter);

    // Error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

/**
 * Start the server
 */
export const startServer = (app: Express, port: number): void => {
    const server = app.listen(port, () => {
        logger.info(`🚀 Server is running at http://localhost:${port}`);
        logger.info(`📚 API Base URL: http://localhost:${port}${Paths.Base}`);
        logger.info(`💚 Health Check: http://localhost:${port}/health`);
        logger.info(`🌍 Environment: ${ENV.NODE_ENV}`);
        logger.info(`📝 Log Level: ${ENV.LOG_LEVEL}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        logger.info('SIGINT signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
        logger.err(`Uncaught Exception: ${err.message}`);
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
        logger.err(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
        process.exit(1);
    });
};
