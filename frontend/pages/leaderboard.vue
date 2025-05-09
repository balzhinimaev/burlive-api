<template>
    <div class="leaderboard-page">
        <section>
            <div class="container">

                <UserInfo />

            </div>
        </section>
        <section>
            <div class="container">
                <Top5Component v-if="user" :promotion-id="promotionId" :user="user" />
            </div>
        </section>

        <!-- <section>
            <div class="container">
                <GiveawayComponent :giveaway="giveaway" />
            </div>
        </section> -->
        <!-- {{ tasks }} -->

        <section>
            <div class="container">
                <AvailableTasks />
            </div>
        </section>

        <section>
            <div class="container" v-if="tasks.tasks?.length">
                <!-- <h4>Кампании</h4> -->
                <LeaderboardAreYouWannaBeTop :tasks="tasks.tasks" :user="user" :promotion-id="promotionId" />
            </div>
        </section>
        <section>
            <div class="container">
                <LeaderboardAreYouWannaBeTopArchive :completed-task-records="tasks.completedTaskRecords"
                    :tasks="tasks.completedTasks" />
            </div>
        </section>
        <section>
            <div class="container">
                <!-- <h4>История наград</h4> -->
                <HistoryComponent :completed-task-records="tasks.completedTaskRecords" :tasks="tasks.completedTasks" />
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import type { getTasksResponse, ITask } from '~/server/api/tasks.get'
import HistoryComponent from '~/components/Leaderboard/HistoryComponent.vue';
import Top5Component from '~/components/Leaderboard/Top5Component.vue';
import GiveawayComponent, { type Giveaway } from '~/components/Leaderboard/GiveawayComponent.vue';
import AvailableTasks from '~/components/Leaderboard/AvailableTasks.vue';

function isTelegramWebAppProperlyInitialized() {
    const webApp = window.Telegram?.WebApp;
    return Boolean(
        webApp?.initDataUnsafe?.user?.id
        // webApp?.version    // Check if version exists
        // typeof webApp?.isExpanded === 'boolean'  // Check a method that should exist
    );
}
const truncate = (value: string | undefined, maxLength = 10): string => {
    if (!value) return ''
    return value.length > maxLength ? value.slice(0, maxLength) + '...' : value
}
const promotionId = ref("67ccfb6cab6af833b096470d")

const userStore = useUserStore()
const user = computed(() => userStore.user)
// Лидерборд
const leaderboard = computed(() => userStore.getLeaderboard)

const giveaway = ref<Giveaway>({
    _id: "67ccfb6cab6af833b096470d",
    title: "Конкурс с 20 призовыми местами",
    description: "Призовые места: 1 место – 15000 руб, 2 место – 10000 руб, 3 место – 5000 руб, 4-9 места – 1000 руб, 10-20 места – 500 руб",
    startDate: new Date("2025-03-08T16:00:00.000Z"),
    endDate: new Date("2025-04-10T16:00:00.000+00:00"),
    status: "active",
    prizes: [
        { minRank: 1, maxRank: 1, prizeType: "money", amount: 15000, description: "Первое место: 15000 руб" },
        { minRank: 2, maxRank: 2, prizeType: "money", amount: 10000, description: "Второе место: 10000 руб" },
        { minRank: 3, maxRank: 3, prizeType: "money", amount: 5000, description: "Третье место: 5000 руб" },
        { minRank: 4, maxRank: 4, prizeType: "money", amount: 1000, description: "Четвёртое место: 1000 руб" },
        { minRank: 5, maxRank: 5, prizeType: "money", amount: 1000, description: "Пятое место: 1000 руб" },
        { minRank: 6, maxRank: 6, prizeType: "money", amount: 1000, description: "Шестое место: 1000 руб" },
        { minRank: 7, maxRank: 7, prizeType: "money", amount: 1000, description: "Седьмое место: 1000 руб" },
        { minRank: 8, maxRank: 8, prizeType: "money", amount: 1000, description: "Восьмое место: 1000 руб" },
        { minRank: 9, maxRank: 9, prizeType: "money", amount: 1000, description: "Девятое место: 1000 руб" },
        { minRank: 10, maxRank: 10, prizeType: "money", amount: 500, description: "Десятое место: 500 руб" },
        { minRank: 11, maxRank: 11, prizeType: "money", amount: 500, description: "Одиннадцатое место: 500 руб" },
        { minRank: 12, maxRank: 12, prizeType: "money", amount: 500, description: "Двенадцатое место: 500 руб" },
        { minRank: 13, maxRank: 13, prizeType: "money", amount: 500, description: "Тринадцатое место: 500 руб" },
        { minRank: 14, maxRank: 14, prizeType: "money", amount: 500, description: "Четырнадцатое место: 500 руб" },
        { minRank: 15, maxRank: 15, prizeType: "money", amount: 500, description: "Пятнадцатое место: 500 руб" },
        { minRank: 16, maxRank: 16, prizeType: "money", amount: 500, description: "Шестнадцатое место: 500 руб" },
        { minRank: 17, maxRank: 17, prizeType: "money", amount: 500, description: "Семнадцатое место: 500 руб" },
        { minRank: 18, maxRank: 18, prizeType: "money", amount: 500, description: "Восемнадцатое место: 500 руб" },
        { minRank: 19, maxRank: 19, prizeType: "money", amount: 500, description: "Девятнадцатое место: 500 руб" },
        { minRank: 20, maxRank: 20, prizeType: "money", amount: 500, description: "Двадцатое место: 500 руб" },
    ],
});

const formattedStartDate = computed(() =>
    giveaway.value.startDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
)

const formattedEndDate = computed(() =>
    giveaway.value.endDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
)

