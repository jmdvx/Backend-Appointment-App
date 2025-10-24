import { ObjectId } from "mongodb";
import { z } from 'zod';

export interface User {
    _id?: ObjectId;
    id?: ObjectId;
    name: string;
    phonenumber?: string;
    email: string;
    password: string;
    dob?: Date;
    dateJoined?: Date,
    lastUpdated?: Date,
    role?: "admin" | "user",
    roles?: string[]; // Array of role strings for flexible role management
    // Client-specific fields
    notes?: string;
    isBanned?: boolean;
    preferences?: {
        favoriteServices?: string[];
        preferredTimes?: string[];
        allergies?: string;
        specialRequests?: string;
    };
}

export const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    dob: z.coerce.date().refine(date => date <= new Date(), {
  message: "Date of birth cannot be in the future",}).optional(),
    phonenumber: z.string().regex(/^08[3-9]\d{7,8}$/, {
        message: "Invalid Irish mobile number. Must start with 08 followed by 3-9 and 7-8 digits."
    }).optional(),
    role: z.enum(["admin", "user"]).optional().default("user"),
    roles: z.array(z.string()).optional().default([]), // Array of role strings
    // Client-specific fields
    notes: z.string().optional(),
    isBanned: z.boolean().optional().default(false),
    preferences: z.object({
        favoriteServices: z.array(z.string()).optional(),
        preferredTimes: z.array(z.string()).optional(),
        allergies: z.string().optional(),
        specialRequests: z.string().optional()
    }).optional()
});

// Simplified registration schema for frontend compatibility
export const registerUserSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name must be less than 100 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z.string()
        .email("Invalid email address")
        .max(255, "Email must be less than 255 characters")
        .toLowerCase(),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password must be less than 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    phonenumber: z.string()
        .regex(/^08[3-9]\d{7,8}$/, {
            message: "Invalid Irish mobile number. Must start with 08 followed by 3-9 and 7-8 digits."
        }).optional(),
    phone: z.string()
        .regex(/^08[3-9]\d{7,8}$/, {
            message: "Invalid Irish mobile number. Must start with 08 followed by 3-9 and 7-8 digits."
        }).optional(),
    dob: z.coerce.date()
        .refine(date => date <= new Date(), {
            message: "Date of birth cannot be in the future"
        })
        .refine(date => {
            const age = new Date().getFullYear() - date.getFullYear();
            return age >= 13 && age <= 120;
        }, {
            message: "Age must be between 13 and 120 years"
        }).optional()
}).refine((data) => {
    // Ensure at least one phone field is provided
    return data.phonenumber || data.phone;
}, {
    message: "Phone number is required",
    path: ["phonenumber"]
});


export const updateUserSchema = z.object({
  name: z.string().min(1),
  dob: z.coerce.date().refine(date => date <= new Date(), {
  message: "Date of birth cannot be in the future",}),
    phonenumber: z.string().regex(/^08[3-9]\d{7,8}$/, {
        message: "Invalid Irish mobile number. Must start with 08 followed by 3-9 and 7-8 digits."
    }),
    // Client-specific fields
    notes: z.string().optional(),
    isBanned: z.boolean().optional(),
    roles: z.array(z.string()).optional(), // Array of role strings for updates
    preferences: z.object({
        favoriteServices: z.array(z.string()).optional(),
        preferredTimes: z.array(z.string()).optional(),
        allergies: z.string().optional(),
        specialRequests: z.string().optional()
    }).optional()
});