// Unified Notification Service
// Centralizes all email and notification operations

import { UnifiedUser } from './userDataService';

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface NotificationOptions {
  to: string;
  template: EmailTemplate;
  data?: Record<string, any>;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user: UnifiedUser): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        subject: 'Welcome to GR Balance - Your Account is Being Reviewed',
        template: 'welcome',
        data: {
          businessName: user.business_name,
          subscriptionTier: user.subscription_tier
        }
      })
    });

    if (!response.ok) {
      console.error('notificationService: Welcome email failed:', await response.text());
      return false;
    }

    console.log('notificationService: Welcome email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('notificationService: Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send trial reminder email
 */
export async function sendTrialReminder(user: UnifiedUser, daysLeft: number): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        subject: `Your GR Balance trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        template: 'trial-reminder',
        data: {
          businessName: user.business_name,
          daysLeft,
          clientPath: user.client_path
        }
      })
    });

    if (!response.ok) {
      console.error('notificationService: Trial reminder failed:', await response.text());
      return false;
    }

    console.log('notificationService: Trial reminder sent to:', user.email);
    return true;
  } catch (error) {
    console.error('notificationService: Error sending trial reminder:', error);
    return false;
  }
}

/**
 * Send consultation reminder email
 */
export async function sendConsultationReminder(user: UnifiedUser): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        subject: 'Complete Your GR Balance Setup - Book Your Consultation',
        template: 'consultation-reminder',
        data: {
          businessName: user.business_name
        }
      })
    });

    if (!response.ok) {
      console.error('notificationService: Consultation reminder failed:', await response.text());
      return false;
    }

    console.log('notificationService: Consultation reminder sent to:', user.email);
    return true;
  } catch (error) {
    console.error('notificationService: Error sending consultation reminder:', error);
    return false;
  }
}

/**
 * Send approval notification email
 */
export async function sendApprovalNotification(user: UnifiedUser): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        subject: 'Your GR Balance Account is Now Active!',
        template: 'approval',
        data: {
          businessName: user.business_name,
          clientPath: user.client_path,
          loginUrl: `https://grbalance.com/${user.client_path}`
        }
      })
    });

    if (!response.ok) {
      console.error('notificationService: Approval email failed:', await response.text());
      return false;
    }

    console.log('notificationService: Approval email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('notificationService: Error sending approval email:', error);
    return false;
  }
}

/**
 * Send custom email notification
 */
export async function sendCustomEmail(options: NotificationOptions): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.template.subject,
        html: options.template.html,
        data: options.data
      })
    });

    if (!response.ok) {
      console.error('notificationService: Custom email failed:', await response.text());
      return false;
    }

    console.log('notificationService: Custom email sent to:', options.to);
    return true;
  } catch (error) {
    console.error('notificationService: Error sending custom email:', error);
    return false;
  }
}