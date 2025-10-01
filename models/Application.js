import mongoose from "mongoose";

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
  notes: String,
  is_deleted: {
    type: Boolean,
    default: false
  },
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
applicationSchema.virtual('daysSinceApplication').get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.applicationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Update status method
applicationSchema.methods.updateStatus = function (newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

export default mongoose.model('Application', applicationSchema);