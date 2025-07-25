import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { AuthService } from './auth.service';
import { HTTPSTATUS } from '../../config/http.config';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
  verificationEmailSchema,
} from '../../common/validators/auth.validator';
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookie,
} from '../../common/utils/cookie';
import {
  NotFoundException,
  UnAuthorizedException,
} from '../../common/utils/catch-error';

export class AuthController {
  public authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req.body,
      });
      const { user } = await this.authService.register(body);
      res
        .status(HTTPSTATUS.CREATED)
        .json({ message: 'User registered successfully', data: user });
    },
  );

  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.headers['user-agent'];
      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });

      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(body);
      return setAuthenticationCookie({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({ message: 'User login successfully', user, mfaRequired });
    },
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      const refreshToken = req.cookies.refreshToken as string | undefined;
      if (!refreshToken) {
        throw new UnAuthorizedException('Missing refresh token');
      }
      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshToken);

      if (newRefreshToken) {
        res.cookie(
          'refreshToken',
          newRefreshToken,
          getRefreshTokenCookieOptions(),
        );
      }
      res
        .status(HTTPSTATUS.OK)
        .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
        .json({ message: 'Refresh access token successfully' });
    },
  );

  public verifyEmail = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      const { code } = verificationEmailSchema.parse(req.body);
      await this.authService.verifyEmail(code);
      return res.status(HTTPSTATUS.OK).json({
        message: 'Email verified successfully',
      });
    },
  );

  public forgotPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      const email = emailSchema.parse(req.body.email);
      await this.authService.forgotPassword(email);
      return res.status(HTTPSTATUS.OK).json({
        message: 'Password reset email sent.',
      });
    },
  );

  public resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      const body = resetPasswordSchema.parse(req.body);
      await this.authService.resetPassword(body);
      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message: 'Reset password successfully',
      });
    },
  );

  public logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      const sessionId = req.sessionId;
      if (!sessionId) {
        throw new NotFoundException('Session is expired');
      }
      await this.authService.logout(sessionId);
      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message: 'User logout successfull.',
      });
    },
  );
}
