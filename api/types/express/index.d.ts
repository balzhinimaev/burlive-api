// types/express/index.d.ts

import { IUser } from '../../src/models/User'; // Убедитесь, что путь верный
import { ISuggestedWordModel } from '../../src/models/Vocabulary/SuggestedWordModel'; // Убедитесь, что путь верный
import { JwtPayload } from 'jsonwebtoken';
import { Server } from 'socket.io'; // Импорт для io?: Server;

// Структура декодированного JWT payload
// Используется в authenticateToken и в Socket.IO middleware
export interface DecodedToken extends JwtPayload {
    // _id должен соответствовать типу ID в модели User
    // Если при создании токена вы используете user._id.toString(), то здесь будет string
    _id: string;
    sessionId?: string; // Если вы добавляете ID сессии в токен
    // Добавить другие поля, если они есть в токене (например, role)
}

declare global {
    namespace Express {
        interface Request {
            user?: IUser; // Тип пользователя из модели, прикрепляемый к запросу
            suggestedWord?: ISuggestedWordModel;
            telegram_user_id?: number;
            file?: Express.Multer.File;
            requestId?: string;
            io?: Server; // Экземпляр Socket.IO сервера
        }
    }
}

// Эта строка важна, чтобы файл обрабатывался как модуль
export {};
