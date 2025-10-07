import Subscription from '../models/Subscription.js';
import Company from '../models/Company.js';

// @desc    Subscribe to a company
// @route   POST /subscription
// @access  Private
export const createSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      companyId, 
      jobTypes, 
      experienceLevels, 
      notificationPreferences 
    } = req.body;

    // Check if company exists
    const company = await Company.findOne({ _id: companyId, is_deleted: false, status: 'active' });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
      user: userId,
      company: companyId
    });

    if (existingSubscription) {
      return res.status(409).json({ 
        message: 'You are already subscribed to this company',
        subscription: existingSubscription
      });
    }

    // Create new subscription
    const subscription = new Subscription({
      user: userId,
      company: companyId,
      jobTypes: jobTypes || [],
      experienceLevels: experienceLevels || [],
      notificationPreferences: notificationPreferences || {
        email: true,
        push: true,
        sms: false
      }
    });

    await subscription.save();
    await subscription.populate('company', 'name logo industry location');

    res.status(201).json({
      message: 'Successfully subscribed to company',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user subscriptions
// @route   GET /subscription
// @access  Private
export const getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, isActive } = req.query;

    const query = { user: userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subscriptions = await Subscription.find(query)
      .populate('company', 'name logo industry location website')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(query);

    res.json({
      subscriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subscription by ID
// @route   GET /subscription/:id
// @access  Private
export const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('company', 'name logo industry location website');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update subscription preferences
// @route   PATCH /subscription/:id
// @access  Private
export const updateSubscription = async (req, res) => {
  try {
    const { 
      jobTypes, 
      experienceLevels, 
      notificationPreferences, 
      isActive 
    } = req.body;

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update fields if provided
    if (jobTypes !== undefined) subscription.jobTypes = jobTypes;
    if (experienceLevels !== undefined) subscription.experienceLevels = experienceLevels;
    if (notificationPreferences !== undefined) {
      subscription.notificationPreferences = {
        ...subscription.notificationPreferences,
        ...notificationPreferences
      };
    }
    if (isActive !== undefined) subscription.isActive = isActive;

    await subscription.save();
    await subscription.populate('company', 'name logo industry location website');

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Unsubscribe from a company
// @route   DELETE /subscription/:id
// @access  Private
export const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({ message: 'Successfully unsubscribed from company' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if user is subscribed to a company
// @route   GET /subscription/check/:companyId
// @access  Private
export const checkSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      company: req.params.companyId
    });

    res.json({
      isSubscribed: !!subscription,
      subscription: subscription || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle subscription active status
// @route   PATCH /subscription/:id/toggle
// @access  Private
export const toggleSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.isActive = !subscription.isActive;
    await subscription.save();
    await subscription.populate('company', 'name logo industry location website');

    res.json({
      message: `Subscription ${subscription.isActive ? 'activated' : 'deactivated'}`,
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};