import { Request, Response } from 'express';
import crypto from 'crypto';
import razorpay from '../config/razorpay';
import { Form } from '../models/Form';
import { Response as FormResponse } from '../models/Response';
import { getIO } from '../config/socket';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.log("RAZORPAY_KEY_SECRET exists:", !!process.env.RAZORPAY_KEY_SECRET);
  try {
    const { id } = req.params;
    const form = await Form.findById(id);
    if (!form || !form.isPublished) {
      res.status(404).json({ message: 'Form not found or is not published yet' });
      return;
    }

    const priceInINR = form.price && form.price > 0 ? form.price : 500;
    const amount = Math.round(priceInINR * 100); // Convert INR to paise
    const currency = 'INR';

    const options = {
      amount,
      currency,
      receipt: `rcpt_${id.slice(-8)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ message: 'Failed to create order', error: (error as Error).message });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, answers } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !answers) {
      res.status(400).json({ message: 'Payment verification failed, missing parameters' });
      return;
    }

    const form = await Form.findById(id);
    if (!form || !form.isPublished) {
      res.status(404).json({ message: 'Form not found or is not published yet' });
      return;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(razorpay_signature, 'utf8');

    const isSignatureValid =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isSignatureValid) {
      res.status(400).json({ message: 'Payment verification failed' });
      return;
    }

    const newResponse = new FormResponse({
      formId: form._id,
      answers,
      paymentId: razorpay_payment_id,
    });

    await newResponse.save();

    // Emit real-time notification
    try {
      const io = getIO();
      io.to(`form-${id}`).emit('new-response', {
        formId: form._id,
        submittedAt: newResponse.submittedAt,
        increment: true,
        response: newResponse,
      });
    } catch (socketErr) {
      console.error('Socket notification failed:', socketErr);
    }

    res.status(201).json(newResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
