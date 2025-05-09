<template>
    <div class="leaderboard-container">
        <div class="leaderboard-header">
            <h3 class="leaderboard-title">Топ 5 пользователей</h3>
            <div class="leaderboard-counter" v-if="leaderboard && leaderboard.length">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M8 1.33334L9.32933 5.50668H13.7147L10.1927 8.15999L11.5227 12.3333L8 9.68001L4.47733 12.3333L5.80733 8.15999L2.28533 5.50668H6.67067L8 1.33334Z"
                        fill="#4CAF50" />
                </svg>
                <span>{{ leaderboard.length }} {{ getNounPluralForm(leaderboard.length, 'участник', 'участника',
                    'участников') }}</span>
            </div>
        </div>

        <div class="leaderboard-wrapper">
            <!-- Индикатор загрузки -->
            <div v-if="isLeaderboardFetch" class="loading-indicator">
                <div class="spinner"></div>
                <span>Загрузка данных...</span>
            </div>

            <!-- Если данные есть, выводим список -->
            <div v-else-if="leaderboard && leaderboard.length" class="leaderboard-list">
                <div v-for="(userLeaderboard, index) in leaderboard.slice(0, 5)" :key="userLeaderboard._id"
                    :class="['leaderboard-item', { highlight: userLeaderboard.user && userLeaderboard.user.id === currentUserId }]">
                    <div class="leaderboard-item-content">
                        <div class="rank-column">{{ index + 1 }}</div>
                        <div class="user-column">
                            <div class="user-avatar">
                                <div class="user-avatar-placeholder">
                                    <svg v-if="!user.photo_url || typeof (userLeaderboard.user) === null" width="16"
                                        height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z"
                                            fill="#BBBBBB" />
                                        <path d="M8 9C5.33333 9 2 10.3333 2 13V14H14V13C14 10.3333 10.6667 9 8 9Z"
                                            fill="#BBBBBB" />
                                    </svg>
                                    <div v-if="userLeaderboard.user">
                                        <NuxtImg :src="userLeaderboard.user.photo_url" alt="" width="28" height="28"/>
                                    </div>
                                </div>
                            </div>
                            <div class="user-details">
                                <div class="user-name"
                                    v-if="userLeaderboard.user && (userLeaderboard.user.username || userLeaderboard.user.first_name)">
                                    {{ truncate(userLeaderboard.user.username || userLeaderboard.user.first_name) }}
                                </div>
                                <div class="user-name" v-else>
                                    Неизвестный пользователь
                                </div>
                            </div>
                        </div>
                        <div class="points-column">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M8 1.33334L9.32933 5.50668H13.7147L10.1927 8.15999L11.5227 12.3333L8 9.68001L4.47733 12.3333L5.80733 8.15999L2.28533 5.50668H6.67067L8 1.33334Z"
                                    fill="#4CAF50" />
                            </svg>
                            <span>{{ userLeaderboard.points }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Если данных нет -->
            <div v-else class="empty-state">
                <div class="empty-state-content">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 4L28.5 17.5H42L31 26L35.5 39.5L24 31L12.5 39.5L17 26L6 17.5H19.5L24 4Z"
                            fill="#888888" />
                    </svg>
                    <span>Станьте первым участником</span>
                </div>
            </div>
        </div>

        <!-- Если текущий пользователь не входит в топ-5 -->
        <div v-if="!isUserInTop5 && userRank && userRank > 5" class="user-rank-block">
            <div class="user-rank-content">
                <div class="user-rank-header">
                    <div class="user-rank-title">Ваше место:</div>
                    <div class="user-rank-number">{{ userRank }}</div>
                </div>
                <div class="user-rank-details">
                    <div class="user-name">{{ truncate(user?.username || user?.first_name) }}</div>
                    <div class="user-points">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M8 1.33334L9.32933 5.50668H13.7147L10.1927 8.15999L11.5227 12.3333L8 9.68001L4.47733 12.3333L5.80733 8.15999L2.28533 5.50668H6.67067L8 1.33334Z"
                                fill="#4CAF50" />
                        </svg>
                        <span>{{ userRating }}</span>
                    </div>
                </div>
            </div>
        </div>
        <TaskModal v-if="isModalVisible" :isVisible="isModalVisible" :isOpen="isModalVisible" :selectedTask="null"
            :isRegistrationSuccess="true" :isAlreadyRegistered="false" :userRank="userRank" :subscriptionStatus="null"
            :isChecking="false" :isRegistering="false" @close="isModalVisible = false" />
    </div>
</template>

<script lang="ts" setup>
import { useUserStore, type User } from '@/stores/userStore'
import { computed } from 'vue'

interface Props {
    user: User,
    promotionId: string
}
const props = defineProps<Props>()

const isModalVisible = ref(false)

// Проверяем, загружается ли лидерборд
const userStore = useUserStore()
const isLeaderboardFetch = computed(() => userStore.isFetchingLeaderboard)
const isLeaderboardFetchError = computed(() => userStore.isFetchingLeaderboardError)

// Функция для укорачивания длинных имен
const truncate = (value: string | undefined, maxLength = 16): string => {
    if (!value) return ''
    return value.length > maxLength ? value.slice(0, maxLength) + '...' : value
}

// Получаем данные лидерборда
const leaderboard = computed(() => userStore.getLeaderboard)
// В вашем компоненте leaderboard.vue:
const closeModal = () => {
    isModalVisible.value = false;
    // Обновляем данные после закрытия модального окна
    if (window.Telegram?.WebApp.initDataUnsafe?.user?.id) {
        userStore.fetchLeaderboard(
            props.promotionId,
            window.Telegram?.WebApp.initDataUnsafe?.user.id
        );
    }
}
// Получаем ID текущего пользователя
const currentUserId = computed(() => props.user.id)

// Проверяем, входит ли пользователь в топ-5
const isUserInTop5 = computed(() => {
    if (!userRank.value) return false
    return userRank.value <= 5
})

// Определяем позицию пользователя в общем списке
const userRank = computed(() => {
    if (!leaderboard.value || !currentUserId.value) return null
    const index = leaderboard.value.findIndex(
        (u) => u.user && u.user.id === currentUserId.value
    )
    return index >= 0 ? index + 1 : null
})

// Вычисляем рейтинг пользователя
const userRating = computed(() => {
    if (!leaderboard.value || !currentUserId.value) return null
    const found = leaderboard.value.find((u) => u.user && u.user.id === currentUserId.value)
    return found ? found.points : null
})

// Получение правильной формы слова для русского языка
const getNounPluralForm = (number: number, one: string, two: string, five: string) => {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}
const isParticipation = computed(() => userStore.getResponseCheckParicipation)
const shouldShowMainButton = computed(() => {
    // Проверяем статус участия пользователя
    // Обратите внимание: 404 означает, что пользователь не участвует
    return isParticipation.value === 404;
});

// Обработчик клика по кнопке "Принять участие"
watch(shouldShowMainButton, (newVal) => {
    if (newVal && window.Telegram?.WebApp) {
        window.Telegram.WebApp.MainButton.setText("Принять участие");
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.onClick(async () => {
            const response = await userStore.joinToLeaderboard(props.promotionId);
            window.Telegram?.WebApp.MainButton.hide();
            // Если регистрация успешна, показываем модальное окно
            if (response && response === 'success') {
                isModalVisible.value = true;
            }
            if (window.Telegram?.WebApp.initDataUnsafe?.user?.id) {
                await userStore.fetchLeaderboard(
                    props.promotionId,
                    window.Telegram?.WebApp.initDataUnsafe?.user.id
                );
            }
        });
    }
});
onBeforeMount(async () => {
    if (window.Telegram?.WebApp.initDataUnsafe?.user?.id) {
        await userStore.fetchLeaderboard(
            props.promotionId,
            window.Telegram?.WebApp.initDataUnsafe?.user.id
        )
    }
})
</script>

<style lang="scss" scoped>
.leaderboard-container {
    display: flex;
    flex-direction: column;
    background: var(--background-component-color);
    border-radius: 18px;
    box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.06);
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    margin-top: 1rem;
}

.leaderboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.leaderboard-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary-color, #333);
}

.leaderboard-counter {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--text-secondary-color, #666);
    background-color: rgba(76, 175, 80, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
}

.leaderboard-wrapper {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;

    /* Стилизация скроллбара для WebKit */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
        margin: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.3);
    }

    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 2rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(76, 175, 80, 0.2);
    border-radius: 50%;
    border-top-color: #4CAF50;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.empty-state-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: #888;
    font-style: italic;
}

.leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.leaderboard-item {
    display: flex;
    flex-direction: column;
    background: var(--background-component-color);
    border-radius: 14px;
    box-shadow: var(--box-shadow);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.03);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.1);
    }
}

.leaderboard-item.highlight {
    position: relative;
    background-color: rgba(0, 102, 204, 0.05);

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background-color: #0066cc;
        border-radius: 0 2px 2px 0;
    }
}

.leaderboard-item-content {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.rank-column {
    width: 30px;
    min-width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    font-weight: 600;
    font-size: 14px;
}

.user-column {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
}

.user-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-name {
    font-weight: 500;
    font-size: 15px;
}

.points-column {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #4CAF50;
}

.user-rank-block {
    margin-top: 1rem;
    padding: 16px;
    background-color: var(--background-component-color);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background-color: #0066cc;
        border-radius: 0 2px 2px 0;
    }
}

.user-rank-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.user-rank-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-rank-title {
    font-weight: 500;
    font-size: 15px;
}

.user-rank-number {
    font-weight: 600;
    font-size: 16px;
    background-color: rgba(0, 102, 204, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
    color: #0066cc;
}

.user-rank-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.user-points {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #4CAF50;
}

@media (max-width: 768px) {
    .leaderboard-header {
        padding: 14px 16px;
    }

    .leaderboard-title {
        font-size: 16px;
    }

    .leaderboard-wrapper {
        padding: 14px;
        max-height: 360px;
    }

    .leaderboard-item {
        border-radius: 12px;
    }

    .leaderboard-item-content {
        padding: 10px 14px;
    }

    .rank-column {
        width: 26px;
        height: 26px;
        min-width: 26px;
        font-size: 13px;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        min-width: 32px;
    }

    .user-name {
        font-size: 14px;
    }

    .points-column {
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    .leaderboard-header {
        padding: 12px 14px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .leaderboard-title {
        font-size: 15px;
    }

    .leaderboard-wrapper {
        padding: 12px;
        max-height: 320px;
    }

    .leaderboard-item-content {
        padding: 8px 12px;
    }

    .user-column {
        gap: 8px;
        padding: 0 8px;
    }

    .rank-column {
        width: 24px;
        height: 24px;
        min-width: 24px;
        font-size: 12px;
    }

    .user-avatar {
        width: 28px;
        height: 28px;
        min-width: 28px;
    }

    .user-name {
        font-size: 13px;
    }

    .points-column {
        font-size: 13px;
    }

    .user-rank-block {
        padding: 14px;
    }

    .user-rank-title {
        font-size: 14px;
    }

    .user-rank-number {
        font-size: 15px;
        padding: 3px 8px;
    }
}
</style>