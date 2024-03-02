// userRouter.ts
import express from 'express';
import userController from '../controllers/userController';
import authenticateToken from '../middleware/authenticateToken';

const userRouter = express.Router();

// Регистрация нового пользователя
userRouter.post('/register', userController.register);

// Вход пользователя
userRouter.post('/login', userController.login);

userRouter.put('/update-user-data', authenticateToken, userController.updateName);

// Получение пользователя 2
userRouter.get('/getMe', authenticateToken, userController.getMe);  

// Получение пользователя
userRouter.get('/:id', userController.getUser);

// Получение всех пользоваталей
userRouter.get('/', userController.getAllPublicUsers);

// Получение всех пользоваталей
userRouter.put('/set-profile-photo', authenticateToken, userController.setProfilePhoto);

export default userRouter;
