import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'WebRTC-HLS Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.get('/mediasoup', (req: Request, res: Response) => {
  // Add mediasoup health check here
  res.json({
    status: 'ok',
    message: 'Mediasoup services are healthy',
  });
});

export default router;
