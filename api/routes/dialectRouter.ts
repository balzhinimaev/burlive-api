// dialectRouter.ts
import express from 'express';
import dialectController from '../controllers/dialectController';

const dialectRouter = express.Router();

// Создание нового диалекта
dialectRouter.post('/create', dialectController.create);

export default dialectRouter;
