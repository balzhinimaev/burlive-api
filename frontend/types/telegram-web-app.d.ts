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
            photo_url?: string;
        };
        [key: string]: any; // Позволяет расширять объект дополнительными свойствами
    };
    setHeaderColor(color: string): void;
    setBackgroundColor(color: string): void;
    setBottomBarColor(color: string): void;
    setFooterColor(color: string): void;
    expand: any;
    openTelegramLink: any;
    themeParams: {
        background_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        section_bg_color?: string;
        bottom_bar_bg_color?: string;
        theme?: string;
    };
    platform: string;
    MainButton: any;
    isFullscreen: boolean;
    enableClosingConfirmation: any;
    disableVerticalSwipes: any;
    showPopup: any;
    colorScheme: "light" | "dark";
    onEvent: any;
    // Другие свойства и методы WebApp
}

interface Telegram {
    WebApp: TelegramWebApp;
}

interface Window {
    Telegram?: Telegram;
}