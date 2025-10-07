import { Router } from "express";
import { validateCreateJobAlert, validateUpdateJobAlert } from "../validators/jobAlertValidator.js";
import { validate } from "../middlewares/validate.js";
import { createJobAlert, deleteJobAlert, getJobAlertById, getMyJobAlerts, testJobAlert, toggleJobAlertStatus, updateJobAlert } from "../controllers/jobAlert.js";
import { authCheck } from "../middlewares/authCheck.js";





const jobAlert = Router();

// Apply authentication middleware to all routes
jobAlert.use(authCheck);

jobAlert.post('/', validateCreateJobAlert, validate, createJobAlert);
jobAlert.get('/', getMyJobAlerts);
jobAlert.get('/:id', getJobAlertById);

//test job alert (find matching jobs)
jobAlert.post(':id/test', testJobAlert);

//Update Job Alert
jobAlert.patch(':id/', validateUpdateJobAlert, validate, updateJobAlert);

//toggle job alert status
jobAlert.patch('/:id/toggle', toggleJobAlertStatus);

//delete job alert
jobAlert.delete('/:id', deleteJobAlert);

export default jobAlert;




