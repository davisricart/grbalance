# 2-Minute Reminder Setup (One Time Only)

## ✅ What You'll Have After Setup:
- **Consultation reminders**: Sent 48 hours after signup (if no consultation booked)
- **Trial expiration reminders**: Sent 3 days before trial expires  
- **Completely automated**: Runs daily without you doing anything
- **Uses your existing Resend**: No additional email service needed

## 🚀 Setup Steps (2 minutes):

### 1. Go to cron-job.org
- Visit: https://cron-job.org
- Click "Sign up for free" (just need email)

### 2. Create the reminder job
- Click "Create cronjob" 
- **Title**: GR Balance Reminders
- **URL**: `https://grbalance.netlify.app/.netlify/functions/scheduled-reminders`
- **Schedule**: 
  - Every: `1` day
  - At: `10:00` (10 AM - or whatever time you prefer)
- Click "Create cronjob"

### 3. Verify it's active
- Should show "Active" status
- That's it!

## 📧 What Happens Daily:
1. **10 AM**: cron-job.org automatically calls your reminder function
2. **Your function**: Checks who needs consultation reminders (48+ hours, no booking)
3. **Your function**: Checks who needs trial expiration reminders (3 days left)
4. **Your Resend**: Sends the emails (same service as welcome emails)
5. **Database**: Tracks sent reminders to prevent duplicates

## ✅ Result:
- **100% automated**: Runs every day at 10 AM without you doing anything
- **No login required**: Works whether you check admin or not  
- **Uses existing Resend**: Same 3,000/month free plan
- **Gentle reminders**: Non-pushy, one-time only per user
- **Cost**: $0 (cron-job.org free plan handles this easily)

**Total time**: 2 minutes setup, then completely hands-off forever!