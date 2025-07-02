// Welcome Email Service for GR Balance Client Activation
import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || (() => {
  throw new Error('VITE_RESEND_API_KEY environment variable is required');
})());

export interface WelcomeEmailData {
  clientEmail: string;
  businessName?: string;
  subscriptionTier: string;
  usageLimit: number;
  clientPortalUrl: string;
}

export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<boolean> => {
  try {
    console.log('📧 Sending welcome email to:', data.clientEmail);
    
    // Get usage limit based on subscription tier
    const getUsageLimit = (tier: string) => {
      switch (tier.toLowerCase()) {
        case 'professional': return 100;
        case 'business': return 200;
        case 'starter':
        default: return 50;
      }
    };
    
    const usageLimit = getUsageLimit(data.subscriptionTier);
    
    // Create minimalistic HTML email template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GR Balance!</title>
        <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #374151; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px; 
            }
            .header { 
              border-left: 4px solid #10b981; 
              padding-left: 15px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #10b981;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #6b7280;
            }
            .content {
              background: #ffffff;
              padding: 0 15px;
            }
            .welcome-message {
              font-size: 16px;
              color: #111827;
              margin-bottom: 30px;
            }
            .details {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .details-row {
              display: flex;
              margin: 10px 0;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .details-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .details-label {
              flex: 1;
              color: #6b7280;
              font-weight: 500;
            }
            .details-value {
              flex: 2;
              color: #111827;
            }
            .section {
              margin: 30px 0;
            }
            .section h2 {
              color: #10b981;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to GR Balance</h1>
                <p>Your account is now active</p>
            </div>
            
            <div class="content">
                <div class="welcome-message">
                    Great news! Your GR Balance account is now ready to streamline your reconciliation process.
                </div>
                
                <div class="details">
                    <div class="details-row">
                        <div class="details-label">Email</div>
                        <div class="details-value">${data.clientEmail}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Plan</div>
                        <div class="details-value">${data.subscriptionTier} Plan</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Monthly Usage</div>
                        <div class="details-value">${usageLimit} reconciliations</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Getting Started</h2>
                    <ol>
                        <li>Upload your data files (Excel/CSV)</li>
                        <li>Run reconciliation analysis</li>
                        <li>Get instant insights and reports</li>
                    </ol>
                    
                    <a href="${data.clientPortalUrl}" class="button">Access Your Portal</a>
                </div>
                
                <div class="section">
                    <h2>Trial Benefits</h2>
                    <ul>
                        <li>14-day free trial with full access</li>
                        <li>No credit card required</li>
                        <li>Cancel anytime during trial</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h2>Need Help?</h2>
                    <p>Email us at davis@grbalance.com or visit our <a href="${data.clientPortalUrl}/docs" style="color: #10b981; text-decoration: none;">documentation</a>.</p>
                </div>
                
                <div class="footer">
                    GR Balance - Automated Reconciliation Made Simple
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Send email using Resend API
    const response = await resend.emails.send({
      from: 'GR Balance Team <davis@grbalance.com>',
      to: data.clientEmail,
      subject: 'Welcome to GR Balance - Your Account is Active',
      html: htmlContent,
    });
    
    console.log('✅ Welcome email sent successfully:', response);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};

// Simplified welcome email function for quick activation
export const sendSimpleWelcomeEmail = async (clientEmail: string, businessName: string, tier: string): Promise<boolean> => {
  try {
    console.log('📧 Sending simple welcome email to:', clientEmail);
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #374151; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px; 
            }
            .header { 
              border-left: 4px solid #10b981; 
              padding-left: 15px;
              margin-bottom: 30px;
            }
            .header h2 {
              margin: 0;
              color: #10b981;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              background: #ffffff;
              padding: 0 15px;
            }
            .welcome-text {
              margin: 20px 0;
              font-size: 16px;
            }
            .features {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .features ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .features li {
              margin: 10px 0;
              padding-left: 24px;
              position: relative;
            }
            .features li:before {
              content: "✓";
              color: #10b981;
              position: absolute;
              left: 0;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Welcome to GR Balance</h2>
            </div>
            
            <div class="content">
                <div class="welcome-text">
                    Hi ${businessName},<br>
                    Your GR Balance account is now active and ready to use.
                </div>
                
                <div class="features">
                    <ul>
                        <li>Plan: ${tier} Plan</li>
                        <li>14-day free trial included</li>
                        <li>Full access to all features</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://grbalance.com/client-portal" class="button">Get Started Now</a>
                </div>
                
                <p>Need help? Email us at davis@grbalance.com</p>
            </div>
            
            <div class="footer">
                GR Balance - Automated Reconciliation Made Simple
            </div>
        </div>
    </body>
    </html>
    `;
    
    const response = await resend.emails.send({
      from: 'GR Balance Team <davis@grbalance.com>',
      to: clientEmail,
      subject: 'Welcome to GR Balance - Account Activated',
      html: htmlContent,
    });
    
    console.log('✅ Simple welcome email sent successfully:', response);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send simple welcome email:', error);
    return false;
  }
}; 