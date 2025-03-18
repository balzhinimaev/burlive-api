import express from 'express';
import taskController from '../controllers/taskController';
import authenticateToken from '../middleware/authenticateToken';

const router = express.Router();

// Создание нового задания (доступно, например, администраторам)
router.post('/create', authenticateToken, taskController.createTask);

// Получение списка заданий
router.get('/', authenticateToken, taskController.getTasks);

// Получение списка заданий пользователем с возвратом выполненных заданий и не выполненных
router.get('/:userId/:promotionId', authenticateToken, taskController.getTasksExtended);

// Подтверждение выполнения задания
router.post('/complete', authenticateToken, taskController.completeTask);

export default router;
