import { Router } from 'express';

import { authCheck } from '../middlewares/authCheck.js';
import { createCompany, createJob, deleteCompany, deleteJob, getAllCompaniesByAdmin, getDashboardStats, updateCompany, updateJob} from '../controllers/admin.js';
import upload from '../middlewares/multer.js';
import { validateCompanyCreation, validateCompanyUpdate } from '../validators/companyValidator.js';
import { validate } from '../middlewares/validate.js';
import { validateJobCreation, validateJobUpdate } from '../validators/jobValidator.js';

const admin = Router();

// All admin routes require authentication
admin.use(authCheck);

// Check if user is admin
admin.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
});

//Company Management routes
admin.get('/companies', getAllCompaniesByAdmin);
admin.post('/companies',upload.single('logo'), validateCompanyCreation, validate, createCompany);
admin.patch('/companies/:id', upload.single('logo'), validateCompanyUpdate, validate, updateCompany);
admin.delete('/companies/:id', deleteCompany);

//Job Management routes
admin.post('/companies/:companyId/jobs', validateJobCreation, validate, createJob);
admin.patch('/jobs/:id', validateJobUpdate, validate, updateJob);
admin.delete('/jobs/:id', deleteJob);

//Application management routes
// admin.get('/applications', getAllApplications);
// admin.patch('/applications/:applicationId/status', updateApplicationStatus);

//Dashboard routes
admin.get('/dashboard/stats', getDashboardStats);

export default admin;