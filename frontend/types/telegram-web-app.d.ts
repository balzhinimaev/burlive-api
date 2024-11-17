// types/telegram-web-app.d.ts
interface TelegramWebApp {
    BackButton: {
        show(): void;
        hide(): void;
        onClick(callback: () => void): void;
        offClick(callback?: () => void): void;
        isVisible: boolean;
    };
    initDataUnsafe?: {
        user: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
        };
        [key: string]: any; // Позволяет расширять объект дополнительными свойствами
    };
    setHeaderColor(color: string): void;
    setBackgroundColor(color: string): void;
    setBottomBarColor(color: string): void;
    setFooterColor(color: string): void;
    openTelegramLink: any;
    themeParams: {
        background_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    colorScheme: "light" | "dark";
    // Другие свойства и методы WebApp
}

interface Telegram {
    WebApp: TelegramWebApp;
}

interface Window {
    Telegram?: Telegram;
}