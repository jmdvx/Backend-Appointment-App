
import { z } from "zod";
import { ObjectId} from 'mongodb'
import { ObjectIdSchema } from "./objectidSchema";

export interface Attendee {
  name: string;
  email: string;
  rsvp: "yes" | "no" | "maybe";
}

export interface Appointment {
  id?: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  date: Date; 
  location: string;
  attendees: Attendee[];
}


export const attendeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  rsvp: z.enum(["yes", "no", "maybe"])
});



export const createAppointmentSchema = z.object({
  userId: ObjectIdSchema.optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.coerce.date(),
  location: z.string().min(1, "Location is required"),
  attendees: z.array(attendeeSchema)
});




