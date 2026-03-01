# Calendar Booking App — Setup Guide

## Overview
This app combines three calendars to show your real availability:
- **City of Hope** (via ICS subscription feed — read-only)
- **Stanford Outlook/365** (via Microsoft Graph API — read + write bookings)
- **Personal Google Calendar** (via Google Calendar API — read-only)

When someone books → an Outlook event is created → you subscribe to the app's ICS feed in COH to auto-block that time.

---

## Step 1: Copy Environment Variables

```bash
cp .env.example .env.local
```

---

## Step 2: Stanford Outlook Calendar (Microsoft Graph)

### Register an Azure AD Application

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Name: `CalendarBooking` | Supported account types: **Single tenant**
3. Click **Register**

### Get your credentials
- Copy **Application (client) ID** → `MICROSOFT_CLIENT_ID`
- Copy **Directory (tenant) ID** → `MICROSOFT_TENANT_ID`

### Create a client secret
- Go to **Certificates & secrets** → **New client secret**
- Copy the **Value** (not ID) → `MICROSOFT_CLIENT_SECRET`

### Grant API permissions
- Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions**
- Add: `Calendars.ReadWrite`, `Calendars.Read`
- Click **Grant admin consent**

### Set your email
- `MICROSOFT_USER_EMAIL=you@stanford.edu`

> **Note**: If Stanford IT manages Azure AD, you may need to contact them to grant admin consent.
> Alternative: Ask IT for a service account or use delegate permissions with your personal OAuth token.

---

## Step 3: Personal Google Calendar

### Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → **Enable APIs** → search **Google Calendar API** → Enable
3. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Desktop app**
5. Copy **Client ID** → `GOOGLE_CLIENT_ID`
6. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

### Get a Refresh Token

Run this one-time script to get your refresh token:

```bash
node -e "
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar.readonly'],
});
console.log('Visit this URL and paste the code below:', url);
"
```

Then exchange the code:

```bash
node -e "
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);
oauth2Client.getToken('PASTE_CODE_HERE').then(({ tokens }) => {
  console.log('Refresh token:', tokens.refresh_token);
});
"
```

Copy the refresh token → `GOOGLE_REFRESH_TOKEN`

---

## Step 4: City of Hope ICS Feed

### Get your ICS subscription URL from COH Outlook Web App

1. Sign into your COH email at [outlook.office.com](https://outlook.office.com)
2. Click the **Calendar** icon (left sidebar)
3. Right-click your calendar → **Sharing and permissions**
4. Or: Go to **Settings** (gear icon) → **View all Outlook settings** → **Calendar** → **Shared calendars**
5. Under **Publish a calendar**, select your calendar and set to **All details**
6. Copy the **ICS** link → paste into `COH_ICS_URL`

---

## Step 5: Email (SMTP)

### Gmail (recommended)

1. Go to your Google Account → **Security** → **2-Step Verification** (enable if not already)
2. Go to **Security** → **App Passwords**
3. Create an app password for "Mail"
4. Copy the 16-character password → `SMTP_PASS`
5. Set `SMTP_USER=your.gmail@gmail.com`
6. Set `YOUR_EMAIL=you@stanford.edu` (where booking notifications go)

---

## Step 6: Run the App

```bash
npm run dev
```

Visit [http://localhost:3000/book](http://localhost:3000/book)

---

## Step 7: Subscribe to the Booking Feed in COH Calendar

Once the app is running (or deployed), subscribe to the ICS feed to auto-block your COH calendar:

1. In **COH Outlook Web App**: Settings → Calendar → Add calendar → Subscribe from web
2. Paste the feed URL: `https://your-domain.com/api/feed`
3. Name it "Booked Meetings" and save

Now whenever someone books through your app, it will appear in your COH calendar automatically!

---

## Deployment

The app can be deployed to [Vercel](https://vercel.com) for free:

```bash
npx vercel
```

Add all `.env.local` variables in the Vercel dashboard under **Settings → Environment Variables**.

After deploying, update `NEXT_PUBLIC_BASE_URL` to your Vercel URL and re-subscribe the COH feed with the production URL.
