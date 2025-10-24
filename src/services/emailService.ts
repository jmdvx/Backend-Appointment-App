import nodemailer from 'nodemailer';
import { User } from '../models/user';

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates with pink and white theme
export const emailTemplates = {
  welcome: (user: User) => ({
    subject: 'Welcome to Katie\'s Appointment Booking!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome ${user.name}!</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Thank you for signing up with Katie's Appointment Booking System! We're excited to have you on board.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Your Account Details:</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phonenumber}</p>
            <p><strong>Date Joined:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background: #ffe4f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #ff69b4; margin-top: 0;">What's Next?</h3>
            <ul style="color: #333; line-height: 1.6;">
              <li>Browse available appointment slots</li>
              <li>Book your preferred time and service</li>
              <li>Receive appointment confirmations</li>
              <li>Manage your bookings from your account</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            If you have any questions, feel free to contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This email was sent from Katie's Appointment Booking System</p>
        </div>
      </div>
    `,
    text: `
      Welcome ${user.name}!
      
      Thank you for signing up with Katie's Appointment Booking System! We're excited to have you on board.
      
      Your Account Details:
      - Name: ${user.name}
      - Email: ${user.email}
      - Phone: ${user.phonenumber}
      - Date Joined: ${new Date().toLocaleDateString()}
      
      What's Next?
      - Browse available appointment slots
      - Book your preferred time and service
      - Receive appointment confirmations
      - Manage your bookings from your account
      
      Login to Your Account: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
      
      If you have any questions, feel free to contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
      
      This email was sent from Katie's Appointment Booking System
    `
  }),

  appointmentConfirmation: (appointment: any) => ({
    subject: 'Appointment Confirmation - Katie\'s Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Confirmed!</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Your appointment has been successfully booked. Here are the details:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Appointment Details:</h3>
            <p><strong>Service:</strong> ${appointment.title}</p>
            <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(appointment.date).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${appointment.location}</p>
            ${appointment.description ? `<p><strong>Notes:</strong> ${appointment.description}</p>` : ''}
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Reminder:</strong> Please arrive 10 minutes before your appointment time.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Need to reschedule or cancel? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Appointment Confirmed!
      
      Your appointment has been successfully booked. Here are the details:
      
      Appointment Details:
      - Service: ${appointment.title}
      - Date: ${new Date(appointment.date).toLocaleDateString()}
      - Time: ${new Date(appointment.date).toLocaleTimeString()}
      - Location: ${appointment.location}
      ${appointment.description ? `- Notes: ${appointment.description}` : ''}
      
      Reminder: Please arrive 10 minutes before your appointment time.
      
      Need to reschedule or cancel? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  loginNotification: (user: User, loginTime: Date, ipAddress?: string) => ({
    subject: 'Login Notification - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Login Successful!</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, you have successfully logged into your Katie's Appointment Booking account.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Login Details:</h3>
            <p><strong>Account:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Login Time:</strong> ${loginTime.toLocaleString()}</p>
            ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Security Note:</strong> If you didn't log in at this time, please contact us immediately and consider changing your password.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" 
               style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Questions? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Login Successful!
      
      Hello ${user.name}, you have successfully logged into your Katie's Appointment Booking account.
      
      Login Details:
      - Account: ${user.name}
      - Email: ${user.email}
      - Login Time: ${loginTime.toLocaleString()}
      ${ipAddress ? `- IP Address: ${ipAddress}` : ''}
      
      Security Note: If you didn't log in at this time, please contact us immediately and consider changing your password.
      
      Go to Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard
      
      Questions? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  passwordReset: (user: User, resetToken: string) => ({
    subject: 'Password Reset Request - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, we received a request to reset your password for your Katie's Appointment Booking account.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Reset Your Password:</h3>
            <p>Click the button below to reset your password. This link will expire in 1 hour for security.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}" 
                 style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Security Alert:</strong> If you didn't request this password reset, please ignore this email and contact us immediately. Your account may be compromised.
            </p>
          </div>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #87ceeb;">
            <p style="margin: 0; color: #4682b4;">
              <strong>Tip:</strong> Use a strong password with at least 8 characters, including numbers and special characters.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Need help? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hello ${user.name}, we received a request to reset your password for your Katie's Appointment Booking account.
      
      Reset Your Password:
      Click the link below to reset your password. This link will expire in 1 hour for security.
      
      Reset Link: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}
      
      Security Alert: If you didn't request this password reset, please ignore this email and contact us immediately. Your account may be compromised.
      
      Tip: Use a strong password with at least 8 characters, including numbers and special characters.
      
      Need help? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  profileUpdate: (user: User, changes: string[]) => ({
    subject: 'Profile Updated - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Profile Updated!</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, your profile has been successfully updated.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Changes Made:</h3>
            <ul style="color: #333; line-height: 1.6;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Note:</strong> If you didn't make these changes, please contact us immediately.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/profile" 
               style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Profile
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Questions? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Profile Updated!
      
      Hello ${user.name}, your profile has been successfully updated.
      
      Changes Made:
      ${changes.map(change => `- ${change}`).join('\n')}
      
      Updated: ${new Date().toLocaleString()}
      
      Note: If you didn't make these changes, please contact us immediately.
      
      View Profile: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/profile
      
      Questions? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  accountDeletion: (user: User) => ({
    subject: 'Account Deleted - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Account Deleted</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, your account has been successfully deleted from Katie's Appointment Booking system.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Account Details:</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Deleted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Important:</strong> All your personal data, appointments, and account information have been permanently removed from our system.
            </p>
          </div>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #87ceeb;">
            <p style="margin: 0; color: #4682b4;">
              <strong>Note:</strong> If you didn't request this account deletion, please contact us immediately as your account may have been compromised.
            </p>
          </div>
          
          <div style="background: #f0fff0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #90ee90;">
            <p style="margin: 0; color: #228b22;">
              <strong>Thank you:</strong> We appreciate the time you spent with Katie's Appointment Booking. If you ever want to return, you're always welcome to create a new account.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Questions? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Account Deleted
      
      Hello ${user.name}, your account has been successfully deleted from Katie's Appointment Booking system.
      
      Account Details:
      - Name: ${user.name}
      - Email: ${user.email}
      - Deleted: ${new Date().toLocaleString()}
      
      Important: All your personal data, appointments, and account information have been permanently removed from our system.
      
      Note: If you didn't request this account deletion, please contact us immediately as your account may have been compromised.
      
      Thank you: We appreciate the time you spent with Katie's Appointment Booking. If you ever want to return, you're always welcome to create a new account.
      
      Questions? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  appointmentRescheduled: (user: User, oldAppointment: any, newAppointment: any) => ({
    subject: 'Appointment Rescheduled - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Rescheduled!</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, your appointment has been successfully rescheduled. Here are the updated details:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Previous Appointment:</h3>
            <p><strong>Service:</strong> ${oldAppointment.title}</p>
            <p><strong>Date:</strong> ${new Date(oldAppointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(oldAppointment.date).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${oldAppointment.location}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff1493;">
            <h3 style="color: #ff1493; margin-top: 0;">New Appointment:</h3>
            <p><strong>Service:</strong> ${newAppointment.title}</p>
            <p><strong>Date:</strong> ${new Date(newAppointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(newAppointment.date).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${newAppointment.location}</p>
            ${newAppointment.description ? `<p><strong>Notes:</strong> ${newAppointment.description}</p>` : ''}
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Reminder:</strong> Please arrive 10 minutes before your new appointment time.
            </p>
          </div>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #87ceeb;">
            <p style="margin: 0; color: #4682b4;">
              <strong>Need to make more changes?</strong> Contact us at least 24 hours in advance for any further modifications.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/appointments" 
               style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Appointments
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Questions? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Appointment Rescheduled!
      
      Hello ${user.name}, your appointment has been successfully rescheduled. Here are the updated details:
      
      Previous Appointment:
      - Service: ${oldAppointment.title}
      - Date: ${new Date(oldAppointment.date).toLocaleDateString()}
      - Time: ${new Date(oldAppointment.date).toLocaleTimeString()}
      - Location: ${oldAppointment.location}
      
      New Appointment:
      - Service: ${newAppointment.title}
      - Date: ${new Date(newAppointment.date).toLocaleDateString()}
      - Time: ${new Date(newAppointment.date).toLocaleTimeString()}
      - Location: ${newAppointment.location}
      ${newAppointment.description ? `- Notes: ${newAppointment.description}` : ''}
      
      Reminder: Please arrive 10 minutes before your new appointment time.
      
      Need to make more changes? Contact us at least 24 hours in advance for any further modifications.
      
      View Appointments: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/appointments
      
      Questions? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  appointmentCancelled: (user: User, appointment: any) => ({
    subject: 'Appointment Cancelled - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Cancelled</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, your appointment has been cancelled. Here are the details of the cancelled appointment:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Cancelled Appointment:</h3>
            <p><strong>Service:</strong> ${appointment.title}</p>
            <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(appointment.date).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${appointment.location}</p>
            ${appointment.description ? `<p><strong>Notes:</strong> ${appointment.description}</p>` : ''}
            <p><strong>Cancelled:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #87ceeb;">
            <p style="margin: 0; color: #4682b4;">
              <strong>Need to reschedule?</strong> You can book a new appointment at any time through our booking system.
            </p>
          </div>
          
          <div style="background: #f0fff0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #90ee90;">
            <p style="margin: 0; color: #228b22;">
              <strong>Refund Policy:</strong> If you have any questions about refunds or rescheduling, please contact us within 24 hours.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/appointments" 
               style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Book New Appointment
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Questions? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Appointment Cancelled
      
      Hello ${user.name}, your appointment has been cancelled. Here are the details of the cancelled appointment:
      
      Cancelled Appointment:
      - Service: ${appointment.title}
      - Date: ${new Date(appointment.date).toLocaleDateString()}
      - Time: ${new Date(appointment.date).toLocaleTimeString()}
      - Location: ${appointment.location}
      ${appointment.description ? `- Notes: ${appointment.description}` : ''}
      - Cancelled: ${new Date().toLocaleString()}
      
      Need to reschedule? You can book a new appointment at any time through our booking system.
      
      Refund Policy: If you have any questions about refunds or rescheduling, please contact us within 24 hours.
      
      Book New Appointment: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/appointments
      
      Questions? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  }),

  passwordUpdated: (user: User) => ({
    subject: 'Password Updated - Katie\'s Appointment Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Updated!</h1>
        </div>
        
        <div style="background: #fff5f8; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Hello ${user.name}, your password has been successfully updated for your Katie's Appointment Booking account.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <h3 style="color: #ff69b4; margin-top: 0;">Account Details:</h3>
            <p><strong>Account:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #ffe4f1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff69b4;">
            <p style="margin: 0; color: #8b2252;">
              <strong>Security Note:</strong> If you didn't update your password, please contact us immediately and consider changing it again. Your account may be compromised.
            </p>
          </div>
          
          <div style="background: #f0fff0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #90ee90;">
            <p style="margin: 0; color: #228b22;">
              <strong>Tip:</strong> Use a strong, unique password and consider enabling two-factor authentication for added security.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/profile" 
               style="background: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Manage Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Questions? Contact us at 
            <a href="mailto:${process.env.CONTACT_EMAIL || 'katie@example.com'}" style="color: #ff69b4;">${process.env.CONTACT_EMAIL || 'katie@example.com'}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Password Updated!
      
      Hello ${user.name}, your password has been successfully updated for your Katie's Appointment Booking account.
      
      Account Details:
      - Account: ${user.name}
      - Email: ${user.email}
      - Password Updated: ${new Date().toLocaleString()}
      
      Security Note: If you didn't update your password, please contact us immediately and consider changing it again. Your account may be compromised.
      
      Tip: Use a strong, unique password and consider enabling two-factor authentication for added security.
      
      Manage Account: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/profile
      
      Questions? Contact us at ${process.env.CONTACT_EMAIL || 'katie@example.com'}
    `
  })
};

