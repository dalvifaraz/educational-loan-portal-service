import { Router } from 'express';
import { authController } from './auth.module';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';

const authRoute = Router();

authRoute.post('/register', authController.register);
authRoute.post('/login', authController.login);
authRoute.post('/verify/email', authController.verifyEmail);
authRoute.post('/password/forgot', authController.forgotPassword);
authRoute.post('/password/reset', authController.resetPassword);
authRoute.post('/logout', authenticateJWT, authController.logout);

authRoute.get('/refresh', authController.refreshToken);
export default authRoute;
