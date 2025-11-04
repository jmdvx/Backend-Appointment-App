import { Request, Response } from 'express';
import { collections } from '../database';
import { BlockedDate } from '../models/blockedDate';
import { ObjectId } from 'mongodb';

// Get all blocked dates
export const getAllBlockedDates = async (req: Request, res: Response) => {
  try {
    if (!collections.blockedDates) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const blockedDates = (await collections.blockedDates.find({}).toArray()) as unknown as BlockedDate[];
    res.status(200).json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
};

// Get blocked dates for specific month
export const getBlockedDatesByMonth = async (req: Request, res: Response) => {
  const { year, month } = req.params;
  
  try {
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }
    
    // Create date range for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split('T')[0]; // Last day of month
    
    const blockedDates = (await collections.blockedDates?.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray()) as unknown as BlockedDate[];
    
    res.status(200).json(blockedDates);
  } catch (error) {
    console.error(`Error fetching blocked dates for ${year}/${month}:`, error);
    res.status(500).json({ error: 'Failed to fetch blocked dates for month' });
  }
};

// Check if specific date is blocked
export const checkDateBlocked = async (req: Request, res: Response) => {
  const { date } = req.params;
  
  try {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const blockedDate = (await collections.blockedDates?.findOne({ date })) as unknown as BlockedDate;
    
    if (blockedDate) {
      res.status(200).json({
        blocked: true,
        reason: blockedDate.reason,
        date: blockedDate.date
      });
    } else {
      res.status(200).json({
        blocked: false,
        date: date
      });
    }
  } catch (error) {
    console.error(`Error checking if date ${date} is blocked:`, error);
    res.status(500).json({ error: 'Failed to check date' });
  }
};

// Get blocked dates in date range
export const getBlockedDatesInRange = async (req: Request, res: Response) => {
  const { start, end } = req.query;
  
  try {
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start as string) || !/^\d{4}-\d{2}-\d{2}$/.test(end as string)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const blockedDates = (await collections.blockedDates?.find({
      date: {
        $gte: start,
        $lte: end
      }
    }).toArray()) as unknown as BlockedDate[];
    
    res.status(200).json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates in range:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates in range' });
  }
};

// Create new blocked date
export const createBlockedDate = async (req: Request, res: Response) => {
  try {
    if (!collections.blockedDates) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { date, reason, recurringPattern = 'none' } = req.body;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Check if date is already blocked
    const existingBlockedDate = await collections.blockedDates.findOne({ date });
    if (existingBlockedDate) {
      return res.status(409).json({ error: 'Date is already blocked' });
    }
    
    const newBlockedDate: BlockedDate = {
      date,
      reason,
      recurringPattern,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collections.blockedDates.insertOne(newBlockedDate);
    
    if (result) {
      res.status(201).json({
        message: 'Blocked date created successfully',
        id: result.insertedId,
        date: newBlockedDate.date,
        reason: newBlockedDate.reason,
        recurringPattern: newBlockedDate.recurringPattern
      });
    } else {
      res.status(500).json({ error: 'Failed to create blocked date' });
    }
  } catch (error) {
    console.error('Error creating blocked date:', error);
    res.status(500).json({ error: 'Failed to create blocked date' });
  }
};

// Update blocked date
export const updateBlockedDate = async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid blocked date ID' });
  }
  
  try {
    if (!collections.blockedDates) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { date, reason, recurringPattern } = req.body;
    
    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Check if updating to a date that's already blocked (by another record)
    if (date) {
      const existingBlockedDate = await collections.blockedDates.findOne({ 
        date, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (existingBlockedDate) {
        return res.status(409).json({ error: 'Date is already blocked by another record' });
      }
    }
    
    const updateData: Partial<BlockedDate> = {
      updatedAt: new Date()
    };
    
    if (date) updateData.date = date;
    if (reason) updateData.reason = reason;
    if (recurringPattern) updateData.recurringPattern = recurringPattern;
    
    const result = await collections.blockedDates.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result?.matchedCount === 0) {
      return res.status(404).json({ error: 'Blocked date not found' });
    }
    
    if (result?.modifiedCount && result.modifiedCount > 0) {
      res.status(200).json({ message: 'Blocked date updated successfully' });
    } else {
      res.status(400).json({ error: 'No changes made to blocked date' });
    }
  } catch (error) {
    console.error(`Error updating blocked date ${id}:`, error);
    res.status(500).json({ error: 'Failed to update blocked date' });
  }
};

