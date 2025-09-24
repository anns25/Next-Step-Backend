import Company from '../models/Company.js';
import User from '../models/User.js';

import Application from '../models/Application.js';
import Job from '../models/Job.js';

// ==================== COMPANY MANAGEMENT ====================

export const getAllCompaniesByAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 12, search, industry } = req.query;

    const query = { is_deleted: false };
    if (industry) query.industry = industry;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
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
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
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