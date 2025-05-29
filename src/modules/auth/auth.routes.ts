import { Router } from 'express';
import { authController } from './auth.module';

const authRoute = Router();

authRoute.post('/register', authController.register);
authRoute.post('/login', authController.login);
authRoute.get('/refresh', authController.refreshToken);

export default authRoute;
