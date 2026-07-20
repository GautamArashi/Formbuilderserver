import { Schema, model, Document } from 'mongoose';

export interface IOtpCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const OtpCode = model<IOtpCode>('OtpCode', OtpCodeSchema);
