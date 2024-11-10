// src/middleware/authorizeAdmin.ts

import { Request, Response, NextFunction } from 'express';

// Предполагается, что у вас есть механизм аутентификации, который добавляет user к Request
interface IUser {
    _id: string;
    role: string; // Например, 'admin', 'user' и т.д.
}

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'admin') {
        next(); // Пользователь является администратором, продолжаем выполнение
    } else {
        res.status(403).json({ message: 'Доступ запрещён: требуется административные права.' });
    }
};

export default authorizeAdmin;
