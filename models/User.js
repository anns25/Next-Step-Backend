import mongoose from "mongoose"
import bcrypt from "bcrypt"

// Base schema with common fields
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  profilePicture: {
    type: String,
    required: [true, 'Profile picture is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Common fields
  lastLogin: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
}, {
  timestamps: true,
  discriminatorKey: 'role' // This is key for handling different user types
});

// User-specific schema (for role: 'user')
const userSpecificSchema = new mongoose.Schema({
  workStatus: {
    type: String,
    enum: ['fresher', 'experienced'],
    default: 'fresher'
  },
  resumeHeadline: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date
  }],
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
  }],
  location: {
    city: String,
    state: String,
    country: String,
  },
  preferences: {
    jobTypes: [{
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote']
    }],
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    remoteWork: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    }
  }
});

// Index for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'location.city': 1, 'location.state': 1 });
userSchema.index({ skills: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  return user;
};

// Create the base User model
const User = mongoose.model("User", userSchema);

// Create discriminator models
const RegularUser = User.discriminator('user', userSpecificSchema);
const AdminUser = User.discriminator('admin', new mongoose.Schema({})); // Empty schema for admin

export default User;
export { RegularUser, AdminUser };

