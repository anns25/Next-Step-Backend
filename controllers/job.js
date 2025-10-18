import Job from '../models/Job.js';

// Get all jobs with pagination and filters
export const getAllJobs = async (req, res) => {
    try {
        console.log('🔍 PRODUCTION - Backend received query params:', req.query);
        console.log('📍 PRODUCTION - Location filters:', {
            latitude: req.query.latitude,
            longitude: req.query.longitude,
            radius: req.query.radius,
            remoteOnly: req.query.remoteOnly
        });

        const {
            page = 1,
            limit = 10,
            search,
            company,
            jobType,
            experienceLevel,
            locationType,
            city,
            state,
            country,
            isActive = true,
            latitude,
            longitude,
            radius,
            remoteOnly = false
        } = req.query;

        console.log('🎯 PRODUCTION - Parsed location values:', { latitude, longitude, radius, remoteOnly });

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

        // Remote-only filter
        if (remoteOnly === 'true' || remoteOnly === true) {
            matchStage.$match['location.type'] = 'remote';
        } else if (locationType) {
            matchStage.$match['location.type'] = locationType;
        }

        // Location filters
        if (city && !remoteOnly) {
            matchStage.$match['location.city'] = { $regex: city, $options: 'i' };
        }
        if (state && !remoteOnly) {
            matchStage.$match['location.state'] = { $regex: state, $options: 'i' };
        }
        if (country && !remoteOnly) {
            matchStage.$match['location.country'] = { $regex: country, $options: 'i' };
        }

        pipeline.push(matchStage);

        // Add this debug log before radius filtering
        if (latitude && longitude && radius && !remoteOnly) {
            console.log('🌍 PRODUCTION - Adding radius-based filtering...');
            console.log('📏 PRODUCTION - Radius in meters:', parseFloat(radius) * 1000);

            // ... your existing radius filtering code ...

            console.log('✅ PRODUCTION - Radius filtering added to pipeline');
        } else {
            console.log('❌ PRODUCTION - No radius filtering applied:', {
                hasLatitude: !!latitude,
                hasLongitude: !!longitude,
                hasRadius: !!radius,
                remoteOnly: remoteOnly
            });
        }

        // Radius based filtering stage

        if (latitude && longitude && radius && !remoteOnly) {
            const radiusInMeters = parseFloat(radius) * 1000;
            pipeline.push({
                $addFields: {
                    distance: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ['$location.coordinates.latitude', null] },
                                    { $ne: ['$location.coordinates.longitude', null] }
                                ]
                            },
                            then: {
                                $multiply: [
                                    6371000, // Earth radius in meters
                                    {
                                        $acos: {
                                            $add: [
                                                {
                                                    $multiply: [
                                                        { $sin: { $degreesToRadians: parseFloat(latitude) } },
                                                        { $sin: { $degreesToRadians: '$location.coordinates.latitude' } }
                                                    ]
                                                },
                                                {
                                                    $multiply: [
                                                        { $cos: { $degreesToRadians: parseFloat(latitude) } },
                                                        { $cos: { $degreesToRadians: '$location.coordinates.latitude' } },
                                                        {
                                                            $cos: {
                                                                $subtract: [
                                                                    { $degreesToRadians: '$location.coordinates.longitude' },
                                                                    { $degreesToRadians: parseFloat(longitude) }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            else: null
                        }
                    }
                }
            });

            pipeline.push({
                $match: {
                    distance: { $lte: radiusInMeters }
                }
            });
        }

        // Stage 2: Lookup company information
        pipeline.push({
            $lookup: {
                from: 'companies',
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

        // Sort by distance if radius search, otherwise by date
        if (latitude && longitude && radius && !remoteOnly) {
            pipeline.push({ $sort: { distance: 1, createdAt: -1 } });
        } else {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

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
        console.log('📊 PRODUCTION - Final jobs count:', jobs.length);
        console.log('📊 PRODUCTION - Total jobs:', total);
    } catch (error) {
        console.error('Error in getAllJobs:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get unique locations for autocomplete
export const getLocationSuggestions = async (req, res) => {
    try {
        const { type, query } = req.query; // type: 'city', 'state', 'country'

        if (!type || !['city', 'state', 'country'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type parameter' });
        }

        const field = `location.${type}`;
        const matchQuery = query ? { $regex: query, $options: 'i' } : { $exists: true, $ne: '' };

        const locations = await Job.aggregate([
            {
                $match: {
                    is_deleted: false,
                    isActive: true,
                    'location.type': { $ne: 'remote' },
                    [field]: matchQuery
                }
            },
            {
                $group: {
                    _id: `$${field}`,
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1, _id: 1 }
            },
            {
                $limit: 20
            },
            {
                $project: {
                    _id: 0,
                    value: '$_id',
                    label: '$_id',
                    count: 1
                }
            }
        ]);

        res.json(locations);
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
