<template>
    <div class="leaderboard-page">
        <section>
            <div class="container">

                <UserInfo />
                <div class="frame mt-4">
                    <h4 style="text-align: left;">Топ 5 пользователей</h4>
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
                    <div v-for="(userLeaderboard, index) in leaderboard.slice(0, 5)" :key="userLeaderboard.user.id"
                        :class="['leaderboard-row', { highlight: userLeaderboard.user.id === currentUserId }]">
                        <div class="rank-column">{{ index + 1 }}</div>
                        <div class="user-column" v-if="userLeaderboard.user.username || userLeaderboard.user.first_name">
                            {{ truncate(userLeaderboard.user.username || userLeaderboard.user.first_name) }}
                        </div>
                        <div class="rating-column">{{ userLeaderboard.points }}</div>
                    </div>
                </div>

                <!-- Если данных нет -->
                <p v-else class="no-data-message">Нет данных для отображения</p>

                <!-- Если текущий пользователь не входит в топ-10 -->
                <div v-if="!isUserInTop10 && userRank && userRank > 4" class="user-rank-block">
                    <p>
                        Ваше место:
                        <strong>{{ userRank }}</strong>
                        <br />
                        {{ user?.username ? user?.username : user?.first_name }} — {{ userRating }}
                    </p>
                </div>
            </div>
        </section>
        <section>
            <div class="container" v-if="tasks.length">
                <h4>Кампании</h4>
                <LeaderboardAreYouWannaBeTop :tasks="tasks" />
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
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import type { ITask } from '~/server/api/tasks.get'
import type { User } from '@/stores/userStore'
const truncate = (value: string | undefined, maxLength = 10): string => {
    if (!value) return ''
    return value.length > maxLength ? value.slice(0, maxLength) + '...' : value
}
const promotionId = ref("67ccfb6cab6af833b096470d")

const userStore = useUserStore()

// Лидерборд
const leaderboard = computed(() => userStore.getLeaderboard)

// Проверяем, загружается ли лидерборд
const isLeaderboardFetch = computed(() => userStore.isLeaderboardFetch)

// Текущий пользователь из Telegram
const isFetching = computed(() => userStore.on_fetching_user_result)
const user = computed(() => userStore.user)

// Получаем ID текущего пользователя
const currentUserId = computed(() => user.value?.id || null)

const tasks = ref(<ITask[]>[])
const isParticipation = computed(() => userStore.getResponseCheckParicipation)

/**
 * Функция для проверки доступности localStorage
 */
function isLocalStorageAvailable() {
    try {
        const test = '__test__'
        localStorage.setItem(test, test)
        localStorage.removeItem(test)
        return true
    } catch (e) {
        console.error('localStorage недоступен:', e)
        return false
    }
}

/**
 * Функция для сохранения пользовательских данных в localStorage
 */
function saveUserToLocalStorage(userData: any) {
    if (!isLocalStorageAvailable() || !userData) return
    try {
        localStorage.setItem('userData', JSON.stringify(userData))
        console.log('Пользовательские данные сохранены в localStorage')
    } catch (error) {
        console.error('Ошибка при сохранении в localStorage:', error)
    }
}

/**
 * Функция для получения данных пользователя из localStorage
 */
function getUserFromLocalStorage() {
    if (!isLocalStorageAvailable()) return null
    try {
        const storedUser = localStorage.getItem('userData')
        return storedUser ? JSON.parse(storedUser) : null
    } catch (error) {
        console.error('Ошибка при получении из localStorage:', error)
        return null
    }
}

/**
 * Функция для сохранения данных с временем истечения
 * @param {string} key - Ключ для сохранения
 * @param {any} value - Значение для сохранения
 * @param {number} ttl - Время жизни в миллисекундах
 */
function saveWithExpiry(key: any, value: any, ttl: any) {
    if (!isLocalStorageAvailable()) return
    try {
        const now = new Date()
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        }
        localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
        console.error('Ошибка при сохранении с истечением срока:', error)
    }
}

/**
 * Функция для получения данных с проверкой времени истечения
 * @param {string} key - Ключ для получения
 */
function getWithExpiry(key: any) {
    if (!isLocalStorageAvailable()) return null
    try {
        const itemStr = localStorage.getItem(key)
        if (!itemStr) return null

        const item = JSON.parse(itemStr)
        const now = new Date()

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key)
            return null
        }
        return item.value
    } catch (error) {
        console.error('Ошибка при получении данных с истечением срока:', error)
        return null
    }
}

