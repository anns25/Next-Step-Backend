import { Router } from "express";

import { authCheck } from "../middlewares/authCheck.js";
import { validateApplicationCreation, validateApplicationId, validateApplicationQuery, validateApplicationUpdate, validateJobId } from "../validators/applicationValidator.js";
import { createApplication, deleteApplication, getApplicationById, getApplicationStats, getJobApplications, getUserApplications, updateApplication } from "../controllers/application.js";
import { validate } from "../middlewares/validate.js";
import { uploadResume } from "../middlewares/multer.js";
import { updateApplicationStatus } from "../controllers/admin.js";


const application = Router();

// Apply authentication middleware to all routes
application.use(authCheck);


// User application routes
application.post('/', uploadResume.single('resume'), validateApplicationCreation, validate, createApplication);
application.get('/', validateApplicationQuery, validate, getUserApplications);
application.get('/stats', getApplicationStats);
application.patch('/:id/status', validateApplicationUpdate, validate, updateApplicationStatus);
application.get('/:id', validateApplicationId, validate, getApplicationById);
application.patch('/:id', validateApplicationUpdate, validate, updateApplication);
application.delete('/:id', validateApplicationId, validate, deleteApplication);

// Job applications (for companies)
application.get('/job/:jobId', validateJobId, validate, getJobApplications);

export default application;