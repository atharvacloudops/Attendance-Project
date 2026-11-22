/**
 * Standard API success response
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Standard API error response
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
