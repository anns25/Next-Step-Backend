import Company from '../models/Company.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

// Get all companies with approval status
export const getAllCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query)
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve company
export const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { maxJobs = 10 } = req.body;
    const adminId = req.user._id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.status = 'approved';
    company.approvedBy = adminId;
    company.approvedAt = new Date();
    company.canPostJobs = true;
    company.maxJobs = maxJobs;

    await company.save();

    // TODO: Send approval email to company
    // await sendCompanyApprovalEmail(company.contact.email, company.name);

    res.json({ 
      message: 'Company approved successfully',
      company: company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject company
export const rejectCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.status = 'rejected';
    company.approvedBy = adminId;
    company.rejectionReason = reason;

    await company.save();

    // TODO: Send rejection email to company
    // await sendCompanyRejectionEmail(company.contact.email, company.name, reason);

    res.json({ 
      message: 'Company rejected successfully',
      company: company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suspend company
export const suspendCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.status = 'suspended';
    company.canPostJobs = false;
    company.rejectionReason = reason;

    await company.save();

    res.json({ 
      message: 'Company suspended successfully',
      company: company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      totalJobs,
      totalUsers,
      totalApplications
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'pending' }),
      Company.countDocuments({ status: 'approved' }),
      Job.countDocuments(),
      User.countDocuments(),
      Application.countDocuments()
    ]);

    res.json({
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      totalJobs,
      totalUsers,
      totalApplications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};