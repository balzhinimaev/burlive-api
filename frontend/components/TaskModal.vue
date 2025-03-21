<template>
    <div v-show="isVisible" class="modal-overlay" @click.self="$emit('close')">
        <div ref="modalContentEl" class="modal-content" :class="{ 'slide-active': isOpen }" :style="dragStyle"
            @mousedown="onDragStart" @touchstart="onDragStart">
            <!-- Шапка модального окна -->
            <div class="modal-header">
                <div class="drag-handle"></div>
                <button class="modal-close" @click="$emit('close')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>
            </div>

            <!-- Контент модального окна -->
            <div class="modal-body">
                <!-- Заголовок модалки с иконкой -->
                <div class="modal-task-header">
                    <div class="modal-task-image" v-if="selectedTask?.imageUrl || isRegistrationSuccess">
                        <NuxtImg v-if="selectedTask?.imageUrl" width="80" height="80"
                            :src="'https://burlive.ru/uploads/' + selectedTask.imageUrl" />
                        <div v-else-if="isRegistrationSuccess" class="success-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4CAF50" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M22 4L12 14.01l-3-3" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div class="modal-task-title">
                        <h2 v-if="isRegistrationSuccess">Участие подтверждено!</h2>
                        <h2 v-else-if="isAlreadyRegistered">Вы уже участвуете</h2>
                        <h2 v-else>{{ selectedTask?.title }}</h2>
                    </div>
                </div>

                <!-- Сообщение об успешной регистрации -->
                <div v-if="isRegistrationSuccess" class="registration-success-message">
                    <p>Вы успешно зарегистрированы в конкурсе. Теперь вы можете выполнять задания и зарабатывать баллы!
                    </p>
                    <div class="registration-points">
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M8 1.33334L9.32933 5.50668H13.7147L10.1927 8.15999L11.5227 12.3333L8 9.68001L4.47733 12.3333L5.80733 8.15999L2.28533 5.50668H6.67067L8 1.33334Z"
                                fill="#4CAF50" />
                        </svg>
                        <span>+10 баллов</span>
                    </div>
                </div>

                <!-- Сообщение о том, что пользователь уже участвует -->
                <div v-else-if="isAlreadyRegistered" class="already-registered-message">
                    <p>Вы уже зарегистрированы в этом конкурсе. Продолжайте выполнять задания и повышайте свой рейтинг!
                    </p>
                    <div class="user-rank-info">
                        <p>Ваше текущее место в рейтинге:</p>
                        <div class="user-rank-number">{{ userRank || '-' }}</div>
                    </div>
                </div>

                <!-- Стандартное описание задания -->
                <div class="modal-task-description" v-else-if="selectedTask?.taskType !== 'friend'">
                    <p>{{ selectedTask?.description }}</p>
                </div>

                <!-- Сообщение о результате проверки подписки -->
                <div v-if="subscriptionStatus !== null"
                    :class="['subscription-status', subscriptionStatus ? 'success' : 'error']">
                    <div class="status-icon">
                        <svg v-if="subscriptionStatus" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <span>{{ subscriptionStatus ? 'Подписка подтверждена!' : 'Подписка не найдена. Пожалуйста, подпишитесь на канал и повторите проверку.' }}</span>
                </div>

                <!-- Статичный контент для подписки -->
                <div class="modal-task-benefits"
                    v-if="selectedTask?.taskType === 'subscription' && selectedTask.telegram_channel == 'bur_live'">
                    <h3>Преимущества подписки</h3>
                    <ul class="benefits-list">
                        <li>
                            <span class="benefit-icon">✓</span>
                            <span class="benefit-text">Ранний доступ к новым урокам</span>
                        </li>
                        <li>
                            <span class="benefit-icon">✓</span>
                            <span class="benefit-text">Эксклюзивные материалы по изучению бурятского языка</span>
                        </li>
                        <li>
                            <span class="benefit-icon">✓</span>
                            <span class="benefit-text">Мгновенные уведомления о новом контенте</span>
                        </li>
                    </ul>
                </div>

                <!-- Статичный контент для приглашения друзей -->
                <template v-else-if="selectedTask?.taskType === 'friend'">
                    <div class="modal-friend-description">
                        <p class="mb-2">Приглашая друзей, вы не только помогаете расширять наше сообщество, но и
                            получаете бонусные
                            очки!</p>
                        <p>Каждый новый участник повышает ваш рейтинг и открывает доступ к эксклюзивным возможностям.
                        </p>
                    </div>
                </template>
            </div>

            <!-- Футер модального окна -->
            <div class="modal-footer">
                <template v-if="isRegistrationSuccess || isAlreadyRegistered">
                    <button class="action-button" @click="$emit('close')">
                        <span>Продолжить</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </template>
                <template v-else-if="selectedTask?.taskType === 'subscription'">
                    <button class="action-button" @click="$emit('subscribe')">
                        <span>Подписаться на канал</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                    <button class="action-button secondary" @click="checkSubscription" :disabled="isChecking">
                        <span v-if="!isChecking">Проверить подписку</span>
                        <div v-else class="spinner"></div>
                        <svg v-if="!isChecking" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                    <p class="subscription-note">
                        Отписываться можно не ранее, чем через 5 дней, чтобы рейтинг не был списан.
                    </p>
                </template>
                <template v-else-if="selectedTask?.taskType === 'friend'">
                    <button class="action-button" @click="$emit('invite')">
                        <span>Пригласить друга</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </template>
                <template v-else>
                    <button class="action-button" @click="$emit('register')" :disabled="isRegistering">
                        <span v-if="!isRegistering">Принять участие</span>
                        <div v-else class="spinner"></div>
                        <svg v-if="!isRegistering" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { ITask } from '~/server/api/tasks.get'

