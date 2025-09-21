import mongoose from "mongoose";

const jobAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  name: {
    type: String,
    required: [true, 'Alert name is required'],
    trim: true,
    maxLength: [100, 'Alert name cannot exceed 100 characters']
  },
  keywords: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    type: {
      type: String,
      enum: ['remote', 'on-site', 'hybrid', 'any'],
      default: 'any'
    },
    city: String,
    state: String,
    country: String,
    radius: { type: Number, default: 50 } // in miles/km
  },
  jobTypes: [{
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary']
  }],
  experienceLevels: [{
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive']
  }],
  salaryRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  industries: [String],
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  excludeCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notificationFrequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  lastChecked: Date,
  totalMatches: {
    type: Number,
    default: 0
  },
  lastNotificationSent: Date
}, {
  timestamps: true
});

// Indexes
jobAlertSchema.index({ user: 1 });
jobAlertSchema.index({ isActive: 1 });
jobAlertSchema.index({ keywords: 1 });
jobAlertSchema.index({ skills: 1 });
jobAlertSchema.index({ lastChecked: 1 });

// Method to check if job matches alert criteria
jobAlertSchema.methods.matchesJob = function(job) {
  // Check keywords
  if (this.keywords.length > 0) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const hasKeyword = this.keywords.some(keyword => 
      jobText.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) return false;
  }

  // Check skills
  if (this.skills.length > 0) {
    const hasSkill = this.skills.some(skill => 
      job.requirements.skills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    if (!hasSkill) return false;
  }

  // Check location
  if (this.location.type !== 'any') {
    if (job.location.type !== this.location.type) return false;
  }

  // Check job type
  if (this.jobTypes.length > 0) {
    if (!this.jobTypes.includes(job.jobType)) return false;
  }

  // Check experience level
  if (this.experienceLevels.length > 0) {
    if (!this.experienceLevels.includes(job.experienceLevel)) return false;
  }

  // Check salary range
  if (this.salaryRange.min || this.salaryRange.max) {
    if (job.salary.min && this.salaryRange.max && job.salary.min > this.salaryRange.max) return false;
    if (job.salary.max && this.salaryRange.min && job.salary.max < this.salaryRange.min) return false;
  }

  // Check industries
  if (this.industries.length > 0) {
    // This would need to be implemented based on how industries are stored
  }

  // Check companies
  if (this.companies.length > 0) {
    if (!this.companies.includes(job.company)) return false;
  }

  // Check exclude companies
  if (this.excludeCompanies.length > 0) {
    if (this.excludeCompanies.includes(job.company)) return false;
  }

  return true;
};

export default mongoose.model('JobAlert', jobAlertSchema);