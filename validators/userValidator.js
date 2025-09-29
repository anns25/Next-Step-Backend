// validators/userValidator.js
import { check, body } from "express-validator";

// Signup validation rules
export const validateSignup = [
  check("firstName")
    .notEmpty().withMessage("First name is required")
    .isString().withMessage("First name must be a string")
    .trim(),

  check("lastName")
    .notEmpty().withMessage("Last name is required")
    .isString().withMessage("Last name must be a string")
    .trim(),

  check("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .trim()
    .normalizeEmail(),

  check("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  check("role")
    .optional()
    .trim()
    .equals("user").withMessage("Role must be user for this endpoint"),

  // Profile picture validation - required for both roles
  body().custom((value) => {
    if (!value.role || value.role === 'user') {
      // Profile picture will be validated in controller (file upload)
      return true;
    }
    return true;
  })
];

// Admin-only signup validation
export const validateAdminSignup = [
  check("firstName")
    .notEmpty().withMessage("First name is required")
    .isString().withMessage("First name must be a string")
    .trim(),

  check("lastName")
    .notEmpty().withMessage("Last name is required")
    .isString().withMessage("Last name must be a string")
    .trim(),

  check("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .trim()
    .normalizeEmail(),

  check("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  check("role")
    .equals("admin").withMessage("Role must be admin for this endpoint"),

  // Profile picture validation - required for admin
  body().custom((value) => {
    if (value.role === 'admin') {
      // Profile picture will be validated in controller (file upload)
      return true;
    }
    return true;
  })
];

// Login validation rules
export const validateLogin = [
  check("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .notEmpty().withMessage("Password is required")
];

// Update user validation rules (for regular users)
export const validateUpdateUser = [
  check("firstName")
    .optional()
    .isString().withMessage("First name must be a string")
    .trim(),

  check("lastName")
    .optional()
    .isString().withMessage("Last name must be a string")
    .trim(),

  check("email")
    .optional()
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .optional()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  check("workStatus")
    .optional()
    .isIn(["fresher", "experienced"]).withMessage("Work status must be 'fresher' or 'experienced'"),

  // Skills
  check("skills")
    .optional()
    .isArray().withMessage("Skills must be an array"),

  // Experience array
  check("experience")
    .optional()
    .isArray().withMessage("Experience must be an array"),
  check("experience.*.company")
    .optional()
    .isString().withMessage("Company name must be a string"),
  check("experience.*.position")
    .optional()
    .isString().withMessage("Position must be a string"),
  check("experience.*.startDate")
    .optional()
    .isISO8601().withMessage("Start date must be a valid date"),
  check("experience.*.endDate")
    .optional()
    .isISO8601().withMessage("End date must be a valid date"),

  // Add date range validation
  check("experience.*.startDate")
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 60;
      const maxYear = currentYear;

      if (date.getFullYear() < minYear || date.getFullYear() > maxYear) {
        throw new Error(`Start date must be between ${minYear} and ${maxYear}`);
      }
      return true;
    }),

  check("experience.*.endDate")
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 60;
      const maxYear = currentYear + 2;

      if (date.getFullYear() < minYear || date.getFullYear() > maxYear) {
        throw new Error(`End date must be between ${minYear} and ${maxYear}`);
      }
      return true;
    }),

  // Education array
  check("education")
    .optional()
    .isArray().withMessage("Education must be an array"),
  check("education.*.institution")
    .optional()
    .isString().withMessage("Institution must be a string"),
  check("education.*.degree")
    .optional()
    .isString().withMessage("Degree must be a string"),
  check("education.*.fieldOfStudy")
    .optional()
    .isString().withMessage("Field of study must be a string"),
  check("education.*.startDate")
    .optional()
    .isISO8601().withMessage("Start date must be a valid date"),
  check("education.*.endDate")
    .optional()
    .isISO8601().withMessage("End date must be a valid date"),

  check("education.*.startDate")
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 60;
      const maxYear = currentYear;

      if (date.getFullYear() < minYear || date.getFullYear() > maxYear) {
        throw new Error(`Start date must be between ${minYear} and ${maxYear}`);
      }
      return true;
    }),

  check("education.*.endDate")
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 60;
      const maxYear = currentYear + 2;

      if (date.getFullYear() < minYear || date.getFullYear() > maxYear) {
        throw new Error(`End date must be between ${minYear} and ${maxYear}`);
      }
      return true;
    }),

  // Location object
  check("location.city")
    .optional()
    .isString().withMessage("City must be a string"),
  check("location.state")
    .optional()
    .isString().withMessage("State must be a string"),
  check("location.country")
    .optional()
    .isString().withMessage("Country must be a string"),
  check("preferences.jobTypes.*")
    .optional()
    .isIn(["full-time", "part-time", "contract", "internship", "remote"])
    .withMessage("Each job type must be one of : full-time, part-time, contract, internship, remote"),

  // Preferences object
  check("preferences.jobTypes")
    .optional()
    .isArray().withMessage("Job types must be an array"),
  check("preferences.salaryRange.min")
    .optional()
    .isNumeric().withMessage("Minimum salary must be a number"),
  check("preferences.salaryRange.max")
    .optional()
    .isNumeric().withMessage("Maximum salary must be a number"),
  check("preferences.salaryRange.currency")
    .optional()
    .isString().withMessage("Currency must be a string"),
  check("preferences.remoteWork")
    .optional()
    .isBoolean().withMessage("Remote work must be true or false"),
  check("preferences.notifications.email")
    .optional()
    .isBoolean().withMessage("Email notification must be true or false"),
  check("preferences.notifications.push")
    .optional()
    .isBoolean().withMessage("Push notification must be true or false"),

  // Custom conditional validation: if workStatus = experienced, require experience
  body().custom((value) => {
    if (value.workStatus === "experienced") {
      if (!value.experience || !Array.isArray(value.experience) || value.experience.length === 0) {
        throw new Error("At least one experience entry is required for experienced users");
      }
      value.experience.forEach((exp, i) => {
        if (!exp.company || !exp.position || !exp.startDate) {
          throw new Error(`Experience entry #${i + 1} must have company, position, and startDate`);
        }
      });
    }
    return true;
  })
];

// Update admin validation rules (minimal fields)
export const validateUpdateAdmin = [
  check("firstName")
    .optional()
    .isString().withMessage("First name must be a string")
    .trim(),

  check("lastName")
    .optional()
    .isString().withMessage("Last name must be a string")
    .trim(),

  check("email")
    .optional()
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .optional()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  // Admin should not be able to update user-specific fields
  body().custom((value) => {
    const userSpecificFields = ['workStatus', 'skills', 'experience', 'education', 'location', 'preferences'];
    const hasUserFields = userSpecificFields.some(field => value.hasOwnProperty(field));
    
    if (hasUserFields) {
      throw new Error("Admin accounts cannot have user-specific profile fields");
    }
    return true;
  })
];