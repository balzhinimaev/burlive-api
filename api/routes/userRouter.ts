// userRouter.ts
import express from 'express';
import userController from '../controllers/userController';

const userRouter = express.Router();

// Регистрация нового пользователя
userRouter.post('/register', userController.register);

// Вход пользователя
userRouter.post('/login', userController.login);

export default userRouter;
