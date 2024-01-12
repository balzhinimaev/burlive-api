// translationsRouter.ts
import express from 'express';
import translationController from '../controllers/translationController';

const translationsRouter = express.Router();

// Маршрут для получения всех предложений
translationsRouter.get('/', translationController.getAllTranslations);

// Маршрут для создания нового предложения
translationsRouter.post('/', translationController.createTranslation);

// Маршрут для обновления статуса предложения
translationsRouter.put('/:id/status', translationController.updateStatus);

// Маршрут для принятия предложения для перевода
translationsRouter.put('/:id/accept', translationController.acceptTranslation);

// Маршрут для отклонения предложения
translationsRouter.put('/:id/reject', translationController.rejectTranslation);

export default translationsRouter;
