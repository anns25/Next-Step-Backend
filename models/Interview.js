import mongoose from "mongoose"

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application is required']
  },
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
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  type: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'technical', 'panel', 'hr', 'final'],
    required: [true, 'Interview type is required']
  },
  round: {
    type: Number,
    default: 1
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  location: {
    type: {
      type: String,
      enum: ['office', 'remote', 'phone'],
      default: 'office'
    },
    address: String,
    meetingLink: String,
    phoneNumber: String
  },
  interviewers: [{
    name: String,
    email: String,
    title: String,
    linkedin: String
  }],
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  preparation: {
    notes: String,
    questions: [String],
    research: String,
    documents: [String]
  },
  feedback: {
    userNotes: String,
    interviewerFeedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    strengths: [String],
    areasForImprovement: [String]
  },
  outcome: {
    type: String,
    enum: ['pending', 'passed', 'failed', 'cancelled']
  },
  nextSteps: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: Date,
  followUpDate: Date
}, {
  timestamps: true
});

// Indexes
interviewSchema.index({ user: 1 });
interviewSchema.index({ application: 1 });
interviewSchema.index({ company: 1 });
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ status: 1 });

// Virtual for time until interview
interviewSchema.virtual('timeUntilInterview').get(function() {
  const now = new Date();
  const diffTime = this.scheduledDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
});

// Method to send reminder
interviewSchema.methods.sendReminder = function() {
  this.reminderSent = true;
  this.reminderDate = new Date();
  return this.save();
};

export default mongoose.model('Interview', interviewSchema);