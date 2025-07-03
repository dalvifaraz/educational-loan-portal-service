import { Router } from 'express';
import { userController } from './user.module';

const userRoute = Router();

userRoute.post(
  '/checkEmailAvailability',
  userController.checkEmailAvailability,
);

export default userRoute;
