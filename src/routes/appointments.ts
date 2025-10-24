import express, { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { createAppointmentSchema } from '../models/appointment';

import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByUserId,
  getAppointmentsWithUserDetails,
} from '../controllers/appointments';

const router: Router = express.Router();

router.get('/', getAllAppointments);
router.get('/with-user-details', getAppointmentsWithUserDetails);
router.get('/user/:userId', getAppointmentsByUserId);
router.get('/:id', getAppointmentById);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
