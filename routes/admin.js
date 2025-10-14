import { Router } from 'express';

import { authCheck } from '../middlewares/authCheck.js';
import { createCompany, createJob, deleteCompany, deleteJob, deleteUserByAdmin, getAllCompaniesByAdmin, getAllJobsByAdmin, getAllUsersByAdmin, getDashboardStats, getInterviewStatsAdmin, getUserApplicationsByAdmin, getUserByIdByAdmin, updateApplicationStatus, updateCompany, updateJob } from '../controllers/admin.js';
import { uploadImage } from '../middlewares/multer.js';
import { validateCompanyCreation, validateCompanyUpdate } from '../validators/companyValidator.js';
import { validate } from '../middlewares/validate.js';
import { validateJobCreation, validateJobUpdate } from '../validators/jobValidator.js';
import { completeInterviewValidator, createInterviewValidator, getInterviewsValidator, interviewIdValidator, rescheduleInterviewValidator, updateInterviewValidator, updatePreparationValidator } from '../validators/interviewValidator.js';
import { cancelInterview, completeInterview, confirmInterview, createInterview, deleteInterview, getAllInterviews, getInterviewById, rescheduleInterview, sendInterviewReminders, updateInterview, updatePreparation } from '../controllers/interview.js';

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
admin.post('/companies', uploadImage.single('logo'), validateCompanyCreation, validate, createCompany);
admin.patch('/companies/:id', uploadImage.single('logo'), validateCompanyUpdate, validate, updateCompany);
admin.delete('/companies/:id', deleteCompany);

//Job Management routes
admin.get('/jobs', getAllJobsByAdmin);
admin.post('/companies/:companyId/jobs', validateJobCreation, validate, createJob);
admin.patch('/jobs/:id', validateJobUpdate, validate, updateJob);
admin.delete('/jobs/:id', deleteJob);

//User Management routes

admin.get('/users', getAllUsersByAdmin);
admin.get('/users/:id', getUserByIdByAdmin);
admin.delete('/users/:id', deleteUserByAdmin);

//Application management routes
// admin.get('/applications', getAllApplications);
admin.patch('/applications/:applicationId/status', updateApplicationStatus);
admin.get('/users/:userId/applications', getUserApplicationsByAdmin);

//Dashboard routes
admin.get('/dashboard/stats', getDashboardStats);

// ADMIN INTERVIEW CRUD ROUTES
admin.post('/interview', createInterviewValidator, validate, createInterview);
admin.get('/interviews', getInterviewsValidator, validate, getAllInterviews);
admin.get('/interview/stats', getInterviewStatsAdmin);
admin.get('/interview/:id', interviewIdValidator, validate, getInterviewById);
admin.patch('/interview/:id', updateInterviewValidator, validate, updateInterview);
admin.delete('/interview/:id', interviewIdValidator, validate, deleteInterview);

// Interview actions
admin.patch('/interview/:id/reschedule', rescheduleInterviewValidator, validate, rescheduleInterview);
admin.patch('/interview/:id/confirm', interviewIdValidator, validate, confirmInterview);
admin.patch('/interview/:id/cancel', interviewIdValidator, validate, cancelInterview);
admin.patch('/interview/:id/complete', completeInterviewValidator, validate, completeInterview);
admin.patch('/interview/:id/preparation', updatePreparationValidator, validate, updatePreparation);

// SEND REMINDERS
admin.post('/interview/send-reminders', sendInterviewReminders);

export default admin;