// Общие типы, не привязанные к домену

export interface PaginatedResult<T> {
    items: T[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
}

// Переименовал PaginatedWords для большей универсальности
export interface PaginatedWords<T> extends PaginatedResult<T> {
    words: T[]; // Оставил для обратной совместимости, если где-то используется words
    totalWords: number; // Оставил для обратной совместимости
}

// Можете добавить сюда другие общие типы/интерфейсы
