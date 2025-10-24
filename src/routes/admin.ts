import express, { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';
import { collections } from '../database';
import { ObjectId } from 'mongodb';

const router: Router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Admin-only: Get all users
router.get('/users', async (req, res) => {
  try {
    if (!collections.users) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const users = await collections.users.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin-only: Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await collections.users?.countDocuments() || 0;
    const appointmentCount = await collections.appointments?.countDocuments() || 0;
    
    res.json({
      totalUsers: userCount,
      totalAppointments: appointmentCount,
      adminAccess: true
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Admin-only: Get all appointments with user details
router.get('/appointments', async (req, res) => {
  try {
    if (!collections.appointments || !collections.users) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    console.log('=== ADMIN APPOINTMENTS DEBUG ===');
    
    // Get all appointments
    const appointments = await collections.appointments.find({}).toArray();
    console.log('Found appointments:', appointments.length);
    
    // Get all users for lookup
    const users = await collections.users.find({}).toArray();
    console.log('Found users:', users.length);
    
    // Create user lookup map
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });
    
    // Enrich appointments with user details
    const enrichedAppointments = appointments.map(appointment => {
      console.log('Processing appointment:', appointment._id);
      console.log('Appointment userId:', appointment.userId);
      console.log('Appointment attendees:', appointment.attendees);
      
      // Get user details if userId exists
      let userDetails = null;
      if (appointment.userId) {
        userDetails = userMap.get(appointment.userId.toString());
        console.log('Found user details:', userDetails ? 'YES' : 'NO');
      }
      
      // Extract phone number from attendees or user details
      let phoneNumber = 'N/A';
      
      // First try to get phone from attendees
      if (appointment.attendees && appointment.attendees.length > 0) {
        const primaryAttendee = appointment.attendees[0];
        if (primaryAttendee.phone) {
          phoneNumber = primaryAttendee.phone;
          console.log('Phone from attendee:', phoneNumber);
        }
      }
      
      // If no phone in attendees, try user details
      if (phoneNumber === 'N/A' && userDetails) {
        phoneNumber = userDetails.phonenumber || 'N/A';
        console.log('Phone from user:', phoneNumber);
      }
      
      console.log('Final phone number:', phoneNumber);
      
      return {
        _id: appointment._id,
        userId: appointment.userId,
        title: appointment.title,
        description: appointment.description,
        date: appointment.date,
        location: appointment.location,
        attendees: appointment.attendees,
        // User details
        userName: userDetails ? userDetails.name : (appointment.attendees && appointment.attendees[0] ? appointment.attendees[0].name : 'N/A'),
        userEmail: userDetails ? userDetails.email : (appointment.attendees && appointment.attendees[0] ? appointment.attendees[0].email : 'N/A'),
        userPhone: phoneNumber,
        // Additional user info
        userNotes: userDetails ? userDetails.notes : '',
        userRoles: userDetails ? userDetails.roles : [],
        userDateJoined: userDetails ? userDetails.dateJoined : null
      };
    });
    
    console.log('Enriched appointments count:', enrichedAppointments.length);
    
    res.json(enrichedAppointments);
  } catch (error) {
    console.error('Error fetching admin appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments with user details' });
  }
});

// Admin-only: Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collections.users?.deleteOne({ _id: new ObjectId(id) });
    
    if (result?.deletedCount) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
