import cron from 'node-cron';
import JobAlert from '../models/JobAlert.js';
import Job from '../models/Job.js';
import { sendBatchJobAlerts } from './notificationService.js';

class JobAlertScheduler {
    constructor() {
        this.isRunning = false;
        this.jobs = {};
    }

    // Start all scheduled jobs
    start() {
        if (this.isRunning) {
            console.log('Job alert scheduler is already running');
            return;
        }

        // Daily alerts at 9:00 AM
        this.jobs.daily = cron.schedule('0 9 * * *', async () => {
            console.log('Running daily job alerts...');
            await this.processBatchAlerts('daily');
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Weekly alerts every Monday at 9:00 AM
        this.jobs.weekly = cron.schedule('0 9 * * 1', async () => {
            console.log('Running weekly job alerts...');
            await this.processBatchAlerts('weekly');
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Monthly alerts on 1st of month at 9:00 AM
        this.jobs.monthly = cron.schedule('0 9 1 * *', async () => {
            console.log('Running monthly job alerts...');
            await this.processBatchAlerts('monthly');
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        this.isRunning = true;
        console.log('Job alert scheduler started successfully');
    }

    // Stop all scheduled jobs
    stop() {
        if (this.jobs.daily) this.jobs.daily.stop();
        if (this.jobs.weekly) this.jobs.weekly.stop();
        if (this.jobs.monthly) this.jobs.monthly.stop();
        
        this.isRunning = false;
        console.log('Job alert scheduler stopped');
    }

    // Process batch alerts for a specific frequency
    async processBatchAlerts(frequency) {
        try {
            console.log(`Processing ${frequency} job alerts...`);

            const jobAlerts = await JobAlert.find({
                isActive: true,
                notificationFrequency: frequency
            }).populate('user');

            const results = {
                processed: 0,
                sent: 0,
                errors: 0
            };

            // Determine time range
            const since = new Date();
            if (frequency === 'daily') {
                since.setDate(since.getDate() - 1);
            } else if (frequency === 'weekly') {
                since.setDate(since.getDate() - 7);
            } else if (frequency === 'monthly') {
                since.setMonth(since.getMonth() - 1);
            }

            for (const alert of jobAlerts) {
                try {
                    results.processed++;

                    // Find jobs created since last check
                    const newJobs = await Job.find({
                        isActive: true,
                        is_deleted: false,
                        createdAt: { $gte: since }
                    }).populate('company', 'name logo industry');

                    // Filter matching jobs
                    const matchingJobs = newJobs.filter(job => alert.matchesJob(job));

                    if (matchingJobs.length === 0) {
                        continue;
                    }

                    // Send batch notification
                    if (alert.notificationPreferences.email) {
                        const result = await sendBatchJobAlerts(
                            alert.user,
                            matchingJobs,
                            alert,
                            frequency
                        );

                        if (result.success) {
                            results.sent++;
                            alert.totalMatches += matchingJobs.length;
                            alert.lastNotificationSent = new Date();
                        } else {
                            results.errors++;
                        }
                    }

                    alert.lastChecked = new Date();
                    await alert.save();

                    // Add delay to avoid overwhelming email server
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    console.error(`Error processing alert ${alert._id}:`, error.message);
                    results.errors++;
                }
            }

            console.log(`${frequency} alerts complete:`, results);
            return results;

        } catch (error) {
            console.error(`Error in processBatchAlerts(${frequency}):`, error);
            throw error;
        }
    }

    // Manual trigger for testing
    async triggerManualAlert(frequency) {
        console.log(`Manually triggering ${frequency} alerts...`);
        return await this.processBatchAlerts(frequency);
    }

    // Get scheduler status
    getStatus() {
        return {
            isRunning: this.isRunning,
            schedules: {
                daily: '0 9 * * * (Every day at 9:00 AM)',
                weekly: '0 9 * * 1 (Every Monday at 9:00 AM)',
                monthly: '0 9 1 * * (1st of every month at 9:00 AM)'
            },
            timezone: 'UTC'
        };
    }
}

export default new JobAlertScheduler();