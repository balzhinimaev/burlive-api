<template>
    <div class="dashboard-page">
        <UserInfo></UserInfo>
        <header>
            <div class="container">
                <div v-if="user" class="user-info" style="
                gap: 5px;
                display: flex;
                flex-direction: column;">
                    <div>
                        <p><strong>User ID:</strong> {{ user.id }}</p>
                    </div>
                    <div>
                        <p><strong>Email:</strong> {{ user.email || 'Нет данных' }}</p>
                    </div>
                    <div>
                        <p><strong>Имя:</strong> {{ user.first_name || 'Нет данных' }}</p>
                    </div>
                    <div>
                        <p>
                            <strong>Дата регистрации:</strong>
                            {{ user.createdAt ? formattedDate(user.createdAt) : 'Неизвестно' }}
                        </p>
                    </div>
                    <div>
                        <p><strong>Рейтинг:</strong> {{ user.rating || 'Нет данных' }}</p>
                    </div>
                    <select class="form-select" aria-label="Default select example">
                        <option selected>Open this select menu</option>
                        <option value="1">One</option>
                        <option value="2">Two</option>
                        <option value="3">Three</option>
                    </select>
                </div>
            </div>
        </header>

        <!-- <div class="premium-card">
            <h2>BurLive Premium</h2>
            <p>Получи безлимитный доступ с подпиской</p>
            <button class="subscribe-button">Подписаться</button>
        </div> -->
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
// Навигационные функции
const goToReferralProgram = () => {
    // Логика перехода
};
const goToNews = () => {
    // Логика перехода
};
const goToContact = () => {
    // Логика перехода
};
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

onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: `/` });
        });
    }
});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.MainButton.hide();
        window.Telegram.WebApp.MainButton.disable();
        window.Telegram.WebApp.BackButton.offClick();
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
    // margin-bottom: 20px;
    background-color: var(--background-component-color);
    border-radius: 12px;
    padding: 16px;
    width: 100%;
    box-shadow: 0px 2px 8px var(--inner-component-shadow);
    // margin: auto auto 20px auto;
    p {
        &:last-child {
            margin: 0;
        }
    }

    &.more {
        padding: 0;
        border-radius: 0;
        h6 {
            padding: 16px;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        ul {
            list-style-type: none;
            margin: 0;
            padding: 0;
            li {
                display: flex;
                button {
                    display: flex;
                    padding: 8px 16px;
                    margin: 0;
                    border: 0;
                    width: 100%;
                    text-align: left;
                    background-color: var(--background-component-color);
                    border-radius: 0;
                    p {
                        color: var(--text-color)
                    }
                    &:hover, &:active {
                        background-color: var(--button-hover-background);
                    }
                    .arrow-right {
                        margin: auto 8px auto auto;
                        svg, path {
                            fill: #666;
                        }
                    }
                }
                .icon {
                    margin: auto 16px auto 0;
                }
                // margin-bottom: 10px;
                &:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }
    // Удалите следующую строку для удаления анимации
    // transition: background-color 0.6s ease, color 0.6s ease;
}

.theme-button {
    position: relative;
    overflow: hidden;
    border-radius: 25px;
    padding: 8px 16px;
    font-size: 16px;
    cursor: pointer;

    &:hover {
        background-color: var(--button-hover-background);
        color: var(--text-color);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

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
