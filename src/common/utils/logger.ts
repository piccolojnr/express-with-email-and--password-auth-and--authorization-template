import { Formats, JetLogger, LoggerModes } from 'jet-logger';
import fs from 'fs';
import { ENV } from '../constants/env';

// Ensure log directory exists in production
if (ENV.NODE_ENV === 'production') {
    const logDir = './logs';
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
}

const logger = new JetLogger(
    ENV.NODE_ENV === 'production' ? LoggerModes.File : LoggerModes.Console,
    ENV.NODE_ENV === 'production' ? './logs/app.log' : undefined,
    true,
    true,
    ENV.NODE_ENV === 'production' ? Formats.Json : Formats.Line,
);

export default logger;
