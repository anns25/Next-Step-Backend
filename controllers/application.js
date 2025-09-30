import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Create a new job application
export const createApplication = async (req, res) => {
    try {
        const {
            jobId,
            coverLetter,
            resume,
            portfolio,
            linkedinProfile,
            expectedSalary,
            availability,
            notes,
            source,
            referralContact
        } = req.body;

        const userId = req.user._id; // Assuming user is authenticated

        // Check if job exists and is active
        const job = await Job.findOne({
            _id: jobId,
            isActive: true,
            is_deleted: false
        }).populate('company');

        if (!job) {
            return res.status(404).json({ message: 'Job not found or not active' });
        }

        // Check if user already applied for this job
        const existingApplication = await Application.findOne({
            user: userId,
            job: jobId
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        // Create new application
        const application = new Application({
            user: userId,
            job: jobId,
            company: job.company._id,
            coverLetter,
            resume,
            portfolio,
            linkedinProfile,
            expectedSalary,
            availability,
            notes,
            source,
            referralContact,
            applicationDate: new Date()
        });

        await application.save();

        // Increment job's application count
        await Job.findByIdAndUpdate(jobId, {
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

// Get user's applications
export const getUserApplications = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'applicationDate',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const applications = await Application.find(query)
            .populate('job', 'title description location jobType experienceLevel salary applicationDeadline')
            .populate('company', 'name logo industry location contact')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Application.countDocuments(query);

        // Get application statistics
        const stats = await Application.aggregate([
            { $match: { user: userId } },
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

// Get application by ID
export const getApplicationById = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user._id;

        const application = await Application.findOne({
            _id: applicationId,
            user: userId
        })
            .populate('user', 'firstName lastName email profilePicture')
            .populate('job', 'title description location jobType experienceLevel salary requirements benefits')
            .populate('company', 'name logo industry location contact description');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);

    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update application status (user can only withdraw)
export const updateApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user._id;
        const { status, notes } = req.body;

        const application = await Application.findOne({
            _id: applicationId,
            user: userId
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Users can only withdraw their applications
        if (status && status !== 'withdrawn') {
            return res.status(403).json({ 
                message: 'You can only withdraw your application. Contact the company for other status updates.' 
            });
        }

        // Update application
        if (status) application.status = status;
        if (notes) application.notes = notes;

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

// Delete application (withdraw)
export const deleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user._id;

        const application = await Application.findOne({
            _id: applicationId,
            user: userId
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Decrement job's application count
        await Job.findByIdAndUpdate(application.job, {
            $inc: { applicationCount: -1 }
        });

        await Application.findByIdAndDelete(applicationId);

        res.json({ message: 'Application withdrawn successfully' });

    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get application statistics for user
export const getApplicationStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const stats = await Application.aggregate([
            { $match: { user: userId } },
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

        // Get recent applications (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentApplications = await Application.countDocuments({
            user: userId,
            applicationDate: { $gte: thirtyDaysAgo }
        });

        // Get average response time
        const responseTimeStats = await Application.aggregate([
            { 
                $match: { 
                    user: userId,
                    status: { $in: ['under-review', 'shortlisted', 'interview-scheduled', 'rejected', 'accepted'] }
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

// Get applications for a specific job (for company view)
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

        // Build query
        const query = { job: jobId };
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