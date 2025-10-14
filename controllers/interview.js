import Interview from '../models/Interview.js';
import Application from '../models/Application.js';

// @desc    Create a new interview
// @route   POST /interview
// @access  Private
export const createInterview = async (req, res) => {
  try {
    const {
      applicationId,
      userId,
      type,
      round,
      scheduledDate,
      duration,
      location,
      interviewers,
      preparation,
      nextSteps
    } = req.body;

    // Verify application exists and belongs to user
    const application = await Application.findOne({
      _id: applicationId,
      user: userId
    }).populate('job company');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Create interview
    const interview = new Interview({
      application: applicationId,
      user: userId,
      company: application.company._id,
      job: application.job._id,
      type,
      round: round || 1,
      scheduledDate: new Date(scheduledDate),
      duration: duration || 60,
      location,
      interviewers: interviewers || [],
      preparation: preparation || {},
      nextSteps,
      status: 'scheduled'
    });

    // Calculate reminder date (24 hours before interview)
    const reminderDate = new Date(scheduledDate);
    reminderDate.setHours(reminderDate.getHours() - 24);
    interview.reminderDate = reminderDate;

    await interview.save();

    // Update application status to interview-scheduled if not already
    if (application.status !== 'interview-scheduled' && application.status !== 'interviewed') {
      application.status = 'interview-scheduled';
      await application.save();
    }

    // Populate interview details
    await interview.populate([
      { path: 'job', select: 'title' },
      { path: 'company', select: 'name logo' },
      { path: 'application', select: 'status' }
    ]);

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user's interviews
// @route   GET /interview
// @access  Private
export const getMyInterviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      status,
      type,
      upcoming,
      past,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    const query = { user: userId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by upcoming/past
    const now = new Date();
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: now };
    } else if (past === 'true') {
      query.scheduledDate = { $lt: now };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const interviews = await Interview.find(query)
      .populate('job', 'title')
      .populate('company', 'name logo')
      .populate('application', 'status')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all interviews (Admin only)
// @route   GET /admin/interviews
// @access  Private (Admin)
export const getAllInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      upcoming,
      past,
      userId,
      companyId,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    // Filter by user (if specified)
    if (userId) {
      query.user = userId;
    }

    // Filter by company (if specified)
    if (companyId) {
      query.company = companyId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by upcoming/past
    const now = new Date();
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: now };
    } else if (past === 'true') {
      query.scheduledDate = { $lt: now };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const interviews = await Interview.find(query)
      .populate('job', 'title')
      .populate('company', 'name logo')
      .populate('application', 'status')
      .populate('user', 'firstName lastName email profilePicture')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching all interviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming interviews (next 7 days)
// @route   GET /interview/upcoming
// @access  Private
export const getUpcomingInterviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const interviews = await Interview.find({
      user: userId,
      scheduledDate: {
        $gte: now,
        $lte: sevenDaysFromNow
      },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('job', 'title')
      .populate('company', 'name logo')
      .populate('application', 'status')
      .sort({ scheduledDate: 1 });

    res.json({
      interviews,
      count: interviews.length
    });
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get interview by ID
// @route   GET /interview/:id
// @access  Private
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('job')
      .populate('company')
      .populate('application')
      .populate('user', 'firstName lastName email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update interview
// @route   PATCH /interview/:id
// @access  Private
export const updateInterview = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.user; // Prevent changing owner
    delete updates.application; // Prevent changing application

    // If scheduledDate is being updated, recalculate reminder date
    if (updates.scheduledDate) {
      const reminderDate = new Date(updates.scheduledDate);
      reminderDate.setHours(reminderDate.getHours() - 24);
      updates.reminderDate = reminderDate;
      updates.reminderSent = false; // Reset reminder flag
    }

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    )
      .populate('job', 'title')
      .populate('company', 'name logo')
      .populate('application', 'status');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({
      message: 'Interview updated successfully',
      interview
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule interview
// @route   PATCH /interview/:id/reschedule
// @access  Private (Admin only)
export const rescheduleInterview = async (req, res) => {
  try {

    const { scheduledDate, duration, location } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ message: 'New scheduled date is required' });
    }

    // Remove user restriction - admin can reschedule any interview
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Update interview details
    interview.scheduledDate = new Date(scheduledDate);
    if (duration) interview.duration = duration;
    if (location) interview.location = location;
    interview.status = 'rescheduled';
    interview.reminderSent = false;

    // Recalculate reminder date
    const reminderDate = new Date(scheduledDate);
    reminderDate.setHours(reminderDate.getHours() - 24);
    interview.reminderDate = reminderDate;

    await interview.save();
    await interview.populate([
      { path: 'job', select: 'title' },
      { path: 'company', select: 'name logo' },
      { path: 'application', select: 'status' },
      { path: 'user', select: 'firstName lastName email' }
    ]);

    res.json({
      message: 'Interview rescheduled successfully',
      interview
    });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    res.status(500).json({ message: error.message });
  }
};


// @desc    Confirm interview
// @route   PATCH /interview/:id/confirm
// @access  Private (Admin only)
export const confirmInterview = async (req, res) => {
  try {
    // Find interview without user restriction (admin can confirm any interview)
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'confirmed';
    await interview.save();
    await interview.populate([
      { path: 'job', select: 'title' },
      { path: 'company', select: 'name logo' },
      { path: 'user', select: 'firstName lastName email' } // Add user info for admin
    ]);

    res.json({
      message: 'Interview confirmed',
      interview
    });
  } catch (error) {
    console.error('Error confirming interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel interview
// @route   PATCH /interview/:id/cancel
// @access  Private
export const cancelInterview = async (req, res) => {
  try {
    const { reason } = req.body || {};
    // Find interview without user restriction (admin can confirm any interview)
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'cancelled';

    // Update application status to under-review when interview is deleted
    const application = await Application.findById(interview.application);
    if (application) {
      //Only update if the current status is interview related
      if (['interview-scheduled', 'interviewed'].includes(application.status)) {
        application.status = 'under-review';
        await application.save();
      }
    }
    if (reason) {
      interview.feedback = {
        ...interview.feedback,
        userNotes: reason
      };
    }

    await interview.save();
    await interview.populate([
      { path: 'job', select: 'title' },
      { path: 'company', select: 'name logo' }
    ]);

    res.json({
      message: 'Interview cancelled',
      interview
    });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete interview (add feedback)
// @route   PATCH /interview/:id/complete
// @access  Private
export const completeInterview = async (req, res) => {
  try {
    const { feedback, outcome, nextSteps } = req.body || {};

    // Find interview without user restriction (admin can confirm any interview)
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'completed';
    if (feedback) interview.feedback = { ...interview.feedback, ...feedback };
    if (outcome) interview.outcome = outcome;
    if (nextSteps) interview.nextSteps = nextSteps;

    await interview.save();

    // Update application status
    const application = await Application.findById(interview.application);
    if (application && application.status === 'interview-scheduled') {
      application.status = 'interviewed';
      await application.save();
    }

    await interview.populate([
      { path: 'job', select: 'title' },
      { path: 'company', select: 'name logo' },
      { path: 'application', select: 'status' }
    ]);

    res.json({
      message: 'Interview marked as completed',
      interview
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update interview preparation notes
// @route   PATCH /interview/:id/preparation
// @access  Private
export const updatePreparation = async (req, res) => {
  try {
    const { notes, questions, research, documents } = req.body || {};

    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.preparation = {
      ...interview.preparation,
      ...(notes && { notes }),
      ...(questions && { questions }),
      ...(research && { research }),
      ...(documents && { documents })
    };

    await interview.save();
    await interview.populate([
      { path: 'job', select: 'title' },
      { path: 'company', select: 'name logo' }
    ]);

    res.json({
      message: 'Preparation notes updated',
      interview
    });
  } catch (error) {
    console.error('Error updating preparation:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete interview
// @route   DELETE /interview/:id
// @access  Private
export const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    // Update application status to under-review when interview is deleted
    const application = await Application.findById(interview.application);
    if (application) {
      //Only update if the current status is interview related
      if (['interview-scheduled', 'interviewed'].includes(application.status)) {
        application.status = 'under-review';
        await application.save();
      }
    }
    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get interview statistics
// @route   GET /interview/stats
// @access  Private
export const getInterviewStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Total interviews
    const totalInterviews = await Interview.countDocuments({ user: userId });

    // Upcoming interviews
    const upcomingInterviews = await Interview.countDocuments({
      user: userId,
      scheduledDate: { $gte: now },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Completed interviews
    const completedInterviews = await Interview.countDocuments({
      user: userId,
      status: 'completed'
    });

    // Interviews by status
    const byStatus = await Interview.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Interviews by type
    const byType = await Interview.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Interviews by outcome
    const byOutcome = await Interview.aggregate([
      { $match: { user: userId, outcome: { $exists: true, $ne: null } } },
      { $group: { _id: '$outcome', count: { $sum: 1 } } }
    ]);

    // Average rating
    const avgRating = await Interview.aggregate([
      { $match: { user: userId, 'feedback.rating': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } }
    ]);

    res.json({
      totalInterviews,
      upcomingInterviews,
      completedInterviews,
      byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
      byType: Object.fromEntries(byType.map(t => [t._id, t.count])),
      byOutcome: Object.fromEntries(byOutcome.map(o => [o._id, o.count])),
      averageRating: avgRating[0]?.avgRating || 0
    });
  } catch (error) {
    console.error('Error fetching interview stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send interview reminders (called by cron job)
// @route   POST /interview/send-reminders
// @access  Private (Admin/System)
export const sendInterviewReminders = async (req, res) => {
  try {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find interviews that need reminders
    const interviews = await Interview.find({
      scheduledDate: {
        $gte: now,
        $lte: oneDayFromNow
      },
      status: { $in: ['scheduled', 'confirmed'] },
      reminderSent: false
    })
      .populate('user', 'firstName lastName email')
      .populate('job', 'title')
      .populate('company', 'name');

    let remindersSent = 0;

    for (const interview of interviews) {
      try {
        // Here you would integrate with your email service
        // await sendEmail({
        //   to: interview.user.email,
        //   subject: `Interview Reminder: ${interview.job.title} at ${interview.company.name}`,
        //   html: generateReminderEmail(interview)
        // });

        await interview.sendReminder();
        remindersSent++;
      } catch (error) {
        console.error(`Failed to send reminder for interview ${interview._id}:`, error);
      }
    }

    res.json({
      message: `Sent ${remindersSent} interview reminders`,
      count: remindersSent
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({ message: error.message });
  }
};