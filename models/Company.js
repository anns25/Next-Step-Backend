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
      trim : true
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
      address: {
        type :String,
        trim : true
      },
      city: { type: String, required: [true, "City is required"],  trim : true},
      state: {
        type :String,
        trim : true
      },
      country: { type: String, required: [true, "Country is required"],  trim : true},
      zipCode: {
        type : String,
        trim : true
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    contact: {
      email: {
        type: String,
        required: [true, "Contact email is required"],
         trim : true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      phone: {
        type : String,
        trim : true
      },
      linkedin: {
        type : String,
        trim : true
      },
      twitter: {
        type : String,
        trim : true
      },
    },
    benefits: [String],
    culture: [String],
    foundedYear: {
        type : Number,
        trim : true
      },
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
      default: 'active',
      trim : true
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