import { Router } from "express";
import { getAllJobs, getJobById, getJobsByCompany } from "../controllers/job.js";


const job = Router();


job.get('/all', getAllJobs);
job.get('/:id', getJobById);
job.get('/company/:companyId', getJobsByCompany);


export default job;