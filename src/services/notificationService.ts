// Unified Notification Service
// Centralizes all email operations for consistent messaging

interface EmailTemplate {
  subject: string;
  html: string;
}

interface WelcomeEmailData {
  email: string;
  businessName: string;
  subscriptionTier: string;
  billingCycle: string;
}

interface TrialReminderData {
  email: string;
  businessName: string;
  daysLeft: number;
  expiresAt: Date;
}

interface ConsultationReminderData {
  email: string;
  businessName: string;
  scheduledDate?: string;
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userData: WelcomeEmailData): Promise<boolean> {
  try {
    console.log('notificationService: Sending welcome email to:', userData.email);
    
    const template = createWelcomeEmailTemplate(userData);
    
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userData.email,
        subject: template.subject,
        html: template.html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('notificationService: Welcome email failed:', errorText);
      return false;
    }

    console.log('notificationService: Welcome email sent successfully');
    return true;
  } catch (error) {
    console.error('notificationService: Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send trial expiration reminder
 */
export async function sendTrialReminder(reminderData: TrialReminderData): Promise<boolean> {
  try {
    console.log('notificationService: Sending trial reminder to:', reminderData.email);
    
    const template = createTrialReminderTemplate(reminderData);
    
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: reminderData.email,
        subject: template.subject,
        html: template.html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('notificationService: Trial reminder failed:', errorText);
      return false;
    }

    console.log('notificationService: Trial reminder sent successfully');
    return true;
  } catch (error) {
    console.error('notificationService: Error sending trial reminder:', error);
    return false;
  }
}

/**
 * Send consultation reminder
 */
export async function sendConsultationReminder(reminderData: ConsultationReminderData): Promise<boolean> {
  try {
    console.log('notificationService: Sending consultation reminder to:', reminderData.email);
    
    const template = createConsultationReminderTemplate(reminderData);
    
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: reminderData.email,
        subject: template.subject,
        html: template.html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('notificationService: Consultation reminder failed:', errorText);
      return false;
    }

    console.log('notificationService: Consultation reminder sent successfully');
    return true;
  } catch (error) {
    console.error('notificationService: Error sending consultation reminder:', error);
    return false;
  }
}

/**
 * Create welcome email template
 */
function createWelcomeEmailTemplate(userData: WelcomeEmailData): EmailTemplate {
  return {
    subject: `Welcome to GR Balance, ${userData.businessName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to GR Balance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to GR Balance!</h1>
            <p>Your payment reconciliation solution</p>
          </div>
          
          <div class="content">
            <h2>Hi ${userData.businessName},</h2>
            
            <p>Welcome to GR Balance! We're excited to help you streamline your payment reconciliation process.</p>
            
            <p><strong>Your Account Details:</strong></p>
            <ul>
              <li>Business: ${userData.businessName}</li>
              <li>Plan: ${userData.subscriptionTier.charAt(0).toUpperCase() + userData.subscriptionTier.slice(1)} (${userData.billingCycle})</li>
              <li>Email: ${userData.email}</li>
            </ul>
            
            <p>You can now access your dashboard and start reconciling your payment data.</p>
            
            <p style="text-align: center;">
              <a href="https://grbalance.netlify.app/login" class="button">Access Your Dashboard</a>
            </p>
            
            <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The GR Balance Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 GR Balance. All rights reserved.</p>
            <p>You received this email because you signed up for GR Balance.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

/**
 * Create trial reminder template
 */
function createTrialReminderTemplate(reminderData: TrialReminderData): EmailTemplate {
  const urgencyColor = reminderData.daysLeft <= 1 ? '#ef4444' : '#f59e0b';
  const urgencyText = reminderData.daysLeft <= 1 ? 'expires today' : `expires in ${reminderData.daysLeft} days`;
  
  return {
    subject: `Your GR Balance trial ${urgencyText}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Trial Expiration Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .urgent { background: ${urgencyColor}; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trial Expiration Notice</h1>
            <p>Your GR Balance trial ${urgencyText}</p>
          </div>
          
          <div class="content">
            <h2>Hi ${reminderData.businessName},</h2>
            
            <div class="urgent">
              <strong>⏰ Your trial expires on ${reminderData.expiresAt.toLocaleDateString()}</strong>
            </div>
            
            <p>We hope you've been enjoying GR Balance for your payment reconciliation needs!</p>
            
            <p>To continue using our service without interruption, please upgrade to a paid plan before your trial expires.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Choose a plan that fits your business needs</li>
              <li>Seamless transition - no data loss</li>
              <li>Continue reconciling your payment data</li>
              <li>Access to premium features and support</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="https://grbalance.netlify.app/billing" class="button">Upgrade Now</a>
            </p>
            
            <p>Questions? We're here to help! Reply to this email or contact our support team.</p>
            
            <p>Best regards,<br>Davis from GR Balance</p>
          </div>
          
          <div class="footer">
            <p>© 2024 GR Balance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

/**
 * Create consultation reminder template
 */
function createConsultationReminderTemplate(reminderData: ConsultationReminderData): EmailTemplate {
  return {
    subject: `Consultation Reminder - GR Balance Setup`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Consultation Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Consultation Reminder</h1>
            <p>Your GR Balance setup consultation</p>
          </div>
          
          <div class="content">
            <h2>Hi ${reminderData.businessName},</h2>
            
            <p>This is a friendly reminder about your upcoming consultation with our GR Balance team.</p>
            
            ${reminderData.scheduledDate ? `<p><strong>Scheduled for:</strong> ${reminderData.scheduledDate}</p>` : ''}
            
            <p><strong>What we'll cover:</strong></p>
            <ul>
              <li>GR Balance setup and configuration</li>
              <li>Payment reconciliation best practices</li>
              <li>Custom workflow recommendations</li>
              <li>Q&A session for your specific needs</li>
            </ul>
            
            <p><strong>To prepare:</strong></p>
            <ul>
              <li>Have your recent payment reports ready</li>
              <li>List any specific reconciliation challenges</li>
              <li>Think about your current workflow</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="https://calendly.com/grbalance/consultation" class="button">Reschedule if Needed</a>
            </p>
            
            <p>We're looking forward to helping you streamline your payment reconciliation process!</p>
            
            <p>Best regards,<br>Davis from GR Balance</p>
          </div>
          
          <div class="footer">
            <p>© 2024 GR Balance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

/**
 * Send admin notification (internal use)
 */
export async function sendAdminNotification(subject: string, message: string): Promise<boolean> {
  try {
    const template = {
      subject: `[GR Balance Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #374151;">${subject}</h2>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
            ${message}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Generated by GR Balance System<br>
            ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };
    
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'davisricart@gmail.com',
        subject: template.subject,
        html: template.html
      })
    });

    return response.ok;
  } catch (error) {
    console.error('notificationService: Error sending admin notification:', error);
    return false;
  }
}