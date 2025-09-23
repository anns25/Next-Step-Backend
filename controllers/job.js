import Job from '../models/Job.js';

// Get all jobs with pagination and filters
export const getAllJobs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            company,
            jobType,
            experienceLevel,
            locationType,
            isActive = true
        } = req.query;

        const query = { is_deleted: false, isActive: true };

        if (company) query.company = company;
        if (jobType) query.jobType = jobType;
        if (experienceLevel) query.experienceLevel = experienceLevel;
        if (locationType) query['location.type'] = locationType;

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const jobs = await Job.find(query)
            .populate('company', 'name logo industry location')
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Job.countDocuments(query);

        res.json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get job by ID
export const getJobById = async (req, res) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            is_deleted: false,
            isActive: true
        })
            .populate('company', 'name logo industry location contact')
            .populate('createdBy', 'firstName lastName email');

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Increment view count
        await job.incrementViewCount();

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get jobs by company
export const getJobsByCompany = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive = true } = req.query;

        const query = {
            company: req.params.companyId,
            isActive: true,
            is_deleted: false
        };

        const jobs = await Job.find(query)
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);



        const total = await Job.countDocuments(query);

        res.json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