/**
 * Функция для проверки и установки данных пользователя
 * Использует существующие методы userStore
 */
async function checkAndSetUser(telegramUser: any) {
    if (!telegramUser || !telegramUser.id) {
        console.error('Нет данных пользователя для проверки')
        return false
    }

    try {
        // Проверяем существование пользователя
        const exists = await userStore.checkUserExists(
            telegramUser.id,
            telegramUser.photo_url
        )

        // Если пользователя нет, создаем его
        if (!exists) {
            await userStore.createUser({
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                username: telegramUser.username,
                photo_url: telegramUser.photo_url,
                platform: window.Telegram?.WebApp?.platform || 'web'
            })
            // После создания снова проверяем существование, чтобы получить данные
            await userStore.checkUserExists(telegramUser.id)
        }

        return true
    } catch (error) {
        console.error('Ошибка при проверке/создании пользователя:', error)
        return false
    }
}

// При монтировании запрашиваем лидерборд и проверяем пользователя
onBeforeMount(async () => {
    // Попытка загрузить данные из localStorage
    const storedUser = getUserFromLocalStorage()
    if (storedUser) {
        // console.log('Найден пользователь в localStorage:', storedUser)
        // Используем существующие методы для установки пользователя
        await checkAndSetUser(storedUser)
    }

    try {
        // Загружаем лидерборд и задачи
        await userStore.fetchLeaderboard(promotionId.value)
        const response = await $fetch("/api/tasks")
        tasks.value = response.tasks
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
    }
})

// Дополнительная логика при полном монтировании компонента
onMounted(async () => {
    
    // Попытка загрузить данные из localStorage
    const storedUser = getUserFromLocalStorage()
    if (storedUser) {
        // console.log('Найден пользователь в localStorage:', storedUser)
        // Используем существующие методы для установки пользователя
        await checkAndSetUser(storedUser)
    }

    // Логика для Telegram WebApp
    if (window.Telegram?.WebApp) {
        // Настройка кнопки участия
        await userStore.checkParticipation(promotionId.value)
        
        if (isParticipation.value === 404) {
            // alert("Пользователь отсутствует")
            window.Telegram.WebApp.MainButton.setText("Участвую")
            window.Telegram.WebApp.MainButton.show()
            window.Telegram.WebApp.MainButton.onClick(async () => {
                await userStore.joinToLeaderboard(promotionId.value)
                window.Telegram?.WebApp.MainButton.hide()
                await userStore.fetchLeaderboard(promotionId.value)
            })
        }

        // Получение данных пользователя из Telegram WebApp
        if (window.Telegram.WebApp.initDataUnsafe?.user) {
            const telegramUser = window.Telegram.WebApp.initDataUnsafe.user
            // Сохраняем в localStorage
            saveUserToLocalStorage(telegramUser)
            // Проверяем и устанавливаем пользователя через существующие методы
            await checkAndSetUser(telegramUser)
        }
    }
})

// Функция для участия в кампании
async function toParticipation() {
    // Здесь логика участия в кампании
    console.log('Пользователь нажал кнопку участия')
    try {
        // Пример запроса для участия
        await userStore.joinToLeaderboard(promotionId.value)
    } catch (error) {
        console.error('Ошибка при участии:', error)
    }
}

// Слежение за изменениями данных пользователя
watch(() => user.value, (newUser) => {
    if (newUser) {
        saveUserToLocalStorage(newUser)
    }
}, { deep: true })

// Вычисляем рейтинг пользователя
const userRating = computed(() => {
    if (!leaderboard.value || !currentUserId.value) return null
    const found = leaderboard.value.find((u) => u.user.id === currentUserId.value)
    return found ? found.points : null
})

// Определяем позицию пользователя в общем списке
const userRank = computed(() => {
    if (!leaderboard.value || !currentUserId.value) return null
    const index = leaderboard.value.findIndex(
        (u) => u.user.id === currentUserId.value
    )
    return index >= 0 ? index + 1 : null
})

// Проверяем, входит ли пользователь в топ-10
const isUserInTop10 = computed(() => {
    if (!userRank.value) return false
    return userRank.value <= 5
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

.leaderboard-row {
    &:last-child {
        padding-bottom: 1rem;
    }
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
</style>