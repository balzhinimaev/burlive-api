// Простая утилита для проверки ошибок
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

// Сюда можно добавлять другие type guards