const props = defineProps<{
    isVisible: boolean
    isOpen: boolean
    selectedTask: ITask | null
    isRegistrationSuccess?: boolean
    isAlreadyRegistered?: boolean
    userRank?: number | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'subscribe'): void
    (e: 'checkSubscription'): void
    (e: 'invite'): void
    (e: 'register'): void
}>()

// Состояние проверки подписки
const isChecking = ref(false)
const isRegistering = ref(false)
const subscriptionStatus = ref<boolean | null>(null)

// Функция проверки подписки
const checkSubscription = async () => {
    // Сбрасываем предыдущий статус при новой проверке
    subscriptionStatus.value = null
    isChecking.value = true

    try {
        // Вызываем событие для проверки подписки
        emit('checkSubscription')

        // Имитация задержки сетевого запроса
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Здесь должна быть логика обработки результата проверки
        // Например, подождать ответа от API и обновить статус

    } catch (error) {
        console.error('Ошибка при проверке подписки:', error)
        subscriptionStatus.value = false
    } finally {
        isChecking.value = false
    }
}

// Сбрасываем статус при закрытии модального окна
watch(() => props.isVisible, (newValue) => {
    if (!newValue) {
        subscriptionStatus.value = null
    }
})

// Для обновления статуса подписки извне
const updateSubscriptionStatus = (status: boolean) => {
    subscriptionStatus.value = status
}

// Для обновления статуса регистрации
const setRegistering = (status: boolean) => {
    isRegistering.value = status
}

// Переменные для драггинга
const isDragging = ref(false)
const startY = ref(0)
const dragOffset = ref(0)
const DRAG_THRESHOLD = 150
let initialHeight = 0

const modalContentEl = ref<HTMLElement | null>(null)

const onDragStart = (event: MouseEvent | TouchEvent) => {
    if ((event.target as HTMLElement).closest('button')) return

    isDragging.value = true
    startY.value = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY

    // Запоминаем исходную высоту модального окна
    initialHeight = modalContentEl.value?.offsetHeight || 0

    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
    document.addEventListener('touchmove', onDragMove)
    document.addEventListener('touchend', onDragEnd)
}

const onDragMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
    const currentY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY
    dragOffset.value = currentY - startY.value
}

const onDragEnd = () => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', onDragEnd)

    if (dragOffset.value > DRAG_THRESHOLD) {
        emit('close')
    } else {
        dragOffset.value = 0
    }
    isDragging.value = false
}

const dragStyle = computed(() => {
    if (!isDragging.value) return {}
    if (dragOffset.value < 0) {
        const newHeight = Math.min(initialHeight + Math.abs(dragOffset.value), window.innerHeight)
        return { height: `${newHeight}px`, transform: 'none', transition: 'none' }
    } else {
        return { transform: `translateY(${dragOffset.value}px)`, transition: 'none' }
    }
})

defineExpose({
    updateSubscriptionStatus,
    setRegistering
})
</script>

<style lang="scss" scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    backdrop-filter: blur(5px);
}

