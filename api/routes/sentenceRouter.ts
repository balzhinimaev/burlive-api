// sentencesRouter.ts
import express from 'express';
import sentencesController from '../controllers/sentenceController';

const sentencesRouter = express.Router();

// Маршрут для получения всех предложений
sentencesRouter.get('/', sentencesController.getAllSentences);

// Маршрут для создания нового предложения
sentencesRouter.post('/', sentencesController.createSentence);

// Маршрут для получения предложения
sentencesRouter.get('/:id', sentencesController.getSentence);

// Маршрут для обновления статуса предложения
sentencesRouter.put('/:id/status', sentencesController.updateStatus);

// Маршрут для принятия предложения для перевода
sentencesRouter.put('/:id/accept', sentencesController.acceptSentence);

// Маршрут для отклонения предложения
sentencesRouter.put('/:id/reject', sentencesController.rejectSentence);

export default sentencesRouter;
