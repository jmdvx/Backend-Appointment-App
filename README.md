# 🚀 Appointment App Backend - Clean & Production Ready

## 📋 Overview

This is a clean, production-ready Node.js backend for an appointment booking system with comprehensive features for user management, appointment scheduling, and blocked dates management.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure User Registration**: Password validation, email confirmation
- **User Authentication**: JWT-based authentication
- **Role-based Access**: Admin and user roles
- **Client Management**: Full CRUD operations for client profiles

### 📅 Appointment Management
- **Appointment Booking**: Create, read, update, delete appointments
- **User Details Integration**: Automatic phone number extraction from user profiles
- **Email Notifications**: Confirmation and reschedule emails
- **Walk-in Support**: Book appointments without user accounts

### 🚫 Blocked Dates Management
- **Comprehensive Blocking**: Block individual dates or date ranges
- **Bulk Operations**: Block multiple dates at once
- **Admin Tools**: Command-line tools for management
- **Validation**: Duplicate detection and consistency checks

### 📧 Email Services
- **Welcome Emails**: Automatic welcome emails for new users
- **Appointment Confirmations**: Booking and reschedule notifications
- **Configurable Templates**: Customizable email templates

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Email**: Nodemailer
- **Validation**: Zod schemas
- **Security**: bcrypt password hashing

## 📁 Project Structure

```
src/
├── controllers/          # Business logic
│   ├── appointments.ts   # Appointment management
│   ├── blockedDates.ts   # Blocked dates management
│   ├── users.ts         # User management
│   └── email.ts         # Email services
├── middleware/           # Express middleware
│   ├── auth.middleware.ts
│   └── validate.middleware.ts
├── models/              # Data models and schemas
│   ├── appointment.ts
│   ├── blockedDate.ts
│   ├── user.ts
│   └── objectidSchema.ts
├── routes/              # API routes
│   ├── admin.ts         # Admin-only endpoints
│   ├── appointments.ts  # Appointment endpoints
│   ├── auth.ts          # Authentication endpoints
│   ├── blockedDates.ts  # Blocked dates endpoints
│   ├── clients.ts       # Client management
│   ├── email.ts         # Email endpoints
│   └── users.ts         # User endpoints
├── services/            # External services
│   └── emailService.ts  # Email service implementation
├── database.ts          # Database connection
├── index.ts             # Express app configuration
└── server.ts            # Server startup
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Email service credentials (Gmail, etc.)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd appointment-app-backend
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with:
   ```env
   DB_CONN_STRING=mongodb://localhost:27017
   DB_NAME=appointmentAppDB
   JWT_SECRET=your-jwt-secret
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm run build
   npm start
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Appointments
- `GET /api/v1/appointments` - Get all appointments
- `GET /api/v1/appointments/with-user-details` - Get appointments with user details
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Delete appointment

### Blocked Dates
- `GET /api/v1/blocked-dates` - Get all blocked dates
- `GET /api/v1/blocked-dates/range` - Get blocked dates in range
- `POST /api/v1/blocked-dates` - Block a date
- `DELETE /api/v1/blocked-dates/date/:date` - Unblock a date
- `DELETE /api/v1/blocked-dates/clear-all` - Clear all blocked dates
- `POST /api/v1/blocked-dates/bulk-block` - Block multiple dates

### Admin (Requires Authentication)
- `GET /api/v1/admin/appointments` - Get appointments with user details
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/stats` - Get system statistics

## 🔧 Admin Tools

### Blocked Dates Management
```bash
# Get summary of blocked dates
npm run blocked-dates-admin -- summary

# Clear all blocked dates
npm run blocked-dates-admin -- clear-all

# Block multiple dates
npm run blocked-dates-admin -- block-multiple "2025-10-25,2025-10-26"

# Validate database consistency
npm run blocked-dates-admin -- validate

# Force sync (remove duplicates)
npm run blocked-dates-admin -- force-sync
```

### Port Management
```bash
# Kill port 3000 if needed
npm run kill-port

# Start with clean port
npm run dev:clean
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing
Use the HTTP files in `tests/manual/` for API testing:
- `appointments.http` - Appointment endpoints
- `blockedDates.http` - Blocked dates endpoints
- `email.http` - Email testing
- `users.http` - User management

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Zod schema validation
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Admin and user permissions
- **SQL Injection Protection**: MongoDB parameterized queries
- **CORS Configuration**: Proper cross-origin setup

## 📊 Performance Features

- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **Error Handling**: Comprehensive error management
- **Graceful Shutdown**: Proper server cleanup
- **Port Conflict Resolution**: Automatic port finding

## 🚨 Error Handling

- **Comprehensive Logging**: Detailed error logs
- **Graceful Degradation**: Fallback mechanisms
- **User-friendly Messages**: Clear error responses
- **Database Connection Handling**: Robust connection management

## 📈 Monitoring & Logging

- **Request Logging**: Morgan HTTP request logger
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **Database Health**: Connection status monitoring

## 🔄 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set:
- Database connection string
- JWT secret
- Email credentials
- Port configuration

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the documentation
2. Review the API endpoints
3. Check the admin tools
4. Review error logs

---

**🎉 Your backend is now clean, organized, and production-ready!**
