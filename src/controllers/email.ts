import { Request, Response } from 'express';
import EmailService from '../services/emailService';
import { collections } from '../database';
import { ObjectId } from 'mongodb';
import { User } from '../models/user';
import crypto from 'crypto';

// Test email service connection
export const testEmailService = async (req: Request, res: Response) => {
  try {
    const isConnected = await EmailService.testEmailConnection();
    
    if (isConnected) {
      res.status(200).json({ 
        success: true, 
        message: 'Email service is working correctly' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Email service configuration error' 
      });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test email service' 
    });
  }
};

// Send welcome email to a specific user
export const sendWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const emailSent = await EmailService.sendWelcomeEmail(user);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Welcome email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send welcome email' 
      });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send welcome email' 
    });
  }
};

// Send appointment confirmation email
export const sendAppointmentConfirmation = async (req: Request, res: Response) => {
  try {
    const { userId, appointmentId } = req.params;
    
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID or appointment ID format' 
      });
    }

    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
    const appointment = await collections.appointments?.findOne({ _id: new ObjectId(appointmentId) });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    const emailSent = await EmailService.sendAppointmentConfirmation(user, appointment);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Appointment confirmation email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send appointment confirmation email' 
      });
    }
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send appointment confirmation email' 
    });
  }
};

// Send custom email
export const sendCustomEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: to, subject, html' 
      });
    }

    const emailSent = await EmailService.sendCustomEmail(to, subject, html, text);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Custom email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send custom email' 
      });
    }
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send custom email' 
    });
  }
};

// Send bulk emails to all users
export const sendBulkEmail = async (req: Request, res: Response) => {
  try {
    const { subject, html, text } = req.body;
    
    if (!subject || !html) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: subject, html' 
      });
    }

    const users = await collections.users?.find({}).toArray();
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No users found' 
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        const emailSent = await EmailService.sendCustomEmail(user.email, subject, html, text);
        if (emailSent) {
          successCount++;
          results.push({ email: user.email, status: 'success' });
        } else {
          failureCount++;
          results.push({ email: user.email, status: 'failed' });
        }
      } catch (error) {
        failureCount++;
        results.push({ email: user.email, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Bulk email completed. Success: ${successCount}, Failed: ${failureCount}`,
      results 
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send bulk email' 
    });
  }
};

// Send login notification email
export const sendLoginNotification = async (req: Request, res: Response) => {
  try {
    const { userId, ipAddress } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const emailSent = await EmailService.sendLoginNotification(user, ipAddress);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Login notification email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send login notification email' 
      });
    }
  } catch (error) {
    console.error('Error sending login notification email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send login notification email' 
    });
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await collections.users?.findOne({ email: email }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const emailSent = await EmailService.sendPasswordResetEmail(user, resetToken);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Password reset email sent successfully',
        resetToken: resetToken // Only for testing - remove in production
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send password reset email' 
      });
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send password reset email' 
    });
  }
};

// Send profile update notification email
export const sendProfileUpdateEmail = async (req: Request, res: Response) => {
  try {
    const { userId, changes } = req.body;
    
    if (!userId || !changes || !Array.isArray(changes)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and changes array are required' 
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const emailSent = await EmailService.sendProfileUpdateEmail(user, changes);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Profile update email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send profile update email' 
      });
    }
  } catch (error) {
    console.error('Error sending profile update email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send profile update email' 
    });
  }
};

// Send account deletion notification email
export const sendAccountDeletionEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const emailSent = await EmailService.sendAccountDeletionEmail(user);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Account deletion email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send account deletion email' 
      });
    }
  } catch (error) {
    console.error('Error sending account deletion email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send account deletion email' 
    });
  }
};

// Send appointment rescheduled notification email
export const sendAppointmentRescheduledEmail = async (req: Request, res: Response) => {
  try {
    const { userId, oldAppointmentId, newAppointmentId } = req.body;
    
    if (!userId || !oldAppointmentId || !newAppointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, old appointment ID, and new appointment ID are required' 
      });
    }

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(oldAppointmentId) || !ObjectId.isValid(newAppointmentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }

    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const oldAppointment = await collections.appointments?.findOne({ _id: new ObjectId(oldAppointmentId) });
    const newAppointment = await collections.appointments?.findOne({ _id: new ObjectId(newAppointmentId) });
    
    if (!oldAppointment || !newAppointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or both appointments not found' 
      });
    }

    const emailSent = await EmailService.sendAppointmentRescheduledEmail(user, oldAppointment, newAppointment);
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Appointment rescheduled email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send appointment rescheduled email' 
      });
    }
  } catch (error) {
    console.error('Error sending appointment rescheduled email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send appointment rescheduled email' 
    });
  }
};
