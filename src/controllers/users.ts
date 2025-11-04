import { Request, Response } from 'express';
import { collections } from '../database';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import EmailService from '../services/emailService';

export const loginUser = async (req: Request, res: Response) => {
  // Login user with email and password
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  try {
    // Find user by email
    const user = await collections.users?.findOne({ email: email }) as unknown as User;
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ error: "Your account has been banned and you cannot access the system" });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Send login notification email
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const emailSent = await EmailService.sendLoginNotification(user, ipAddress);
      if (emailSent) {
        console.log(`Login notification email sent to ${user.email}`);
      } else {
        console.log(`Failed to send login notification email to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error sending login notification email:', emailError);
      // Don't fail login if email fails
    }
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword
    });
    
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Login error: ${error.message}`);
    }
    res.status(500).json({ error: "Login failed" });
  }
};

export const getUsers = async (req: Request, res: Response) => {

    const rawFilter = req.query.filter;
    let filterObj = {};

    if (typeof rawFilter === 'string') {
      try {
        filterObj = JSON.parse(rawFilter);
      } catch (err) {
        console.error("Invalid filter JSON:", err);
        return res.status(400).json({ error: "Invalid filter format" });
      }
    }

  try {
    if (!collections.users) {
      console.error('❌ Database collections not initialized - users collection is undefined');
      console.log('🔍 Collections status:', {
        users: !!collections.users,
        appointments: !!collections.appointments,
        blockedDates: !!collections.blockedDates
      });
      return res.status(500).json({ 
        error: 'Database not connected',
        details: 'Collections not initialized - check database connection'
      });
    }
    const users = await collections.users.find(filterObj).toArray();
    res.json(users);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Issue with GET users: ${error.message}`);
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({ 
      error: 'get failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  //get a single  user by ID from the database

  let id: string = req.params.id;
  try {
    const query = { _id: new ObjectId(id) };
    const user = (await collections.users?.findOne(query)) as unknown as User;

    if (user) {
      res.status(200).send(user);
    }
    else {
      res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
  } catch (error) {

    if (error instanceof Error) {
      console.log('Issue with GET for user ${id}  ${error.message}')
    }
    res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
  }
};

export const createUser = async (req: Request, res: Response) => {
  // create a new user in the database

  console.log('=== CREATE USER DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  // Check database connection first
  if (!collections.users) {
    console.error('❌ Database not connected - users collection unavailable');
    return res.status(500).json({ 
      error: 'Database not connected',
      message: 'Cannot create user - database connection failed'
    });
  }

  const { name, phonenumber, phone, email, password, dob, role } = req.body;
  
  // Validate required fields
  if (!name || !email || !password || (!phonenumber && !phone)) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Name, email, password, and phone number are required"
    });
  }

  // Check if user already exists
  try {
    const existingUser = await collections.users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        message: "An account with this email already exists"
      });
    }
  } catch (error) {
    console.error('Error checking existing user:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
  
  // Hash the password with increased salt rounds for better security
  const saltRounds = 12;
  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);
    return res.status(500).json({ error: "Error processing password" });
  }
  
  // Ensure phone number is properly handled
  let phoneNumber = phonenumber || phone;
  
  if (!phoneNumber || phoneNumber === '' || phoneNumber === null || phoneNumber === undefined) {
    return res.status(400).json({
      error: "Phone number required",
      message: "A valid Irish mobile number is required"
    });
  }
  
  console.log('Final phone number being saved:', phoneNumber);
  
  const newUser: User = {
    name: name.trim(), 
    phonenumber: phoneNumber, 
    email: email.toLowerCase().trim(), 
    password: hashedPassword,
    dob: dob,
    role: role || "user",
    dateJoined: new Date(), 
    lastUpdated: new Date()
  }
  
  console.log('=== NEW USER OBJECT ===');
  console.log('newUser.phonenumber:', newUser.phonenumber);

  try {
    const result = await collections.users.insertOne(newUser)

    if (result) {
      // Send welcome email to the new user
      try {
        const emailSent = await EmailService.sendWelcomeEmail(newUser);
        if (emailSent) {
          console.log(`Welcome email sent to ${newUser.email}`);
        } else {
          console.log(`Failed to send welcome email to ${newUser.email}`);
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail user creation if email fails
      }

      res.status(201).location(`${result.insertedId}`).json({ 
        message: `Created a new user with id ${result.insertedId}`,
        userId: result.insertedId,
        user: {
          id: result.insertedId,
          name: newUser.name,
          email: newUser.email,
          phonenumber: newUser.phonenumber,
          role: newUser.role,
          dateJoined: newUser.dateJoined
        }
      })
    }
    else {
      res.status(500).json({ error: "Failed to create a new user." });
    }
  }
  catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error) {
      // Handle duplicate key errors
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({
          error: "User already exists",
          message: "An account with this email already exists"
        });
      }
      res.status(500).json({ error: `Failed to create user: ${error.message}` });
    }
    else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
};


export const updateUser = async (req: Request, res: Response) => {

  const id: string = req.params.id;

  const { name, phonenumber, dob } = req.body
  
  // Set default phone number if not provided
  const phoneNumber = phonenumber || "080000000";
  
  const newData: Partial<User> = {
    name: name, 
    phonenumber: phoneNumber, 
    dob: dob,
    lastUpdated: new Date()
  }

  try {
    // Get the user before updating to track changes
    const user = await collections.users?.findOne({ _id: new ObjectId(id) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ message: `User ${id} not found` });
    }

    const query = { _id: new ObjectId(id) };
    const result = await collections.users?.updateOne(query, { $set: newData });

    console.table(result)

    if (result) {
      if (result.modifiedCount > 0) {
        // Track what changed for email notification
        const changes: string[] = [];
        if (name && name !== user.name) changes.push(`Name changed from "${user.name}" to "${name}"`);
        if (phonenumber && phonenumber !== user.phonenumber) changes.push(`Phone number updated`);
        if (dob && dob !== user.dob) changes.push(`Date of birth updated`);

        // Send profile update email if there were changes
        if (changes.length > 0) {
          try {
            const updatedUser = { ...user, ...newData };
            const emailSent = await EmailService.sendProfileUpdateEmail(updatedUser, changes);
            if (emailSent) {
              console.log(`Profile update email sent to ${user.email}`);
            } else {
              console.log(`Failed to send profile update email to ${user.email}`);
            }
          } catch (emailError) {
            console.error('Error sending profile update email:', emailError);
            // Don't fail update if email fails
          }
        }

        res.status(200).json({ message: `Updated User` })
      }
      else if (result.matchedCount == 1) {
        res.status(400).json({ message: `User found but no update` });
      }
      else {
        res.status(404).json({ "Message": `${id} not found ` });
      }
    }
    else {
      res.status(400).send(`Unable to update user ${req.params.id}`);
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(`eror with ${error.message}`);
    }
    else {
      console.error(error);
    }
    res.status(400).send(`Unable to update user ${req.params.id}`);
  }
};


export const deleteUser = async (req: Request, res: Response) => {

  let id: string = req.params.id;
  try {
    // Get user before deletion to send email
    const user = await collections.users?.findOne({ _id: new ObjectId(id) }) as unknown as User;
    
    if (!user) {
      return res.status(404).json({ message: `no user found with id ${id}` });
    }

    const query = { _id: new ObjectId(id) };

    // Send account deletion email before deleting
    try {
      const emailSent = await EmailService.sendAccountDeletionEmail(user);
      if (emailSent) {
        console.log(`Account deletion email sent to ${user.email}`);
      } else {
        console.log(`Failed to send account deletion email to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error sending account deletion email:', emailError);
      // Don't fail deletion if email fails
    }

    const result = await collections.users?.deleteOne(query);

    if (result && result.deletedCount) {
      res.status(204).json({ message: `Successfully removed user with id ${id}` });
    } else if (!result) {
      res.status(400).json({ message: `Failed to remove user with id ${id}` });
    } else if (result.deletedCount == 0) {
      res.status(404).json({ message: `no user found with id ${id}` });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(`issue with deleting user ${error.message}`);
    }
    else {
      console.log(`error with ${error}`)
    }

    res.status(400).send(`Unable to delete user`);
  }
};

