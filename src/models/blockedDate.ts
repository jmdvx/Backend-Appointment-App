import { z } from "zod";
import { ObjectId } from 'mongodb';

export interface BlockedDate {
  id?: ObjectId;
  date: string; // YYYY-MM-DD format
  reason: string;
  recurringPattern?: 'none' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export const createBlockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  reason: z.string().min(1, "Reason is required"),
  recurringPattern: z.enum(['none', 'weekly', 'monthly', 'yearly']).optional().default('none')
});

export const updateBlockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  reason: z.string().min(1, "Reason is required").optional(),
  recurringPattern: z.enum(['none', 'weekly', 'monthly', 'yearly']).optional()
});

export const dateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
});
