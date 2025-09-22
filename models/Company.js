import mongoose from "mongoose";

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
    benefits: [String],
    culture: [String],
    foundedYear: Number,
    isRemoteFriendly: {
      type: Boolean,
      default: false,
    },
    // Company capabilities
    canPostJobs: { type: Boolean, default: true },
    maxJobs: { type: Number, default: 50 },
    // Company Stats
    totalJobs: {
      type: Number,
      default: 0,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    // Status and permissions
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    // Admin management
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    }
  },
  { timestamps: true }
);

companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ "location.city": 1, "location.country": 1 });
companySchema.index({ status: 1 });

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

const Company = mongoose.model("Company", companySchema);
export default Company;