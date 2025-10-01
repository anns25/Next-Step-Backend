import { check, body } from "express-validator";

// Application creation validation
export const validateApplicationCreation = [
  // Accept both jobId and job field names
  check("jobId")
    .optional()
    .isMongoId().withMessage("Job ID must be a valid ObjectId"),
  
  check("job")
    .optional()
    .isMongoId().withMessage("Job ID must be a valid ObjectId"),

  // Ensure at least one job field is provided
  body().custom((value, { req }) => {
    if (!req.body.jobId && !req.body.job) {
      throw new Error('Either jobId or job is required');
    }
    return true;
  }),

  check("coverLetter")
    .optional()
    .isString().withMessage("Cover letter must be a string")
    .isLength({ max: 2000 }).withMessage("Cover letter cannot exceed 2000 characters"),

  check("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters")
];

// Application update validation (for users - only status and notes)
export const validateApplicationUpdate = [
  check("status")
    .optional()
    .isIn(['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'accepted', 'withdrawn'])
    .withMessage("Invalid status"),

  check("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters")
];

// Application status update validation (for companies)
export const validateApplicationStatusUpdate = [
  check("status")
    .optional()
    .isIn(['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'accepted', 'withdrawn'])
    .withMessage("Invalid status"),

  check("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters")
];

// Application ID validation
export const validateApplicationId = [
  check("id")
    .isMongoId().withMessage("Invalid application ID format")
];

// Job ID validation
export const validateJobId = [
  check("jobId")
    .isMongoId().withMessage("Invalid job ID format")
];

// Query parameters validation
export const validateApplicationQuery = [
  check("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  check("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

  check("status")
    .optional()
    .isIn(['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'accepted', 'withdrawn'])
    .withMessage("Invalid status filter"),

  check("sortBy")
    .optional()
    .isIn(['applicationDate', 'status', 'company', 'job'])
    .withMessage("Invalid sort field"),

  check("sortOrder")
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("Sort order must be asc or desc")
];