# Brevo Email Service Setup Guide

## Why Brevo?

Render blocks SMTP ports (25, 587) which causes Gmail SMTP to fail. Brevo (formerly Sendinblue) uses API-based email delivery which works perfectly on Render.

**Benefits:**
- ✅ Works on Render (no port restrictions)
- ✅ Free tier: 300 emails/day
- ✅ Better deliverability than SMTP
- ✅ Email tracking and analytics
- ✅ No 2FA/app password hassles

## Setup Steps

### 1. Create Brevo Account

1. Go to [https://app.brevo.com/account/register](https://app.brevo.com/account/register)
2. Sign up with your email
3. Verify your email address

### 2. Get API Key

1. Log in to Brevo dashboard
2. Go to **Settings** → **SMTP & API** → **API Keys**
3. Click **Generate a new API key**
4. Name it: `Tourism System Production`
5. Copy the API key (starts with `xkeysib-...`)

### 3. Verify Sender Email

1. Go to **Senders** → **Add a Sender**
2. Enter your email: `abebemarye5381@gmail.com`
3. Brevo will send a verification email
4. Click the verification link

### 4. Add to Render Environment Variables

Go to your Render service → **Environment** tab and add:

```
BREVO_API_KEY=xkeysib-your-actual-api-key-here
BREVO_SENDER_EMAIL=abebemarye5381@gmail.com
BREVO_SENDER_NAME=North Wollo Tourism
```

### 5. Deploy

The system will automatically use Brevo when `BREVO_API_KEY` is set. No code changes needed!

## How It Works

The system uses a smart email service selector (`email.service.js`):

1. **If `BREVO_API_KEY` is set** → Uses Brevo (recommended)
2. **Else if Gmail credentials are set** → Uses Gmail SMTP (fallback)
3. **Else** → Logs warning, emails not sent

## Testing

After deployment, test by:

1. Register a new account
2. Check if you receive the verification email
3. Try password reset
4. Create a booking and check notifications

## Troubleshooting

**Emails not sending?**
- Check Brevo dashboard → **Logs** → **Email Logs**
- Verify sender email is confirmed in Brevo
- Check Render logs for error messages

**API key invalid?**
- Regenerate API key in Brevo dashboard
- Update in Render environment variables
- Redeploy service

## Free Tier Limits

- **300 emails/day** (enough for most small-medium apps)
- Unlimited contacts
- Email tracking included

Need more? Upgrade to paid plan or use multiple API keys.
