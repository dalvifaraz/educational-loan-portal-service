import mongoose, { Document, Schema } from 'mongoose';
import { comparePassword, hashValue } from '../../common/utils/bcrypt';

interface UserPreference {
  enable2fa: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  userPreferences: UserPreference;
  comparePassword(value: string): Promise<boolean>;
}

const userPreferencesSchema = new Schema<UserPreference>({
  enable2fa: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFactorSecret: { type: Boolean, required: false },
});

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    userPreferences: {
      type: userPreferencesSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {},
  },
);

userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.userPreferences.twoFactorSecret;
    return ret;
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashValue(this.password);
  }
  next();
});

userSchema.methods.comparePassword = async function (value: string) {
  return comparePassword(value, this.password);
};

const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
