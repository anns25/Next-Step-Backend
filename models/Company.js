import mongoose from "mongoose";
import bcrypt from "bcrypt";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxLength: [100, "Company name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Company description is required"],
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
    },
    logo: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      required: [true, "Industry is required"],
      trim: true,
    },
    location: {
      address: String,
      city: { type: String, required: [true, "City is required"] },
      state: String,
      country: { type: String, required: [true, "Country is required"] },
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    contact: {
      email: {
        type: String,
        required: [true, "Contact email is required"],
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      phone: String,
      linkedin: String,
      twitter: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // hide password by default
    },
    benefits: [String],
    culture: [String],
    foundedYear: Number,
    isRemoteFriendly: {
      type: Boolean,
      default: false,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ "location.city": 1, "location.country": 1 });

companySchema.virtual("fullAddress").get(function () {
  const parts = [
    this.location.address,
    this.location.city,
    this.location.state,
    this.location.country,
    this.location.zipCode,
  ].filter(Boolean);
  return parts.join(", ");
});

// Hash password before saving
companySchema.pre('save', async function (next) {
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
companySchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Company = mongoose.model("Company", companySchema);
export default Company;
