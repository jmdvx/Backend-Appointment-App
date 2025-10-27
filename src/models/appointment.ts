
import { z } from "zod";
import { ObjectId} from 'mongodb'
import { ObjectIdSchema } from "./objectidSchema";

export interface Attendee {
  name: string;
  email: string;
  phone?: string; // Add phone number field
  rsvp: "yes" | "no" | "maybe";
}

export interface Appointment {
  id?: ObjectId;
  userId?: ObjectId; // Make userId optional for walk-ins
  title: string;
  description?: string;
  date: Date; 
  location: string;
  attendees: Attendee[];
  cancelled?: boolean; // Flag to mark cancelled appointments
  cancellationReason?: string; // Reason for cancellation
}


export const attendeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(), // Add phone number validation
  rsvp: z.enum(["yes", "no", "maybe"])
});



export const createAppointmentSchema = z.object({
  userId: z.string().optional(), // Accept any string, not just ObjectIds
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.coerce.date(),
  location: z.string().min(1, "Location is required"),
  attendees: z.array(attendeeSchema)
});




