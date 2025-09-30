import { check, body } from "express-validator";

// Application creation validation
export const validateApplicationCreation = [
  check("jobId")
    .notEmpty().withMessage("Job ID is required")
    .isMongoId().withMessage("Job ID must be a valid ObjectId"),

  check("coverLetter")
    .optional()
    .isString().withMessage("Cover letter must be a string")
    .isLength({ max: 2000 }).withMessage("Cover letter cannot exceed 2000 characters"),

  check("resume")
    .notEmpty().withMessage("Resume is required")
    .isString().withMessage("Resume must be a string"),

  check("portfolio")
    .optional()
    .isURL().withMessage("Portfolio must be a valid URL"),

  check("linkedinProfile")
    .optional()
    .isURL().withMessage("LinkedIn profile must be a valid URL"),

  check("expectedSalary.amount")
    .optional()
    .isNumeric().withMessage("Expected salary amount must be a number")
    .isFloat({ min: 0 }).withMessage("Expected salary must be positive"),

  check("expectedSalary.currency")
    .optional()
    .isString().withMessage("Currency must be a string")
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code"),

  check("expectedSalary.period")
    .optional()
    .isIn(['hourly', 'monthly', 'yearly'])
    .withMessage("Salary period must be hourly, monthly, or yearly"),

  check("availability")
    .optional()
    .isISO8601().withMessage("Availability must be a valid date"),

  check("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),

  check("source")
    .optional()
    .isIn(['website', 'linkedin', 'indeed', 'glassdoor', 'referral', 'other'])
    .withMessage("Source must be one of: website, linkedin, indeed, glassdoor, referral, other"),

  check("referralContact.name")
    .optional()
    .isString().withMessage("Referral contact name must be a string"),

  check("referralContact.email")
    .optional()
    .isEmail().withMessage("Referral contact email must be a valid email"),

  check("referralContact.relationship")
    .optional()
    .isString().withMessage("Referral contact relationship must be a string")
];

// Application update validation
export const validateApplicationUpdate = [
  check("status")
    .optional()
    .isIn(['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'accepted', 'withdrawn'])
    .withMessage("Invalid status"),

  check("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),

  check("feedback")
    .optional()
    .isString().withMessage("Feedback must be a string")
    .isLength({ max: 1000 }).withMessage("Feedback cannot exceed 1000 characters"),

  check("interviewDate")
    .optional()
    .isISO8601().withMessage("Interview date must be a valid date"),

  check("interviewType")
    .optional()
    .isIn(['phone', 'video', 'in-person', 'technical', 'panel'])
    .withMessage("Interview type must be one of: phone, video, in-person, technical, panel"),

  check("rejectionReason")
    .optional()
    .isString().withMessage("Rejection reason must be a string")
    .isLength({ max: 500 }).withMessage("Rejection reason cannot exceed 500 characters")
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