import { Router } from 'express';

import {
  createConversation,
  getConversation,
  sendMessage,
  updateCustomer,
  updateVehicle,
} from '../controllers/conversationController.js';
import {
  conversationIdValidation,
  createConversationValidation,
  customerValidation,
  messageValidation,
  vehicleValidation,
} from '../validators/conversationValidators.js';

const router = Router();

router.post('/conversations', createConversationValidation, createConversation);
router.get('/conversations/:id', conversationIdValidation, getConversation);
router.post(
  '/conversations/:id/messages',
  conversationIdValidation,
  messageValidation,
  sendMessage
);
router.patch(
  '/conversations/:id/customer',
  conversationIdValidation,
  customerValidation,
  updateCustomer
);
router.patch(
  '/conversations/:id/vehicle',
  conversationIdValidation,
  vehicleValidation,
  updateVehicle
);

export default router;
