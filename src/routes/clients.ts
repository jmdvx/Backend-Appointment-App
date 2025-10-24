import express, {Router} from 'express';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/users';

const router: Router = express.Router();

// Client routes (mapped to users but with client-specific format)
router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
