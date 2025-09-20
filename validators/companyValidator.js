import { check } from "express-validator";

export const validateCompanySignup = [
  check("name")
    .notEmpty().withMessage("Company name is required")
    .isString().withMessage("Company name must be a string")
    .isLength({ max: 100 }).withMessage("Company name cannot exceed 100 characters")
    .trim(),

  check("description")
    .notEmpty().withMessage("Company description is required")
    .isString().withMessage("Description must be a string")
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  check("industry")
    .notEmpty().withMessage("Industry is required")
    .isString().withMessage("Industry must be a string")
    .trim(),

  check("website")
    .optional()
    .isURL().withMessage("Please enter a valid website URL"),

  check("contact.email")
    .notEmpty().withMessage("Contact email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("contact.phone")
    .optional()
    .isMobilePhone().withMessage("Please enter a valid phone number"),

  check("contact.linkedin")
    .optional()
    .isURL().withMessage("Please enter a valid LinkedIn URL"),

  check("contact.twitter")
    .optional()
    .isURL().withMessage("Please enter a valid Twitter URL"),

  check("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

// Company Login validation rules
export const validateCompanyLogin = [
  check("email")
    .notEmpty().withMessage("Contact email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .notEmpty().withMessage("Password is required"),
];
