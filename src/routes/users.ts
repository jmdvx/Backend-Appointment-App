import express, {Router} from 'express';
import {validate} from '../middleware/validate.middleware';
import {createUserSchema, updateUserSchema}  from '../models/user';

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  cleanupUsers,
} from '../controllers/users';

const router: Router = express.Router();

// User routes
router.get('/', getUsers);
router.post('/login', loginUser);
router.delete('/cleanup', cleanupUsers); // Admin cleanup endpoint (must be before /:id)
router.get('/:id', getUserById);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;