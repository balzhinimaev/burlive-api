<template>
    <div class="dashboard-page">
        <HeadingPage title="Профиль" :back_button="false" />

        <div v-if="user" class="user-info" style="
                gap: 5px;
                display: flex;
                flex-direction: column;">
            <div>
                <p><strong>User ID:</strong> {{ user.id }}</p>
            </div>
            <div>
                <p><strong>Имя пользователя:</strong> {{ user.c_username || 'Неизвестно' }}</p>
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
        </div>

        <div class="user-info more">
            <!-- <h6><b>More</b></h6> -->
            <ul>
                <li>
                    <button class="btn" @click="goToReferralProgram">
                        <div class="icon">💰</div>
                        <div class="content">
                            <div class="content-heading">
                                <p>Программа реферальная</p>
                            </div>
                            <div class="content-body">
                                <p style="font-size: 12px; color: #666;">Зарабатывайте с BurLive</p>
                            </div>
                        </div>
                        <div class="arrow-right">
                            <svg width="8" height="14" viewBox="0 0 6 11" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M5.34821 5.27192C5.33894 5.40156 5.28649 5.52436 5.19925 5.6207L1.01382 10.2712C0.962768 10.328 0.901033 10.3741 0.832138 10.4071C0.763243 10.44 0.688537 10.459 0.612285 10.4631C0.536034 10.4671 0.45973 10.4561 0.387733 10.4307C0.315735 10.4052 0.249454 10.3659 0.192672 10.3148C0.135891 10.2638 0.0897232 10.202 0.0568043 10.1331C0.0238854 10.0642 0.00486054 9.98952 0.000816144 9.91327C-0.00322825 9.83702 0.00778706 9.76071 0.033233 9.68872C0.0586789 9.61673 0.0980571 9.55045 0.149119 9.49368L3.98576 5.23194L0.149119 0.970224C0.0980571 0.913448 0.0586789 0.847176 0.033233 0.775181C0.00778706 0.703187 -0.00322825 0.626885 0.000816144 0.550633C0.00486054 0.474381 0.0238854 0.399668 0.0568043 0.330769C0.0897232 0.26187 0.135891 0.200122 0.192672 0.149067C0.249454 0.0980117 0.315735 0.05864 0.387733 0.0332024C0.45973 0.00776469 0.536034 -0.00323723 0.612285 0.000815906C0.688537 0.00486904 0.763243 0.0239055 0.832138 0.0568323C0.901033 0.089759 0.962768 0.135935 1.01382 0.192722L5.19925 4.8432C5.25156 4.90102 5.2917 4.96877 5.31729 5.04242C5.34288 5.11607 5.3534 5.19412 5.34821 5.27192Z"
                                    :fill="theme === 'light' ? 'black' : 'white'" />
                            </svg>
                        </div>
                    </button>
                </li>
                <li>
                    <button class="btn" @click="goToNews">
                        <div class="icon">🗞</div>
                        <div class="content">
                            <div class="content-heading">
                                <p>Наши новости</p>
                            </div>
                            <div class="content-body">
                                <p style="font-size: 12px; color: #666;">t.me/bur_live</p>
                            </div>
                        </div>
                        <div class="arrow-right">
                            <svg width="8" height="14" viewBox="0 0 6 11" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M5.34821 5.27192C5.33894 5.40156 5.28649 5.52436 5.19925 5.6207L1.01382 10.2712C0.962768 10.328 0.901033 10.3741 0.832138 10.4071C0.763243 10.44 0.688537 10.459 0.612285 10.4631C0.536034 10.4671 0.45973 10.4561 0.387733 10.4307C0.315735 10.4052 0.249454 10.3659 0.192672 10.3148C0.135891 10.2638 0.0897232 10.202 0.0568043 10.1331C0.0238854 10.0642 0.00486054 9.98952 0.000816144 9.91327C-0.00322825 9.83702 0.00778706 9.76071 0.033233 9.68872C0.0586789 9.61673 0.0980571 9.55045 0.149119 9.49368L3.98576 5.23194L0.149119 0.970224C0.0980571 0.913448 0.0586789 0.847176 0.033233 0.775181C0.00778706 0.703187 -0.00322825 0.626885 0.000816144 0.550633C0.00486054 0.474381 0.0238854 0.399668 0.0568043 0.330769C0.0897232 0.26187 0.135891 0.200122 0.192672 0.149067C0.249454 0.0980117 0.315735 0.05864 0.387733 0.0332024C0.45973 0.00776469 0.536034 -0.00323723 0.612285 0.000815906C0.688537 0.00486904 0.763243 0.0239055 0.832138 0.0568323C0.901033 0.089759 0.962768 0.135935 1.01382 0.192722L5.19925 4.8432C5.25156 4.90102 5.2917 4.96877 5.31729 5.04242C5.34288 5.11607 5.3534 5.19412 5.34821 5.27192Z"
                                    :fill="theme === 'light' ? 'black' : 'white'" />
                            </svg>
                        </div>
                    </button>
                </li>
                <li>
                    <button class="btn" @click="goToContact">
                        <div class="icon">💬</div>
                        <div class="content">
                            <div class="content-heading">
                                <p>Связаться с нами</p>
                            </div>
                            <div class="content-body">
                                <p style="font-size: 12px; color: #666;">Помощь, партнерство, и тд</p>
                            </div>
                        </div>
                        <div class="arrow-right">
                            <svg width="8" height="14" viewBox="0 0 6 11" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M5.34821 5.27192C5.33894 5.40156 5.28649 5.52436 5.19925 5.6207L1.01382 10.2712C0.962768 10.328 0.901033 10.3741 0.832138 10.4071C0.763243 10.44 0.688537 10.459 0.612285 10.4631C0.536034 10.4671 0.45973 10.4561 0.387733 10.4307C0.315735 10.4052 0.249454 10.3659 0.192672 10.3148C0.135891 10.2638 0.0897232 10.202 0.0568043 10.1331C0.0238854 10.0642 0.00486054 9.98952 0.000816144 9.91327C-0.00322825 9.83702 0.00778706 9.76071 0.033233 9.68872C0.0586789 9.61673 0.0980571 9.55045 0.149119 9.49368L3.98576 5.23194L0.149119 0.970224C0.0980571 0.913448 0.0586789 0.847176 0.033233 0.775181C0.00778706 0.703187 -0.00322825 0.626885 0.000816144 0.550633C0.00486054 0.474381 0.0238854 0.399668 0.0568043 0.330769C0.0897232 0.26187 0.135891 0.200122 0.192672 0.149067C0.249454 0.0980117 0.315735 0.05864 0.387733 0.0332024C0.45973 0.00776469 0.536034 -0.00323723 0.612285 0.000815906C0.688537 0.00486904 0.763243 0.0239055 0.832138 0.0568323C0.901033 0.089759 0.962768 0.135935 1.01382 0.192722L5.19925 4.8432C5.25156 4.90102 5.2917 4.96877 5.31729 5.04242C5.34288 5.11607 5.3534 5.19412 5.34821 5.27192Z"
                                    :fill="theme === 'light' ? 'black' : 'white'" />
                            </svg>
                        </div>
                    </button>
                </li>
            </ul>
        </div>

        <div class="user-info">
            <div class="theme-switch">
                <button class="theme-button btn" :class="theme === 'light' ? 'btn-light' : 'btn-dark'"
                    @click="toggleTheme()">
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
    width: 100%;
    box-shadow: 0px 2px 8px var(--inner-component-shadow);
    margin: auto auto 20px auto;
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
