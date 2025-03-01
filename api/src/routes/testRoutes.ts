import { Router } from 'express';
import { getTestByLesson } from '../controllers/testController';
import authenticateToken from '../middleware/authenticateToken';

const router = Router();

// Получить тест для урока
router.get('/lesson/:lessonId', authenticateToken, getTestByLesson);

// Отправить ответы и зафиксировать прогресс
// router.post('/submit', authenticateToken, submitAnswers);

export default router;
