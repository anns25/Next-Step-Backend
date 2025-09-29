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

        // Build aggregation pipeline
        const pipeline = [];

        // Stage 1: Match basic filters
        const matchStage = {
            $match: {
                is_deleted: false,
                isActive: isActive === 'true' || isActive === true
            }
        };

        // Add basic filters
        if (jobType) matchStage.$match.jobType = jobType;
        if (experienceLevel) matchStage.$match.experienceLevel = experienceLevel;
        if (locationType) matchStage.$match['location.type'] = locationType;

        pipeline.push(matchStage);

        // Stage 2: Lookup company information
        pipeline.push({
            $lookup: {
                from: 'companies', // Adjust collection name if different
                localField: 'company',
                foreignField: '_id',
                as: 'companyInfo'
            }
        });

        // Stage 3: Unwind company info
        pipeline.push({
            $unwind: {
                path: '$companyInfo',
                preserveNullAndEmptyArrays: false
            }
        });

        // Stage 4: Add computed fields
        pipeline.push({
            $addFields: {
                company: '$companyInfo'
            }
        });

        // Stage 5: Apply company name filter if provided
        if (company) {
            pipeline.push({
                $match: {
                    'company.name': { $regex: company, $options: 'i' }
                }
            });
        }

        // Stage 6: Apply search filter if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { tags: { $in: [new RegExp(search, 'i')] } }
                    ]
                }
            });
        }

        // Stage 7: Lookup createdBy information
        pipeline.push({
            $lookup: {
                from: 'users', // Adjust collection name if different
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdByInfo'
            }
        });

        pipeline.push({
            $addFields: {
                createdBy: {
                    $arrayElemAt: ['$createdByInfo', 0]
                }
            }
        });

        // Stage 8: Project final fields
        pipeline.push({
            $project: {
                companyInfo: 0,
                createdByInfo: 0
            }
        });

        // Stage 9: Sort
        pipeline.push({
            $sort: { createdAt: -1 }
        });

        // Execute aggregation with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const jobs = await Job.aggregate([
            ...pipeline,
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        // Get total count for pagination
        const totalPipeline = [...pipeline, { $count: 'total' }];
        const totalResult = await Job.aggregate(totalPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        res.json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Error in getAllJobs:', error);
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
