import { Router } from 'express';
import { createForm, getMyForms, getFormById, updateForm, deleteForm, getPublicForm, duplicateForm } from '../controllers/formController';
import { submitResponse, getFormResponses, exportResponsesCSV } from '../controllers/responseController';
import { createOrder, verifyPayment } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createForm);
router.get('/', protect, getMyForms);
router.get('/:id', protect, getFormById);
router.put('/:id', protect, updateForm);
router.delete('/:id', protect, deleteForm);
router.get('/:id/responses', protect, getFormResponses);
router.post('/:id/duplicate', protect, duplicateForm);
router.get('/:id/responses/export', protect, exportResponsesCSV);

// Public routes
router.get('/:id/public', getPublicForm);
router.post('/:id/responses', submitResponse);
router.post('/:id/create-order', createOrder);
router.post('/:id/verify-payment', verifyPayment);

export default router;
