import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { authenticateDevice } from '../middleware/auth';

const router = Router();

// All device API routes require device authentication via API key
router.post('/heartbeat', authenticateDevice, DeviceController.heartbeat);
router.post('/validate-code', authenticateDevice, DeviceController.validateCode);
router.post('/log-event', authenticateDevice, DeviceController.logEvent);

export default router;
