<template>
    <div class="tasks-container">
        <div class="tasks-header">
            <div class="tasks-title-wrapper">
                <h3 class="tasks-title">Доступные задания</h3>
                <div class="info-tooltip">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="#999" stroke-width="1.5" />
                        <text x="8" y="11" font-size="11" font-weight="bold" fill="#999" text-anchor="middle">?</text>
                    </svg>
                    <div class="tooltip-content">
                        <p>Выполняйте задания, чтобы получать очки и открывать новые возможности словаря.</p>
                    </div>
                </div>
            </div>
            <div class="tasks-status">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 8.5L5.5 12L14 3.5" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <span>{{ availableTasks.length }} доступно</span>
            </div>
        </div>

        <div class="tasks-wrapper">
            <!-- Loading indicator -->
            <div v-if="isLoading" class="loading-indicator">
                <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25" />
                    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22" stroke="currentColor"
                        stroke-width="4" stroke-linecap="round" />
                </svg>
                <span>Загрузка заданий...</span>
            </div>

            <!-- Error message -->
            <div v-else-if="loadError" class="error-message">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#FF6B6B" stroke-width="2" />
                    <path d="M12 8V12" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" />
                    <path d="M12 16H12.01" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>Ошибка загрузки заданий. Пожалуйста, попробуйте позже.</span>
            </div>

            <!-- No available tasks -->
            <div v-else-if="!availableTasks.length" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M40 16H8C5.79086 16 4 17.7909 4 20V36C4 38.2091 5.79086 40 8 40H40C42.2091 40 44 38.2091 44 36V20C44 17.7909 42.2091 16 40 16Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M36 16V12C36 9.79086 34.2091 8 32 8H16C13.7909 8 12 9.79086 12 12V16" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M24 26V30" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <span>Нет доступных заданий в данный момент</span>
            </div>

            <!-- Available tasks list -->
            <div v-else class="available-tasks-list">
                <router-link :to="task.route" class="task-item" v-for="task in availableTasks" :key="task.id">
                    <div class="task-item-inner">
                        <div class="task-header">
                            <div class="task-header-photo" :class="task.iconBgClass">
                                <div class="task-icon">
                                    <component :is="task.icon" />
                                </div>
                            </div>

                            <div class="task-header-content">
                                <div class="task-header-content-title">
                                    {{ task.title }}
                                    <span v-if="task.isNew" class="task-status-badge new">Новое</span>
                                    <span v-if="task.isHot" class="task-status-badge hot">Популярное</span>
                                </div>
                                <div class="task-header-content-description">{{ task.description }}</div>
                                <div class="task-header-content-points">
                                    <span class="points-reward">+{{ task.rewardPoints }} очков</span>
                                </div>
                            </div>
                        </div>

                        <div class="task-footer">
                            <div class="task-difficulty" :class="'difficulty-' + task.difficulty">
                                <div class="difficulty-level">
                                    <span class="active"></span>
                                    <span :class="{ active: task.difficulty >= 2 }"></span>
                                    <span :class="{ active: task.difficulty >= 3 }"></span>
                                </div>
                                <span class="difficulty-text">{{ getDifficultyText(task.difficulty) }}</span>
                            </div>

                            <div class="task-action">
                                <span>Перейти</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.5"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

