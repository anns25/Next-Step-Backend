import transporter from '../config/emailConfig.js';
import { loadTemplate } from '../config/emailTemplates.js';
import Subscription from '../models/Subscription.js';
import JobAlert from '../models/JobAlert.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5001';
const FROM_EMAIL = process.env.FROM_EMAIL || '"NextStep Job Tracker" <noreply@nextstep.com>';

// Send company subscription notification
export const sendCompanyJobNotification = async (user, job, company, subscriptionId) => {
    try {
        const template = loadTemplate('company-job-alert');
        const html = template({
            username: user.firstName,
            companyName: company.name,
            jobTitle: job.title,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            salary: job.salary,
            description: job.description,
            jobUrl: `${FRONTEND_URL}/jobs/${job._id}`,
            settingsUrl: `${FRONTEND_URL}/settings/subscriptions`,
            unsubscribeUrl: `${FRONTEND_URL}/subscriptions/${subscriptionId}/unsubscribe`
        });

        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: `New Job at ${company.name}: ${job.title}`,
            html: html,
            text: `New Job at ${company.name}\n\n${job.title}\n\nLocation: ${job.location.type}\nJob Type: ${job.jobType}\n\nView details: ${FRONTEND_URL}/jobs/${job._id}`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Company job notification sent to ${user.email}:`, info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending company job notification:', error);
        return { success: false, error: error.message };
    }
};

// Send custom job alert notification
export const sendCustomJobAlertNotification = async (user, job, company, alert) => {
    try {
        const template = loadTemplate('custom-job-alert');
        const html = template({
            username: user.firstName,
            alertName: alert.name,
            jobTitle: job.title,
            companyName: company.name,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            salary: job.salary,
            description: job.description,
            jobUrl: `${FRONTEND_URL}/jobs/${job._id}`,
            settingsUrl: `${FRONTEND_URL}/settings/job-alerts`,
            editAlertUrl: `${FRONTEND_URL}/job-alerts/${alert._id}/edit`
        });

        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: `Job Alert: ${job.title} at ${company.name}`,
            html: html,
            text: `Job Alert Match!\n\nAlert: ${alert.name}\n${job.title} at ${company.name}\n\nView details: ${FRONTEND_URL}/jobs/${job._id}`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Custom job alert sent to ${user.email}:`, info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending custom job alert:', error);
        return { success: false, error: error.message };
    }
};

// Send batch job alerts (daily/weekly/monthly)
export const sendBatchJobAlerts = async (user, jobs, alert, frequency) => {
    try {
        const template = loadTemplate('batch-job-alert');
        const html = template({
            username: user.firstName,
            frequency: frequency,
            jobCount: jobs.length,
            jobs: jobs,
            alertName: alert.name,
            currentDate: new Date(),
            frontendUrl: FRONTEND_URL,
            settingsUrl: `${FRONTEND_URL}/settings/job-alerts`,
            editAlertUrl: `${FRONTEND_URL}/job-alerts/${alert._id}/edit`
        });

        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: `Your ${frequency} job digest: ${jobs.length} new match${jobs.length > 1 ? 'es' : ''}`,
            html: html,
            text: `Your ${frequency} Job Digest\n\n${jobs.length} new jobs matching "${alert.name}"\n\nView all: ${FRONTEND_URL}/job-alerts/${alert._id}`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Batch job alert sent to ${user.email}:`, info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending batch job alert:', error);
        return { success: false, error: error.message };
    }
};

// Notify all subscribers of a company about a new job
export const notifySubscribers = async (job, company) => {
    try {
        console.log(`Checking subscriptions for company: ${company.name}`);

        const subscriptions = await Subscription.find({
            company: company._id,
            isActive: true
        }).populate('user');

        if (subscriptions.length === 0) {
            console.log('No active subscriptions found');
            return { notified: 0, errors: 0 };
        }

        let notified = 0;
        let errors = 0;

        for (const subscription of subscriptions) {
            try {
                // Check if subscription filters match the job
                if (subscription.jobTypes.length > 0 && !subscription.jobTypes.includes(job.jobType)) {
                    continue;
                }
                if (subscription.experienceLevels.length > 0 && !subscription.experienceLevels.includes(job.experienceLevel)) {
                    continue;
                }

                // Send notification based on preferences
                if (subscription.notificationPreferences.email) {
                    const result = await sendCompanyJobNotification(
                        subscription.user,
                        job,
                        company,
                        subscription._id
                    );

                    if (result.success) {
                        notified++;
                        subscription.lastNotificationSent = new Date();
                        subscription.totalNotificationsSent += 1;
                        await subscription.save();
                    } else {
                        errors++;
                    }
                }

                // Add delay to avoid overwhelming email server
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error notifying user ${subscription.user.email}:`, error.message);
                errors++;
            }
        }

        console.log(`Subscription notifications: ${notified} sent, ${errors} errors`);
        return { notified, errors };

    } catch (error) {
        console.error('Error in notifySubscribers:', error);
        throw error;
    }
};

// Check job against all active job alerts (immediate notifications)
export const checkJobAlerts = async (job, company) => {
    try {
        console.log(`Checking job alerts for job: ${job.title}`);

        const jobAlerts = await JobAlert.find({
            isActive: true,
            notificationFrequency: 'immediate'
        }).populate('user');

        if (jobAlerts.length === 0) {
            console.log('No active immediate job alerts found');
            return { notified: 0, errors: 0 };
        }

        let notified = 0;
        let errors = 0;

        for (const alert of jobAlerts) {
            try {
                // Check if job matches alert criteria
                if (!alert.matchesJob(job)) {
                    continue;
                }

                // Send notification based on preferences
                if (alert.notificationPreferences.email) {
                    const result = await sendCustomJobAlertNotification(
                        alert.user,
                        job,
                        company,
                        alert
                    );

                    if (result.success) {
                        notified++;
                        alert.totalMatches += 1;
                        alert.lastNotificationSent = new Date();
                        alert.lastChecked = new Date();
                        await alert.save();
                    } else {
                        errors++;
                    }
                }

                // Add delay to avoid overwhelming email server
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error processing alert for user ${alert.user.email}:`, error.message);
                errors++;
            }
        }

        console.log(`Job alert notifications: ${notified} sent, ${errors} errors`);
        return { notified, errors };

    } catch (error) {
        console.error('Error in checkJobAlerts:', error);
        throw error;
    }
};