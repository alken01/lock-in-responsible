import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { authenticate, requireOwnership } from '../middleware/auth';

const router = Router();

// User endpoints (require authentication)
router.get('/', authenticate, DeviceController.listDevices);
router.post('/pair', authenticate, DeviceController.pairDevice);
router.get('/:deviceId', authenticate, requireOwnership('device'), DeviceController.getDevice);
router.patch(
  '/:deviceId',
  authenticate,
  requireOwnership('device'),
  DeviceController.updateDevice
);
router.delete(
  '/:deviceId',
  authenticate,
  requireOwnership('device'),
  DeviceController.deleteDevice
);
router.post(
  '/:deviceId/unlock',
  authenticate,
  requireOwnership('device'),
  DeviceController.requestUnlock
);

export default router;
