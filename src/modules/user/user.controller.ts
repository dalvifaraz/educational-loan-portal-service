import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { UserService } from './user.service';
import { emailSchema } from '../../common/validators/auth.validator';
import { HTTPSTATUS } from '../../config/http.config';

export class UserController {
  userService: UserService;
  constructor(userService: UserService) {
    this.userService = userService;
  }

  public checkEmailAvailability = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const email = emailSchema.parse(req.body.email);
      const user = await this.userService.findUserByEmail(email);
      if (user) {
        return res.status(HTTPSTATUS.CONFLICT).json({
          message: 'User with this email already exists',
        });
      }
      return res.status(HTTPSTATUS.OK).json({
        message: 'Email is available',
      });
    },
  );
}
