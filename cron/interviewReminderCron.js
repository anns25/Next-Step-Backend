import cron from 'node-cron';
import { checkAndSendReminders } from '../services/interviewNotificationService.js';

// Run every hour to check for interviews that need reminders
export const startInterviewReminderCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running interview reminder check...');
    try {
      const count = await checkAndSendReminders();
      console.log(`Interview reminder check complete. Sent ${count} reminders.`);
    } catch (error) {
      console.error('Error in interview reminder cron:', error);
    }
  });

  console.log('Interview reminder cron job started');
};