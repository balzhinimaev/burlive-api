// src/middleware/authorizeAdmin.ts

import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User'; // Импортируем тип IUser из модели
import logger from '../utils/logger'; // Рекомендуется для логирования попыток доступа

// Локальное определение IUser и declare global НЕ НУЖНЫ,
// так как предполагается, что они определены централизованно.

/**
 * Middleware для проверки прав администратора.
 * Требует успешного выполнения предшествующего middleware аутентификации,
 * который устанавливает `req.user` (типа IUser).
 * Предоставляет доступ только если `req.user.role === 'admin'`.
 */
const authorizeAdmin = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    // Тип Request уже должен быть расширен через глобальные декларации
    const user = req.user as IUser | undefined; // Получаем пользователя из запроса

    // Проверяем наличие пользователя и его роль
    if (user && user.role === 'admin') {
        // Пользователь аутентифицирован и является администратором
        // logger.debug(`Admin access granted: User ${user._id} to ${req.method} ${req.originalUrl}`); // Опциональное логирование успеха
        next(); // Разрешаем доступ к следующему обработчику
    } else {
        // Пользователь либо не аутентифицирован, либо не администратор
        const userId = user ? user._id : 'anonymous/unauthenticated';
        logger.warn(
            `Forbidden access attempt: User [${userId}] lacks admin role for ${req.method} ${req.originalUrl}`,
        );
        res.status(403).json({
            message: 'Access Denied: Administrator privileges required.',
        });
        // Завершаем обработку запроса, отправляя ответ 403
    }
};

export default authorizeAdmin;
