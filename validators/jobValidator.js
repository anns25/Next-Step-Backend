import { check, body } from "express-validator";

// Job creation validation
export const validateJobCreation = [
  check("title")
    .notEmpty().withMessage("Job title is required")
    .isString().withMessage("Job title must be a string")
    .isLength({ max: 100 }).withMessage("Job title cannot exceed 100 characters")
    .trim(),

  check("description")
    .notEmpty().withMessage("Job description is required")
    .isString().withMessage("Description must be a string")
    .isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters"),

  check("company")
    .notEmpty().withMessage("Company is required")
    .isMongoId().withMessage("Company must be a valid ObjectId"),

  check("location.type")
    .notEmpty().withMessage("Location type is required")
    .isIn(['remote', 'on-site', 'hybrid']).withMessage("Location type must be remote, on-site, or hybrid"),

  check("location.address")
    .optional()
    .isString().withMessage("Address must be a string")
    .trim(),

  // In jobValidator.js, update the city and country validation:
  check("location.city")
    .optional()
    .isString().withMessage("City must be a string")
    .custom((value, { req }) => {
      if (req.body.location && req.body.location.type !== 'remote' && !value) {
        throw new Error("City is required for non-remote positions");
      }
      return true;
    })
    .trim(),

  check("location.state")
    .optional()
    .isString().withMessage("State must be a string")
    .trim(),

  check("location.country")
    .optional()
    .isString().withMessage("Country must be a string")
    .custom((value, { req }) => {
      if (req.body.location && req.body.location.type !== 'remote' && !value) {
        throw new Error("Country is required for non-remote positions");
      }
      return true;
    })
    .trim(),

  check("location.zipCode")
    .optional()
    .isString().withMessage("Zip code must be a string")
    .trim(),

  check("location.coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),

  check("location.coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),

  check("jobType")
    .notEmpty().withMessage("Job type is required")
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary'])
    .withMessage("Job type must be full-time, part-time, contract, internship, or temporary"),

  check("experienceLevel")
    .notEmpty().withMessage("Experience level is required")
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage("Experience level must be entry, mid, senior, or executive"),

  // Salary validation
  check("salary.min")
    .optional()
    .isNumeric().withMessage("Minimum salary must be a number")
    .isFloat({ min: 0 }).withMessage("Minimum salary must be positive"),

  check("salary.max")
    .optional()
    .isNumeric().withMessage("Maximum salary must be a number")
    .isFloat({ min: 0 }).withMessage("Maximum salary must be positive"),

  check("salary.currency")
    .optional()
    .isString().withMessage("Currency must be a string")
    .trim(),

  check("salary.period")
    .optional()
    .isIn(['hourly', 'monthly', 'yearly'])
    .withMessage("Salary period must be hourly, monthly, or yearly"),

  check("salary.isNegotiable")
    .optional()
    .isBoolean().withMessage("isNegotiable must be a boolean"),

  // Requirements validation
  check("requirements.skills")
    .optional()
    .isArray().withMessage("Skills must be an array"),

  check("requirements.skills.*")
    .optional()
    .isString().withMessage("Each skill must be a string"),

  check("requirements.education")
    .optional()
    .isString().withMessage("Education must be a string"),

  check("requirements.experience")
    .optional()
    .isString().withMessage("Experience must be a string"),

  check("requirements.certifications")
    .optional()
    .isArray().withMessage("Certifications must be an array"),

  check("requirements.certifications.*")
    .optional()
    .isString().withMessage("Each certification must be a string"),

  check("requirements.languages")
    .optional()
    .isArray().withMessage("Languages must be an array"),

  check("requirements.languages.*")
    .optional()
    .isString().withMessage("Each language must be a string"),

  // Responsibilities and benefits
  check("responsibilities")
    .optional()
    .isArray().withMessage("Responsibilities must be an array"),

  check("responsibilities.*")
    .optional()
    .isString().withMessage("Each responsibility must be a string"),

  check("benefits")
    .optional()
    .isArray().withMessage("Benefits must be an array"),

  check("benefits.*")
    .optional()
    .isString().withMessage("Each benefit must be a string"),

  // Date validations
  check("applicationDeadline")
    .optional()
    .isISO8601().withMessage("Application deadline must be a valid date")
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error("Application deadline must be a future date");
      }
      return true;
    }),

  check("startDate")
    .optional()
    .isISO8601().withMessage("Start date must be a valid date"),

  // Boolean validations
  check("isActive")
    .optional()
    .isBoolean().withMessage("isActive must be a boolean"),

  check("isFeatured")
    .optional()
    .isBoolean().withMessage("isFeatured must be a boolean"),

  // Tags and external URL
  check("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),

  check("tags.*")
    .optional()
    .isString().withMessage("Each tag must be a string"),

  check("externalUrl")
    .optional()
    .isURL().withMessage("External URL must be a valid URL"),

  check("applicationInstructions")
    .optional()
    .isString().withMessage("Application instructions must be a string"),

  // Custom validation for salary range
  body().custom((value) => {
    if (value.salary && value.salary.min && value.salary.max) {
      if (parseFloat(value.salary.min) > parseFloat(value.salary.max)) {
        throw new Error("Minimum salary must be less than or equal to maximum salary");
      }
    }
    return true;
  }),

  // Custom validation for location requirements
  body().custom((value) => {
    if (value.location && value.location.type !== 'remote') {
      if (!value.location.city || !value.location.country) {
        throw new Error("City and country are required for non-remote positions");
      }
    }
    return true;
  })
];

