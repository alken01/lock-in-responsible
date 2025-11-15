import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';

const router = Router();

// No auth required for demo
router.get('/', DeviceController.listDevices);
router.post('/', DeviceController.createDevice);
router.get('/:deviceId', DeviceController.getDevice);
router.patch('/:deviceId', DeviceController.updateDevice);
router.delete('/:deviceId', DeviceController.deleteDevice);
router.post('/:deviceId/unlock', DeviceController.generateUnlockCode);
router.post('/:deviceId/lock', DeviceController.lockDevice);

export default router;
