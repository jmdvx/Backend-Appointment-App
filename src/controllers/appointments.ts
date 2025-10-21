import { Request, Response } from 'express';
import { collections } from '../database';
import { Appointment } from '../models/appointment';
import { ObjectId } from 'mongodb';

// Get all appointments
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = (await collections.appointments?.find({}).toArray()) as unknown as Appointment[];
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
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

// Create new appointment
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { userId, title, description, date, location, attendees } = req.body;
    
    console.log('=== CREATE APPOINTMENT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('userId from request:', userId);
    console.log('userId type:', typeof userId);
    
    let finalUserId = userId;
    
    // If no userId provided, try to find it from the attendee's email
    if (!userId || userId === '000000000000000000000000') {
      console.log('No valid userId provided, attempting to find user by email...');
      
      if (attendees && attendees.length > 0) {
        const attendeeEmail = attendees[0].email;
        console.log('Looking up user by email:', attendeeEmail);
        
        try {
          // Make email lookup case-insensitive
          const user = await collections.users?.findOne({ 
            email: { $regex: new RegExp(`^${attendeeEmail}$`, 'i') }
          });
          if (user) {
            finalUserId = user._id.toString();
            console.log('Found user ID:', finalUserId);
          } else {
            console.log('No user found with email:', attendeeEmail);
            return res.status(400).json({ error: 'User not found. Please ensure you are logged in.' });
          }
        } catch (error) {
          console.error('Error looking up user:', error);
          return res.status(500).json({ error: 'Failed to find user' });
        }
      } else {
        console.log('No attendees provided');
        return res.status(400).json({ error: 'User ID is required' });
      }
    }
    
    if (!finalUserId) {
      console.log('ERROR: No userId available');
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const newAppointment: Appointment = {
      userId: new ObjectId(finalUserId),
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
      res.status(201).json({ 
        message: 'Appointment created successfully',
        id: result.insertedId 
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
    const query = { _id: new ObjectId(id) };
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
