# Stripe Production Quick Reference

## 🚀 Quick Setup Checklist

### 1. Switch to Live Mode
- [ ] Toggle to **Live Mode** in Stripe Dashboard
- [ ] Copy **Live Publishable Key** (`pk_live_...`)
- [ ] Copy **Live Secret Key** (`sk_live_...`)

### 2. Create Products (Live Mode)

| Plan | Monthly | Annual | Description |
|------|---------|--------|-------------|
| **Starter** | $19/month | $180/year | Small businesses |
| **Professional** | $34/month | $324/year | Growing businesses |
| **Business** | $59/month | $564/year | Large organizations |

### 3. Set Up Webhook
- **URL**: `https://grbalance.netlify.app/.netlify/functions/stripe-webhook`
- **Events**: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- **Copy Webhook Secret** (`whsec_...`)

### 4. Update Netlify Environment Variables

```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key

# Replace test price IDs with live price IDs
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_live_...
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_live_...
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_live_...
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_live_...
VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_live_...
VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_live_...
VITE_STRIPE_SETUP_FEE_PRICE_ID=price_live_...
```

## 🔍 Key Differences: Test vs Production

| Feature | Test Mode | Production Mode |
|---------|-----------|-----------------|
| **API Keys** | `pk_test_...` / `sk_test_...` | `pk_live_...` / `sk_live_...` |
| **Webhook Secret** | `whsec_test_...` | `whsec_live_...` |
| **Price IDs** | `price_test_...` | `price_live_...` |
| **Payments** | Test cards only | Real money |
| **Environment** | Safe for testing | Real customers |

## 🧪 Testing Production

### Before Going Live:
1. **Test with real card** (small amount)
2. **Verify webhook events**
3. **Check environment detection**
4. **Test complete payment flow**

### Test Cards (Test Mode Only):
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check key prefix (test vs live) |
| Webhook failures | Verify URL and secret |
| Payment declined | Check Stripe dashboard for reason |

## 🔗 Important Links

- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Keys**: Dashboard → Developers → API Keys
- **Products**: Dashboard → Products
- **Webhooks**: Dashboard → Developers → Webhooks
- **Netlify Environment**: Site Settings → Environment Variables

---

**⚠️ Remember**: Never use test keys in production or live keys in test mode! 