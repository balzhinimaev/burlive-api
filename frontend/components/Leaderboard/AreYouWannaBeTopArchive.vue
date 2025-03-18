<template>
    <div class="archive-container">
        <div class="archive-header">
            <div class="archive-title-wrapper">
                <h3 class="archive-title">Архив заданий</h3>
                <div class="info-tooltip">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="#999" stroke-width="1.5" />
                        <text x="8" y="11" font-size="11" font-weight="bold" fill="#999" text-anchor="middle">?</text>
                    </svg>
                    <div class="tooltip-content">
                        <p>Здесь отображаются все выполненные задания и полученные за них очки.</p>
                    </div>
                </div>
            </div>
            <div class="archive-status" v-if="completedTasks.length > 0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="#4CAF50" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>{{ completedTasks.length }} выполнено</span>
            </div>
        </div>

        <div class="archive-wrapper">
            <!-- Loading indicator -->
            <div v-if="isLoading" class="loading-indicator">
                <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25" />
                    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22" stroke="currentColor"
                        stroke-width="4" stroke-linecap="round" />
                </svg>
                <span>Загрузка архива...</span>
            </div>

            <!-- Error message -->
            <div v-else-if="loadError" class="error-message">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#FF6B6B" stroke-width="2" />
                    <path d="M12 8V12" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" />
                    <path d="M12 16H12.01" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>Ошибка загрузки архива. Пожалуйста, попробуйте позже.</span>
            </div>

            <!-- No completed tasks -->
            <div v-else-if="!completedTasks.length" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M40 16H8C5.79086 16 4 17.7909 4 20V36C4 38.2091 5.79086 40 8 40H40C42.2091 40 44 38.2091 44 36V20C44 17.7909 42.2091 16 40 16Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M36 16V12C36 9.79086 34.2091 8 32 8H16C13.7909 8 12 9.79086 12 12V16" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M24 26V30" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <span>В архиве пока нет выполненных заданий</span>
            </div>

            <!-- Completed tasks list -->
            <div v-else class="completed-tasks-list">
                <div class="task-item" v-for="(task, index) in completedTasks" :key="task._id">
                    <div class="task-header">
                        <div class="task-header-photo">
                            <img v-if="task.imageUrl" :src="'https://burlive.ru/uploads/' + task.imageUrl"
                                alt="Task image" />
                            <div v-else class="task-header-photo-placeholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="none" />
                                    <path
                                        d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path
                                        d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M21 15L16 10L5 19" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div class="task-header-content">
                            <div class="task-header-content-title">
                                {{ task.title }}
                                <span class="task-status-badge completed">Выполнено</span>
                            </div>
                            <div class="task-header-content-description">{{ task.description }}</div>
                            <div class="task-header-content-points">
                                <span class="points-gained">+{{ task.rewardPoints }} очков</span>
                            </div>
                        </div>
                    </div>

                    <!-- Warning for subscription tasks -->
                    <div v-if="task.taskType === 'subscription'" class="task-warning">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5Z"
                                stroke="#FF6B6B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M8 5.5V8.5" stroke="#FF6B6B" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M7.99609 10.5H8.00208" stroke="#FF6B6B" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        <span>Внимание! При отписке от канала вы потеряете {{ task.rewardPoints * 2 }} очков.</span>
                    </div>

                    <!-- Completion date -->
                    <div class="task-completion-date" v-if="completedTaskRecords && completedTaskRecords[index]">
                        Выполнено: {{ formatDate(completedTaskRecords[index].createdAt) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import type { ITask } from '~/server/api/tasks.get'

const userStore = useUserStore()
const completedTasks = ref<ITask[]>([])
const completedTaskRecords = ref<{
    _id: string;
    task: ITask;
    user: string;
    promotion: string;
    rewardPoints: number;
    completedAt: string;
    createdAt: string;
    updatedAt: string;
}[] | []>([])

const isLoading = ref(true)
const loadError = ref(false)
const promotionId = ref("67ccfb6cab6af833b096470d")

interface Props {
    tasks?: ITask[] | null;
    completedTaskRecords?: {
        _id: string;
        task: ITask;
        user: string;
        promotion: string;
        rewardPoints: number;
        completedAt: string;
        createdAt: string;
        updatedAt: string;
    }[] | [];
    promotionId?: string;
}

const props = withDefaults(defineProps<Props>(), {
    tasks: null,
    completedTaskRecords: () => [],
    promotionId: "67ccfb6cab6af833b096470d"
})

// Update promotion ID if provided as prop
if (props.promotionId) {
    promotionId.value = props.promotionId
}

// Fetch completed tasks
const fetchCompletedTasks = async () => {
    isLoading.value = true
    loadError.value = false

    try {
        // Get user ID from the store
        const userId = userStore.user?._id
        if (!userId) {
            throw new Error('User ID not found')
        }

        // Fetch completed tasks
        const response = await $fetch<any>(`/api/tasks/${userId}/${promotionId.value}`)

        // Filter only completed tasks
        if (response && response.completedTasks) {
            completedTasks.value = response.completedTasks
            completedTaskRecords.value = response.completedTaskRecords
        }
    } catch (error) {
        console.error('Error fetching completed tasks:', error)
        loadError.value = true
    } finally {
        isLoading.value = false
    }
}

// Format date
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day}.${month}.${year} ${hours}:${minutes}`
}

// Watch for changes in user ID
watch(() => userStore.user?._id, (newId) => {
    if (newId) {
        fetchCompletedTasks()
    }
})

// Use props if provided, otherwise fetch from API
onMounted(() => {
    if (props.tasks) {
        completedTasks.value = props.tasks as ITask[]
        if (props.completedTaskRecords && props.completedTaskRecords.length) {
            completedTaskRecords.value = props.completedTaskRecords
        }
        isLoading.value = false
    } else if (userStore.user?._id) {
        fetchCompletedTasks()
    }
})
</script>

<style lang="scss" scoped>
.archive-container {
    display: flex;
    flex-direction: column;
    background: var(--background-component-color);
    border-radius: 18px;
    box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.06);
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
}

.archive-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.archive-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.archive-title {
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
    background: var(--background-tooltip-color);
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

.archive-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
}

.archive-wrapper {
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

.completed-tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-item {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--background-component-color);
    border-radius: 15px;
    box-shadow: 0px 4px 4px rgba(16, 16, 16, 0.06);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 3px;
        background-color: #4CAF50;
        border-radius: 0 2px 2px 0;
    }
}

.task-header {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
}

.task-header-photo {
    width: 64px;
    height: 64px;
    min-width: 64px;
    min-height: 64px;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0px 2px 4px rgba(64, 64, 64, 0.1);
    // background: var(--background-alt-color, #f5f5f5);
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.task-header-photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.2);
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

    &.completed {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
    }
}

.task-header-content-description {
    font-size: 14px;
    color: var(--text-secondary-color, #666);
}

.task-header-content-points {
    margin-top: 4px;
    font-size: 14px;
    font-weight: 600;

    .points-gained {
        color: #4CAF50;
    }
}

.task-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    margin-bottom: 12px;
    background-color: rgba(255, 107, 107, 0.1);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.4;
    color: #FF6B6B;
}

.task-completion-date {
    font-size: 12px;
    color: var(--text-secondary-color, #888);
    text-align: right;
    margin-top: 8px;
}

@media (max-width: 768px) {
    .archive-header {
        padding: 14px 16px;
    }

    .archive-title {
        font-size: 16px;
    }

    .archive-wrapper {
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
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .info-tooltip .tooltip-content {
        width: 220px;
    }
}

@media (max-width: 480px) {
    .archive-header {
        padding: 12px 14px;
    }

    .archive-title {
        font-size: 15px;
    }

    .archive-wrapper {
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
}
</style>