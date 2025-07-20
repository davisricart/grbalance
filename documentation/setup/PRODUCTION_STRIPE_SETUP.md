# Production Stripe Setup Guide

## 🚀 Overview
This guide will help you transition from test mode to production mode in Stripe and set up your live products.

## 📋 Prerequisites
- ✅ Stripe account with verified business information
- ✅ Test mode products already created and working
- ✅ Netlify deployment ready

## 🔄 Step 1: Switch to Production Mode

### In Stripe Dashboard:
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Toggle from Test Mode to Live Mode** (top right corner)
3. You'll now see your live API keys with `pk_live_` and `sk_live_` prefixes

### Important Notes:
- **Test mode**: Keys start with `pk_test_` and `sk_test_`
- **Production mode**: Keys start with `pk_live_` and `sk_live_`
- Your application automatically detects the environment based on the key prefix

## 🏗️ Step 2: Create Production Products

### In Live Mode Stripe Dashboard:

1. **Navigate to Products** → **Add Product**

2. **Create Starter Plan:**
   ```
   Product Name: GR Balance Starter
   Description: Perfect for small businesses getting started with financial reconciliation
   
   Pricing:
   - Monthly: $19.00 USD, recurring monthly
   - Annual: $180.00 USD, recurring yearly (15% discount)
   ```

3. **Create Professional Plan:**
   ```
   Product Name: GR Balance Professional
   Description: Advanced features for growing businesses with complex reconciliation needs
   
   Pricing:
   - Monthly: $34.00 USD, recurring monthly
   - Annual: $324.00 USD, recurring yearly (15% discount)
   ```

4. **Create Business Plan:**
   ```
   Product Name: GR Balance Business
   Description: Enterprise-level features for large organizations with multiple locations
   
   Pricing:
   - Monthly: $59.00 USD, recurring monthly
   - Annual: $564.00 USD, recurring yearly (15% discount)
   ```

5. **Create Setup Fee (Optional):**
   ```
   Product Name: GR Balance Setup Fee
   Description: One-time setup and onboarding fee
   
   Pricing:
   - One-time: $497.00 USD
   Note: Currently waived until August 1st, 2025
   ```

## 🔑 Step 3: Get Your Production Keys

### In Live Mode Stripe Dashboard:

1. **Go to Developers → API Keys**
2. **Copy your Live Publishable Key** (`pk_live_...`)
3. **Copy your Live Secret Key** (`sk_live_...`)

## 🌐 Step 4: Set Up Production Webhook

### In Live Mode Stripe Dashboard:

1. **Go to Developers → Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://grbalance.netlify.app/.netlify/functions/stripe-webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy the webhook signing secret** (`whsec_...`)

## ⚙️ Step 5: Update Environment Variables

### In Netlify Dashboard:

1. **Go to Site Settings → Environment Variables**
2. **Replace test variables with production values**:

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_production_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Production Price IDs (copy from your live products)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_live_starter_monthly_id
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_live_starter_annual_id
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_live_professional_monthly_id
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_live_professional_annual_id
VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_live_business_monthly_id
VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_live_business_annual_id
VITE_STRIPE_SETUP_FEE_PRICE_ID=price_live_setup_fee_id
```

## 🧪 Step 6: Testing Production Setup

### Before Going Live:

1. **Test with real cards** (small amounts):
   - Use your own credit card for testing
   - Start with the lowest tier ($19/month)
   - Verify webhook events are received

2. **Verify environment detection**:
   - Your app should show "Production" mode
   - Check that the correct price IDs are being used

3. **Test the complete flow**:
   - User registration → Trial activation → Payment → Subscription

## 🔒 Step 7: Security Checklist

### Before Launch:

- [ ] **Business verification complete** in Stripe
- [ ] **PCI compliance** requirements met
- [ ] **Terms of service** and **privacy policy** updated
- [ ] **Refund policy** documented
- [ ] **Customer support** process established
- [ ] **Monitoring** set up for failed payments
- [ ] **Backup** of all configuration

## 🚀 Step 8: Go Live Checklist

### Final Steps:

- [ ] **Deploy** updated environment variables to Netlify
- [ ] **Test** complete payment flow with real card
- [ ] **Verify** webhook events are working
- [ ] **Monitor** first few transactions
- [ ] **Update** any marketing materials with live pricing
- [ ] **Notify** team about production launch

## 📊 Step 9: Post-Launch Monitoring

### What to Monitor:

1. **Payment Success Rate**: Should be >95%
2. **Webhook Delivery**: Check for failed webhook deliveries
3. **Customer Support**: Monitor for payment-related issues
4. **Revenue Tracking**: Verify all payments are being captured
5. **Subscription Management**: Test upgrades/downgrades

## 🆘 Troubleshooting

### Common Issues:

**"Invalid API key" errors:**
- Ensure you're using live keys in production
- Check for typos in environment variables

**Webhook failures:**
- Verify webhook URL is correct
- Check Netlify function logs
- Ensure webhook secret matches

**Payment failures:**
- Check Stripe dashboard for declined reasons
- Verify customer's card information
- Check for fraud detection triggers

## 📞 Support

If you encounter issues:
1. Check Stripe dashboard for error details
2. Review Netlify function logs
3. Contact Stripe support for payment issues
4. Check application logs for webhook issues

---

**Remember**: Always test thoroughly in test mode before switching to production! 