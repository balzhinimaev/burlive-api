import { Router } from 'express';
import {
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getAllQuestions,
} from '../controllers/questionController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate';
import { createQuestionValidators, updateQuestionValidators } from '../validators/questionValidators';

const router = Router();

// Создание нового вопроса
// Routes with cleaner validation code
router.post(
  '/',
  authenticateToken,
  authorizeAdmin,
  createQuestionValidators,
  validate,
  createQuestion
);

// Остальные роуты без изменений
router.get('/:questionId', authenticateToken, getQuestionById);
router.put(
    '/:questionId',
    authenticateToken,
    authorizeAdmin,
    updateQuestionValidators,
    validate,
    updateQuestion,
);
router.delete(
  '/:questionId',
  authenticateToken,
  authorizeAdmin,
  deleteQuestion,
);
router.get('/', authenticateToken, authorizeAdmin, getAllQuestions);

export default router;
