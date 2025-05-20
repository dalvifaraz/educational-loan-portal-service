import mongoose, { Document, Schema } from 'mongoose';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { thirtyDaysFromNow } from '../../common/utils/date-time';
import { generateUniqueCode } from '../../common/utils/uuid';

interface VerificationCodeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  type: VerificationEnum;
  createdAt?: Date;
  expireAt?: Date;
}

const verificationCodeSchema = new Schema<VerificationCodeDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
    default: generateUniqueCode,
  },
  type: { type: String, required: true },
  createdAt: { type: Date, required: false, default: Date.now },
  expireAt: { type: Date, required: false },
});

const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
  'Verification',
  verificationCodeSchema,
  'verification_codes',
);

export default VerificationCodeModel;
