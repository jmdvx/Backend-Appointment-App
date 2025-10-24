import express, { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { registerUserSchema } from '../models/user';
import { createUser, loginUser, requestPasswordReset, resetPassword, updatePassword } from '../controllers/users';

const router: Router = express.Router();

// Auth routes for frontend compatibility
router.post('/register', validate(registerUserSchema), createUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.put('/update-password/:id', updatePassword);

export default router;
