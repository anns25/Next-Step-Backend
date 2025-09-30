import { Router } from "express";

import { authCheck } from "../middlewares/authCheck.js";
import { validateApplicationCreation, validateApplicationId, validateApplicationQuery, validateApplicationUpdate } from "../validators/applicationValidator.js";
import { createApplication, deleteApplication, getApplicationById, getApplicationStats, getJobApplications, getUserApplications, updateApplication } from "../controllers/application.js";
import { validateJobId } from "../validators/jobValidator.js";
import { validate } from "../middlewares/validate.js";

const application = Router();

// Apply authentication middleware to all routes
application.use(authCheck);

// User application routes
application.post('/', validateApplicationCreation, validate, createApplication);
application.get('/', validateApplicationQuery, validate, getUserApplications);
application.get('/stats', getApplicationStats);
application.get('/:id', validateApplicationId, validate, getApplicationById);
application.put('/:id', validateApplicationUpdate, validate, updateApplication);
application.delete('/:id', validateApplicationId, validate, deleteApplication);

// Job applications (for companies)
application.get('/job/:jobId', validateJobId, validate, getJobApplications);

export default application;