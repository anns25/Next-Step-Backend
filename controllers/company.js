import Company from '../models/Company.js';

// Get all companies (public)
export const getAllCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 12, search, industry } = req.query;
    
    const query = { is_deleted: false, status: 'active' }; // Only show active companies publicly
    if (industry) query.industry = industry;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get company by ID (public)
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findOne({ 
      _id: req.params.id, 
      is_deleted: false,
      status: 'active'
    })
    .populate('createdBy', 'firstName lastName')
    .select('-contact.email -contact.phone -contact.linkedin -contact.twitter'); // Hide sensitive contact info

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get companies by industry (public)
export const getCompaniesByIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const companies = await Company.find({ 
      industry: { $regex: industry, $options: 'i' },
      is_deleted: false,
      status: 'active'
    })
    .populate('createdBy', 'firstName lastName')
    .select('-contact.email -contact.phone -contact.linkedin -contact.twitter')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Company.countDocuments({ 
      industry: { $regex: industry, $options: 'i' },
      is_deleted: false,
      status: 'active'
    });

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getCompanyStats = async (req, res) => {
  try {
    const company = await Company.findOne({ 
      _id: req.params.id, 
      is_deleted: false,
      status: 'active'
    }).select('name');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Count jobs linked to this company
    const totalJobs = await Job.countDocuments({
      companyId: company._id,
      is_deleted: false,
      isActive: true
    });

    // Example: count applications if you have an Application model
    const totalApplications = await Application.countDocuments({
      companyId: company._id
    });

    res.json({
      name: company.name,
      totalJobs,
      totalApplications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
