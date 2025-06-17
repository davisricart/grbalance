# Stripe Integration Setup Guide for GR Balance

## 🎯 Overview
This guide will help you set up Stripe testing for your subscription billing system.

## 📋 Step 1: Get Your Stripe Test Keys

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Navigate to **Developers > API Keys**
4. Copy your **Publishable Key** (`pk_test_...`) and **Secret Key** (`sk_test_...`)

## 🏗️ Step 2: Create Stripe Products & Prices

In Stripe Dashboard, go to **Products** and create:

**Starter Plan:**
- Monthly: $19.00 USD, recurring monthly
- Annual: $150.00 USD, recurring yearly

**Professional Plan:**
- Monthly: $34.00 USD, recurring monthly  
- Annual: $270.00 USD, recurring yearly

**Business Plan:**
- Monthly: $59.00 USD, recurring monthly
- Annual: $470.00 USD, recurring yearly

Copy the Price IDs for each (they look like `price_1ABC123...`)

## ⚙️ Step 3: Update Configuration

1. Edit `src/config/stripe.ts` and replace placeholder price IDs
2. In Netlify dashboard, add environment variables:
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key`
   - `STRIPE_SECRET_KEY=sk_test_your_key`

## 🧪 Step 4: Test with Test Cards

**Successful Payment:** `4242 4242 4242 4242`
**Declined Payment:** `4000 0000 0000 0002`

## 🚀 Ready to Test!

Your Stripe integration is now ready for testing all subscription tiers and billing cycles. 