import {
  createConversation as createConversationService,
  getConversationById,
  processCustomerMessage,
  updateCustomerInfo,
  updateVehicleInfo,
} from '../services/assessmentService.js';
import { errorResponse, successResponse } from '../utils/response.js';

export const createConversation = async (req, res, next) => {
  try {
    const conversation = await createConversationService({
      customerName: req.body?.customerName,
      vehicleMake: req.body?.vehicleMake,
    });

    return successResponse(
      res,
      {
        conversation: {
          id: conversation._id,
          status: conversation.status,
          messages: conversation.messages,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversation = await getConversationById(req.params.id);
    return successResponse(res, { conversation });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const message = req.body.message;
    const result = await processCustomerMessage(req.params.id, message);
    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const result = await updateCustomerInfo(req.params.id, req.body);
    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const result = await updateVehicleInfo(req.params.id, req.body);
    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};