// Job update validation
export const validateJobUpdate = [
  check("title")
    .optional()
    .isString().withMessage("Job title must be a string")
    .isLength({ max: 100 }).withMessage("Job title cannot exceed 100 characters")
    .trim(),

  check("description")
    .optional()
    .isString().withMessage("Description must be a string")
    .isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters"),

  check("company")
    .optional()
    .isMongoId().withMessage("Company must be a valid ObjectId"),

  check("location.type")
    .optional()
    .isIn(['remote', 'on-site', 'hybrid']).withMessage("Location type must be remote, on-site, or hybrid"),

  check("location.address")
    .optional()
    .isString().withMessage("Address must be a string")
    .trim(),

  check("location.city")
    .optional()
    .isString().withMessage("City must be a string")
    .trim(),

  check("location.state")
    .optional()
    .isString().withMessage("State must be a string")
    .trim(),

  check("location.country")
    .optional()
    .isString().withMessage("Country must be a string")
    .trim(),

  check("location.zipCode")
    .optional()
    .isString().withMessage("Zip code must be a string")
    .trim(),

  check("location.coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),

  check("location.coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),

  check("jobType")
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary'])
    .withMessage("Job type must be full-time, part-time, contract, internship, or temporary"),

  check("experienceLevel")
    .optional()
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage("Experience level must be entry, mid, senior, or executive"),

  // Salary validation
  check("salary.min")
    .optional()
    .isNumeric().withMessage("Minimum salary must be a number")
    .isFloat({ min: 0 }).withMessage("Minimum salary must be positive"),

  check("salary.max")
    .optional()
    .isNumeric().withMessage("Maximum salary must be a number")
    .isFloat({ min: 0 }).withMessage("Maximum salary must be positive"),

  check("salary.currency")
    .optional()
    .isString().withMessage("Currency must be a string")
    .trim(),

  check("salary.period")
    .optional()
    .isIn(['hourly', 'monthly', 'yearly'])
    .withMessage("Salary period must be hourly, monthly, or yearly"),

  check("salary.isNegotiable")
    .optional()
    .isBoolean().withMessage("isNegotiable must be a boolean"),

  // Requirements validation
  check("requirements.skills")
    .optional()
    .isArray().withMessage("Skills must be an array"),

  check("requirements.skills.*")
    .optional()
    .isString().withMessage("Each skill must be a string"),

  check("requirements.education")
    .optional()
    .isString().withMessage("Education must be a string"),

  check("requirements.experience")
    .optional()
    .isString().withMessage("Experience must be a string"),

  check("requirements.certifications")
    .optional()
    .isArray().withMessage("Certifications must be an array"),

  check("requirements.certifications.*")
    .optional()
    .isString().withMessage("Each certification must be a string"),

  check("requirements.languages")
    .optional()
    .isArray().withMessage("Languages must be an array"),

  check("requirements.languages.*")
    .optional()
    .isString().withMessage("Each language must be a string"),

  // Responsibilities and benefits
  check("responsibilities")
    .optional()
    .isArray().withMessage("Responsibilities must be an array"),

  check("responsibilities.*")
    .optional()
    .isString().withMessage("Each responsibility must be a string"),

  check("benefits")
    .optional()
    .isArray().withMessage("Benefits must be an array"),

  check("benefits.*")
    .optional()
    .isString().withMessage("Each benefit must be a string"),

  // Date validations
  check("applicationDeadline")
    .optional()
    .isISO8601().withMessage("Application deadline must be a valid date")
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error("Application deadline must be a future date");
      }
      return true;
    }),

  check("startDate")
    .optional()
    .isISO8601().withMessage("Start date must be a valid date"),

  // Boolean validations
  check("isActive")
    .optional()
    .isBoolean().withMessage("isActive must be a boolean"),

  check("isFeatured")
    .optional()
    .isBoolean().withMessage("isFeatured must be a boolean"),

  // Tags and external URL
  check("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),

  check("tags.*")
    .optional()
    .isString().withMessage("Each tag must be a string"),

  check("externalUrl")
    .optional()
    .isURL().withMessage("External URL must be a valid URL"),

  check("applicationInstructions")
    .optional()
    .isString().withMessage("Application instructions must be a string"),

  // Custom validation for salary range
  body().custom((value) => {
    if (value.salary && value.salary.min && value.salary.max) {
      if (parseFloat(value.salary.min) > parseFloat(value.salary.max)) {
        throw new Error("Minimum salary must be less than or equal to maximum salary");
      }
    }
    return true;
  }),

  // Custom validation for location requirements
  body().custom((value) => {
    if (value.location && value.location.type && value.location.type !== 'remote') {
      if (!value.location.city || !value.location.country) {
        throw new Error("City and country are required for non-remote positions");
      }
    }
    return true;
  })
];

// Job ID validation
export const validateJobId = [
  check("id")
    .isMongoId().withMessage("Invalid job ID format")
];

// Company ID validation for job creation
export const validateCompanyId = [
  check("companyId")
    .isMongoId().withMessage("Invalid company ID format")
];