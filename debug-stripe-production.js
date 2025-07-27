// Debug script to verify Stripe production configuration
// Run this in your Stripe Dashboard API explorer or locally

// 1. VERIFY YOUR STRIPE ACCOUNT IS ACTIVATED FOR LIVE PAYMENTS
console.log("=== STRIPE PRODUCTION DEBUG CHECKLIST ===\n");

console.log("1. 🔍 ACCOUNT STATUS CHECK:");
console.log("   → Go to Stripe Dashboard → Settings → Account details");
console.log("   → Verify 'Payments' shows as 'Enabled'");
console.log("   → Check if business verification is complete");
console.log("   → Ensure no warnings about restricted functionality\n");

console.log("2. 🔑 API KEYS VERIFICATION:");
console.log("   → Live publishable key starts with: pk_live_");
console.log("   → Live secret key starts with: sk_live_");
console.log("   → Both keys are from the SAME Stripe account");
console.log("   → Keys match the ones in Netlify environment variables\n");

console.log("3. 💰 PRODUCT/PRICE VERIFICATION:");
console.log("   → All price IDs start with: price_live_");
console.log("   → Products are active (not archived)");
console.log("   → Price IDs match exactly what's in your environment variables\n");

console.log("4. 🔔 WEBHOOK CONFIGURATION:");
console.log("   → Endpoint: https://grbalance.netlify.app/.netlify/functions/stripe-webhook");
console.log("   → Status: Active (not disabled)");
console.log("   → Events include: checkout.session.completed");
console.log("   → Webhook secret (whsec_) is correctly set in Netlify\n");

console.log("5. 🚫 COMMON BLOCKING ISSUES:");
console.log("   → Incomplete business verification");
console.log("   → Account limitations or holds");
console.log("   → Missing required business information");
console.log("   → Restricted payment methods for your business type\n");

console.log("6. ⚡ IMMEDIATE DEBUGGING STEPS:");
console.log("   → Test session creation in Stripe API explorer");
console.log("   → Check Stripe Dashboard → Payments for failed sessions");
console.log("   → Review Stripe Dashboard → Webhooks for delivery failures");
console.log("   → Monitor Netlify function logs during checkout attempts\n");

// Quick test to run in Stripe API explorer (Live mode)
const testSessionConfig = {
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{
    price: 'price_live_YOUR_STARTER_MONTHLY_ID', // Replace with actual price ID
    quantity: 1,
  }],
  success_url: 'https://grbalance.netlify.app/billing/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://grbalance.netlify.app/billing/cancelled',
  customer_email: 'test@example.com',
  metadata: {
    test: 'debug_session'
  }
};

console.log("7. 🧪 TEST SESSION CONFIG (for Stripe API explorer):");
console.log(JSON.stringify(testSessionConfig, null, 2));