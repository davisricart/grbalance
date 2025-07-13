# Stripe Integration Setup Guide

## 🚀 Quick Overview
The billing integration is now code-complete! Here's what happens:

1. **Admin activates user** → 14-day FREE trial starts (tracked in database)
2. **User gets full access** for 14 days
3. **Trial expires** → User redirected to Stripe checkout for payment
4. **Payment succeeds** → User upgraded to paid subscription

## 🔑 Environment Variables Needed

### In Netlify Environment Variables:

```bash
# Stripe Keys (get from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_...  # Your secret key (test mode for now)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# Price IDs (create these in Stripe dashboard)
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...

# Optional: Annual plans
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_...
VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_...

# Stripe Publishable Key (for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (for webhook to update user status)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📋 Setup Steps

### 1. Create Stripe Products & Prices
In your Stripe dashboard, create:

**Starter Plan:**
- Monthly: $19/month
- Annual: $180/year

**Professional Plan:**
- Monthly: $34/month  
- Annual: $324/year

**Business Plan:**
- Monthly: $59/month
- Annual: $564/year

### 2. Set up Webhook Endpoint
1. In Stripe dashboard → Webhooks → Add endpoint
2. URL: `https://grbalance.netlify.app/.netlify/functions/stripe-webhook`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Add Environment Variables to Netlify
1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add all the variables listed above

## 🧪 Testing

1. **Use Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
   - Any future date for expiry, any 3 digits for CVC

2. **Test workflow:**
   - Activate a user in admin (starts 14-day trial)
   - User gets free access
   - After trial expires → should redirect to Stripe checkout
   - Complete payment → user status updates to 'paid'

## 🔄 How It Works

### Current Trial Flow:
```
Admin Activation → Database stores:
├── status: 'trial'
├── trialStartedAt: '2024-01-01T00:00:00Z'  
├── trialEndsAt: '2024-01-15T00:00:00Z'
└── subscriptionTier: 'professional'
```

### After Payment:
```
Stripe Webhook → Database updates:
├── status: 'paid'
├── stripeCustomerId: 'cus_...'
├── stripeSubscriptionId: 'sub_...'
└── paidAt: '2024-01-10T00:00:00Z'
```

## ✅ What's Ready
- ✅ Netlify functions for Stripe integration
- ✅ Database trial tracking
- ✅ Admin workflow integration
- ✅ Webhook handling for payment events
- ✅ Trial expiration checker utility

## 🔜 Next Steps (Optional)
1. Add trial status to client portal UI
2. Create billing management page for users
3. Add usage limit enforcement based on plan
4. Set up email notifications for trial expiration

The core billing flow is complete and ready for testing once you add the environment variables!