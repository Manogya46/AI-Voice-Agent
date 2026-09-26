import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    { code: 'NOT_FOUND', message: 'Route not found.' },
    404
  );
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  if (error.name === 'CastError' || error.name === 'ValidationError') {
    return errorResponse(
      res,
      { code: 'VALIDATION_ERROR', message: 'Invalid request data.' },
      400
    );
  }

  if (error.code === 11000) {
    return errorResponse(
      res,
      {
        code: 'DUPLICATE_ENTRY',
        message: 'A duplicate record already exists.',
      },
      409
    );
  }

  if (error.message && error.message.toLowerCase().includes('ollama')) {
    return errorResponse(
      res,
      {
        code: 'AI_SERVICE_ERROR',
        message: 'AI service is unavailable at the moment.',
      },
      503
    );
  }

  const message =
    env.nodeEnv === 'production'
      ? 'Internal server error.'
      : error.message || 'Internal server error.';

  return errorResponse(res, { code: 'SERVER_ERROR', message }, statusCode);
};
