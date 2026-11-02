const { validationResult } = require('express-validator');

/**
 * Runs after express-validator check() chains on a route.
 * If any validation failed, returns a clean 400 instead of letting bad data through.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
