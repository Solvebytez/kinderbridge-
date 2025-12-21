const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  
  body('lastName')
    .optional()
    .trim(),
  
  body('phone')
    .optional()
    .trim()
    .custom((value) => {
      // If phone is provided, validate it
      if (value && value.length > 0 && value.length < 10) {
        throw new Error('Phone number must be at least 10 characters long');
      }
      return true;
    }),
  
  body('address')
    .notEmpty()
    .withMessage('Postal address or code is required')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Address must be at least 3 characters long'),
  
  body('userType')
    .optional()
    .isIn(['parent', 'provider', 'employer', 'employee'])
    .withMessage('Invalid user type'),
  
  body('children')
    .isArray()
    .withMessage('Children must be an array')
    .custom((children, { req }) => {
      const userType = req.body.userType || 'parent';
      if (userType === 'parent') {
        if (!children || children.length === 0) {
          throw new Error('At least one child is required for parent accounts');
        }
        const hasValidChild = children.some(child => 
          child.age && child.age > 0 && child.age <= 18
        );
        if (!hasValidChild) {
          throw new Error('At least one child must have a valid age (1-18)');
        }
      }
      return true;
    }),
  
  body('children.*.age')
    .optional()
    .isInt({ min: 1, max: 18 })
    .withMessage('Child age must be between 1 and 18'),
  
  body('communicationPreferences')
    .isObject()
    .withMessage('Communication preferences are required'),
  
  body('communicationPreferences.email')
    .isBoolean()
    .withMessage('Email consent must be a boolean')
    .custom((value) => {
      if (value !== true) {
        throw new Error('Email consent is required');
      }
      return true;
    }),
  
  body('communicationPreferences.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS consent must be a boolean'),
  
  body('communicationPreferences.promotional')
    .optional()
    .isBoolean()
    .withMessage('Promotional consent must be a boolean'),
  
  body('communicationPreferences.acknowledgement')
    .isBoolean()
    .withMessage('Acknowledgement must be a boolean')
    .custom((value) => {
      if (value !== true) {
        throw new Error('Acknowledgement is required to proceed with registration');
      }
      return true;
    }),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  next();
};

module.exports = {
  registerValidation,
  handleValidationErrors
};