// Иконки для заданий - правильно определены как функциональные компоненты
const DictionaryIcon = () => h('svg', {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
}, [
    h('path', {
        d: 'M4 19.5V4.5C4 3.4 4.9 2.5 6 2.5H18C19.1 2.5 20 3.4 20 4.5V19.5C20 20.6 19.1 21.5 18 21.5H6C4.9 21.5 4 20.6 4 19.5Z',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M12 7.5H16',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M12 11.5H16',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M8 7.5H8.01',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M8 11.5H8.01',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M8 15.5H16',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    })
])

const TranslateIcon = () => h('svg', {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
}, [
    h('path', {
        d: 'M2 5H9',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M5.5 2.5V5',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M2 12L7 7L12 12',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M9 9V22',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M16 13L22 19',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M22 13L16 19',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    })
])

const SentenceIcon = () => h('svg', {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
}, [
    h('path', {
        d: 'M4 7H20',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M4 12H12',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M4 17H16',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    })
])

const ModerationIcon = () => h('svg', {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
}, [
    h('path', {
        d: 'M9 11L12 14L22 4',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }),
    h('path', {
        d: 'M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    })
])

const userStore = useUserStore()
const availableTasks = ref([
    {
        id: 1,
        title: 'Использование словаря',
        description: 'Поиск и изучение переводов слов в словаре',
        icon: DictionaryIcon,
        iconBgClass: 'bg-blue',
        route: '/vocabular',
        rewardPoints: 10,
        isNew: false,
        isHot: true,
        difficulty: 1
    },
    {
        id: 2,
        title: 'Предложить перевод',
        description: 'Добавьте собственные переводы для пополнения словаря',
        icon: TranslateIcon,
        iconBgClass: 'bg-purple',
        route: '/vocabular/suggest',
        rewardPoints: 25,
        isNew: true,
        isHot: false,
        difficulty: 2
    },
    {
        id: 3,
        title: 'Перевод предложений',
        description: 'Переводите целые предложения и контекстные выражения',
        icon: SentenceIcon,
        iconBgClass: 'bg-green',
        route: '/vocabular/sentences',
        rewardPoints: 30,
        isNew: false,
        isHot: false,
        difficulty: 2
    },
    {
        id: 4,
        title: 'Модерация переводов',
        description: 'Голосуйте за качество переводов и помогайте улучшать словарь',
        icon: ModerationIcon,
        iconBgClass: 'bg-orange',
        route: '/vocabular/moderation',
        rewardPoints: 15,
        isNew: false,
        isHot: false,
        difficulty: 3
    }
])

const isLoading = ref(true)
const loadError = ref(false)

// Получить текстовое описание сложности
const getDifficultyText = (level: number) => {
    switch (level) {
        case 1: return 'Легко';
        case 2: return 'Средне';
        case 3: return 'Сложно';
        default: return 'Легко';
    }
}

// Имитация загрузки данных с сервера
const fetchAvailableTasks = async () => {
    isLoading.value = true
    loadError.value = false

    try {
        // В реальном приложении здесь будет запрос к API
        await new Promise(resolve => setTimeout(resolve, 1000))
        // availableTasks.value = [...] // Загрузка с API

        isLoading.value = false
    } catch (error) {
        console.error('Error fetching available tasks:', error)
        loadError.value = true
        isLoading.value = false
    }
}

// Наблюдение за изменениями пользователя
watch(() => userStore.user?._id, (newId) => {
    if (newId) {
        fetchAvailableTasks()
    }
})

// При монтировании компонента
onMounted(() => {
    // Имитация загрузки
    fetchAvailableTasks()
})
</script>

<style lang="scss" scoped>
.tasks-container {
    display: flex;
    flex-direction: column;
    background: var(--background-component-color, #fff);
    border-radius: 18px;
    box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.06);
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
}

.tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tasks-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tasks-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary-color, #333);
}

.info-tooltip {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.info-tooltip .tooltip-content {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 240px;
    background: var(--background-tooltip-color, #fff);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 12px;
    font-size: 14px;
    color: var(--text-primary-color, #333);
    z-index: 10;
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s, opacity 0.2s ease;
}

.info-tooltip .tooltip-content p {
    margin: 0;
    line-height: 1.4;
}

.info-tooltip:hover .tooltip-content {
    visibility: visible;
    opacity: 1;
}

.tasks-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
}

.tasks-wrapper {
    max-height: 600px;
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
}

.loading-indicator,
.error-message,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary-color, #666);

    svg {
        margin-bottom: 16px;
    }

    span {
        font-size: 16px;
    }
}

.spinner {
    animation: spin 1.5s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.error-message {
    color: #FF6B6B;
}

.empty-state {
    svg {
        color: var(--text-secondary-color, #666);
        opacity: 0.5;
    }
}

.available-tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-item {
    text-decoration: none;
    color: inherit;
    display: block;

    &:hover {
        .task-item-inner {
            transform: translateY(-2px);
            box-shadow: 0px 8px 16px rgba(16, 16, 16, 0.1);
        }

        // .task-action {
            // background-color: var(--background-component-color);
            // color: var(--text-primary-color);
        // }
    }
}

.task-item-inner {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background-color: var(--background-component-color);
    // background: var(--background-item-color, #fff);
    border-radius: 15px;
    box-shadow: 0px 4px 8px rgba(16, 16, 16, 0.06);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}

.task-header {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.task-header-photo {
    width: 64px;
    height: 64px;
    min-width: 64px;
    min-height: 64px;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0px 2px 4px rgba(64, 64, 64, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;

    &.bg-blue {
        background: linear-gradient(135deg, #42A5F5, #2962FF);
        color: white;
    }

    &.bg-purple {
        background: linear-gradient(135deg, #AB47BC, #7B1FA2);
        color: white;
    }

    &.bg-green {
        background: linear-gradient(135deg, #66BB6A, #388E3C);
        color: white;
    }

    &.bg-orange {
        background: linear-gradient(135deg, #FFA726, #F57C00);
        color: white;
    }
}

.task-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    svg {
        width: 28px;
        height: 28px;
    }
}

.task-header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.task-header-content-title {
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.task-status-badge {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 12px;

    &.new {
        background-color: rgba(66, 133, 244, 0.1);
        color: #4285F4;
    }

    &.hot {
        background-color: rgba(234, 67, 53, 0.1);
        color: #EA4335;
    }
}

.task-header-content-description {
    font-size: 14px;
    color: var(--text-secondary-color, #666);
    line-height: 1.4;
}

.task-header-content-points {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 600;

    .points-reward {
        color: #4CAF50;
    }
}

.task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
}

.task-difficulty {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary-color, #888);

    &.difficulty-1 .difficulty-text {
        color: #4CAF50;
    }

    &.difficulty-2 .difficulty-text {
        color: #FFC107;
    }

    &.difficulty-3 .difficulty-text {
        color: #F44336;
    }
}

.difficulty-level {
    display: flex;
    gap: 3px;

    span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.1);

        &.active {

            &.difficulty-1 &,
            .difficulty-1 & {
                background-color: #4CAF50;
            }

            &.difficulty-2 &,
            .difficulty-2 & {
                background-color: #FFC107;
            }

            &.difficulty-3 &,
            .difficulty-3 & {
                background-color: #F44336;
            }
        }
    }

    .difficulty-1 & span.active {
        background-color: #4CAF50;
    }

    .difficulty-2 & span.active {
        background-color: #FFC107;
    }

    .difficulty-3 & span.active {
        background-color: #F44336;
    }
}

.task-action {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text-primary-color, #333);
    transition: all 0.2s ease;
}

@media (max-width: 768px) {
    .tasks-header {
        padding: 14px 16px;
    }

    .tasks-title {
        font-size: 16px;
    }

    .tasks-wrapper {
        padding: 14px;
    }

    .task-header-photo {
        width: 56px;
        height: 56px;
        min-width: 56px;
        min-height: 56px;
    }

    .task-header-content-title {
        font-size: 15px;
    }

    .info-tooltip .tooltip-content {
        width: 220px;
    }
}

@media (max-width: 480px) {
    .tasks-header {
        padding: 12px 14px;
    }

    .tasks-title {
        font-size: 15px;
    }

    .tasks-wrapper {
        padding: 12px;
    }

    .task-header-photo {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
    }

    .task-header-content-title {
        font-size: 14px;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .task-header-content-description {
        font-size: 13px;
    }

    .info-tooltip .tooltip-content {
        width: 200px;
        font-size: 13px;
    }

    .loading-indicator,
    .error-message,
    .empty-state {
        padding: 30px 16px;

        span {
            font-size: 14px;
        }
    }

    .task-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .task-action {
        align-self: flex-end;
    }
}
</style>