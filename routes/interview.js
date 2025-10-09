import { Router } from 'express';
import {
  createInterview,
  getMyInterviews,
  getUpcomingInterviews,
  getInterviewById,
  updateInterview,
  rescheduleInterview,
  confirmInterview,
  cancelInterview,
  completeInterview,
  updatePreparation,
  deleteInterview,
  getInterviewStats,
  sendInterviewReminders
} from '../controllers/interview.js';
import {
  createInterviewValidator,
  updateInterviewValidator,
  rescheduleInterviewValidator,
  completeInterviewValidator,
  updatePreparationValidator,
  getInterviewsValidator,
  interviewIdValidator
} from '../validators/interviewValidator.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const interview = Router();

// All routes are protected
interview.use(protect);

// Interview CRUD
interview.post('/', createInterviewValidator, validate, createInterview);
interview.get('/', getInterviewsValidator, validate, getMyInterviews);
interview.get('/upcoming', getUpcomingInterviews);
interview.get('/stats', getInterviewStats);
interview.get('/:id', interviewIdValidator, validate, getInterviewById);
interview.patch('/:id', updateInterviewValidator, validate, updateInterview);
interview.delete('/:id', interviewIdValidator, validate, deleteInterview);

// Interview actions
interview.patch('/:id/reschedule', rescheduleInterviewValidator, validate, rescheduleInterview);
interview.patch('/:id/confirm', interviewIdValidator, validate, confirmInterview);
interview.patch('/:id/cancel', interviewIdValidator, validate, cancelInterview);
interview.patch('/:id/complete', completeInterviewValidator, validate, completeInterview);
interview.patch('/:id/preparation', updatePreparationValidator, validate, updatePreparation);

// System/Admin route for sending reminders
interview.post('/send-reminders', sendInterviewReminders);

export default interview;