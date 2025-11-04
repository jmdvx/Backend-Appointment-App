import express, { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { createBlockedDateSchema, updateBlockedDateSchema, dateRangeSchema } from '../models/blockedDate';

import {
  getAllBlockedDates,
  getBlockedDatesByMonth,
  checkDateBlocked,
  getBlockedDatesInRange,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
  deleteBlockedDateByDate,
  // PERMANENT SOLUTION: New bulk operations
  clearAllBlockedDates,
  blockMultipleDates,
  getBlockedDatesSummary,
  validateBlockedDatesConsistency,
  forceSyncBlockedDates,
} from '../controllers/blockedDates';

const router: Router = express.Router();

// Get all blocked dates
router.get('/', getAllBlockedDates);

// Get blocked dates for specific month
router.get('/month/:year/:month', getBlockedDatesByMonth);

// Check if specific date is blocked
router.get('/check/:date', checkDateBlocked);

// Get blocked dates in date range
router.get('/range', getBlockedDatesInRange);

// Create new blocked date
router.post('/', validate(createBlockedDateSchema), createBlockedDate);

// Update blocked date
router.put('/:id', validate(updateBlockedDateSchema), updateBlockedDate);

// Delete blocked date by ID
router.delete('/:id', deleteBlockedDate);

// Delete blocked date by date
router.delete('/date/:date', deleteBlockedDateByDate);

// PERMANENT SOLUTION: Bulk operations for blocked dates management
// Clear ALL blocked dates (emergency fix)
router.delete('/clear-all', clearAllBlockedDates);

// Block multiple dates at once
router.post('/bulk-block', blockMultipleDates);

// Get blocked dates summary (for frontend sync)
router.get('/summary', getBlockedDatesSummary);

// Validate blocked dates consistency
router.get('/validate', validateBlockedDatesConsistency);

// Force sync blocked dates (admin only)
router.post('/force-sync', forceSyncBlockedDates);

export default router;
