// src/errors/customErrors.ts

/**
 * Базовый класс для всех ожидаемых ошибок приложения.
 * Позволяет централизованно обрабатывать ошибки и присваивать им HTTP статус-коды.
 * Свойство 'name' будет автоматически установлено равным имени класса ошибки.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    // Убираем 'public readonly name: string;', так как оно уже есть у Error
    // public readonly name: string;

    // Убираем параметр 'name' из конструктора
    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        // Убираем 'this.name = name;'
        // this.name = name;

        // Восстанавливаем цепочку прототипов для корректной работы instanceof
        Object.setPrototypeOf(this, new.target.prototype);
        // Исключаем конструктор из стека вызовов
        Error.captureStackTrace(this, this.constructor);
    }
}

// --- Ошибки Валидации (400 Bad Request) ---
export class ValidationError extends AppError {
    // Просто вызываем super с нужными параметрами
    constructor(message: string = 'Ошибка валидации входных данных') {
        super(message, 400);
    }
}

// --- Ошибки Аутентификации (401 Unauthorized) ---
export class AuthenticationError extends AppError {
    constructor(
        message: string = 'Ошибка аутентификации. Пожалуйста, войдите в систему.',
    ) {
        super(message, 401);
    }
}

// --- Ошибки Авторизации / Доступа (403 Forbidden) ---
export class ForbiddenError extends AppError {
    constructor(message: string = 'Доступ запрещен. У вас недостаточно прав.') {
        super(message, 403);
    }
}

// --- Ошибки "Не найдено" (404 Not Found) ---
export class NotFoundError extends AppError {
    constructor(message: string = 'Запрашиваемый ресурс не найден') {
        super(message, 404);
    }
}
// Специфичная ошибка "Пользователь не найден"
export class UserNotFoundError extends NotFoundError {
    constructor(message: string = 'Пользователь не найден') {
        super(message); // Статус код 404 унаследуется
        // Убираем 'this.name = 'UserNotFoundError';'
    }
}

// --- Ошибки Конфликта (409 Conflict) ---
export class ConflictError extends AppError {
    constructor(message: string = 'Конфликт ресурса') {
        super(message, 409);
    }
}
// Специфичная ошибка "Пользователь уже существует"
export class UserExistsError extends ConflictError {
    constructor(
        message: string = 'Пользователь с такими данными уже существует',
    ) {
        super(message); // Статус код 409 унаследуется
        // Убираем 'this.name = 'UserExistsError';'
    }
}

// --- Ошибки Сервера (5xx) ---

// Ошибка конфигурации (500 Internal Server Error)
export class ConfigurationError extends AppError {
    constructor(message: string = 'Ошибка конфигурации сервера') {
        super(message, 500);
    }
}

// Общая ошибка базы данных (500 Internal Server Error)
export class DatabaseError extends AppError {
    constructor(
        message: string = 'Произошла ошибка при обращении к базе данных',
    ) {
        super(message, 500);
    }
}

// Ошибка внешнего сервиса (502 Bad Gateway / 503 Service Unavailable)
export class ExternalServiceError extends AppError {
    // Убираем параметр name из super
    constructor(
        message: string = 'Ошибка при обращении к внешнему сервису',
        statusCode: 502 | 503 = 502,
    ) {
        super(message, statusCode);
    }
}

// Можно добавить и другие типы ошибок по мере необходимости...

// Определяем LevelUpdateError где-то (можно в customErrors.ts)
export class LevelUpdateError extends AppError {
  cause: Error | undefined;
  constructor(message: string, cause?: Error) {
    super(message, 500); // Или другой статус
    this.cause = cause;
    Object.setPrototypeOf(this, LevelUpdateError.prototype);
  }
}