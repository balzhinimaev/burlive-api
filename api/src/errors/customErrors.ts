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

/**
 * Представляет ошибку, возникшую при взаимодействии с базой данных.
 * Обычно соответствует HTTP статусу 500 (Internal Server Error).
 * Позволяет сохранить исходную ошибку в поле `cause` для отладки.
 */
export class DatabaseError extends AppError {
    /**
     * Дополнительная информация об исходной ошибке, если она доступна.
     * Полезно для отладки ошибок, возникших на уровне драйвера БД или ORM.
     * @type {Error | undefined}
     */
    public readonly cause?: Error;

    /**
     * Создает экземпляр DatabaseError.
     * @param {string} [message='Произошла ошибка при обращении к базе данных'] - Сообщение об ошибке, понятное пользователю или для логов.
     * @param {Error} [cause] - (Опционально) Исходная ошибка, которая привела к возникновению DatabaseError.
     */
    constructor(
        message: string = 'Произошла ошибка при обращении к базе данных',
        cause?: Error, // Добавляем опциональный параметр cause
    ) {
        super(message, 500); // Вызываем конструктор AppError со статусом 500
        this.cause = cause; // Сохраняем исходную ошибку

        // Установка прототипа выполняется в базовом классе AppError через new.target.prototype,
        // поэтому явный вызов Object.setPrototypeOf здесь обычно не требуется,
        // если только не нужна специфическая логика для этого конкретного класса.
        // Object.setPrototypeOf(this, DatabaseError.prototype);
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
    public readonly cause?: Error; // Поле cause уже было здесь
    constructor(message: string, cause?: Error) {
        super(message, 500); // Или другой статус
        this.cause = cause;
        Object.setPrototypeOf(this, LevelUpdateError.prototype); // Здесь может быть нужен, если есть своя логика
    }
}