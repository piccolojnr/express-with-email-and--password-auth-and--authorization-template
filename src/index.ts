import { createServer, startServer } from './server'
import { ENV } from '@constants/env'
import logger from '@utils/logger'

/**
 * Application entry point
 */
const main = (): void => {
    try {
        // Create Express application
        const app = createServer();

        // Start the server
        startServer(app, ENV.PORT);

    } catch (error) {
        logger.err(`Failed to start server: ${error}`);
        process.exit(1);
    }
};

// Start the application
main();
