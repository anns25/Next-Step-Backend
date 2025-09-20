import { Router } from "express";
import { loginCompany, registerCompany } from "../controllers/company.js";
import upload from "../middlewares/multer.js";
import { validate } from "../middlewares/validate.js";
import { validateCompanySignup } from "../validators/companyValidator.js";
import { validateCompanyLogin } from "../validators/companyValidator.js";



const company = Router();

company.post("/register", upload.single('logo'), validateCompanySignup, validate, registerCompany);
company.post("/login",  validateCompanyLogin, validate, loginCompany);

export default company