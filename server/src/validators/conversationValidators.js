import Joi from 'joi';

import { errorResponse } from '../utils/response.js';

const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    const payload = req[source] || {};
    const { error, value } = schema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return errorResponse(
        res,
        { code: 'VALIDATION_ERROR', message: message || 'Invalid request' },
        400
      );
    }

    req[source] = value;
    return next();
  };
};

export const conversationIdValidation = validateSchema(
  Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      'string.hex': 'Invalid conversation id',
      'string.length': 'Invalid conversation id',
      'any.required': 'Invalid conversation id',
    }),
  }),
  'params'
);

export const createConversationValidation = validateSchema(
  Joi.object({
    customerName: Joi.string().trim().max(150).optional(),
    vehicleMake: Joi.string().trim().max(80).optional(),
  })
);

export const messageValidation = validateSchema(
  Joi.object({
    message: Joi.string().trim().min(1).max(2000).required(),
  })
);

export const customerValidation = validateSchema(
  Joi.object({
    fullName: Joi.string().trim().max(150).optional(),
    phoneNumber: Joi.string().trim().max(50).optional(),
    email: Joi.string().email().max(150).optional(),
    preferredServiceLocation: Joi.string().trim().max(200).optional(),
    preferredServiceDate: Joi.string().trim().max(100).optional(),
  }).min(1)
);

export const vehicleValidation = validateSchema(
  Joi.object({
    make: Joi.string().trim().max(80).optional(),
    model: Joi.string().trim().max(80).optional(),
    year: Joi.number().integer().min(1900).max(2100).optional(),
    registrationNumber: Joi.string().trim().max(30).uppercase().optional(),
    vin: Joi.string().trim().max(60).uppercase().optional(),
    mileage: Joi.number().integer().min(0).optional(),
    issuePattern: Joi.string()
      .valid('constant', 'intermittent', 'unknown')
      .optional(),
    isDrivable: Joi.boolean().optional(),
  }).min(1)
);
