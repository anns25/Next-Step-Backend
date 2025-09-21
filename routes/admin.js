import { Router } from 'express';

import { authCheck } from '../middlewares/authCheck.js';
import { approveCompany, getAllCompanies, getDashboardStats, rejectCompany, suspendCompany } from '../controllers/admin.js';

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

// Dashboard stats
admin.get('/dashboard/stats', getDashboardStats);

// Company management
admin.get('/companies', getAllCompanies);
admin.patch('/companies/:companyId/approve', approveCompany);
admin.patch('/companies/:companyId/reject', rejectCompany);
admin.patch('/companies/:companyId/suspend', suspendCompany);

export default admin;