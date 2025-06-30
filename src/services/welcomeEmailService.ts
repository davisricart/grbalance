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
    
    // Create beautiful HTML email template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GR Balance!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .section { margin: 25px 0; }
            .section h3 { color: #10b981; margin-bottom: 15px; }
            .details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to GR Balance!</h1>
                <p>Your account is now ACTIVE and ready to use</p>
            </div>
            
            <div class="content">
                <p>Hi ${data.businessName ? `from <strong>${data.businessName}</strong>` : 'there'}!</p>
                
                <p>🚀 Great news! Your GR Balance account is now <strong>ACTIVE</strong> and ready to streamline your reconciliation process.</p>
                
                <div class="details">
                    <h3>📋 Your Account Details</h3>
                    <p><strong>📧 Email:</strong> ${data.clientEmail}</p>
                    <p><strong>📊 Plan:</strong> ${data.subscriptionTier} Plan</p>
                    <p><strong>🔢 Monthly Usage:</strong> ${usageLimit} reconciliations per month</p>
                    <p><strong>🔗 Your Portal:</strong> <a href="${data.clientPortalUrl}">${data.clientPortalUrl}</a></p>
                </div>
                
                <div class="section">
                    <h3>🚀 What's Next</h3>
                    <ol>
                        <li>📁 Upload your first data files (Excel/CSV)</li>
                        <li>⚡ Run reconciliation analysis</li>
                        <li>📈 Get instant insights and reports</li>
                        <li>💬 Contact us if you need help</li>
                    </ol>
                </div>
                
                <div class="section">
                    <h3>🎁 14-Day FREE Trial</h3>
                    <ul>
                        <li>✅ No credit card required</li>
                        <li>✅ Full access to all features</li>
                        <li>✅ Cancel anytime during trial</li>
                        <li>✅ Billing starts after trial ends</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.clientPortalUrl}" class="button">Access Your Portal</a>
                </div>
                
                <div class="section">
                    <h3>💬 Need Help?</h3>
                    <p><strong>📧 Email:</strong> davis@grbalance.com</p>
                    <p><strong>🌐 Documentation:</strong> <a href="${data.clientPortalUrl}/docs">View Guides</a></p>
                    <p>We're here to help you succeed!</p>
                </div>
                
                <p>Welcome to the GR Balance family! 🎉</p>
                
                <p>Best regards,<br><strong>The GR Balance Team</strong></p>
            </div>
            
            <div class="footer">
                <p>GR Balance - Automated Reconciliation Made Simple</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Send email using Resend API
    const response = await resend.emails.send({
      from: 'GR Balance Team <davis@grbalance.com>',
      to: data.clientEmail,
      subject: '🎉 Welcome to GR Balance - Your Account is Active!',
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Welcome to GR Balance!</h2>
            </div>
            <div class="content">
                <p>Hi <strong>${businessName}</strong>!</p>
                
                <p>Your GR Balance account is now <strong>ACTIVE</strong>! 🚀</p>
                
                <ul>
                    <li>✅ Plan: <strong>${tier} Plan</strong></li>
                    <li>✅ 14-day FREE trial started</li>
                    <li>✅ Portal: <a href="https://grbalance.com/client-portal">Access Here</a></li>
                </ul>
                
                <p><strong>Next steps:</strong></p>
                <ol>
                    <li>Upload your data files</li>
                    <li>Run reconciliation</li>
                    <li>Get instant insights</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="https://grbalance.com/client-portal" class="button">Get Started Now</a>
                </div>
                
                <p>Need help? Email <strong>davis@grbalance.com</strong></p>
                
                <p>Welcome aboard!<br><strong>GR Balance Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const response = await resend.emails.send({
      from: 'GR Balance Team <davis@grbalance.com>',
      to: clientEmail,
      subject: '🎉 Welcome to GR Balance - Account Activated!',
      html: htmlContent,
    });
    
    console.log('✅ Simple welcome email sent successfully:', response);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send simple welcome email:', error);
    return false;
  }
}; 