export const getClients = async (req: Request, res: Response) => {
  // Get users formatted as clients for the frontend
  try {
    if (!collections.users) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const users = await collections.users.find({}).toArray();
    
    // Transform users to client format
    const clients = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phonenumber || "080000000", // Use phonenumber as phone, default to placeholder
      phonenumber: user.phonenumber || "080000000", // Also include phonenumber field
      notes: user.notes || '',
      isBanned: user.isBanned || false,
      roles: user.roles || [], // Include roles, default to empty array
      dateJoined: user.dateJoined || new Date(),
      preferences: user.preferences || {
        favoriteServices: [],
        preferredTimes: [],
        allergies: '',
        specialRequests: ''
      }
    }));
    
    res.json(clients);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Issue with GET clients: ${error.message}`)
    }
    res.status(500).json({ 'error': 'get clients failed' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  // Create a new client (user) in the database
  console.log('Creating client:', req.body);

  const { name, email, phone, notes, preferences, roles } = req.body;
  
  // Generate a temporary password (in real app, you'd send this via email)
  const tempPassword = 'temp123';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
  
  // Set default phone number if not provided
  const phoneNumber = phone || "080000000";
  
  const newUser: User = {
    name: name, 
    phonenumber: phoneNumber, // Map phone to phonenumber
    email: email, 
    password: hashedPassword,
    role: "user",
    roles: roles || [], // Default to empty array if no roles provided
    dateJoined: new Date(), 
    lastUpdated: new Date(),
    notes: notes,
    isBanned: false,
    preferences: preferences || {
      favoriteServices: [],
      preferredTimes: [],
      allergies: '',
      specialRequests: ''
    }
  }

  try {
    const result = await collections.users?.insertOne(newUser)

    if (result) {
      // Return client format (without password)
      const client = {
        _id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phonenumber,
        notes: newUser.notes,
        isBanned: newUser.isBanned,
        roles: newUser.roles || [], // Include roles in response
        dateJoined: newUser.dateJoined,
        preferences: newUser.preferences
      };
      
      res.status(201).json({ message: `Created a new client with id ${result.insertedId}`, client });
    }
    else {
      res.status(500).send("Failed to create a new client.");
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(`issue with inserting client ${error.message}`);
    }
    else {
      console.log(`error with ${error}`)
    }
    res.status(500).json({ error: "Failed to create client" });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  const { name, email, phone, notes, preferences, isBanned, roles } = req.body;
  
  // Set default phone number if not provided
  const phoneNumber = phone || "080000000";
  
  const newData: Partial<User> = {
    name: name,
    phonenumber: phoneNumber, // Map phone to phonenumber
    email: email,
    notes: notes,
    isBanned: isBanned,
    roles: roles, // Include roles in update
    preferences: preferences,
    lastUpdated: new Date()
  }

  try {
    const query = { _id: new ObjectId(id) };
    const result = await collections.users?.updateOne(query, { $set: newData });

    if (result) {
      if (result.modifiedCount > 0) {
        res.status(200).json({ message: `Updated Client` })
      }
      else if (result.matchedCount == 1) {
        res.status(400).json({ message: `Client found but no update` });
      }
      else {
        res.status(404).json({ "Message": `${id} not found ` });
      }
    }
    else {
      res.status(400).send(`Unable to update client ${req.params.id}`);
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(`error with updating client ${error.message}`);
    }
    else {
      console.error(error);
    }
    res.status(400).send(`Unable to update client ${req.params.id}`);
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  const id: string = req.params.id;
  
  console.log('=== DELETE CLIENT DEBUG ===');
  console.log('Client ID to delete:', id);
  
  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    console.error('Invalid ObjectId format:', id);
    return res.status(400).json({ error: 'Invalid client ID format' });
  }
  
  try {
    if (!collections.users) {
      console.error('Database not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const query = { _id: new ObjectId(id) };
    console.log('Query:', query);

    const result = await collections.users.deleteOne(query);
    console.log('Delete result:', result);

    if (result && result.deletedCount > 0) {
      console.log('✅ Client deleted successfully');
      return res.status(200).json({ 
        message: `Successfully removed client with id ${id}`,
        deletedCount: result.deletedCount
      });
    } else if (result.deletedCount === 0) {
      console.log('❌ No client found with id:', id);
      return res.status(404).json({ error: `No client found with id ${id}` });
    } else {
      console.log('❌ Delete operation failed');
      return res.status(500).json({ error: 'Failed to delete client' });
    }
  } catch (error) {
    console.error('❌ Error deleting client:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Provide more specific error messages
      if (error.message.includes('ObjectId')) {
        return res.status(400).json({ error: 'Invalid client ID format', details: error.message });
      }
      return res.status(500).json({ error: 'Failed to delete client', details: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to delete client' });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await collections.users?.findOne({ email: email }) as unknown as User;
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in user document (you might want to create a separate collection for this)
    await collections.users?.updateOne(
      { _id: user._id },
      { 
        $set: { 
          resetToken: resetToken,
          resetTokenExpiry: resetTokenExpiry
        }
      }
    );

    // Send password reset email
    try {
      const emailSent = await EmailService.sendPasswordResetEmail(user, resetToken);
      if (emailSent) {
        console.log(`Password reset email sent to ${user.email}`);
      } else {
        console.log(`Failed to send password reset email to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({ error: "Failed to send password reset email" });
    }

    res.status(200).json({ 
      message: "If an account with that email exists, a password reset link has been sent." 
    });

  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Find user with valid reset token
    const user = await collections.users?.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    }) as unknown as User;

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await collections.users?.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          lastUpdated: new Date()
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    );

    res.status(200).json({ message: "Password reset successfully" });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Update password (for logged-in users)
