<template>
    <div class="leaderboard-page">
        <section>
            <div class="container">
                <div class="frame">
                    <h2>Топ рейтинг</h2>
                </div>

                <!-- Индикатор загрузки -->
                <div v-if="isLeaderboardFetch" class="loading-indicator">
                    <span>Загрузка данных...</span>
                </div>

                <!-- Если данные есть, выводим список -->
                <div v-else-if="leaderboard && leaderboard.length" class="leaderboard-list">
                    <!-- Заголовок списка -->
                    <div class="leaderboard-header">
                        <div class="rank-column">#</div>
                        <div class="user-column">Пользователь</div>
                        <div class="rating-column">Рейтинг</div>
                    </div>
                    <!-- Ряды списка -->
                    <div v-for="(userLeaderboard, index) in leaderboard.slice(0, 10)" :key="userLeaderboard.id"
                        :class="['leaderboard-row', { highlight: userLeaderboard.id === currentUserId }]">
                        <div class="rank-column">{{ index + 1 }}</div>
                        <div class="user-column">
                            {{ userLeaderboard.username || userLeaderboard.first_name }}
                        </div>
                        <div class="rating-column">{{ userLeaderboard.rating }}</div>
                    </div>
                </div>

                <!-- Если данных нет -->
                <p v-else class="no-data-message">Нет данных для отображения</p>

                <!-- Если текущий пользователь не входит в топ-10 -->
                <div v-if="!isUserInTop10 && userRank && userRank > 10" class="user-rank-block">
                    <p>
                        Ваше место:
                        <strong>{{ userRank }}</strong>
                        <br />
                        {{ user.username || user.first_name }} — {{ userRating }}
                    </p>
                </div>

                <!-- Отладочная информация (можно удалить в production) -->
                <!-- <div class="debug-info">
                <p>User ID: {{ currentUserId }}</p>
                <p>User Rank: {{ userRank }}</p>
                <p>Is in Top 10: {{ isUserInTop10 }}</p>
            </div> -->
            </div>
        </section>
        <section>
            <div class="container">
                <h4>Хочешь быть в топе?</h4>
                <LeaderboardAreYouWannaBeTop />
            </div>
        </section>
        <section>
            <div class="container">
                <h4>Архив</h4>
                <LeaderboardAreYouWannaBeTopArchive />
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// Лидерборд
const leaderboard = computed(() => userStore.getLeaderboard)

// Проверяем, загружается ли лидерборд
const isLeaderboardFetch = computed(() => userStore.isLeaderboardFetch)

// Текущий пользователь из Telegram
const user = ref<any>(null)

// Получаем ID текущего пользователя
const currentUserId = computed(() => user.value?.id || null)

// При монтировании запрашиваем лидерборд и проверяем пользователя
onBeforeMount(async () => {
    try {
        await userStore.fetchLeaderboard()
    } catch (error) {
        console.log(`Error loading leaderboard`, error)
    }

    // Логика для Telegram WebApp
    if (window.Telegram?.WebApp) {
        const initData = window.Telegram.WebApp.initDataUnsafe
        if (initData?.user) {
            user.value = initData.user
            const telegram_id = user.value.id

            try {
                const is_exists = await userStore.checkUserExists(
                    telegram_id,
                    user.value?.photo_url
                )
                if (!is_exists) {
                    await userStore.createUser({
                        id: user.value.id,
                        first_name: user.value.first_name,
                        username: user.value?.username,
                        photo_url: user.value?.photo_url,
                        platform: window.Telegram.WebApp.platform,
                    })
                    await userStore.checkUserExists(telegram_id)
                }
            } catch (error) {
                console.error('Ошибка при проверке/создании пользователя:', error)
            }
        }
    }
})

// Следим за изменением данных пользователя
watch([user, leaderboard], () => {
    console.log('User or leaderboard updated')
}, { deep: true })

// Вычисляем рейтинг пользователя
const userRating = computed(() => {
    if (!leaderboard.value || !currentUserId.value) return null
    const found = leaderboard.value.find((u) => u.id === currentUserId.value)
    return found ? found.rating : null
})

// Определяем позицию пользователя в общем списке
const userRank = computed(() => {
    if (!leaderboard.value || !currentUserId.value) return null
    const index = leaderboard.value.findIndex(
        (u) => u.id === currentUserId.value
    )
    return index >= 0 ? index + 1 : null
})

// Проверяем, входит ли пользователь в топ-10
const isUserInTop10 = computed(() => {
    if (!userRank.value) return false
    return userRank.value <= 10
})
</script>

<style lang="scss" scoped>
.leaderboard-page {
    padding: 1rem 10px;
    background-color: var(--background-page-color);
    .frame {
        margin-bottom: 1rem;
        text-align: center;
    }

    section {
        margin-bottom: 16px;
        &:last-child {
            margin: 0;
        }
    }
}

.loading-indicator {
    text-align: center;
    padding: 1rem;
    color: #666;
}

.no-data-message {
    text-align: center;
    padding: 1rem;
    color: #666;
}

.leaderboard-list {
    width: 100%;
    margin-bottom: 1rem;
    border-radius: 15px;
    overflow: hidden;
}

.leaderboard-header,
.leaderboard-row {
    display: flex;
    background-color: var(--background-component-color);
    padding: 0.5rem 1.3rem;
    align-items: center;
    text-align: left;
}

.leaderboard-header {
    font-weight: bold;
}

.rank-column {
    width: 50px;
    min-width: 50px;
    text-align: center;
    padding: 0 0.5rem;
    position: relative;
}

.user-column {
    flex: 1;
    padding: 0 0.5rem;
}

.rating-column {
    width: 100px;
    min-width: 100px;
    text-align: center;
    padding: 0 0.5rem;
}

.leaderboard-row.highlight {
    position: relative;
    background-color: rgba(0, 102, 204, 0.05);
}

.leaderboard-row.highlight::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background-color: #0066cc;
    border-radius: 0 2px 2px 0;
}

.user-rank-block {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--background-component-color);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 3px;
        background-color: #0066cc;
        border-radius: 0 2px 2px 0;
    }

    p {
        margin: 0;
        font-weight: 500;
    }
}

.debug-info {
    margin-top: 1rem;
    padding: 0.5rem;
    border: 1px dashed #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #999;
}
</style>