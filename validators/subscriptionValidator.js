import { body } from 'express-validator';

export const validateCreateSubscription = [
  body('companyId')
    .trim()
    .notEmpty()
    .withMessage('Company ID is required')
    .isMongoId()
    .withMessage('Invalid company ID format'),

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

export const validateUpdateSubscription = [
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
    .withMessage('SMS preference must be a boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];