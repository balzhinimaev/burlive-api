// types/telegram-web-app.d.ts
interface TelegramWebApp {
    BackButton: {
        show(): void;
        hide(): void;
        onClick(callback: () => void): void;
        offClick(callback?: () => void): void;
        isVisible: boolean;
    };
    // Другие свойства и методы WebApp
}

interface Telegram {
    WebApp: TelegramWebApp;
}

interface Window {
    Telegram?: Telegram;
}