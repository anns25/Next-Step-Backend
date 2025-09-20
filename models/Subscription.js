const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  jobTypes: [{
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary']
  }],
  experienceLevels: [{
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive']
  }],
  lastNotificationSent: Date,
  totalNotificationsSent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1, company: 1 }, { unique: true });
subscriptionSchema.index({ company: 1, isActive: 1 });
subscriptionSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);