import Interview from '../models/Interview.js';
import nodemailer from 'nodemailer';

// Create email transporter (configure with your email service)
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate reminder email HTML
const generateReminderEmail = (interview) => {
  const date = new Date(interview.scheduledDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let locationInfo = '';
  if (interview.location.type === 'remote' && interview.location.meetingLink) {
    locationInfo = `<p><strong>Meeting Link:</strong> <a href="${interview.location.meetingLink}">${interview.location.meetingLink}</a></p>`;
  } else if (interview.location.type === 'office' && interview.location.address) {
    locationInfo = `<p><strong>Address:</strong> ${interview.location.address}</p>`;
  } else if (interview.location.type === 'phone' && interview.location.phoneNumber) {
    locationInfo = `<p><strong>Phone:</strong> ${interview.location.phoneNumber}</p>`;
  }

  let interviewersInfo = '';
  if (interview.interviewers && interview.interviewers.length > 0) {
    interviewersInfo = `
      <p><strong>Interviewers:</strong></p>
      <ul>
        ${interview.interviewers.map(i => `
          <li>${i.name}${i.title ? ` - ${i.title}` : ''}</li>
        `).join('')}
      </ul>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${interview.user.firstName}!</h2>
            <p>This is a friendly reminder about your upcoming interview:</p>
            
            <h3>${interview.job.title}</h3>
            <p><strong>Company:</strong> ${interview.company.name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${interview.duration} minutes</p>
            <p><strong>Type:</strong> ${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}</p>
            ${locationInfo}
            ${interviewersInfo}
            
            ${interview.preparation.notes ? `
              <h4>Your Preparation Notes:</h4>
              <p>${interview.preparation.notes}</p>
            ` : ''}
            
            <a href="${process.env.FRONTEND_URL}/user/interviews/${interview._id}" class="button">
              View Interview Details
            </a>
          </div>
          <div class="footer">
            <p>Good luck with your interview! 🎉</p>
            <p>Job Application Tracker</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Send interview reminder
export const sendInterviewReminder = async (interview) => {
  try {
    const mailOptions = {
      from: `"Job Application Tracker" <${process.env.SMTP_FROM}>`,
      to: interview.user.email,
      subject: `Interview Reminder: ${interview.job.title} at ${interview.company.name}`,
      html: generateReminderEmail(interview)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder sent for interview ${interview._id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send reminder for interview ${interview._id}:`, error);
    return false;
  }
};

// Check and send reminders for upcoming interviews
export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find interviews that need reminders (24 hours before)
    const interviews = await Interview.find({
      scheduledDate: {
        $gte: now,
        $lte: tomorrow
      },
      status: { $in: ['scheduled', 'confirmed'] },
      reminderSent: false
    })
      .populate('user', 'firstName lastName email')
      .populate('job', 'title')
      .populate('company', 'name');

    let remindersSent = 0;

    for (const interview of interviews) {
      const success = await sendInterviewReminder(interview);
      if (success) {
        await interview.sendReminder();
        remindersSent++;
      }
    }

    console.log(`Sent ${remindersSent} interview reminders`);
    return remindersSent;
  } catch (error) {
    console.error('Error checking and sending reminders:', error);
    return 0;
  }
};

// Send reminder for a specific interview
export const sendSingleReminder = async (interviewId) => {
  try {
    const interview = await Interview.findById(interviewId)
      .populate('user', 'firstName lastName email')
      .populate('job', 'title')
      .populate('company', 'name');

    if (!interview) {
      throw new Error('Interview not found');
    }

    const success = await sendInterviewReminder(interview);
    if (success) {
      await interview.sendReminder();
    }

    return success;
  } catch (error) {
    console.error(`Error sending reminder for interview ${interviewId}:`, error);
    return false;
  }
};