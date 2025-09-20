import Company from "../models/Company.js";
import jwt from "jsonwebtoken";

// Company Signup
export const registerCompany = async (req, res) => {
  try {
    const SECRET_KEY = process.env.SECRET_KEY;
    const { name, description, industry, contact, password, website, location } = req.body;


    // Check if logo uploaded
    let logo = "";
    if (req.file) {
      logo = req.file.filename; // multer saves filename
    }
    
    // Check if company already exists (by contact email)
    const existingCompany = await Company.findOne({ "contact.email": contact.email });
    if (existingCompany) {
      return res.status(409).json({ message: "Company already exists" });
    }

    // Create new company
    const newCompany = new Company({
      name,
      description,
      industry,
      website,
      logo,
      contact,
      password,
      location // will be hashed by pre("save")
    });

    await newCompany.save();

    // Generate JWT
    const token = jwt.sign(
      {
        _id: newCompany._id,
        name: newCompany.name,
        email: newCompany.contact.email,
        industry: newCompany.industry,
        logo: newCompany.logo,
        country: newCompany.location.country,
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      data: token,
      company: newCompany,
      message: "New company profile created",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Company Login
export const loginCompany = async (req, res) => {
  try {
    const SECRET_KEY = process.env.SECRET_KEY;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find company by email
    const company = await Company.findOne({ "contact.email": email, "is_deleted": false }).select("+password");
    if (!company || !(await company.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Update last login timestamp
    company.lastLogin = new Date();
    await company.save();

    // Generate token
    const token = jwt.sign(
      {
        _id: company._id,
        name: company.name,
        email: company.contact.email,
        industry: company.industry,
        logo: company.logo,
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      data: token,
      company,
      message: "Company login successful",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
