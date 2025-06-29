// Microsoft Graph API Email Service for GR Balance
// Replaces EmailJS with unlimited emails through Outlook 365

export interface OutlookEmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export const sendOutlookEmail = async (emailData: OutlookEmailData): Promise<boolean> => {
  try {
    console.log('📧 Sending email via Microsoft Graph API to:', emailData.to);
    
    // Call our Netlify function that handles Microsoft Graph API
    const response = await fetch('/api/send-outlook-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Email sent successfully via Outlook!', result);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send Outlook email:', error);
    return false;
  }
};

// Create beautiful HTML welcome email
export const createWelcomeEmailHTML = (clientEmail: string, businessName: string, tier: string): string => {
  const tierDetails = {
    starter: { limit: 50, color: '#3B82F6' },
    professional: { limit: 100, color: '#8B5CF6' },
    business: { limit: 200, color: '#10B981' }
  };
  
  const details = tierDetails[tier.toLowerCase() as keyof typeof tierDetails] || tierDetails.starter;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to GR Balance</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; }
        .tier-badge { background: ${details.color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .feature-list li:before { content: "✅"; margin-right: 10px; }
        .cta-button { background: ${details.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to GR Balance!</h1>
            <p>Your account is now active and ready to use</p>
        </div>
        
        <div class="content">
            <h2>Hi ${businessName}!</h2>
            <p>Great news! Your GR Balance account has been successfully activated and your <strong>14-day FREE trial</strong> has begun.</p>
            
            <div class="tier-badge">${tier} Plan - ${details.limit} reconciliations/month</div>
            
            <h3>🚀 What's included in your trial:</h3>
            <ul class="feature-list">
                <li><strong>Upload Excel/CSV files</strong> - Drag and drop your data files</li>
                <li><strong>Automated reconciliation</strong> - AI-powered analysis and matching</li>
                <li><strong>Instant insights</strong> - Real-time discrepancy detection</li>
                <li><strong>Detailed reports</strong> - Professional reconciliation summaries</li>
                <li><strong>Priority support</strong> - Get help when you need it</li>
            </ul>
            
            <h3>📊 Your Account Details:</h3>
            <p><strong>Email:</strong> ${clientEmail}<br>
            <strong>Plan:</strong> ${tier} Plan<br>
            <strong>Monthly Limit:</strong> ${details.limit} reconciliations<br>
            <strong>Trial Period:</strong> 14 days (ends automatically)</p>
            
            <a href="https://grbalance.com/client-portal" class="cta-button">🚀 Access Your Portal</a>
            
            <h3>🎯 Next Steps:</h3>
            <ol>
                <li><strong>Login to your portal</strong> using the link above</li>
                <li><strong>Upload your first data file</strong> (Excel or CSV format)</li>
                <li><strong>Run your first reconciliation</strong> and see the magic happen!</li>
                <li><strong>Contact us</strong> if you need any assistance</li>
            </ol>
            
            <h3>💡 Need Help Getting Started?</h3>
            <p>We're here to help! Email us at <a href="mailto:davis@grbalance.com">davis@grbalance.com</a> or reply to this email with any questions.</p>
            
            <p><strong>Welcome to the GR Balance family!</strong> 🎉</p>
        </div>
        
        <div class="footer">
            <p><strong>GR Balance</strong> - Automated Reconciliation Made Simple</p>
            <p>This is an automated message. Your 14-day trial will end automatically with no charges.</p>
        </div>
    </div>
</body>
</html>`;
};

// Simple text version for email clients that don't support HTML
export const createWelcomeEmailText = (clientEmail: string, businessName: string, tier: string): string => {
  const tierDetails = {
    starter: { limit: 50 },
    professional: { limit: 100 },
    business: { limit: 200 }
  };
  
  const details = tierDetails[tier.toLowerCase() as keyof typeof tierDetails] || tierDetails.starter;
  
  return `
🎉 Welcome to GR Balance!

Hi ${businessName}!

Great news! Your GR Balance account has been successfully activated and your 14-day FREE trial has begun.

ACCOUNT DETAILS:
- Email: ${clientEmail}
- Plan: ${tier} Plan  
- Monthly Limit: ${details.limit} reconciliations
- Trial Period: 14 days (ends automatically)

WHAT'S INCLUDED:
✅ Upload Excel/CSV files
✅ Automated reconciliation  
✅ Instant insights
✅ Detailed reports
✅ Priority support

NEXT STEPS:
1. Login to your portal: https://grbalance.com/client-portal
2. Upload your first data file (Excel or CSV format)
3. Run your first reconciliation and see the magic happen!
4. Contact us if you need any assistance

Need help? Email davis@grbalance.com

Welcome to the GR Balance family! 🎉

---
GR Balance - Automated Reconciliation Made Simple
This is an automated message. Your 14-day trial will end automatically with no charges.
`;
};

// Main function to send welcome email
export const sendWelcomeEmailOutlook = async (
  clientEmail: string, 
  businessName: string, 
  tier: string
): Promise<boolean> => {
  
  const emailData: OutlookEmailData = {
    to: clientEmail,
    subject: '🎉 Welcome to GR Balance - Your Account is Active!',
    htmlContent: createWelcomeEmailHTML(clientEmail, businessName, tier),
    textContent: createWelcomeEmailText(clientEmail, businessName, tier)
  };
  
  return await sendOutlookEmail(emailData);
}; 