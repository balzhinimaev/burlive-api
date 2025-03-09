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
                <div class="modal-task-header">
                    <div class="modal-task-image" v-if="selectedTask?.imageUrl">
                        <NuxtImg width="80" height="80" :src="'https://burlive.ru/uploads/' + selectedTask.imageUrl" />
                    </div>
                    <div class="modal-task-title">
                        <h2>{{ selectedTask?.title }}</h2>
                    </div>
                </div>

                <div class="modal-task-description">
                    <p>{{ selectedTask?.description }}</p>
                </div>

                <div class="modal-task-benefits" v-if="selectedTask?.taskType === 'subscription'">
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

                <div class="subscription-reward"
                    v-if="selectedTask?.taskType === 'subscription' && selectedTask.rewardPoints">
                    <p>За подписку вы получите {{ selectedTask.rewardPoints }} очков.</p>
                </div>
            </div>

            <!-- Футер модального окна -->
            <div class="modal-footer">
                <template v-if="selectedTask?.taskType === 'subscription'">
                    <button class="action-button" @click="$emit('subscribe')">
                        <span>Подписаться на канал</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                    <button class="action-button secondary" @click="$emit('checkSubscription')">
                        <span>Проверить подписку</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <button class="action-button">
                        <span>Продолжить</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
import { ref, computed } from 'vue'
import type { ITask } from '~/server/api/tasks.get'

const props = defineProps<{
    isVisible: boolean
    isOpen: boolean
    selectedTask: ITask | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'subscribe'): void
    (e: 'checkSubscription'): void
    (e: 'invite'): void
}>()

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

.modal-task-benefits {
    margin-bottom: 24px;
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

.subscription-note {
    margin-top: 12px;
    font-size: 0.85rem;
    color: var(--text-secondary-color, #666);
    text-align: center;
}
</style>
