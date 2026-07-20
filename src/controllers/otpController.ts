import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import transporter from '../config/mailer';
import { OtpCode } from '../models/OtpCode';
import { User } from '../models/User';

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic rate limiting: check if OTP was sent in the last 60 seconds
    const latestOtp = await OtpCode.findOne({ email: trimmedEmail }).sort({ createdAt: -1 });
    if (latestOtp && (Date.now() - latestOtp.createdAt.getTime()) < 60 * 1000) {
      res.status(429).json({ message: 'Please wait before requesting another code' });
      return;
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP codes for this email (cleanup)
    await OtpCode.deleteMany({ email: trimmedEmail });

    // Save new OtpCode
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    const otpDoc = new OtpCode({
      email: trimmedEmail,
      code,
      expiresAt,
    });
    await otpDoc.save();

    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: trimmedEmail,
      subject: 'Your Form Builder verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Verify Your Account</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Here is your 6-digit verification code. This code is valid for 10 minutes.
          </p>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; border: 1px dashed #cbd5e1;">
            ${code}
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: (error as Error).message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: 'Email and code are required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Find valid OtpCode
    const otpRecord = await OtpCode.findOne({
      email: trimmedEmail,
      code: cleanCode,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ message: 'Invalid or expired code' });
      return;
    }

    // Delete OTP document (one-time use)
    await OtpCode.deleteOne({ _id: otpRecord._id });

    // Find or create User
    let user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      const fallbackName = trimmedEmail.split('@')[0];
      user = new User({
        name: fallbackName,
        email: trimmedEmail,
        authProvider: 'email-otp',
      });
      await user.save();
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: (error as Error).message });
  }
};
