import { Router } from 'express';
import { register, login, googleAuth, getMe } from '../controllers/authController';
import { sendOtp, verifyOtp } from '../controllers/otpController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', protect, getMe);

export default router;
