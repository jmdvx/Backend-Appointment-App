import { Request, Response } from 'express';
import { collections } from '../database';
import { BlockedDate } from '../models/blockedDate';
import { ObjectId } from 'mongodb';

// Get all blocked dates
export const getAllBlockedDates = async (req: Request, res: Response) => {
  try {
    const blockedDates = (await collections.blockedDates?.find({}).toArray()) as unknown as BlockedDate[];
    
    console.log('=== GET ALL BLOCKED DATES DEBUG ===');
    console.log('Total blocked dates found:', blockedDates.length);
    console.log('Blocked dates:', blockedDates.map(bd => ({ date: bd.date, reason: bd.reason })));
    
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
    
    console.log('=== GET BLOCKED DATES IN RANGE DEBUG ===');
    console.log('Requested range:', { start, end });
    
    const blockedDates = (await collections.blockedDates?.find({
      date: {
        $gte: start,
        $lte: end
      }
    }).toArray()) as unknown as BlockedDate[];
    
    console.log('Blocked dates in range:', blockedDates.length);
    console.log('Blocked dates details:', blockedDates.map(bd => ({ date: bd.date, reason: bd.reason })));
    
    // Check specifically for Friday Oct 24, 2025
    const fridayOct24 = blockedDates.find(bd => bd.date === '2025-10-24');
    console.log('Friday Oct 24, 2025 blocked?', fridayOct24 ? 'YES' : 'NO');
    if (fridayOct24) {
      console.log('Friday Oct 24 details:', fridayOct24);
    }
    
    res.status(200).json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates in range:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates in range' });
  }
};

// Create new blocked date
export const createBlockedDate = async (req: Request, res: Response) => {
  try {
    const { date, reason, recurringPattern = 'none' } = req.body;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Check if date is already blocked
    const existingBlockedDate = await collections.blockedDates?.findOne({ date });
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
    
    const result = await collections.blockedDates?.insertOne(newBlockedDate);
    
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
    const { date, reason, recurringPattern } = req.body;
    
    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Check if updating to a date that's already blocked (by another record)
    if (date) {
      const existingBlockedDate = await collections.blockedDates?.findOne({ 
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
    
    const result = await collections.blockedDates?.updateOne(
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
    const result = await collections.blockedDates?.deleteOne({ _id: new ObjectId(id) });
    
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
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await collections.blockedDates?.deleteOne({ date });
    
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

// Debug endpoint for frontend troubleshooting
export const debugBlockedDates = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    
    console.log('=== DEBUG BLOCKED DATES ENDPOINT ===');
    console.log('Requested range:', { start, end });
    
    // Get all blocked dates
    const allBlockedDates = (await collections.blockedDates?.find({}).toArray()) as unknown as BlockedDate[];
    
    // Get blocked dates in range if range provided
    let rangeBlockedDates: BlockedDate[] = [];
    if (start && end) {
      rangeBlockedDates = (await collections.blockedDates?.find({
        date: {
          $gte: start,
          $lte: end
        }
      }).toArray()) as unknown as BlockedDate[];
    }
    
    // Check specific dates
    const oct21 = allBlockedDates.find(bd => bd.date === '2025-10-21');
    const oct22 = allBlockedDates.find(bd => bd.date === '2025-10-22');
    const oct23 = allBlockedDates.find(bd => bd.date === '2025-10-23');
    const oct24 = allBlockedDates.find(bd => bd.date === '2025-10-24');
    
    const debugInfo = {
      totalBlockedDates: allBlockedDates.length,
      allBlockedDates: allBlockedDates.map(bd => ({ date: bd.date, reason: bd.reason })),
      rangeBlockedDates: rangeBlockedDates.map(bd => ({ date: bd.date, reason: bd.reason })),
      specificDates: {
        '2025-10-21': oct21 ? { blocked: true, reason: oct21.reason } : { blocked: false },
        '2025-10-22': oct22 ? { blocked: true, reason: oct22.reason } : { blocked: false },
        '2025-10-23': oct23 ? { blocked: true, reason: oct23.reason } : { blocked: false },
        '2025-10-24': oct24 ? { blocked: true, reason: oct24.reason } : { blocked: false }
      },
      requestedRange: { start, end }
    };
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Failed to get debug info' });
  }
};
