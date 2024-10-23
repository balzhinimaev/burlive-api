<template>
    <div class="dashboard-page">
        <HeadingPage title="Профиль" :back_button="false" />

        <div v-if="user" class="user-info">
            <div>
                <p><strong>User ID:</strong> {{ user.id }}</p>
            </div>
            <p><strong>Имя пользователя:</strong> {{ user.c_username || 'Неизвестно' }}</p>
            <p><strong>Email:</strong> {{ user.email || 'Нет данных' }}</p>
            <p><strong>Имя:</strong> {{ user.first_name || 'Нет данных' }}</p>
            <p>
                <strong>Дата регистрации:</strong>
                {{ user.createdAt ? formattedDate(user.createdAt) : 'Неизвестно' }}
            </p>
            <p><strong>Рейтинг:</strong> {{ user.rating || 'Нет данных' }}</p>
        </div>

        <div class="user-info">
            <div class="theme-switch">
                <button class="theme-button ripple" @click="toggleTheme()" :disabled="isAnimating">
                    {{ theme === 'light' ? '🌞 Светлая' : '🌙 Тёмная' }}
                </button>
            </div>
        </div>

        <div class="premium-card">
            <h2>BurLive Premium</h2>
            <p>Получи безлимитный доступ с подпиской</p>
            <button class="subscribe-button">Подписаться</button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import { useUserStore } from '@/stores/userStore';
import { gsap } from 'gsap';
const isAnimating = ref(false);
// Хранилища
const themeStore = useThemeStore();
const userStore = useUserStore();

// Реактивные переменные
const theme = computed(() => themeStore.theme);
const user = computed(() => userStore.user);
// Переключение темы
const toggleTheme = async () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    if (!user || !user.value) {
        return false
    }
    themeStore.saveTheme(newTheme);
};

// Форматирование даты
const formattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

// Инициализация пользователя
onBeforeMount(async () => {
    const tg = (window as any).Telegram.WebApp;
    const tgUser = tg.initDataUnsafe?.user;

    if (tgUser) {
        const userExists = await userStore.checkUserExists(tgUser.id);
        if (!userExists) {
            await userStore.createUser({
                id: tgUser.id,
                username: tgUser.username || '',
                first_name: tgUser.first_name || '',
                email: tgUser.email || '',
            });
        }
    }
});
</script>

<style scoped lang="scss">
.dashboard-page {
    padding-bottom: 20px;
    background-color: var(--background-color);
    color: var(--text-color);
    transition: $custom-transition;
    // Удалите следующую строку для удаления анимации
    // transition: background-color 0.6s ease, color 0.6s ease;
}

.user-info {
    margin-bottom: 20px;
    background-color: var(--background-component-color);
    border-radius: 12px;
    padding: 16px;
    width: 300px;
    box-shadow: 0px 2px 8px var(--inner-component-shadow);
    margin: auto auto 20px auto;
    // Удалите следующую строку для удаления анимации
    // transition: background-color 0.6s ease, color 0.6s ease;
}

.theme-button {
    position: relative;
    overflow: hidden;
    background-color: transparent;
    border: 2px solid currentColor;
    border-radius: 25px;
    padding: 8px 16px;
    font-size: 16px;
    cursor: pointer;
    // Удалите следующую строку для удаления анимации
    // transition: background-color 0.3s, color 0.3s;

    &:hover {
        background-color: var(--button-hover-background);
        color: white;
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    // Псевдоэлемент для ripple-эффекта
    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    // Удалите всю эту секцию для удаления анимации ripple
    // &:active::before {
    //     width: 200%;
    //     height: 200%;
    //     transition: width 0.6s ease-out, height 0.6s ease-out, opacity 1s ease-out;
    //     opacity: 0;
    // }
}

.premium-card {
    background: linear-gradient(45deg, var(--primary-color), #e100ff);
    border-radius: 16px;
    padding: 20px;
    color: white;
    text-align: center;
    width: 300px;
    box-shadow: 0px 4px 12px var(--shadow-color);
    margin: 20px auto 0;
    // Удалите следующую строку для удаления анимации
    // transition: background-color 0.6s ease, color 0.6s ease;
}

.subscribe-button {
    background-color: white;
    color: var(--primary-color);
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    // Удалите следующую строку для удаления анимации
    // transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0px 2px 8px var(--shadow-color);
    }
}
</style>
