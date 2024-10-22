<template>
    <div class="dashboard-page">
        <HeadingPage title="Профиль" />

        <div v-if="user" class="user-info">
            <div style="margin-bottom: 10px;">
                <p><strong>User ID</strong></p>
                <p>{{ user.id }}</p>
            </div>
            <p><strong>Email</strong></p>
            <p>{{ user.email || 'Нет данных' }}</p>
        </div>

        <div class="premium-card">
            <h2>BurLive Premium</h2>
            <p>Получи безлимитный доступ с подпиской</p>
            <button class="subscribe-button">Подписаться</button>
        </div>

        <div class="theme-switch">
            <p>Текущая тема: {{ theme }}</p>
            <button @click="toggleTheme">
                {{ theme === 'light' ? 'Переключиться на темную' : 'Переключиться на светлую' }}
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';

// Подключаем хранилища
const userStore = useUserStore();
const themeStore = useThemeStore();

const user = userStore.user;
const theme = themeStore.theme;

const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    themeStore.saveTheme(newTheme);
};
</script>


<style scoped lang="scss">
.user-info {
    margin-bottom: 20px;
    background-color: var(--background-color, #ffffff);
    border-radius: 12px;
    padding: 16px;
    width: 300px;
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05);
    text-align: left;
    margin: auto auto 20px auto;

    p {
        margin: 4px 0;
        font-size: 14px;
        color: var(--text-color, #1f2937);
        font-family: 'Nunito', sans-serif;
    }
}

.premium-card {
    background: linear-gradient(45deg, #7f00ff, #e100ff);
    border-radius: 16px;
    padding: 20px;
    color: white;
    text-align: center;
    width: 300px;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
    margin: 20px auto 0;
}

.subscribe-button {
    background-color: white;
    color: #7f00ff;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
    }
}

.theme-switch {
    margin-top: 20px;
    text-align: center;

    button {
        background-color: #007bff;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s;

        &:hover {
            background-color: #0056b3;
        }
    }
}
</style>
