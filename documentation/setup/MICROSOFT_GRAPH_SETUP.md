# Microsoft Graph API Setup Guide for GR Balance

**🔥 UNLIMITED EMAIL SYSTEM** - Replace EmailJS with your own Outlook 365 account!

## **Why Microsoft Graph API?**

✅ **Unlimited emails** - Use your existing Outlook 365 subscription  
✅ **Professional sender** - Emails come from `davis@grbalance.com`  
✅ **No monthly limits** - No more EmailJS 200 email/month restriction  
✅ **Better deliverability** - Direct from Microsoft servers  
✅ **Free with existing subscription** - You already pay for Outlook 365  

---

## **Step 1: Create Azure App Registration**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory > App registrations > New registration
3. **Fill out registration form**:
   - **Name**: `GR Balance Email Service`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank (not needed for server-to-server)
4. **Click**: "Register"

---

## **Step 2: Configure App Permissions**

After creating the app, you'll be on the app's overview page:

### **API Permissions**
1. Click **"API permissions"** in the left menu
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Application permissions"** (not Delegated)
5. Search for and add these permissions:
   - `Mail.Send` - Send mail as any user
   - `User.Read.All` - Read all users' basic profiles
6. Click **"Add permissions"**
7. **IMPORTANT**: Click **"Grant admin consent for [Your Organization]"**
   - This step is CRITICAL - the API won't work without admin consent

### **Certificates & Secrets**
1. Click **"Certificates & secrets"** in the left menu
2. Click **"New client secret"**
3. Add description: `GR Balance Production Secret`
4. Set expiration: `24 months` (or custom)
5. Click **"Add"**
6. **COPY THE SECRET VALUE IMMEDIATELY** - you can't see it again!

---

## **Step 3: Get Required Information**

From your Azure app registration page, gather these values:

1. **Application (client) ID** - On the "Overview" page
2. **Directory (tenant) ID** - On the "Overview" page  
3. **Client secret** - The secret you just created
4. **User ID** - Your Outlook user ID (see Step 4)

---

## **Step 4: Find Your User ID**

You need your specific Outlook user ID to send emails:

### **Method 1: Graph Explorer (Easiest)**
1. Go to: https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in with your `davis@grbalance.com` account
3. Run this query: `GET https://graph.microsoft.com/v1.0/me`
4. Copy the `"id"` value from the response

### **Method 2: PowerShell**
```powershell
# Install Microsoft Graph PowerShell if not already installed
Install-Module Microsoft.Graph -Scope CurrentUser

# Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.Read"

# Get your user ID
Get-MgUser -UserId "davis@grbalance.com" | Select-Object Id, DisplayName, Mail
```

---

## **Step 5: Environment Variables**

Add these environment variables to your Netlify site:

### **In Netlify Dashboard**
1. Go to your site in Netlify
2. Go to **Site settings** > **Environment variables**
3. Add these variables:

```env
MICROSOFT_CLIENT_ID=your-application-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here
MICROSOFT_TENANT_ID=your-directory-tenant-id-here
MICROSOFT_USER_ID=your-outlook-user-id-here
```

### **Example (don't use these values)**
```env
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=abcd123~efgh456-ijkl789_mnop012
MICROSOFT_TENANT_ID=87654321-4321-4321-4321-210987654321
MICROSOFT_USER_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## **Step 6: Test the Setup**

After deploying to Netlify with the environment variables:

1. **Test in Admin Panel**:
   - Go to Admin > User Management > Approved Users
   - Try the "Activate Client" button on a test user
   - Check browser console for logs

2. **Expected Console Logs**:
   ```
   📧 Sending email via Microsoft Graph API to: test@example.com
   🔐 Initializing Microsoft Graph authentication...
   ✅ Microsoft Graph access token obtained
   📤 Sending email via Microsoft Graph API...
   ✅ Email sent successfully via Outlook!
   ```

3. **If it fails**, check:
   - Environment variables are set correctly in Netlify
   - Azure app has admin consent granted
   - User ID is correct
   - Client secret hasn't expired

---

## **Step 7: Verify Email Delivery**

1. **Send a test activation email**
2. **Check the recipient's inbox** (including spam/junk folder)
3. **Verify sender**: Should show `davis@grbalance.com`
4. **Check email formatting**: Should be beautifully formatted HTML

---

## **Security Notes**

🔒 **Client Secret Security**:
- Never commit secrets to Git
- Rotate secrets every 6-12 months
- Only store in Netlify environment variables

🔒 **Permissions**:
- Uses "Application permissions" (server-to-server)
- No user interaction required
- Works even when you're not logged in

🔒 **Access Control**:
- Only your Azure tenant can use this app
- Emails can only be sent from your configured user account

---

## **Troubleshooting**

### **"Authentication failed"**
- Check Client ID, Secret, and Tenant ID
- Ensure admin consent was granted
- Try regenerating the client secret

### **"Could not obtain access token"**
- Verify environment variables in Netlify
- Check Azure app registration permissions
- Ensure Application permissions (not Delegated)

### **"Failed to send email"** 
- Verify User ID is correct
- Check that user has a valid mailbox
- Ensure Mail.Send permission is granted

### **Emails not delivering**
- Check recipient's spam folder
- Verify sender domain reputation
- Test with different recipient addresses

---

## **Migration Complete! 🎉**

Your system now sends **unlimited emails** through your own Outlook 365 account instead of being limited by EmailJS's 200/month restriction!

**Next Steps:**
1. Remove EmailJS dependencies (optional cleanup)
2. Update documentation 
3. Monitor email delivery rates
4. Set up email analytics if needed

**Benefits achieved:**
- ✅ Unlimited email sending
- ✅ Professional sender address
- ✅ Better deliverability 
- ✅ No third-party email service fees
- ✅ Full control over email infrastructure 