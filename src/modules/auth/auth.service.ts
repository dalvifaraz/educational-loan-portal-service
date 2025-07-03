import { ErrorCode } from '../../common/enums/error-code.enum';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import {
  LoginDto,
  RegisterDto,
  resetPasswordDto,
} from '../../common/interfaces/auth.interface';
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnAuthorizedException,
} from '../../common/utils/catch-error';
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
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
import { sendMail } from '../../mailer/templates/mailer';
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from '../../mailer/templates/template';
import { HTTPSTATUS } from '../../config/http.config';
import { hashValue } from '../../common/utils/bcrypt';
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
    const verification = await VerificationCodeModel.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });

    const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verification.code}`;

    await sendMail({
      to: newUser.email,
      ...verifyEmailTemplate(verificationUrl),
    });
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

  public async verifyEmail(code: string) {
    const validCode = await VerificationCodeModel.findOne({
      code: code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });
    if (!validCode) {
      throw new BadRequestException('Invalid or expired verification');
    }
    const updatedUser = await UserModel.findOneAndUpdate(
      validCode.userId,
      {
        isEmailVerified: true,
      },
      { new: true },
    );
    if (!updatedUser) {
      throw new BadRequestException(
        'Unable to verify email address',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    await validCode.deleteOne();
    return {
      user: updatedUser,
    };
  }

  public async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // can only call this in 2 times in 10 minutes
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo },
    });
    if (count >= maxAttempts) {
      throw new HttpException(
        'Too many request, try again later',
        HTTPSTATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS,
      );
    }
    const expiresAt = anHourFromNow();
    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });
    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${validCode.code}&exp=${expiresAt.getTime()}`;

    const { data, error } = await sendMail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    });

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`);
    }

    return {
      url: resetLink,
      emailId: data.id,
    };
  }

  public async resetPassword({ password, verificationCode }: resetPasswordDto) {
    const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt: { $gt: new Date() },
    });
    if (!validCode) {
      throw new NotFoundException('Invalid or expired verification code');
    }

    const hashedPassword = await hashValue(password);

    const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    });
    if (!updatedUser) {
      throw new BadRequestException('Failed to reset password');
    }
    await validCode.deleteOne();

    await SessionModel.deleteMany({
      userId: updatedUser._id,
    });

    return {
      user: updatedUser,
    };
  }

  public async logout(sessionId: string) {
    return await SessionModel.findByIdAndDelete(sessionId);
  }
}
