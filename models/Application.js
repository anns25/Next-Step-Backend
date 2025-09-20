const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  status: {
    type: String,
    enum: ['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'rejected', 'accepted', 'withdrawn'],
    default: 'applied'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  resume: {
    type: String,
    required: [true, 'Resume is required']
  },
  coverLetter: {
    type: String,
    default: ''
  },
  portfolio: String,
  linkedinProfile: String,
  expectedSalary: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' }
  },
  availability: Date,
  notes: String,
  source: {
    type: String,
    enum: ['website', 'linkedin', 'indeed', 'glassdoor', 'referral', 'other'],
    default: 'website'
  },
  referralContact: {
    name: String,
    email: String,
    relationship: String
  },
  interviewScheduled: {
    type: Boolean,
    default: false
  },
  interviewDate: Date,
  interviewType: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'technical', 'panel']
  },
  feedback: String,
  rejectionReason: String,
  followUpDate: Date,
  documents: [{
    name: String,
    url: String,
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
applicationSchema.index({ user: 1 });
applicationSchema.index({ job: 1 });
applicationSchema.index({ company: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationDate: -1 });
applicationSchema.index({ user: 1, job: 1 }, { unique: true }); // Prevent duplicate applications

// Virtual for days since application
applicationSchema.virtual('daysSinceApplication').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.applicationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Update status method
applicationSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);