// Email service functions
export class EmailService {
  // Send welcome email to new user
  static async sendWelcomeEmail(user: User): Promise<boolean> {
    try {
      console.log('=== EMAIL DEBUG ===');
      console.log('User data for email:', JSON.stringify(user, null, 2));
      console.log('Phone number in email:', user.phonenumber);
      console.log('User.phonenumber type:', typeof user.phonenumber);
      console.log('User.phonenumber value:', JSON.stringify(user.phonenumber));
      
      const template = emailTemplates.welcome(user);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Send appointment confirmation email
  static async sendAppointmentConfirmation(user: User, appointment: any): Promise<boolean> {
    try {
      const template = emailTemplates.appointmentConfirmation(appointment);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Appointment confirmation email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
      return false;
    }
  }

  // Test email service connection
  static async testEmailConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  // Send custom email
  static async sendCustomEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Custom email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending custom email:', error);
      return false;
    }
  }

  // Send login notification email
  static async sendLoginNotification(user: User, ipAddress?: string): Promise<boolean> {
    try {
      const template = emailTemplates.loginNotification(user, new Date(), ipAddress);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Login notification email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending login notification email:', error);
      return false;
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    try {
      const template = emailTemplates.passwordReset(user, resetToken);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Send profile update notification email
  static async sendProfileUpdateEmail(user: User, changes: string[]): Promise<boolean> {
    try {
      const template = emailTemplates.profileUpdate(user, changes);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Profile update email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending profile update email:', error);
      return false;
    }
  }

  // Send account deletion notification email
  static async sendAccountDeletionEmail(user: User): Promise<boolean> {
    try {
      const template = emailTemplates.accountDeletion(user);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Account deletion email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending account deletion email:', error);
      return false;
    }
  }

  // Send appointment rescheduled notification email
  static async sendAppointmentRescheduledEmail(user: User, oldAppointment: any, newAppointment: any): Promise<boolean> {
    try {
      const template = emailTemplates.appointmentRescheduled(user, oldAppointment, newAppointment);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Appointment rescheduled email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending appointment rescheduled email:', error);
      return false;
    }
  }

  // Send appointment cancelled notification email
  static async sendAppointmentCancelledEmail(user: User, appointment: any): Promise<boolean> {
    try {
      const template = emailTemplates.appointmentCancelled(user, appointment);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Appointment cancelled email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending appointment cancelled email:', error);
      return false;
    }
  }

  // Send password updated notification email
  static async sendPasswordUpdatedEmail(user: User): Promise<boolean> {
    try {
      const template = emailTemplates.passwordUpdated(user);
      
      const mailOptions = {
        from: `"Katie's Appointment Booking" <${emailConfig.auth.user}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Password updated email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password updated email:', error);
      return false;
    }
  }
}

export default EmailService;