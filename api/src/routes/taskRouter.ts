import express from 'express';
import taskController from '../controllers/taskController';
import authenticateToken from '../middleware/authenticateToken';

const router = express.Router();

// Создание нового задания (доступно, например, администраторам)
router.post('/create', authenticateToken, taskController.createTask);

// Получение списка заданий
router.get('/', authenticateToken, taskController.getTasks);

// Подтверждение выполнения задания
router.post('/complete', authenticateToken, taskController.completeTask);

export default router;
