import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chalk from 'chalk';
import { config } from './config/app.config';
import connectToDatabase from './database/mongodb';
import { errorHandler } from './middlewares/errorHandler';
import { HTTPSTATUS, HttpStatusCode } from './config/http.config';
import authRoute from './modules/auth/auth.routes';
import passport from './middlewares/passport';
import userRoute from './modules/user/user.routes';
import morgan from 'morgan';
import logger from './common/utils/logger';
import requestLogger from './middlewares/requestLogger';
import { UnAuthorizedException } from './common/utils/catch-error';

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(passport.initialize());
app.use(requestLogger);

app.get('/', (req: Request, res: Response) => {
  // throw new UnAuthorizedException('Unauthorised');
  res.status(HTTPSTATUS.OK).json({ message: 'Hello from Backend Boilerplate' });
});

app.use(`${BASE_PATH}/auth`, authRoute);
app.use(`${BASE_PATH}/user`, userRoute);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  logger.info('Server is starting...');
  console.log(
    chalk.green.bold(`Backend Boilerplate API is running on:`),
    chalk.blue.bold.underline(`http://localhost:${config.PORT}`),
    chalk.green.bold(`in ${config.NODE_ENV.toUpperCase()}`),
  );
  await connectToDatabase();
});
