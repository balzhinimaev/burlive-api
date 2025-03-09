<template>
    <div class="frame-wrapper">
        <div class="item" v-for="(task, index) in tasks" :key="index">
            <!-- Блок подписки -->
            <div v-if="task.taskType === 'subscription'" class="item-wrapper item-type-subscription"
                @click="openSubscriptionModal(task)">
                <div class="item-header">
                    <div class="item-header-photo">
                        <NuxtImg v-if="task.imageUrl" width="64" height="64"
                            :src="'https://burlive.ru/uploads/' + task.imageUrl" />
                    </div>
                    <div class="item-header-content">
                        <div class="item-header-content-title">{{ task.title }}</div>
                        <div class="item-header-content-description">{{ task.description }}</div>
                    </div>
                    <div class="arrow-right">
                        <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M8.23749 6.86914C8.58999 7.21797 8.58999 7.78203 8.23749 8.12715L2.23749 14.0684C1.88499 14.4172 1.31499 14.4172 0.966245 14.0684C0.617495 13.7195 0.613745 13.1555 0.966245 12.8104L6.32874 7.50371L0.962495 2.19336C0.609995 1.84453 0.609995 1.28047 0.962495 0.935351C1.315 0.590234 1.885 0.586523 2.23375 0.935351L8.23749 6.86914Z" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Блок приглашения друзей -->
            <div v-else-if="task.taskType === 'friend'" class="item-wrapper item-type-friend" @click="inviteFriend">
                <div class="item-header">
                    <div class="item-header-photo">
                        <NuxtImg v-if="task.imageUrl" width="64" height="64"
                            :src="'https://burlive.ru/uploads/' + task.imageUrl" />
                    </div>
                    <div class="item-header-content">
                        <div class="item-header-content-title">{{ task.title }}</div>
                        <div class="item-header-content-description">{{ task.description }}</div>
                    </div>
                    <div class="arrow-right">
                        <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M8.23749 6.86914C8.58999 7.21797 8.58999 7.78203 8.23749 8.12715L2.23749 14.0684C1.88499 14.4172 1.31499 14.4172 0.966245 14.0684C0.617495 13.7195 0.613745 13.1555 0.966245 12.8104L6.32874 7.50371L0.962495 2.19336C0.609995 1.84453 0.609995 1.28047 0.962495 0.935351C1.315 0.590234 1.885 0.586523 2.23375 0.935351L8.23749 6.86914Z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Использование модального окна -->
        <TaskModal :isVisible="isModalVisible" :isOpen="isModalOpen" :selectedTask="selectedTask" @close="closeModal"
            @subscribe="() => subscribeChannel(selectedTask?.telegram_channel || 'bur_live')"
            @checkSubscription="checkSubscription" @invite="inviteFriend" />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { ITask } from '~/server/api/tasks.get'
interface Props {
    tasks: ITask[]
}
defineProps<Props>()

const isModalOpen = ref(false)
const isModalVisible = ref(false)
const selectedTask = ref<ITask | null>(null)


const openSubscriptionModal = (task: ITask) => {
    selectedTask.value = task
    isModalVisible.value = true

    setTimeout(() => {
        isModalOpen.value = true
    }, 10)
}

const closeModal = () => {
    isModalOpen.value = false
    setTimeout(() => {
        isModalVisible.value = false
        selectedTask.value = null
    }, 300)
}

const subscribeChannel = (channel: string) => {
    const channelLink = `https://t.me/${channel}`
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(channelLink)
    } else {
        window.open(channelLink, '_blank')
    }
}

const checkSubscription = () => {
    alert("Проверка подписки...")
}

const inviteFriend = () => {
    const inviteLink = `https://t.me/share/url?url=https://t.me/burlang_bot&text=Присоединяйся ко мне в изучении и продвижении бурятского языка!`
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(inviteLink)
    } else {
        window.open(inviteLink, '_blank')
    }
}

</script>

<style lang="scss" scoped>
.frame-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* Стили для элементов задач */
.item {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--background-component-color);
    box-shadow: 0px 4px 4px rgba(16, 16, 16, 0.25);
    border-radius: 15px;
    cursor: pointer;
}

.item-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    width: 100%;
}

.item-header-photo {
    width: 64px;
    height: 64px;
    min-width: 64px;
    min-height: 64px;
    border-radius: 15px;
    overflow: hidden;
    flex-shrink: 0;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.item-header-content {
    display: flex;
    flex-direction: column;

    .item-header-content-title {
        font-size: 1rem;
        font-weight: 600;
    }

    .item-header-content-description {
        font-size: 0.8rem;
    }
}

.arrow-right {
    margin-left: auto;

    svg {
        path {
            fill: var(--text-color);
        }
    }
}

/* Стили для модального окна */
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

/* Шапка модального окна */
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

    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
}

/* Основная часть модального окна */
.modal-body {
    padding: 20px 24px 10px;
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

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.modal-task-title {
    h2 {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-color, #333);
    }
}

.modal-task-description {
    margin-bottom: 32px;

    p {
        font-size: 1rem;
        line-height: 1.5;
        color: var(--text-secondary-color, #666);
        margin: 0;
    }
}

.modal-task-benefits {
    margin-bottom: 24px;

    h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--text-color, #333);
    }
}

.benefits-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
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
}

/* Информация о начисляемых очках */
.subscription-reward {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-secondary-color, #666);
    margin-bottom: 24px;
}

/* Футер модального окна */
.modal-footer {
    padding: 8px 24px 32px;
    /* уменьшен верхний отступ */
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

    &:hover {
        background-color: #0077b3;
    }

    &:active {
        transform: translateY(1px);
    }

    svg {
        stroke: white;
    }
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
