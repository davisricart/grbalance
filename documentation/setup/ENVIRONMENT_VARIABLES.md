# Environment Variables Configuration

This document lists all required environment variables for the GR Balance application.

## 🔥 Firebase Configuration

### Frontend (VITE_ prefixed)
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Backend (Netlify Functions)
```
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----
```

## 🔒 Admin Authentication
```
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## 💳 Stripe Configuration

### Frontend (VITE_ prefixed)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_your_starter_monthly_id
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_your_starter_annual_id
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_your_professional_monthly_id
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_your_professional_annual_id
VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_your_business_monthly_id
VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_your_business_annual_id
VITE_STRIPE_SETUP_FEE_PRICE_ID=price_your_setup_fee_id
```

### Backend (Netlify Functions)
```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🚀 Deployment Instructions

### Local Development
1. Create a `.env.local` file in the project root
2. Add all the variables listed above
3. Never commit this file to version control

### Netlify Production
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add each variable individually
3. Deploy the site

## ⚠️ Security Notes

- **NEVER** commit API keys or secrets to version control
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage in respective dashboards
- The `FIREBASE_PRIVATE_KEY` should have `\n` characters properly escaped

## 🔍 Validation

The application will throw clear error messages if required environment variables are missing:
- Stripe configuration will fail with specific missing variable names
- Firebase functions will fail to initialize without proper credentials
- Admin authentication will deny access without proper configuration

## 📝 Getting the Values

### Firebase
1. Go to Firebase Console → Project Settings → General
2. Copy the config values for frontend variables
3. Go to Service Accounts tab → Generate new private key
4. Use the downloaded JSON for backend variables

### Stripe
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy publishable and secret keys
3. Go to Products → Create your pricing plans
4. Copy the price IDs for each plan
5. Go to Webhooks → Add endpoint → Copy webhook secret

### Admin Emails
- List of email addresses that should have admin access
- Separate multiple emails with commas
- Use lowercase for consistency 