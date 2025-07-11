import mongoose, { Document, Schema } from 'mongoose';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { generateSixDigitCode } from '../../common/utils/uuid';

interface VerificationCodeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  type: VerificationEnum;
  createdAt: Date;
  expiresAt: Date;
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
    default: generateSixDigitCode,
  },
  type: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
  'Verification',
  verificationCodeSchema,
  'verification_codes',
);

export default VerificationCodeModel;
