import JobAlert from '../models/JobAlert.js';
import Job from '../models/Job.js';

// @desc    Create a new job alert
// @route   POST /job-alert
// @access  Private
export const createJobAlert = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      keywords,
      skills,
      location,
      jobTypes,
      experienceLevels,
      salaryRange,
      industries,
      companies,
      excludeCompanies,
      notificationFrequency,
      notificationPreferences
    } = req.body;

    // Create new job alert
    const jobAlert = new JobAlert({
      user: userId,
      name,
      keywords: keywords || [],
      skills: skills || [],
      location: location || { type: 'any' },
      jobTypes: jobTypes || [],
      experienceLevels: experienceLevels || [],
      salaryRange: salaryRange || {},
      industries: industries || [],
      companies: companies || [],
      excludeCompanies: excludeCompanies || [],
      notificationFrequency: notificationFrequency || 'daily',
      notificationPreferences: notificationPreferences || {
        email: true,
        push: true,
        sms: false
      }
    });

    await jobAlert.save();
    await jobAlert.populate('companies excludeCompanies', 'name logo');

    res.status(201).json({
      message: 'Job alert created successfully',
      jobAlert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user's job alerts
// @route   GET /job-alert
// @access  Private
export const getMyJobAlerts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, isActive } = req.query;

    const query = { user: userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const jobAlerts = await JobAlert.find(query)
      .populate('companies excludeCompanies', 'name logo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobAlert.countDocuments(query);

    res.json({
      jobAlerts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get job alert by ID
// @route   GET /job-alert/:id
// @access  Private
export const getJobAlertById = async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('companies excludeCompanies', 'name logo industry');

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    res.json(jobAlert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update job alert
// @route   PATCH /job-alert/:id
// @access  Private
export const updateJobAlert = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.user; // Prevent changing the owner

    const jobAlert = await JobAlert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('companies excludeCompanies', 'name logo');

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    res.json({
      message: 'Job alert updated successfully',
      jobAlert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete job alert
// @route   DELETE /job-alert/:id
// @access  Private
export const deleteJobAlert = async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    res.json({ message: 'Job alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle job alert active status
// @route   PATCH /job-alert/:id/toggle
// @access  Private
export const toggleJobAlertStatus = async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    jobAlert.isActive = !jobAlert.isActive;
    await jobAlert.save();
    await jobAlert.populate('companies excludeCompanies', 'name logo');

    res.json({
      message: `Job alert ${jobAlert.isActive ? 'activated' : 'deactivated'}`,
      jobAlert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test job alert - find matching jobs
// @route   POST /job-alert/:id/test
// @access  Private
export const testJobAlert = async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    //Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10

    // Get recent jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = await Job.find({
      isActive: true,
      is_deleted: false,
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('company', 'name logo');

    // Filter jobs that match the alert criteria
    const matchingJobs = recentJobs.filter(job => jobAlert.matchesJob(job));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = matchingJobs.slice(startIndex, endIndex);

    res.json({
      message: 'Test completed successfully',
      totalRecentJobs: recentJobs.length,
      matchingJobs: matchingJobs.length,
      jobs: paginatedJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(matchingJobs.length / limit),
        limit: limit,
        total: matchingJobs.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};