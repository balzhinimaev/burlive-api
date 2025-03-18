<template>
    <div class="archive-container">
        <div class="archive-header">
            <h3 class="archive-title">История ваших очков</h3>
            <div class="archive-counter" v-if="completedTaskRecords.length">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M8 1.33334L9.32933 5.50668H13.7147L10.1927 8.15999L11.5227 12.3333L8 9.68001L4.47733 12.3333L5.80733 8.15999L2.28533 5.50668H6.67067L8 1.33334Z"
                        fill="#4CAF50" />
                </svg>
                <span>{{ completedTaskRecords.length }} {{ getNounPluralForm(completedTaskRecords.length, 'награда',
                    'награды', 'наград') }}</span>
            </div>
        </div>

        <div class="archive-wrapper">
            <!-- Loading indicator -->
            <div v-if="isLoading" class="loading-indicator">
                <div class="spinner"></div>
                <span>Загрузка архива...</span>
            </div>

            <!-- Error message -->
            <div v-else-if="loadError" class="error-message">
                <div class="error-content">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 8V12" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M12 16H12.01" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    <span>Ошибка загрузки архива. Пожалуйста, попробуйте позже.</span>
                </div>
            </div>

            <!-- No completed tasks -->
            <div v-else-if="!completedTaskRecords.length" class="empty-state">
                <div class="empty-state-content">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M40 12H24L20 8H8C5.8 8 4.02 9.8 4.02 12L4 36C4 38.2 5.8 40 8 40H40C42.2 40 44 38.2 44 36V16C44 13.8 42.2 12 40 12ZM40 36H8V16H40V36Z"
                            fill="#888888" />
                    </svg>
                    <span>В архиве пока нет выполненных заданий</span>
                </div>
            </div>

            <!-- Completed tasks list -->
            <div v-else class="completed-tasks-list">
                <div class="task-item" v-for="(task, index) in completedTaskRecords" :key="task._id">
                    <div class="task-item-content">
                        <div class="task-header">
                            <div class="task-header-photo">
                                <img v-if="completedTasks[0]?.imageUrl"
                                    :src="'https://burlive.ru/uploads/' + completedTasks[0].imageUrl"
                                    alt="Task image" />
                                <div v-else class="task-header-photo-placeholder">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z"
                                            fill="#BBBBBB" />
                                    </svg>
                                </div>
                            </div>

                            <div class="task-header-content">
                                <div class="task-header-content-title">
                                    {{ completedTasks[0]?.title || 'Задание' }}
                                    <span class="task-status-badge completed">Выполнено</span>
                                </div>

                                <div class="task-type" v-if="task.task.taskType">
                                    Тип задания: {{ task.task.taskType === 'subscription' ? "Подписка на канал" : "" }}
                                </div>

                                <div class="task-header-content-points">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M8 1.33334L9.32933 5.50668H13.7147L10.1927 8.15999L11.5227 12.3333L8 9.68001L4.47733 12.3333L5.80733 8.15999L2.28533 5.50668H6.67067L8 1.33334Z"
                                            fill="#4CAF50" />
                                    </svg>
                                    <span class="points-gained">+{{ task.rewardPoints }} очков</span>
                                </div>
                            </div>
                        </div>

                        <div class="task-completion-date">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M7 12.8334C10.2217 12.8334 12.8333 10.2217 12.8333 7.00002C12.8333 3.77836 10.2217 1.16669 7 1.16669C3.77834 1.16669 1.16667 3.77836 1.16667 7.00002C1.16667 10.2217 3.77834 12.8334 7 12.8334Z"
                                    stroke="#888888" stroke-width="1.2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M7 3.5V7L9.33333 8.16667" stroke="#888888" stroke-width="1.2"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span>Выполнено: {{ formatDate(task.createdAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- <div v-if="completedTaskRecords.length > 3" class="archive-footer">
            <span class="archive-scroll-hint">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12L8 4" stroke="#888888" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M4 8L8 4L12 8" stroke="#888888" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                Прокрутите для просмотра всех наград
            </span>
        </div> -->
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
    tasks: ITask[] | null,
    completedTaskRecords: {
        _id: string;
        task: ITask;
        user: string;
        promotion: string;
        rewardPoints: number;
        completedAt: string;
        createdAt: string;
        updatedAt: string;
    }[] | []
}
const props = defineProps<Props>()

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

// Get plural form for Russian nouns
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

// Watch for changes in user ID
watch(() => userStore.user?._id, (newId) => {
    if (newId) {
        fetchCompletedTasks()
    }
})

// Fetch tasks when component is mounted
onMounted(() => {
    if (userStore.user?._id) {
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
}

.archive-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.archive-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary-color, #333);
}

.archive-counter {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--text-secondary-color, #666);
    background-color: rgba(76, 175, 80, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
}

.archive-wrapper {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;

    /* Стилизация скроллбара для WebKit (Chrome, Safari, новые версии Edge) */
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

.archive-footer {
    padding: 12px;
    text-align: center;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 13px;
    color: var(--text-secondary-color, #888);
    background: linear-gradient(to bottom, rgba(245, 245, 245, 0) 0%, rgba(245, 245, 245, 0.8) 100%);
    margin-top: -1px;
}

.archive-scroll-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    opacity: 0.8;
    animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
    0% {
        opacity: 0.6;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.6;
    }
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

.error-message,
.empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.error-content,
.empty-state-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.error-message {
    color: #FF6B6B;
}

.empty-state {
    color: #888;
    font-style: italic;
}

.completed-tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-item {
    display: flex;
    flex-direction: column;
    background: var(--background-component-color);
    border-radius: 14px;
    box-shadow: 0px 3px 6px rgba(16, 16, 16, 0.06);
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.03);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.1);
    }

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background-color: #4CAF50;
        border-radius: 0 2px 2px 0;
    }
}

.task-item-content {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.task-header {
    display: flex;
    gap: 14px;
}

.task-header-photo {
    width: 60px;
    height: 60px;
    min-width: 60px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;

        &:hover {
            transform: scale(1.05);
        }
    }
}

.task-header-photo-placeholder {
    width: 100%;
    height: 100%;
    background: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.task-header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;

    .task-type {
        font-size: 12px;
    }
}

.task-header-content-title {
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    line-height: 1.3;
}

.task-status-badge {
    font-size: 12px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 12px;
    white-space: nowrap;

    &.completed {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
    }
}

.task-header-content-points {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;

    .points-gained {
        color: #4CAF50;
    }
}

.task-completion-date {
    font-size: 13px;
    color: var(--text-secondary-color, #888);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
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
        max-height: 360px;
    }

    .task-item {
        border-radius: 12px;
    }

    .task-item-content {
        padding: 12px;
    }

    .task-header-photo {
        width: 52px;
        height: 52px;
        min-width: 52px;
    }

    .task-header-content-title {
        font-size: 14px;
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
    }

    .task-status-badge {
        font-size: 11px;
        padding: 2px 7px;
    }

    .task-completion-date {
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .archive-header {
        padding: 12px 14px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .archive-title {
        font-size: 15px;
    }

    .archive-wrapper {
        padding: 12px;
        max-height: 320px;
    }

    .task-header-photo {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 10px;
    }

    .task-header {
        gap: 10px;
    }

    .task-header-content-title {
        font-size: 13px;
    }
}
</style>