const isLeaderboardFetchError = computed(() => userStore.isFetchingLeaderboardError)

// Текущий пользователь из Telegram
const isFetching = computed(() => userStore.on_fetching_user_result)



const tasks = ref<getTasksResponse>({ tasks: [], completedTasks: [], completedTaskRecords: [] });


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

    console.log("WebApp initialized:", isTelegramWebAppProperlyInitialized());

    // Попытка загрузить данные из localStorage
    const storedUser = getUserFromLocalStorage()
    if (storedUser) {
        console.log('Найден пользователь в localStorage:', storedUser)
        // Используем существующие методы для установки пользователя
        await checkAndSetUser(storedUser)
    } else {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            try {
                // Проверяем существование пользователя
                const exists = await userStore.checkUserExists(
                    window.Telegram.WebApp.initDataUnsafe.user.id,
                    window.Telegram.WebApp.initDataUnsafe.user.photo_url
                )

                // Если пользователя нет, создаем его
                if (!exists) {
                    await userStore.createUser({
                        id: window.Telegram.WebApp.initDataUnsafe.user.id,
                        first_name: window.Telegram.WebApp.initDataUnsafe.user.first_name,
                        username: window.Telegram.WebApp.initDataUnsafe.user.username,
                        photo_url: window.Telegram.WebApp.initDataUnsafe.user.photo_url,
                        platform: window.Telegram?.WebApp?.platform || 'web'
                    })
                    // После создания снова проверяем существование, чтобы получить данные
                    // await userStore.checkUserExists(window.Telegram.WebApp.initDataUnsafe.user.id)
                }

                return true
            } catch (error) {
                console.error('Ошибка при проверке/создании пользователя:', error)
                return false
            }
        }
    }

    // Single check for Telegram WebApp initialization
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        try {
            console.log("User ID found:", window.Telegram.WebApp.initDataUnsafe.user.id);
            const response = await $fetch<any>(`/api/tasks/${userStore.user?._id}/${promotionId.value}`);
            // await userStore.fetchLeaderboard(promotionId.value, window.Telegram.WebApp.initDataUnsafe.user.id);
            // alert("is ok");
            console.log(response)
            tasks.value = response;
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
    } else {
        console.log("Telegram WebApp not properly initialized or user ID is missing");
        // Fall back to localStorage user if available
        if (storedUser?.id && userStore.user?._id) {
            try {
                const response = await $fetch<any>(`/api/tasks/${userStore.user._id}/${promotionId.value}`);
                // await userStore.fetchLeaderboard(promotionId.value, storedUser.id);
                tasks.value = response;
            } catch (error) {
                console.error('Ошибка при использовании данных из localStorage:', error);
            }
        } else {
            console.warn("No user data available, functionality will be limited");
        }
    }
})

// Дополнительная логика при полном монтировании компонента
onMounted(async () => {

    // Попытка загрузить данные из localStorage
    // const storedUser = getUserFromLocalStorage()
    // if (storedUser) {
    //     // console.log('Найден пользователь в localStorage:', storedUser)
    //     // Используем существующие методы для установки пользователя
    //     await checkAndSetUser(storedUser)
    // }

    // Логика для Telegram WebApp
    if (window.Telegram?.WebApp) {

        // Получение данных пользователя из Telegram WebApp
        if (window.Telegram.WebApp.initDataUnsafe?.user) {
            // Настройка кнопки участия
            const telegramUser = window.Telegram.WebApp.initDataUnsafe.user
            // Сохраняем в localStorage
            saveUserToLocalStorage(telegramUser)
            // Проверяем и устанавливаем пользователя через существующие методы
            await checkAndSetUser(telegramUser)
            await userStore.checkParticipation(promotionId.value)
            // await userStore.fetchLeaderboard(promotionId.value)
        }

        // if (isLeaderboardFetchError.value === 404) {
        //     // alert("Пользователь отсутствует")
        //     window.Telegram.WebApp.MainButton.setText("Участвую")
        //     window.Telegram.WebApp.MainButton.show()
        //     window.Telegram.WebApp.MainButton.onClick(async () => {
        //         await userStore.joinToLeaderboard(promotionId.value)
        //         window.Telegram?.WebApp.MainButton.hide()
        //         await userStore.fetchLeaderboard(promotionId.value)
        //     })
        // }

    }
})

// Слежение за изменениями данных пользователя
watch(() => user.value, (newUser) => {
    if (newUser) {
        saveUserToLocalStorage(newUser)
    }
}, { deep: true })

</script>

<style lang="scss" scoped>
.leaderboard-page {
    // padding: 1rem 10px;
    padding: 10px 0;
    background-color: var(--background-leaderpage-color);

    // .frame {
    //     margin-bottom: 1rem;
    //     text-align: center;
    // }

    section {
        margin-bottom: 16px;

        &:last-child {
            margin: 0;
        }
    }
}

/* Стили для блока розыгрыша */
.giveaway-section {
    margin-bottom: 16px;

    .giveaway-card {
        background-color: var(--background-component-color);
        border-radius: 8px;
        padding: 1rem;
        border-left: 4px solid #0088cc;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .giveaway-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: var(--text-color);
    }

    .giveaway-description {
        margin-bottom: 0.5rem;
        color: #555;
    }

    .giveaway-dates {
        margin-bottom: 0.5rem;
        color: #333;
    }

    .giveaway-prizes {
        h4 {
            margin-bottom: 0.5rem;
            font-weight: bold;
        }

        ul {
            list-style: none;
            padding: 0;

            li {
                padding: 0.25rem 0;
                color: #333;
            }
        }
    }
}

.loading-indicator {
    text-align: center;
    padding: 1rem;
    color: #666;
}
</style>