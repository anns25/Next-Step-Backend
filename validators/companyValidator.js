import { check } from "express-validator";

// Company creation validation (admin only)
export const validateCompanyCreation = [
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
    .trim()
    .isURL().withMessage("Please enter a valid website URL"),

  check("contact.email")
    .notEmpty().withMessage("Contact email is required")
    .trim()
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("contact.phone")
    .optional()
    .trim()
    .isMobilePhone().withMessage("Please enter a valid phone number"),


  check("contact.linkedin")
    .optional()
    .trim()
    .isURL().withMessage("Please enter a valid LinkedIn URL"),

  check("contact.twitter")
    .optional()
    .trim()
    .isURL().withMessage("Please enter a valid Twitter URL"),

  check("location.city")
    .notEmpty().withMessage("City is required")
    .isString().withMessage("City must be a string")
    .trim(),

  check("location.country")
    .notEmpty().withMessage("Country is required")
    .isString().withMessage("Country must be a string")
    .trim(),

  check("location.address")
    .optional()
    .isString().withMessage("Address must be a string")
    .trim(),

  check("location.state")
    .optional()
    .isString().withMessage("State must be a string")
    .trim(),

  check("location.zipCode")
    .optional()
    .isString().withMessage("Zip code must be a string")
    .trim(),

  check("foundedYear")
    .optional()
    .trim()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage("Please enter a valid founded year"),

  check("isRemoteFriendly")
    .optional()
    .trim()
    .isBoolean().withMessage("isRemoteFriendly must be a boolean"),

  check("benefits")
    .optional()
    .isArray().withMessage("Benefits must be an array"),

  check("culture")
    .optional()
    .isArray().withMessage("Culture must be an array"),

  check("status")
    .optional()
    .trim()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage("Status must be active, inactive, or suspended")
];

// Company update validation
export const validateCompanyUpdate = [
  check("name")
    .optional()
    .isString().withMessage("Company name must be a string")
    .isLength({ max: 100 }).withMessage("Company name cannot exceed 100 characters")
    .trim(),

  check("description")
    .optional()
    .isString().withMessage("Description must be a string")
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  check("industry")
    .optional()
    .isString().withMessage("Industry must be a string")
    .trim(),

  check("website")
    .optional()
    .isURL().withMessage("Please enter a valid website URL"),

  check("contact.email")
    .optional()
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

  check("location.city")
    .optional()
    .isString().withMessage("City must be a string")
    .trim(),

  check("location.country")
    .optional()
    .isString().withMessage("Country must be a string")
    .trim(),

  check("location.address")
    .optional()
    .isString().withMessage("Address must be a string")
    .trim(),

  check("location.state")
    .optional()
    .isString().withMessage("State must be a string")
    .trim(),

  check("location.zipCode")
    .optional()
    .isString().withMessage("Zip code must be a string")
    .trim(),

  check("foundedYear")
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage("Please enter a valid founded year"),

  check("isRemoteFriendly")
    .optional()
    .isBoolean().withMessage("isRemoteFriendly must be a boolean"),

  check("benefits")
    .optional()
    .isArray().withMessage("Benefits must be an array"),

  check("culture")
    .optional()
    .isArray().withMessage("Culture must be an array"),

  check("status")
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage("Status must be active, inactive, or suspended")
];