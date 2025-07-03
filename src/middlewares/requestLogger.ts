import { Request, Response, NextFunction } from 'express';
import logger from '../common/utils/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  logger.info(`➡️ ${req.method} ${req.originalUrl} started`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `⬅️ ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );

    logger.info(
      '✅ Request cycle completed\n------------------------------------------------------------',
    );
  });

  next();
};

export default requestLogger;
