import { body } from 'express-validator';

export const validateCreateJobAlert = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Alert name is required')
    .isLength({ max: 100 })
    .withMessage('Alert name cannot exceed 100 characters'),

  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),

  body('keywords.*')
    .optional()
    .trim()
    .isString()
    .withMessage('Each keyword must be a string'),

  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('skills.*')
    .optional()
    .trim()
    .isString()
    .withMessage('Each skill must be a string'),

  body('location.type')
    .optional()
    .isIn(['remote', 'on-site', 'hybrid', 'any'])
    .withMessage('Invalid location type'),

  body('location.city')
    .optional()
    .trim()
    .isString()
    .withMessage('City must be a string'),

  body('location.state')
    .optional()
    .trim()
    .isString()
    .withMessage('State must be a string'),

  body('location.country')
    .optional()
    .trim()
    .isString()
    .withMessage('Country must be a string'),

  body('location.radius')
    .optional()
    .isNumeric()
    .withMessage('Radius must be a number'),

  body('jobTypes')
    .optional()
    .isArray()
    .withMessage('Job types must be an array'),

  body('jobTypes.*')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary'])
    .withMessage('Invalid job type'),

  body('experienceLevels')
    .optional()
    .isArray()
    .withMessage('Experience levels must be an array'),

  body('experienceLevels.*')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage('Invalid experience level'),

  body('salaryRange.min')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number'),

  body('salaryRange.max')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number'),

  body('salaryRange.currency')
    .optional()
    .trim()
    .isString()
    .withMessage('Currency must be a string'),

  body('industries')
    .optional()
    .isArray()
    .withMessage('Industries must be an array'),

  body('industries.*')
    .optional()
    .trim()
    .isString()
    .withMessage('Each industry must be a string'),

  body('companies')
    .optional()
    .isArray()
    .withMessage('Companies must be an array'),

  body('companies.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID'),

  body('excludeCompanies')
    .optional()
    .isArray()
    .withMessage('Exclude companies must be an array'),

  body('excludeCompanies.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID'),

  body('notificationFrequency')
    .optional()
    .isIn(['immediate', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid notification frequency'),

  body('notificationPreferences')
    .optional()
    .isObject()
    .withMessage('Notification preferences must be an object'),

  body('notificationPreferences.email')
    .optional()
    .isBoolean()
    .withMessage('Email preference must be a boolean'),

  body('notificationPreferences.push')
    .optional()
    .isBoolean()
    .withMessage('Push preference must be a boolean'),

  body('notificationPreferences.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS preference must be a boolean')
];

export const validateUpdateJobAlert = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Alert name cannot exceed 100 characters'),

  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),

  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('location.type')
    .optional()
    .isIn(['remote', 'on-site', 'hybrid', 'any'])
    .withMessage('Invalid location type'),

  body('jobTypes')
    .optional()
    .isArray()
    .withMessage('Job types must be an array'),

  body('jobTypes.*')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary'])
    .withMessage('Invalid job type'),

  body('experienceLevels')
    .optional()
    .isArray()
    .withMessage('Experience levels must be an array'),

  body('experienceLevels.*')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage('Invalid experience level'),

  body('notificationFrequency')
    .optional()
    .isIn(['immediate', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid notification frequency'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('companies')
    .optional()
    .isArray()
    .withMessage('Companies must be an array'),

  body('excludeCompanies')
    .optional()
    .isArray()
    .withMessage('Exclude companies must be an array')
];