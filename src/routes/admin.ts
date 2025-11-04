import express, { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware';
import { collections } from '../database';
import { ObjectId } from 'mongodb';

const router: Router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Helper function for ban/unban operations
const toggleBanClient = async (userId: string, isBanned: boolean, cancelAppointments: boolean = false) => {
  if (!collections.users) {
    throw new Error('Database not connected');
  }

  const user = await collections.users.findOne({ _id: new ObjectId(userId) });
  
  if (!user) {
    throw new Error('User not found');
  }

  // Update user's ban status
  const result = await collections.users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned, lastUpdated: new Date() } }
  );

  if (cancelAppointments && isBanned && collections.appointments) {
    // Cancel all upcoming appointments for this user
    const now = new Date();
    const updateResult = await collections.appointments.updateMany(
      { 
        userId: new ObjectId(userId),
        date: { $gte: now } // Only future appointments
      },
      { $set: { cancelled: true, cancellationReason: 'User account banned' } }
    );
    console.log(`Cancelled ${updateResult.modifiedCount} future appointments for banned user`);
  }

  return {
    modifiedCount: result.modifiedCount,
    user: { ...user, isBanned }
  };
};

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

    // Get all appointments
    const appointments = await collections.appointments.find({}).toArray();
    
    // Get all users for lookup
    const users = await collections.users.find({}).toArray();
    
    // Create user lookup map
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });
    
    // Enrich appointments with user details
    const enrichedAppointments = appointments.map(appointment => {
      // Get user details if userId exists
      let userDetails = null;
      if (appointment.userId) {
        userDetails = userMap.get(appointment.userId.toString());
      }
      
      // Extract phone number from attendees or user details
      let phoneNumber = 'N/A';
      
      // First try to get phone from attendees
      if (appointment.attendees && appointment.attendees.length > 0) {
        const primaryAttendee = appointment.attendees[0];
        if (primaryAttendee.phone) {
          phoneNumber = primaryAttendee.phone;
        }
      }
      
      // If no phone in attendees, try user details
      if (phoneNumber === 'N/A' && userDetails) {
        phoneNumber = userDetails.phonenumber || 'N/A';
      }
      
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

// Admin-only: Ban a client
router.post('/ban-client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelAppointments } = req.body; // Optional: cancel their appointments
    
    const result = await toggleBanClient(id, true, cancelAppointments === true);
    
    if (result.modifiedCount > 0) {
      res.json({ 
        message: 'Client banned successfully',
        client: result.user
      });
    } else {
      res.status(404).json({ error: 'User not found or already banned' });
    }
  } catch (error: any) {
    console.error('Error banning client:', error);
    res.status(500).json({ error: error.message || 'Failed to ban client' });
  }
});

// Admin-only: Unban a client
router.post('/unban-client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await toggleBanClient(id, false);
    
    if (result.modifiedCount > 0) {
      res.json({ 
        message: 'Client unbanned successfully',
        client: result.user
      });
    } else {
      res.status(404).json({ error: 'User not found or already unbanned' });
    }
  } catch (error: any) {
    console.error('Error unbanning client:', error);
    res.status(500).json({ error: error.message || 'Failed to unban client' });
  }
});

export default router;
