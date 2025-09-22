import { Router } from "express";
import { getAllCompanies, getCompaniesByIndustry, getCompanyById, getCompanyStats } from "../controllers/company.js";


const company = Router();


company.get('/all', getAllCompanies);
company.get('/:id', getCompanyById);
company.get('/industry/:industry', getCompaniesByIndustry);
company.get('/stats/:id', getCompanyStats);


export default company