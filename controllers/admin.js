import Company from '../models/Company.js';
import User from '../models/User.js';

import Application from '../models/Application.js';
import Job from '../models/Job.js';

// Add this function at the end of your admin.js file, before the closing

// ==================== USER MANAGEMENT ====================

// Delete user by admin (soft delete)
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'You cannot delete your own account'
      });
    }

    // Find and soft delete the user
    const user = await User.findOneAndUpdate(
      { _id: id, is_deleted: false },
      {
        is_deleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found or already deleted' });
    }

    // Optional: Also soft delete related data
    // You might want to deactivate user's applications, etc.
    await Application.updateMany(
      { user: id },
      { status: 'withdrawn' }
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all users by admin (for user management page)
export const getAllUsersByAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      role,
      emailVerified
    } = req.query;

    const query = { is_deleted: false, role: { $ne: 'admin' } };

    if (role) query.role = role;
    if (emailVerified !== undefined) query.emailVerified = emailVerified === 'true';

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken') // Exclude sensitive fields
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID by admin
export const getUserByIdByAdmin = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, is_deleted: false })
      .select('-password -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== COMPANY MANAGEMENT ====================

export const getAllCompaniesByAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 12, search, industry } = req.query;

    const query = { is_deleted: false };
    if (industry) query.industry = industry;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const companyData = {
      ...req.body,
      createdBy: req.user._id
    };

    // If logo is uploaded
    if (req.file) {
      companyData.logo = req.file.filename;
    }

    const company = new Company(companyData);
    await company.save();

    res.status(201).json({
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Update company
export const updateCompany = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };

    // If logo is uploaded
    if (req.file) {
      updateData.logo = req.file.filename;
    }

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete company (soft delete)
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      {
        is_deleted: true,
        lastUpdatedBy: req.user._id
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Also deactivate all jobs for this company
    await Job.updateMany(
      { company: req.params.id },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: "Company deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== JOB MANAGEMENT ====================

// Admin: Get All Jobs (active + inactive)
export const getAllJobsByAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      company,
      jobType,
      experienceLevel,
      locationType,
      isActive // <-- optional, only filter if passed
    } = req.query;

    const pipeline = [];

    // Stage 1: Match basic filters
    const matchStage = {
      $match: {
        is_deleted: false
      }
    };

    // Apply isActive filter only if query param is given
    if (isActive !== undefined) {
      matchStage.$match.isActive = isActive === 'true' || isActive === true;
    }

    if (jobType) matchStage.$match.jobType = jobType;
    if (experienceLevel) matchStage.$match.experienceLevel = experienceLevel;
    if (locationType) matchStage.$match['location.type'] = locationType;

    pipeline.push(matchStage);

    // Stage 2: Lookup company
    pipeline.push({
      $lookup: {
        from: 'companies',
        localField: 'company',
        foreignField: '_id',
        as: 'companyInfo'
      }
    });

    // Stage 3: Unwind company
    pipeline.push({
      $unwind: {
        path: '$companyInfo',
        preserveNullAndEmptyArrays: false
      }
    });

    // Stage 4: Replace company field
    pipeline.push({
      $addFields: {
        company: '$companyInfo'
      }
    });

    // Stage 5: Filter by company name
    if (company) {
      pipeline.push({
        $match: {
          'company.name': { $regex: company, $options: 'i' }
        }
      });
    }

    // Stage 6: Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      });
    }

    // Stage 7: Lookup createdBy
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdByInfo'
      }
    });

    pipeline.push({
      $addFields: {
        createdBy: { $arrayElemAt: ['$createdByInfo', 0] }
      }
    });

    // Stage 8: Cleanup
    pipeline.push({
      $project: {
        companyInfo: 0,
        createdByInfo: 0
      }
    });

    // Stage 9: Sort
    pipeline.push({ $sort: { createdAt: -1 } });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await Job.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Job.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error in getAllJobsAdmin:', error);
    res.status(500).json({ message: error.message });
  }
};


// Create a new job for a company
export const createJob = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company exists and is active
    const company = await Company.findOne({
      _id: companyId,
      is_deleted: false,
      status: 'active'
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found or inactive' });
    }

    const jobData = {
      ...req.body,
      company: companyId,
      createdBy: req.user._id
    };

    const job = new Job(jobData);
    await job.save();
    await job.populate('company', 'name logo industry location');

    // Trigger notifications asynchronously
    Promise.all([
      notifySubscribers(job, companyExists),
      checkJobAlerts(job, companyExists)
    ]).then(([subscriptionResult, alertResult]) => {
      console.log('Notifications sent:', {
        subscriptions: subscriptionResult,
        alerts: alertResult
      });
    }).catch(error => {
      console.error('Notification error:', error);
    });

    // Update company's total jobs count
    await Company.findByIdAndUpdate(companyId, {
      $inc: { totalJobs: 1 }
    });

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete job (soft delete)
export const deleteJob = async (req, res) => {
  try {

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      { isActive: false, is_deleted: true },
      { new: true }
    );

    await Company.findByIdAndUpdate(job.company, {
      $dec: { totalJobs: 1 }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Update company's total jobs count
    await Company.findByIdAndUpdate(job.company, {
      $inc: { totalJobs: -1 }
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== APPLICATION MANAGEMENT ====================

// Get all applications with filters
export const getAllApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      company,
      job,
      user
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (company) query.company = company;
    if (job) query.job = job;
    if (user) query.user = user;

    const applications = await Application.find(query)
      .populate('user', 'firstName lastName email profilePicture')
      .populate('job', 'title company')
      .populate('company', 'name logo')
      .sort({ applicationDate: -1 })
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
    res.status(500).json({ message: error.message });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    console.log("id", applicationId);

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status, notes },
      { new: true }
    )
      .populate('user', 'firstName lastName email')
      .populate('job', 'title company')
      .populate('company', 'name logo');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== DASHBOARD STATS ====================

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalJobs,
      activeJobs,
      totalUsers,
      totalApplications,
      recentApplications
    ] = await Promise.all([
      Company.countDocuments({ is_deleted: false }),
      Company.countDocuments({ is_deleted: false, status: 'active' }),
      Job.countDocuments({ is_deleted: false }),
      Job.countDocuments({ is_deleted: false, isActive: true }),
      User.countDocuments({ is_deleted: false }),
      Application.countDocuments(),
      Application.countDocuments({
        applicationDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    res.json({
      totalCompanies,
      activeCompanies,
      totalJobs,
      activeJobs,
      totalUsers,
      totalApplications,
      recentApplications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};