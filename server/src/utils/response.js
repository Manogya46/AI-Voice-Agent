export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

export const errorResponse = (res, error, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'REQUEST_ERROR',
      message: error.message || 'Something went wrong.',
    },
  });
};
