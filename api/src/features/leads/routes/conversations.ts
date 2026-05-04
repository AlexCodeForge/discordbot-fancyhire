import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController';
import { authMiddleware } from '../../auth/middleware/auth';

const router = Router();

router.get('/', authMiddleware, ConversationController.getAll);

export default router;
