import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  authProvider?: 'local' | 'google' | 'email-otp';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'email-otp'],
    default: 'local',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = model<IUser>('User', UserSchema);
