// dialogsRouter.ts
import express from 'express';
import dialogsController from '../controllers/dialogsController';

const dialogsRouter = express.Router();

// Маршрут для получения всех предложений
dialogsRouter.post('/', dialogsController.create)
dialogsRouter.get('/save', dialogsController.save)

export default dialogsRouter;
