# 📧 Email Service Setup Guide

## 🎉 Email Feature Successfully Implemented!

Your appointment booking system now has a complete email service using **Nodemailer + Gmail SMTP** - completely FREE!

## 📋 What's Been Added

### ✅ Backend Components Created:
- **Email Service** (`src/services/emailService.ts`) - Core email functionality
- **Email Controller** (`src/controllers/email.ts`) - API endpoints for email operations
- **Email Routes** (`src/routes/email.ts`) - Protected email routes
- **Integration** - Automatic welcome emails on user registration
- **Integration** - Automatic appointment confirmation emails

### ✅ Features Included:
- 🎨 **Beautiful HTML Email Templates** with responsive design
- 📱 **Welcome emails** for new user signups
- 📅 **Appointment confirmation emails** 
- 📧 **Custom email sending** for admins
- 📬 **Bulk email** to all users
- 🔒 **Protected routes** (admin authentication required)
- ⚡ **Error handling** - Email failures won't break user registration

## 🚀 Setup Instructions

### 1. Gmail Configuration

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" → "2-Step Verification"
3. Follow the setup process

#### Step 2: Generate App Password
1. In Google Account Settings → "Security"
2. Click "App passwords" (under "2-Step Verification")
3. Select "Mail" and "Other (Custom name)"
4. Enter "Katie's Appointment App"
5. Copy the generated 16-character password

### 2. Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:4200

# Contact Email (for email templates)
CONTACT_EMAIL=katie@example.com
```

### 3. Test the Setup

#### Test Email Service Connection:
```bash
# Using the manual test file
GET http://localhost:3000/api/v1/email/test
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Test User Registration (sends welcome email):
```bash
POST http://localhost:3000/api/v1/users
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phonenumber": "0831234567",
  "dob": "1990-01-01"
}
```

## 📧 Available Email Endpoints

All email endpoints require admin authentication:

### Test Email Service
```
GET /api/v1/email/test
```

### Send Welcome Email
```
POST /api/v1/email/welcome/:userId
```

### Send Appointment Confirmation
```
POST /api/v1/email/appointment-confirmation/:userId/:appointmentId
```

### Send Custom Email
```
POST /api/v1/email/custom
{
  "to": "user@example.com",
  "subject": "Custom Subject",
  "html": "<h1>Custom HTML</h1>",
  "text": "Custom text version"
}
```

### Send Bulk Email
```
POST /api/v1/email/bulk
{
  "subject": "Bulk Email Subject",
  "html": "<h1>Bulk Email Content</h1>"
}
```

## 🎨 Email Templates

### Welcome Email Features:
- ✨ Beautiful gradient header
- 📋 User account details
- 🚀 Next steps guide
- 🔗 Login button
- 📞 Contact information

### Appointment Confirmation Features:
- 📅 Appointment details
- ⏰ Date and time
- 📍 Location
- ⚠️ Reminder notes
- 📞 Contact for changes

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid login" error**
   - Make sure you're using the App Password, not your regular Gmail password
   - Verify 2FA is enabled

2. **"Less secure app access" error**
   - Use App Passwords instead of regular passwords
   - Don't enable "Less secure app access"

3. **Emails not sending**
   - Check console logs for error messages
   - Verify EMAIL_USER and EMAIL_PASS in .env
   - Test with the `/email/test` endpoint

### Debug Steps:
1. Check server logs for email errors
2. Test email service: `GET /api/v1/email/test`
3. Verify environment variables
4. Check Gmail App Password setup

## 🎯 Next Steps

1. **Set up Gmail App Password** (most important!)
2. **Add environment variables** to your `.env` file
3. **Test user registration** - should automatically send welcome email
4. **Test appointment booking** - should automatically send confirmation email
5. **Customize email templates** if needed

## 💡 Pro Tips

- **Email failures won't break user registration** - the system continues working even if emails fail
- **All email operations are logged** - check console for success/failure messages
- **Templates are easily customizable** - edit `src/services/emailService.ts`
- **Bulk emails are rate-limited** - Gmail has sending limits (500/day for free accounts)

## 🎉 You're All Set!

Your appointment booking system now has professional email functionality! Users will receive beautiful welcome emails when they sign up and confirmation emails when they book appointments.

**Total Cost: $0** - Completely free using Gmail SMTP! 🆓
