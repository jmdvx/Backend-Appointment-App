import { Router } from 'express';
import {
  testEmailService,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendCustomEmail,
  sendBulkEmail,
  sendLoginNotification,
  sendPasswordResetEmail,
  sendProfileUpdateEmail,
  sendAccountDeletionEmail,
  sendAppointmentRescheduledEmail
} from '../controllers/email';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Test email service connection (admin only)
router.get('/test', authenticateUser, requireAdmin, testEmailService);

// Send welcome email to specific user (admin only)
router.post('/welcome/:userId', authenticateUser, requireAdmin, sendWelcomeEmail);

// Send appointment confirmation email (admin only)
router.post('/appointment-confirmation/:userId/:appointmentId', authenticateUser, requireAdmin, sendAppointmentConfirmation);

// Send custom email (admin only)
router.post('/custom', authenticateUser, requireAdmin, sendCustomEmail);

// Send bulk email to all users (admin only)
router.post('/bulk', authenticateUser, requireAdmin, sendBulkEmail);

// Send login notification email (admin only)
router.post('/login-notification', authenticateUser, requireAdmin, sendLoginNotification);

// Send password reset email (admin only)
router.post('/password-reset', authenticateUser, requireAdmin, sendPasswordResetEmail);

// Send profile update notification email (admin only)
router.post('/profile-update', authenticateUser, requireAdmin, sendProfileUpdateEmail);

// Send account deletion notification email (admin only)
router.post('/account-deletion', authenticateUser, requireAdmin, sendAccountDeletionEmail);

// Send appointment rescheduled notification email (admin only)
router.post('/appointment-rescheduled', authenticateUser, requireAdmin, sendAppointmentRescheduledEmail);

export default router;