// Cleanup all users except user@example.com (admin only)
export const cleanupUsers = async (req: Request, res: Response) => {
  try {
    console.log('=== CLEANUP USERS DEBUG ===');
    
    // Find all users except user@example.com
    const usersToDelete = await collections.users?.find({ 
      email: { $ne: 'user@example.com' } 
    }).toArray();
    
    console.log(`Found ${usersToDelete?.length || 0} users to delete:`);
    usersToDelete?.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
    
    if (usersToDelete && usersToDelete.length > 0) {
      // Delete all users except user@example.com
      const result = await collections.users?.deleteMany({ 
        email: { $ne: 'user@example.com' } 
      });
      
      console.log(`✅ Deleted ${result?.deletedCount || 0} users successfully!`);
      
      res.status(200).json({ 
        message: `Successfully deleted ${result?.deletedCount || 0} users`,
        deletedCount: result?.deletedCount || 0
      });
    } else {
      console.log('✅ No users to delete (only user@example.com exists)');
      res.status(200).json({ 
        message: 'No users to delete (only user@example.com exists)',
        deletedCount: 0
      });
    }
    
    // Show remaining users
    const remainingUsers = await collections.users?.find({}).toArray();
    console.log(`📋 Remaining users (${remainingUsers?.length || 0}):`);
    remainingUsers?.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Phone: ${user.phonenumber}`);
    });
    
  } catch (error) {
    console.error('Error cleaning up users:', error);
    res.status(500).json({ error: 'Failed to cleanup users' });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Find user
    const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await collections.users?.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          lastUpdated: new Date()
        }
      }
    );

    // Send password update email
    try {
      const emailSent = await EmailService.sendPasswordUpdatedEmail(user);
      if (emailSent) {
        console.log(`Password update email sent to ${user.email}`);
      } else {
        console.log(`Failed to send password update email to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error sending password update email:', emailError);
      // Don't fail password update if email fails
    }

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: "Failed to update password" });
  }
};
