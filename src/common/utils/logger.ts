import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/app.config';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.Console(), // plain console output
    new winston.transports.File({
      filename: path.join(logDir, `${config.NODE_ENV}.log`),
    }),
  ],
});

export default logger;
