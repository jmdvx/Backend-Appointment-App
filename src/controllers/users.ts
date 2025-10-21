import { Request, Response } from 'express';
import { collections } from '../database';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

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
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
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
    const users = await collections.users?.find(filterObj).toArray();
    res.json(users);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Issue with GET ${error.message}`)
    }
    res.status(500).json({ 'error': 'get failed' });
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

  console.log(req.body); //for now still log the data

  const { name, phonenumber, email, password, dob, role } = req.body;
  
  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const newUser: User = {
    name: name, 
    phonenumber: phonenumber, 
    email: email, 
    password: hashedPassword,
    dob: dob,
    role: role || "user",
    dateJoined: new Date(), 
    lastUpdated: new Date()
  }

  try {
    const result = await collections.users?.insertOne(newUser)

    if (result) {
      res.status(201).location(`${result.insertedId}`).json({ message: `Created a new user with id ${result.insertedId}` })
    }
    else {
      res.status(500).send("Failed to create a new user.");
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(`issue with inserting ${error.message}`);
    }
    else {
      console.log(`error with ${error}`)
    }
  }

};


export const updateUser = async (req: Request, res: Response) => {

  const id: string = req.params.id;

  const { name, phonenumber, dob } = req.body
  const newData: Partial<User> = {
    name: name, phonenumber: phonenumber, dob: dob,
    lastUpdated: new Date()
  }

  try {

    const query = { _id: new ObjectId(id) };
    const result = await collections.users?.updateOne(query, { $set: newData });

    console.table(result)

    if (result) {
      if (result.modifiedCount > 0) {
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
    const query = { _id: new ObjectId(id) };

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
      console.log(`issue with inserting ${error.message}`);
    }
    else {
      console.log(`error with ${error}`)
    }

    res.status(400).send(`Unable to create new user`);
  }



};