.modal-content {
    width: 100%;
    max-height: 85vh;
    background: var(--background-color, #fff);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    position: relative;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s ease-out, height 0.3s ease-out;
    will-change: transform, height;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
}

.modal-content.slide-active {
    transform: translateY(0);
}

.modal-header {
    padding: 12px 16px 0;
    display: flex;
    justify-content: center;
    position: relative;
}

.drag-handle {
    width: 40px;
    height: 4px;
    background-color: #ddd;
    border-radius: 4px;
    margin-bottom: 12px;
    cursor: grab;
}

.modal-close {
    position: absolute;
    top: 12px;
    right: 16px;
    background: transparent;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-color, #333);
    transition: background-color 0.2s;
}

.modal-close:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.modal-body {
    padding: 20px 24px;
    flex: 1;
}

.modal-task-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
}

.modal-task-image {
    width: 80px;
    height: 80px;
    min-width: 80px;
    border-radius: 16px;
    overflow: hidden;
    margin-right: 16px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-icon {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(76, 175, 80, 0.1);
}

.modal-task-title h2 {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color, #333);
}

.modal-task-description p {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--text-secondary-color, #666);
    margin: 0;
}

/* Стили для сообщения об успешной регистрации */
.registration-success-message {
    background-color: rgba(76, 175, 80, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    border: 1px solid rgba(76, 175, 80, 0.2);
}

.registration-success-message p {
    margin: 0 0 12px 0;
    color: var(--text-color, #333);
}

.registration-points {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #4CAF50;
    font-size: 1.1rem;
}

/* Стили для сообщения "уже участвует" */
.already-registered-message {
    background-color: rgba(33, 150, 243, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    border: 1px solid rgba(33, 150, 243, 0.2);
}

.already-registered-message p {
    margin: 0 0 12px 0;
    color: var(--text-color, #333);
}

.user-rank-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
}

.user-rank-info p {
    margin: 0;
    font-size: 0.95rem;
}

.user-rank-number {
    font-weight: 600;
    font-size: 1.2rem;
    background-color: rgba(0, 102, 204, 0.1);
    padding: 4px 14px;
    border-radius: 12px;
    color: #0066cc;
}

/* Стили для статуса подписки */
.subscription-status {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 16px 0;
    font-size: 0.95rem;
}

.subscription-status.success {
    background-color: rgba(46, 204, 113, 0.1);
    color: #2ecc71;
    border: 1px solid rgba(46, 204, 113, 0.3);
}

.subscription-status.error {
    background-color: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.3);
}

.status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
}

.subscription-status.success .status-icon svg {
    stroke: #2ecc71;
}

.subscription-status.error .status-icon svg {
    stroke: #e74c3c;
}

.modal-task-benefits {
    margin: 24px 0;
}

.modal-task-benefits h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-color, #333);
}

.benefits-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.benefits-list li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
}

.benefit-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 24px;
    border-radius: 50%;
    background-color: #e6f7ff;
    color: #0088cc;
    font-weight: bold;
    margin-right: 12px;
}

.benefit-text {
    font-size: 0.95rem;
    line-height: 1.4;
}

.subscription-reward {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-secondary-color, #666);
    margin-bottom: 24px;
}

.modal-footer {
    padding: 8px 24px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.action-button {
    width: 100%;
    max-width: 320px;
    height: 48px;
    background: #0088cc;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
}

.action-button:hover {
    background-color: #0077b3;
}

.action-button:active {
    transform: translateY(1px);
}

.action-button.secondary {
    margin-top: 12px;
}

.action-button:disabled {
    background-color: #7fb9d6;
    cursor: not-allowed;
}

/* Стили для спиннера */
.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.subscription-note {
    margin-top: 12px;
    font-size: 0.85rem;
    color: var(--text-secondary-color, #666);
    text-align: center;
}

/* Дополнительные стили для статичного контента приглашения друзей */
.modal-friend-description {
    margin-bottom: 16px;
    font-size: 1rem;
    color: var(--text-secondary-color, #666);
}

/* Responsive styles */
@media (max-width: 768px) {
    .modal-task-title h2 {
        font-size: 1.3rem;
    }

    .registration-points {
        font-size: 1rem;
    }

    .user-rank-number {
        font-size: 1.1rem;
    }
}

@media (max-width: 480px) {
    .modal-task-image {
        width: 70px;
        height: 70px;
        min-width: 70px;
    }

    .modal-task-title h2 {
        font-size: 1.2rem;
    }

    .modal-body {
        padding: 16px 20px;
    }

    .registration-success-message,
    .already-registered-message {
        padding: 14px;
    }
}
</style>