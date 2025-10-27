import { Request, Response } from 'express';
import { collections } from '../database';
import { Appointment } from '../models/appointment';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';
import EmailService from '../services/emailService';

// Get all appointments
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    if (!collections.appointments) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const appointments = (await collections.appointments.find({}).toArray()) as unknown as Appointment[];
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get appointments with user details for admin dashboard
export const getAppointmentsWithUserDetails = async (req: Request, res: Response) => {
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
    console.error('Error fetching appointments with user details:', error);
    res.status(500).json({ error: 'Failed to fetch appointments with user details' });
  }
};

// Get appointments by user ID
export const getAppointmentsByUserId = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  console.log('=== GET USER APPOINTMENTS DEBUG ===');
  console.log('Requested userId:', userId);
  console.log('userId type:', typeof userId);
  console.log('Is valid ObjectId:', ObjectId.isValid(userId));
  
  if (!ObjectId.isValid(userId)) {
    console.log('ERROR: Invalid user ID format');
    return res.status(400).json({ 
      error: 'Invalid user ID format. Expected MongoDB ObjectId format (e.g., 68f64695199f43daeacbc3f2)',
      received: userId,
      expectedFormat: '24-character hexadecimal string'
    });
  }

  try {
    const query = { userId: new ObjectId(userId) };
    console.log('Querying with:', query);
    
    const appointments = (await collections.appointments?.find(query).toArray()) as unknown as Appointment[];
    console.log('Found appointments:', appointments.length);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error(`Error fetching appointments for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user appointments' });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const appointment = (await collections.appointments?.findOne(query)) as unknown as Appointment;

    if (appointment) {
      res.status(200).json(appointment);
    } else {
      res.status(404).json({ error: `Appointment with id ${id} not found` });
    }
  } catch (error) {
    console.error(`Error fetching appointment ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Create new appointment (supports walk-in bookings without user accounts)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { userId, title, description, date, location, attendees } = req.body;
    
    console.log('=== CREATE APPOINTMENT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('userId from request:', userId);
    console.log('userId type:', typeof userId);
    
    let finalUserId = userId;
    
    // Handle walk-in bookings: If no userId provided, allow booking without user account
    if (!userId || userId === '000000000000000000000000' || userId === null) {
      console.log('No userId provided - creating walk-in appointment without user account');
      finalUserId = null; // Allow appointments without user accounts
    } else if (ObjectId.isValid(finalUserId)) {
      // Check if the user is banned before allowing appointment creation
      const user = await collections.users?.findOne({ _id: new ObjectId(finalUserId) }) as unknown as User;
      if (user && user.isBanned) {
        return res.status(403).json({ error: "You cannot book appointments because your account has been banned" });
      }
    }
    
    const newAppointment: Appointment = {
      userId: finalUserId && ObjectId.isValid(finalUserId) ? new ObjectId(finalUserId) : undefined,
      title,
      description,
      date: new Date(date),
      location,
      attendees: attendees || []
    };

    console.log('New appointment object:', newAppointment);

    const result = await collections.appointments?.insertOne(newAppointment);

    if (result) {
      console.log('Appointment created successfully with ID:', result.insertedId);
      
      // Send appointment confirmation email if user exists
      if (finalUserId && ObjectId.isValid(finalUserId)) {
        try {
          const user = await collections.users?.findOne({ _id: new ObjectId(finalUserId) }) as unknown as User;
          if (user) {
            const emailSent = await EmailService.sendAppointmentConfirmation(user, newAppointment);
            if (emailSent) {
              console.log(`Appointment confirmation email sent to ${user.email}`);
            } else {
              console.log(`Failed to send appointment confirmation email to ${user.email}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending appointment confirmation email:', emailError);
          // Don't fail appointment creation if email fails
        }
      }

      res.status(201).json({ 
        message: 'Appointment created successfully',
        id: result.insertedId,
        userId: finalUserId || null
      });
    } else {
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Update appointment
export const updateAppointment = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }

  try {
    const { userId, title, description, date, location, attendees } = req.body;
    
    console.log('=== UPDATE APPOINTMENT DEBUG ===');
    console.log('Updating appointment:', id);
    console.log('Update data:', { userId, title, description, date, location, attendees });
    
    // Get the original appointment before updating
    const originalAppointment = await collections.appointments?.findOne({ _id: new ObjectId(id) });
    
    if (!originalAppointment) {
      return res.status(404).json({ error: `Appointment with id ${id} not found` });
    }
    
    const updateData: Partial<Appointment> = {};
    if (userId) {
      updateData.userId = new ObjectId(userId);
      console.log('Setting userId to:', updateData.userId);
    }
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (location) updateData.location = location;
    if (attendees) updateData.attendees = attendees;

    console.log('Final update data:', updateData);

    const result = await collections.appointments?.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result?.matchedCount === 0) {
      return res.status(404).json({ error: `Appointment with id ${id} not found` });
    }

    if (result?.modifiedCount && result.modifiedCount > 0) {
      // Check if this is a reschedule (date/time changed) and send email
      const isReschedule = (date && new Date(date).getTime() !== new Date(originalAppointment.date).getTime()) ||
                          (title && title !== originalAppointment.title) ||
                          (location && location !== originalAppointment.location);
      
      if (isReschedule && originalAppointment.userId) {
        try {
          const user = await collections.users?.findOne({ _id: originalAppointment.userId }) as unknown as User;
          if (user) {
            // Get the updated appointment
            const updatedAppointment = await collections.appointments?.findOne({ _id: new ObjectId(id) });
            if (updatedAppointment) {
              const emailSent = await EmailService.sendAppointmentRescheduledEmail(user, originalAppointment, updatedAppointment);
              if (emailSent) {
                console.log(`Appointment reschedule email sent to ${user.email}`);
              } else {
                console.log(`Failed to send appointment reschedule email to ${user.email}`);
              }
            }
          }
        } catch (emailError) {
          console.error('Error sending appointment reschedule email:', emailError);
          // Don't fail update if email fails
        }
      }

      res.status(200).json({ message: 'Appointment updated successfully' });
    } else {
      res.status(400).json({ error: 'No changes made to appointment' });
    }
  } catch (error) {
    console.error(`Error updating appointment ${id}:`, error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Delete appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }

  try {
    // Get the appointment before deleting to send email
    const appointment = await collections.appointments?.findOne({ _id: new ObjectId(id) });
    
    if (!appointment) {
      return res.status(404).json({ error: `Appointment with id ${id} not found` });
    }

    const query = { _id: new ObjectId(id) };

    // Send cancellation email if appointment has a user
    if (appointment.userId) {
      try {
        const user = await collections.users?.findOne({ _id: appointment.userId }) as unknown as User;
        if (user) {
          const emailSent = await EmailService.sendAppointmentCancelledEmail(user, appointment);
          if (emailSent) {
            console.log(`Appointment cancellation email sent to ${user.email}`);
          } else {
            console.log(`Failed to send appointment cancellation email to ${user.email}`);
          }
        }
      } catch (emailError) {
        console.error('Error sending appointment cancellation email:', emailError);
        // Don't fail deletion if email fails
      }
    }

    const result = await collections.appointments?.deleteOne(query);

    if (result?.deletedCount && result.deletedCount > 0) {
      res.status(200).json({ message: `Appointment with id ${id} deleted successfully` });
    } else {
      res.status(404).json({ error: `Appointment with id ${id} not found` });
    }
  } catch (error) {
    console.error(`Error deleting appointment ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
