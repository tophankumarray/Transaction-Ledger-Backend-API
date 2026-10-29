/**
 * Formats a successful response.
 * @param {any} data
 * @param {string} message
 * @param {object} meta
 */
export const successResponse = (data, message = 'Success', meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return response;
};

/**
 * Formats an error response.
 * @param {string} message
 * @param {string} code
 * @param {any} details
 */
export const errorResponse = (message, code = 'ERROR', details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details !== null && details !== undefined) {
    response.error.details = details;
  }
  return response;
};

export default {
  successResponse,
  errorResponse,
};
