<template>
    <div class="profile-page">
        <header>
            <h2 class="heading">Профиль</h2>
        </header>

        <main>
            <section class="user-info">
                <div class="avatar">
                    <img :src="user?.photo_url || defaultAvatar" alt="User Avatar" />
                </div>

                <div class="details">
                    <p v-if="user?.first_name || user?.last_name" class="username">
                        {{ user?.first_name || '' }} {{ user?.last_name || '' }}
                    </p>
                    <p v-if="user?.username" class="username">@{{ user?.username }}</p>
                    <p v-if="!user?.username" class="placeholder">Неизвестный пользователь</p>
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <p class="stat-value">12</p>
                        <p class="stat-label">Модулей пройдено</p>
                    </div>
                    <div class="stat-item">
                        <p class="stat-value">37</p>
                        <p class="stat-label">Слов добавлено</p>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

// Дефолтный аватар на случай отсутствия фото пользователя
const defaultAvatar = 'https://via.placeholder.com/100?text=User';

// Состояние для хранения данных о пользователе
const user = ref<any | null>(null);

onMounted(() => {
    const tg = (window as any).Telegram.WebApp;
    user.value = tg.initDataUnsafe?.user || null; // Получаем информацию о пользователе
});
</script>

<style scoped lang="scss">
.profile-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    /* Полная высота экрана */
    padding: 32px 16px;
    background: linear-gradient(to bottom right, #f0f4f8, #ffffff);
}

.heading {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #333;
    text-align: center;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.avatar {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border: 2px solid #ddd;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.details {
    text-align: center;

    .username {
        font-weight: 600;
        font-size: 18px;
        margin-bottom: 4px;
        color: #333;
    }

    .placeholder {
        font-size: 14px;
        color: #888;
    }
}

.stats {
    display: flex;
    gap: 24px;
    justify-content: center;
    margin-top: 16px;

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
            font-weight: 700;
            font-size: 24px;
            color: #007bff;
        }

        .stat-label {
            font-size: 14px;
            color: #555;
        }
    }
}
</style>
