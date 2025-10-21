import Application from '../models/Application.js';
import Job from '../models/Job.js';
import fs from 'fs';
import mongoose from 'mongoose';

// Helper function to check if user is admin
const isAdmin = (user) => {
    return user.role === 'admin' || user.isAdmin === true;
};

// Helper function to check if user owns the application or is admin
const canAccessApplication = (user, application) => {
    return application.user.toString() === user._id.toString() || isAdmin(user);
};

// Create a new job application
export const createApplication = async (req, res) => {
    try {
        const {
            jobId,
            job, // Handle both field names
            coverLetter,
            notes
        } = req.body;

        const userId = req.user._id;

        // Use jobId or job, whichever is provided
        const actualJobId = jobId || job;

        // Check if resume file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Resume file is required' });
        }

        // Get the file path
        const resumePath = req.file.path;

        // Check if job exists and is active
        const jobDoc = await Job.findOne({
            _id: actualJobId,
            isActive: true,
            is_deleted: false
        }).populate('company');

        if (!jobDoc) {
            return res.status(404).json({ message: 'Job not found or not active' });
        }

        // Check if user already applied for this job (excluding soft deleted applications)
        const existingApplication = await Application.findOne({
            user: userId,
            job: actualJobId,
            is_deleted: false
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        // Create new application
        const application = new Application({
            user: userId,
            job: actualJobId,
            company: jobDoc.company._id,
            coverLetter: coverLetter || '',
            resume: resumePath,
            notes: notes || '',
            is_deleted: false
        });

        await application.save();

        // Increment job's application count
        await Job.findByIdAndUpdate(actualJobId, {
            $inc: { applicationCount: 1 }
        });

        // Populate the application with related data
        const populatedApplication = await Application.findById(application._id)
            .populate('user', 'firstName lastName email profilePicture')
            .populate('job', 'title description location jobType experienceLevel')
            .populate('company', 'name logo industry location');

        res.status(201).json({
            message: 'Application submitted successfully',
            application: populatedApplication
        });

    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user's applications (users can only see their own, admins can see all)
export const getUserApplications = async (req, res) => {
    try {
        const userId = req.user._id;
        const isUserAdmin = isAdmin(req.user);
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'applicationDate',
            sortOrder = 'desc',
            targetUserId // Admin can specify which user's applications to get
        } = req.query;

        // If admin is requesting specific user's applications, fetch all the applications
        // Otherwise, use the requesting user's ID
        // Build query - exclude soft deleted applications
        let query = { is_deleted: false };

        // Admin can see all applications if no specific user is targeted
        if (isUserAdmin) {
            if (targetUserId) {
                query.user = targetUserId;
            }
        } else {
            query.user = userId;
        }

        if (status) {
            query.status = status;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const applications = await Application.find(query)
            .populate('user', 'firstName lastName email profilePicture')
            .populate('job', 'title description location jobType experienceLevel salary applicationDeadline')
            .populate('company', 'name logo industry location contact')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Application.countDocuments(query);

        // Get application statistics (excluding soft deleted)
        const stats = await Application.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusStats = {};
        stats.forEach(stat => {
            statusStats[stat._id] = stat.count;
        });

        res.json({
            applications,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
            stats: statusStats
        });

    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get application by ID (only owner or admin can access)
export const getApplicationById = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user._id;

        const application = await Application.findOne({
            _id: applicationId,
            is_deleted: false
        })
            .populate('user', 'firstName lastName email profilePicture')
            .populate('job', 'title description location jobType experienceLevel salary requirements benefits')
            .populate('company', 'name logo industry location contact description');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check if user can access this application
        if (!canAccessApplication(req.user, application)) {
            return res.status(403).json({
                message: 'You do not have permission to access this application'
            });
        }

        res.json(application);

    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update application (only owner or admin can update)
export const updateApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user._id;
        const { status, notes, coverLetter } = req.body;

        const application = await Application.findOne({
            _id: applicationId,
            is_deleted: false
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check if user can access this application
        if (!canAccessApplication(req.user, application)) {
            return res.status(403).json({
                message: 'You do not have permission to update this application'
            });
        }

        // Users can only withdraw their applications, admins can update any status
        if (status && status !== 'withdrawn' && !isAdmin(req.user)) {
            return res.status(403).json({
                message: 'You can only withdraw your application. Contact the company for other status updates.'
            });
        }

        // Update application
        if (status) application.status = status;
        if (notes !== undefined) application.notes = notes;
        if (coverLetter !== undefined) application.coverLetter = coverLetter;

        await application.save();

        res.json({
            message: 'Application updated successfully',
            application
        });

    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Soft delete application (only owner or admin can delete)
export const deleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user._id;

        const application = await Application.findOne({
            _id: applicationId,
            is_deleted: false
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check if user can access this application
        if (!canAccessApplication(req.user, application)) {
            return res.status(403).json({
                message: 'You do not have permission to delete this application'
            });
        }

        // Soft delete the application
        application.is_deleted = true;
        application.deletedAt = new Date();
        await application.save();

        // Decrement job's application count
        await Job.findByIdAndUpdate(application.job, {
            $inc: { applicationCount: -1 }
        });

        res.json({ message: 'Application withdrawn successfully' });

    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get application statistics for user (users see their own, admins can see any user's)
export const getApplicationStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const isUserAdmin = isAdmin(req.user);
        const { targetUserId } = req.query;

        let stats, recentApplications, responseTimeStats;

        if (isUserAdmin && !targetUserId) {
            // Admin requesting overall stats for all users
            stats = await Application.aggregate([
                { $match: { is_deleted: false } },
                {
                    $group: {
                        _id: null,
                        totalApplications: { $sum: 1 },
                        applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
                        underReview: { $sum: { $cond: [{ $eq: ['$status', 'under-review'] }, 1, 0] } },
                        shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
                        interviewScheduled: { $sum: { $cond: [{ $eq: ['$status', 'interview-scheduled'] }, 1, 0] } },
                        interviewed: { $sum: { $cond: [{ $eq: ['$status', 'interviewed'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
                        withdrawn: { $sum: { $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0] } }
                    }
                }
            ]);

            // Get recent applications for all users (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            recentApplications = await Application.countDocuments({
                applicationDate: { $gte: thirtyDaysAgo },
                is_deleted: false
            });

            // Get average response time for all users
            responseTimeStats = await Application.aggregate([
                {
                    $match: {
                        status: { $in: ['under-review', 'shortlisted', 'interview-scheduled', 'rejected', 'accepted'] },
                        is_deleted: false
                    }
                },
                {
                    $addFields: {
                        responseTime: {
                            $divide: [
                                { $subtract: ['$updatedAt', '$applicationDate'] },
                                1000 * 60 * 60 * 24 // Convert to days
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: '$responseTime' }
                    }
                }
            ]);

        } else {
            // Regular user or admin requesting specific user's stats
            const statsUserId = (isUserAdmin && targetUserId) ? targetUserId : userId;
            const queryUserId = new mongoose.Types.ObjectId(statsUserId);

            stats = await Application.aggregate([
                { $match: { user: queryUserId, is_deleted: false } },
                {
                    $group: {
                        _id: null,
                        totalApplications: { $sum: 1 },
                        applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
                        underReview: { $sum: { $cond: [{ $eq: ['$status', 'under-review'] }, 1, 0] } },
                        shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
                        interviewScheduled: { $sum: { $cond: [{ $eq: ['$status', 'interview-scheduled'] }, 1, 0] } },
                        interviewed: { $sum: { $cond: [{ $eq: ['$status', 'interviewed'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
                        withdrawn: { $sum: { $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0] } }
                    }
                }
            ]);

            // Get recent applications for specific user (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            recentApplications = await Application.countDocuments({
                user: statsUserId,
                applicationDate: { $gte: thirtyDaysAgo },
                is_deleted: false
            });

            // Get average response time for specific user
            responseTimeStats = await Application.aggregate([
                {
                    $match: {
                        user: statsUserId,
                        status: { $in: ['under-review', 'shortlisted', 'interview-scheduled', 'rejected', 'accepted'] },
                        is_deleted: false
                    }
                },
                {
                    $addFields: {
                        responseTime: {
                            $divide: [
                                { $subtract: ['$updatedAt', '$applicationDate'] },
                                1000 * 60 * 60 * 24 // Convert to days
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: '$responseTime' }
                    }
                }
            ]);
        }

        const result = {
            ...(stats[0] || {
                totalApplications: 0,
                applied: 0,
                underReview: 0,
                shortlisted: 0,
                interviewScheduled: 0,
                interviewed: 0,
                rejected: 0,
                accepted: 0,
                withdrawn: 0
            }),
            recentApplications,
            avgResponseTime: responseTimeStats[0]?.avgResponseTime || 0
        };

        res.json(result);

    } catch (error) {
        console.error('Error fetching application stats:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getApplicationCountsByCompany = async (req, res) => {
    try {
        const { companyIds } = req.body; // Array of company IDs

        if (!companyIds || !Array.isArray(companyIds)) {
            return res.status(400).json({ message: 'companyIds array is required' });
        }

        // Get application counts for each company
        const applicationCounts = await Application.aggregate([
            {
                $match: {
                    company: { $in: companyIds.map(id => new mongoose.Types.ObjectId(id)) },
                    is_deleted: false
                }
            },
            {
                $group: {
                    _id: '$company',
                    totalApplications: { $sum: 1 }
                }
            }
        ]);

        // Convert to object for easy lookup
        const countsMap = {};
        applicationCounts.forEach(item => {
            countsMap[item._id.toString()] = item.totalApplications;
        });

        res.json(countsMap);

    } catch (error) {
        console.error('Error fetching application counts by company:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get applications for a specific job (for company view, excluding soft deleted)
export const getJobApplications = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'applicationDate',
            sortOrder = 'desc'
        } = req.query;

        // Verify job exists and user has permission (you might want to add company ownership check)
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Build query - exclude soft deleted applications
        const query = {
            job: jobId,
            is_deleted: false
        };
        if (status) {
            query.status = status;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const applications = await Application.find(query)
            .populate('user', 'firstName lastName email profilePicture location skills experience')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Application.countDocuments(query);

        res.json({
            applications,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update application status (for companies and admins)
export const updateApplicationStatus = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status, notes } = req.body;

        const application = await Application.findOne({
            _id: applicationId,
            is_deleted: false
        })
            .populate('job')
            .populate('company');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check if user can update this application (company owner or admin)
        // You might want to add company ownership check here
        if (!isAdmin(req.user)) {
            // Add company ownership check if needed
            // if (application.company.toString() !== req.user.company.toString()) {
            //     return res.status(403).json({ message: 'You do not have permission to update this application' });
            // }
        }

        // Update application fields
        if (status) application.status = status;
        if (notes !== undefined) application.notes = notes;

        await application.save();

        res.json({
            message: 'Application status updated successfully',
            application
        });

    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: error.message });
    }
};

// Restore soft deleted application (admin only)
export const restoreApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;

        // Only admins can restore applications
        if (!isAdmin(req.user)) {
            return res.status(403).json({
                message: 'Only administrators can restore applications'
            });
        }

        const application = await Application.findOne({
            _id: applicationId,
            is_deleted: true
        });

        if (!application) {
            return res.status(404).json({ message: 'Deleted application not found' });
        }

        // Restore the application
        application.is_deleted = false;
        application.restoredAt = new Date();
        await application.save();

        // Increment job's application count
        await Job.findByIdAndUpdate(application.job, {
            $inc: { applicationCount: 1 }
        });

        res.json({
            message: 'Application restored successfully',
            application
        });

    } catch (error) {
        console.error('Error restoring application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Permanently delete application (admin only)
export const permanentDeleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;

        // Only admins can permanently delete applications
        if (!isAdmin(req.user)) {
            return res.status(403).json({
                message: 'Only administrators can permanently delete applications'
            });
        }

        const application = await Application.findOne({
            _id: applicationId,
            is_deleted: true
        });

        if (!application) {
            return res.status(404).json({ message: 'Deleted application not found' });
        }

        // Delete resume file if it exists
        if (application.resume && fs.existsSync(application.resume)) {
            try {
                fs.unlinkSync(application.resume);
            } catch (error) {
                console.error('Error deleting resume file:', error);
            }
        }

        // Permanently delete the application
        await Application.findByIdAndDelete(applicationId);

        res.json({ message: 'Application permanently deleted successfully' });

    } catch (error) {
        console.error('Error permanently deleting application:', error);
        res.status(500).json({ message: error.message });
    }
};