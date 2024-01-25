// vocabularyRouter.ts
import express from 'express';
import sentencesController from '../controllers/sentenceController';

const vocabularyRouter = express.Router();

// Маршрут для получения всех предложений
vocabularyRouter.get('/', sentencesController.getAllSentences);

// Маршрут для создания нового предложения
vocabularyRouter.post('/', sentencesController.createSentence);

// Маршрут для получения предложения
vocabularyRouter.get('/:id', sentencesController.getSentence);

// Маршрут для обновления статуса предложения
vocabularyRouter.put('/:id/status', sentencesController.updateStatus);

// Маршрут для принятия предложения для перевода
vocabularyRouter.put('/:id/accept', sentencesController.acceptSentence);

// Маршрут для отклонения предложения
vocabularyRouter.put('/:id/reject', sentencesController.rejectSentence);

export default vocabularyRouter;
