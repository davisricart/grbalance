// Welcome Email Service for GR Balance Client Activation
import emailjs from '@emailjs/browser';

// Initialize EmailJS (same configuration as ContactPage)
emailjs.init("e-n1Rxb8CRaf_RfPm");

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
    
    // Email template parameters
    const templateParams = {
      to_email: data.clientEmail,
      business_name: data.businessName || 'Your Business',
      subscription_tier: data.subscriptionTier,
      usage_limit: usageLimit,
      portal_url: data.clientPortalUrl,
      support_email: 'davis@grbalance.com',
      from_name: 'GR Balance Team'
    };
    
    // Send email using existing EmailJS service
    const response = await emailjs.send(
      'service_grbalance',
      'template_welcome',  // We'll need to create this template
      templateParams
    );
    
    console.log('✅ Welcome email sent successfully:', response.status);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};

// Generate the welcome email content (for template creation)
export const getWelcomeEmailTemplate = (data: WelcomeEmailData) => {
  const usageLimit = data.usageLimit;
  
  return `
Subject: 🎉 Welcome to GR Balance - Your Account is Active!

Hi ${data.businessName ? `from ${data.businessName}` : 'there'}!

🚀 Great news! Your GR Balance account is now ACTIVE and ready to use.

=== YOUR ACCOUNT DETAILS ===
📧 Email: ${data.clientEmail}
📊 Plan: ${data.subscriptionTier} Plan
🔢 Monthly Usage: ${usageLimit} reconciliations per month
🔗 Your Portal: ${data.clientPortalUrl}

=== WHAT'S NEXT ===
1. 📁 Upload your first data files (Excel/CSV)
2. ⚡ Run reconciliation analysis
3. 📈 Get instant insights and reports
4. 💬 Contact us if you need help

=== 14-DAY FREE TRIAL ===
✅ No credit card required
✅ Full access to all features
✅ Cancel anytime during trial
✅ Billing starts after trial ends

=== NEED HELP? ===
📧 Email: davis@grbalance.com
🌐 Documentation: ${data.clientPortalUrl}/docs
💬 We're here to help you succeed!

Welcome to the GR Balance family! 🎉

Best regards,
The GR Balance Team

---
GR Balance - Automated Reconciliation Made Simple
`;
};

// Backup: Simple email sending function using basic template
export const sendSimpleWelcomeEmail = async (clientEmail: string, businessName: string, tier: string): Promise<boolean> => {
  try {
    const templateParams = {
      from_name: 'GR Balance Team',
      from_email: 'davis@grbalance.com',
      to_email: clientEmail,
      subject: '🎉 Welcome to GR Balance - Account Activated!',
      message: `
Hi ${businessName}!

Your GR Balance account is now ACTIVE! 🚀

✅ Plan: ${tier} Plan
✅ 14-day FREE trial started
✅ Portal: https://grbalance.com/client-portal

Next steps:
1. Upload your data files
2. Run reconciliation
3. Get instant insights

Need help? Email davis@grbalance.com

Welcome aboard!
GR Balance Team
      `
    };
    
    // Use existing contact template as fallback
    await emailjs.send(
      'service_grbalance',
      'template_rm62n5a',
      templateParams
    );
    
    console.log('✅ Simple welcome email sent to:', clientEmail);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send simple welcome email:', error);
    return false;
  }
}; 