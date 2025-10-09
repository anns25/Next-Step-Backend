import { body, param, query } from 'express-validator';

export const createInterviewValidator = [
  body('applicationId')
    .notEmpty()
    .withMessage('Application ID is required')
    .isMongoId()
    .withMessage('Invalid application ID'),
  
  body('type')
    .notEmpty()
    .withMessage('Interview type is required')
    .isIn(['phone', 'video', 'in-person', 'technical', 'panel', 'hr', 'final'])
    .withMessage('Invalid interview type'),
  
  body('round')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Round must be a positive integer'),
  
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('location.type')
    .optional()
    .isIn(['office', 'remote', 'phone'])
    .withMessage('Invalid location type'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Address must be between 3 and 200 characters'),
  
  body('location.meetingLink')
    .optional()
    .isURL()
    .withMessage('Invalid meeting link URL'),
  
  body('location.phoneNumber')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  
  body('interviewers')
    .optional()
    .isArray()
    .withMessage('Interviewers must be an array'),
  
  body('interviewers.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Interviewer name must be between 2 and 100 characters'),
  
  body('interviewers.*.email')
    .optional()
    .isEmail()
    .withMessage('Invalid interviewer email'),
  
  body('preparation.notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Preparation notes must not exceed 2000 characters'),
  
  body('preparation.questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  
  body('nextSteps')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Next steps must not exceed 500 characters')
];

export const updateInterviewValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid interview ID'),
  
  body('type')
    .optional()
    .isIn(['phone', 'video', 'in-person', 'technical', 'panel', 'hr', 'final'])
    .withMessage('Invalid interview type'),
  
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
  
  body('location.type')
    .optional()
    .isIn(['office', 'remote', 'phone'])
    .withMessage('Invalid location type')
];

export const rescheduleInterviewValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid interview ID'),
  
  body('scheduledDate')
    .notEmpty()
    .withMessage('New scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes')
];

export const completeInterviewValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid interview ID'),
  
  body('feedback.userNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('User notes must not exceed 2000 characters'),
  
  body('feedback.rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('outcome')
    .optional()
    .isIn(['pending', 'passed', 'failed', 'cancelled'])
    .withMessage('Invalid outcome'),
  
  body('nextSteps')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Next steps must not exceed 500 characters')
];

export const updatePreparationValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid interview ID'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  
  body('research')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Research must not exceed 2000 characters')
];

export const getInterviewsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
  
  query('type')
    .optional()
    .isIn(['phone', 'video', 'in-person', 'technical', 'panel', 'hr', 'final'])
    .withMessage('Invalid interview type'),
  
  query('sortBy')
    .optional()
    .isIn(['scheduledDate', 'createdAt', 'type', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

export const interviewIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid interview ID')
];