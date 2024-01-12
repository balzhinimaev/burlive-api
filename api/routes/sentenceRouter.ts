// sentencesRouter.ts
import express from 'express';
import suggestionController from '../controllers/sentenceController';

const sentencesRouter = express.Router();

// Маршрут для получения всех предложений
sentencesRouter.get('/', suggestionController.getAllSentences);

// Маршрут для создания нового предложения
sentencesRouter.post('/', suggestionController.createSentence);

// Маршрут для обновления статуса предложения
sentencesRouter.put('/:id/status', suggestionController.updateStatus);

// Маршрут для принятия предложения для перевода
sentencesRouter.put('/:id/accept', suggestionController.acceptSentence);

// Маршрут для отклонения предложения
sentencesRouter.put('/:id/reject', suggestionController.rejectSentence);

export default sentencesRouter;
