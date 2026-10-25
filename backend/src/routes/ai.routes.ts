import { Router } from 'express';
import { analyzeStatus, chatWithAiHandler } from '../controllers/ai.controller';
import { aiRateLimiter } from '../middlewares/rateLimiter';
import { groqService } from '../services/groq.service';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    success: true,
    provider: 'Groq LPU AI',
    health: groqService.getHealth(),
  });
});

router.post('/analyze-status', aiRateLimiter, analyzeStatus);
router.post('/chat', aiRateLimiter, chatWithAiHandler);

export default router;
