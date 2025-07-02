import { sendWelcomeEmail, sendSimpleWelcomeEmail } from './services/welcomeEmailService';

// Test the full welcome email
const testFullWelcome = async () => {
  const result = await sendWelcomeEmail({
    clientEmail: 'davis@grbalance.com',
    businessName: 'Test Business',
    subscriptionTier: 'Professional',
    usageLimit: 100,
    clientPortalUrl: 'https://grbalance.com/client-portal'
  });
  console.log('Full welcome email sent:', result);
};

// Test the simple welcome email
const testSimpleWelcome = async () => {
  const result = await sendSimpleWelcomeEmail(
    'davis@grbalance.com',
    'Test Business',
    'Professional'
  );
  console.log('Simple welcome email sent:', result);
};

// Run both tests
Promise.all([testFullWelcome(), testSimpleWelcome()])
  .then(() => console.log('All test emails sent'))
  .catch(console.error); 