// Delete blocked date by ID
export const deleteBlockedDate = async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid blocked date ID' });
  }
  
  try {
    if (!collections.blockedDates) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const result = await collections.blockedDates.deleteOne({ _id: new ObjectId(id) });
    
    if (result?.deletedCount && result.deletedCount > 0) {
      res.status(200).json({ message: 'Blocked date deleted successfully' });
    } else {
      res.status(404).json({ error: 'Blocked date not found' });
    }
  } catch (error) {
    console.error(`Error deleting blocked date ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete blocked date' });
  }
};

// Delete blocked date by date
export const deleteBlockedDateByDate = async (req: Request, res: Response) => {
  const { date } = req.params;
  
  try {
    if (!collections.blockedDates) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await collections.blockedDates.deleteOne({ date });
    
    if (result?.deletedCount && result.deletedCount > 0) {
      res.status(200).json({ message: 'Blocked date deleted successfully' });
    } else {
      res.status(404).json({ error: 'Blocked date not found' });
    }
  } catch (error) {
    console.error(`Error deleting blocked date for ${date}:`, error);
    res.status(500).json({ error: 'Failed to delete blocked date' });
  }
};

// PERMANENT SOLUTION: Bulk operations for blocked dates management

// Clear ALL blocked dates (permanent fix for sync issues)
export const clearAllBlockedDates = async (req: Request, res: Response) => {
  try {
    const result = await collections.blockedDates?.deleteMany({});
    
    res.status(200).json({
      message: 'All blocked dates cleared successfully',
      deletedCount: result?.deletedCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing all blocked dates:', error);
    res.status(500).json({ error: 'Failed to clear all blocked dates' });
  }
};

// Block multiple dates at once
export const blockMultipleDates = async (req: Request, res: Response) => {
  try {
    const { dates, reason = 'Day blocked off', recurringPattern = 'none' } = req.body;
    
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required and must not be empty' });
    }
    
    // Validate all dates
    for (const date of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: `Invalid date format: ${date}. Use YYYY-MM-DD` });
      }
    }
    
    const blockedDates: BlockedDate[] = dates.map(date => ({
      date,
      reason,
      recurringPattern,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await collections.blockedDates?.insertMany(blockedDates, { ordered: false });
    
    console.log(`Successfully blocked ${result?.insertedCount || 0} dates`);
    
    res.status(201).json({
      message: 'Multiple dates blocked successfully',
      insertedCount: result?.insertedCount || 0,
      blockedDates: dates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error blocking multiple dates:', error);
    res.status(500).json({ error: 'Failed to block multiple dates' });
  }
};

// Get blocked dates summary (for frontend sync)
export const getBlockedDatesSummary = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    
    let query = {};
    if (start && end) {
      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start as string) || !/^\d{4}-\d{2}-\d{2}$/.test(end as string)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      
      query = {
        date: {
          $gte: start,
          $lte: end
        }
      };
    }
    
    const blockedDates = (await collections.blockedDates?.find(query).toArray()) as unknown as BlockedDate[];
    
    const summary = {
      totalBlockedDates: blockedDates.length,
      blockedDates: blockedDates.map(bd => ({ date: bd.date, reason: bd.reason })),
      dateRange: start && end ? { start, end } : 'all',
      lastUpdated: new Date().toISOString(),
      syncStatus: 'current'
    };
    
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting blocked dates summary:', error);
    res.status(500).json({ error: 'Failed to get blocked dates summary' });
  }
};

// Validate blocked dates consistency
export const validateBlockedDatesConsistency = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    
    
    // Get all blocked dates
    const allBlockedDates = (await collections.blockedDates?.find({}).toArray()) as unknown as BlockedDate[];
    
    // Get blocked dates in range if specified
    let rangeBlockedDates: BlockedDate[] = [];
    if (start && end) {
      rangeBlockedDates = (await collections.blockedDates?.find({
        date: {
          $gte: start,
          $lte: end
        }
      }).toArray()) as unknown as BlockedDate[];
    }
    
    // Check for duplicates
    const dateSet = new Set();
    const duplicates: string[] = [];
    allBlockedDates.forEach(bd => {
      if (dateSet.has(bd.date)) {
        duplicates.push(bd.date);
      } else {
        dateSet.add(bd.date);
      }
    });
    
    const validation = {
      isValid: duplicates.length === 0,
      totalBlockedDates: allBlockedDates.length,
      rangeBlockedDates: rangeBlockedDates.length,
      duplicates: duplicates,
      issues: duplicates.length > 0 ? [`Found ${duplicates.length} duplicate dates`] : [],
      timestamp: new Date().toISOString()
    };
    
    console.log('Validation result:', JSON.stringify(validation, null, 2));
    
    res.status(200).json(validation);
  } catch (error) {
    console.error('Error validating blocked dates consistency:', error);
    res.status(500).json({ error: 'Failed to validate blocked dates consistency' });
  }
};

// Admin endpoint to force sync blocked dates
export const forceSyncBlockedDates = async (req: Request, res: Response) => {
  try {
    
    // Get current state
    const allBlockedDates = (await collections.blockedDates?.find({}).toArray()) as unknown as BlockedDate[];
    
    // Remove duplicates
    const uniqueDates = new Map();
    allBlockedDates.forEach(bd => {
      if (!uniqueDates.has(bd.date)) {
        uniqueDates.set(bd.date, bd);
      }
    });
    
    const uniqueBlockedDates = Array.from(uniqueDates.values());
    
    // Clear all and re-insert unique ones
    await collections.blockedDates?.deleteMany({});
    
    if (uniqueBlockedDates.length > 0) {
      await collections.blockedDates?.insertMany(uniqueBlockedDates);
    }
    
    const syncResult = {
      message: 'Blocked dates sync completed successfully',
      originalCount: allBlockedDates.length,
      uniqueCount: uniqueBlockedDates.length,
      duplicatesRemoved: allBlockedDates.length - uniqueBlockedDates.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sync result:', JSON.stringify(syncResult, null, 2));
    
    res.status(200).json(syncResult);
  } catch (error) {
    console.error('Error forcing blocked dates sync:', error);
    res.status(500).json({ error: 'Failed to force sync blocked dates' });
  }
};

// Debug endpoint removed - use /summary or /validate endpoints instead
