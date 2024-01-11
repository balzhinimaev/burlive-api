import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import JwtTokenModel from '../models/Token'; // Путь к вашей модели JwtToken

interface AuthRequestBody {
    password: string;
    email: string;
}

export interface AuthRequest extends Request {
    userId: string
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

        req.userId = decoded.userId; // Добавляем userId в объект запроса для последующих обработчиков
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Неверный токен аутентификации' });
    }
};

export default authenticateToken;
