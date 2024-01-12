import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import JwtTokenModel from '../models/Token'; // Путь к вашей модели JwtToken
import logger from '../utils/logger';
import mongoose from 'mongoose';

interface AuthRequestBody {
    password: string;
    email: string;
}

export interface AuthRequest extends Request {
    user: {
        userId?: string
    }
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Отсутствует токен аутентификации' });
    }

    try {
        const decoded = jwt.verify(token, process.env.jwt_secret) as { userId: string };

        // Проверка наличия токена в базе данных
        const existingToken = await JwtTokenModel.findOne({ userId: decoded.userId, token });

        if (!existingToken) {
            return res.status(401).json({ message: 'Неверный токен аутентификации' });
        }

        // Инициализация req.user, если еще не инициализирован
        if (!req.user) {
            req.user = {};
        }

        // Установка userId в объект запроса для последующих обработчиков
        req.user.userId = decoded.userId;

        logger.info(`Токен верифицирован для ${existingToken.userId}`);
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Неверный токен аутентификации' });
    }
};


export default authenticateToken;
