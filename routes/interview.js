import { Router } from 'express';
import {
  getMyInterviews,
  getUpcomingInterviews,
  getInterviewById,
  getInterviewStats,
} from '../controllers/interview.js';
import {
  getInterviewsValidator,
  interviewIdValidator
} from '../validators/interviewValidator.js';
import { authCheck } from '../middlewares/authCheck.js';
import { validate } from '../middlewares/validate.js';

const interview = Router();

// All routes are protected
interview.use(authCheck);

// Interview CRUD
interview.get('/', getInterviewsValidator, validate, getMyInterviews);
interview.get('/upcoming', getUpcomingInterviews);
interview.get('/stats', getInterviewStats);
interview.get('/:id', interviewIdValidator, validate, getInterviewById);

export default interview;