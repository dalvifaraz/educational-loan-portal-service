import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { SessionDocument } from '../../database/models/session.model';
import { UserDocument } from '../../database/models/user.model';
import { config } from '../../config/app.config';
import ms from 'ms';

export type AccessTPayload = {
  userId: UserDocument['_id'];
  sessionId: SessionDocument['_id'];
};
export type RefreshTPayload = {
  sessionId: SessionDocument['_id'];
};

type SignOpsAndSecret = SignOptions & {
  secret: string;
};
const defaults: SignOptions = {
  audience: ['user'],
};

export const accessTokenSignOptions: SignOpsAndSecret = {
  expiresIn: config.JWT.EXPIRES_IN as ms.StringValue,
  secret: config.JWT.SECRET,
};
export const refreshTokenSignOptions: SignOpsAndSecret = {
  expiresIn: config.JWT.REFRESH_EXPIRES_IN as ms.StringValue,
  secret: config.JWT.REFRESH_SECRET,
};

export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload,
  options?: SignOpsAndSecret,
) => {
  const { secret, ...opts } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, { ...defaults, ...opts });
};

export const verifyJwtToken = <TPayload extends object = AccessTPayload>(
  token: string,
  options?: VerifyOptions & { secret: string },
) => {
  try {
    const { secret = config.JWT.SECRET, ...opts } = options || {};
    console.log(token);
    const payload = jwt.verify(token, secret, {
      ...defaults,
      ...opts,
    }) as TPayload;
    return { payload };
  } catch (err: any) {
    console.log(err);
    return {
      error: err.message,
    };
  }
};
