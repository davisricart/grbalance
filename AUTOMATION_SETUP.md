# Automated Reminder Setup

## 📧 Email Service
- **Service**: Resend (already configured)
- **API Key**: Already set in Netlify environment
- **Free Tier**: 3,000 emails/month (plenty for 200+ clients)

## 🤖 Automation Function
- **Main Function**: `/.netlify/functions/daily-reminders`
- **Purpose**: Runs both consultation and trial expiration reminders daily
- **Email Service**: Uses existing Resend setup

## ⚙️ Setup Required (One-time, 2 minutes)

### Option 1: cron-job.org (Recommended - Free)
1. Go to https://cron-job.org (free account)
2. Create new cron job:
   - **URL**: `https://grbalance.netlify.app/.netlify/functions/daily-reminders`
   - **Schedule**: Daily at 10:00 AM
   - **Method**: GET
3. Save and activate

### Option 2: EasyCron.com (Alternative - Free)
1. Go to https://www.easycron.com (free account)
2. Add cron job:
   - **URL**: `https://grbalance.netlify.app/.netlify/functions/daily-reminders`
   - **When**: Daily at 10:00 AM
3. Save and start

## 📊 What It Does
- **Daily check**: Runs automatically every day at 10 AM
- **Consultation reminders**: For users pending 48+ hours
- **Trial expiration reminders**: For trials expiring in 3 days
- **Uses existing Resend**: No additional email service needed
- **Tracks sent reminders**: Prevents spam/duplicates

## ✅ After Setup
- **Fully automated**: No manual work required
- **Gentle approach**: Non-pushy, helpful tone
- **One reminder each**: Consultation + trial expiration only
- **Cost**: $0 (uses existing free Resend plan)

Total time investment: 2 minutes setup, then completely hands-off!