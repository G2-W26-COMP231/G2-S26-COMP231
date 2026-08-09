/**
 * Wraps an async route handler so any error it throws gets passed to
 * express's error middleware automatically, instead of having to wrap
 * every single controller function in its own try/catch.
 *
 * @param {Function} handler - an async (req, res, next) function
 * @returns {Function} the wrapped handler
 */
const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;