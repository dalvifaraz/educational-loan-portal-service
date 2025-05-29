import { ErrorCode } from '../../common/enums/error-code.enum';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { LoginDto, RegisterDto } from '../../common/interfaces/auth.interface';
import {
  BadRequestException,
  UnAuthorizedException,
} from '../../common/utils/catch-error';
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
} from '../../common/utils/date-time';
import SessionModel from '../../database/models/session.model';
import UserModel from '../../database/models/user.model';
import VerificationCodeModel from '../../database/models/verification.model';
import { config } from '../../config/app.config';
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from '../../common/utils/jwt';
export class AuthService {
  public async register(registerData: RegisterDto) {
    const { name, email, password } = registerData;

    const existingUser = await UserModel.exists({ email });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
      );
    }
    const newUser = await UserModel.create({
      name,
      email,
      password,
    });
    const userId = newUser._id;
    const verificationCode = await VerificationCodeModel.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });
    // Send verification email link
    return {
      user: newUser,
    };
  }

  public async login(loginData: LoginDto) {
    const { email, password, userAgent } = loginData;

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }
    const isValidPassword = await user?.comparePassword(password);

    if (!isValidPassword) {
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }
    // check if user enalble 2fa and return user = null

    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions,
    );

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }

  public async refreshToken(refreshToken: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });
    if (!payload) {
      throw new UnAuthorizedException('Invalid refresh token');
    }
    const session = await SessionModel.findById(payload.sessionId);
    if (!session) {
      throw new UnAuthorizedException('Session does not exists');
    }
    const now = Date.now();
    if (session.expiredAt.getTime() <= now) {
      throw new UnAuthorizedException('Session expired');
    }
    const sessionRefreshToken =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;
    if (sessionRefreshToken) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN,
      );
      await session.save();
    }
    const newRefreshToken = sessionRefreshToken
      ? signJwtToken({ sessionId: session._id }, refreshTokenSignOptions)
      : undefined;

    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session._id,
    });
    return { accessToken, newRefreshToken };
  }
}
