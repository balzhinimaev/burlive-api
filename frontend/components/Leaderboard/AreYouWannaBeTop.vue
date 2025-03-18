<template>
    <div class="campaign-container">
        <div class="campaign-header">
            <div class="campaign-title-wrapper">
                <h3 class="campaign-title">Активные кампании</h3>
                <div class="info-tooltip">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="#999" stroke-width="1.5"/>
                        <text x="8" y="11" font-size="11" font-weight="bold" fill="#999" text-anchor="middle">?</text>
                    </svg>
                    <div class="tooltip-content">
                        <p>Кампания — это задание, которое можно выполнить для получения бонусных очков. Например, подписаться на канал или пригласить друга.</p>
                    </div>
                </div>
            </div>
            <div class="campaign-status">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#4CAF50" stroke-width="2"/>
                    <circle cx="8" cy="8" r="3" fill="#4CAF50"/>
                </svg>
                <span>{{ tasks.length }} кампаний</span>
            </div>
        </div>

        <div class="campaign-wrapper">
            <div class="campaign-content">
                <div class="frame-wrapper">
                    <div class="item" v-for="(task, index) in tasks" :key="index">
                        <!-- Блок подписки -->
                        <div v-if="task.taskType === 'subscription'" class="item-wrapper item-type-subscription"
                            @click="openSubscriptionModal(task)">
                            <div class="item-header">
                                <div class="item-header-photo">
                                    <NuxtImg v-if="task.imageUrl" width="64" height="64"
                                        :src="'https://burlive.ru/uploads/' + task.imageUrl" />
                                    <div v-else class="placeholder-image">
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M27 5H5C3.34315 5 2 6.34315 2 8V24C2 25.6569 3.34315 27 5 27H27C28.6569 27 30 25.6569 30 24V8C30 6.34315 28.6569 5 27 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M10.5 13C11.8807 13 13 11.8807 13 10.5C13 9.11929 11.8807 8 10.5 8C9.11929 8 8 9.11929 8 10.5C8 11.8807 9.11929 13 10.5 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M30 18L22.5 13L5 27" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="item-header-content">
                                    <div class="item-header-content-title">{{ task.title }}</div>
                                    <div class="item-header-content-description">{{ task.description }}</div>
                                    <div class="item-points" v-if="task.rewardPoints">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7 1.16667L8.16317 4.81917H12.0186L8.92775 7.13167L10.0915 10.7833L7 8.46917L3.90858 10.7833L5.07225 7.13167L1.98142 4.81917H5.83683L7 1.16667Z" fill="#FFD700"/>
                                        </svg>
                                        <span>{{ task.rewardPoints }} очков</span>
                                    </div>
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
                        <div v-else-if="task.taskType === 'friend'" class="item-wrapper item-type-friend"
                            @click="openFriendModal(task)">
                            <div class="item-header">
                                <div class="item-header-photo">
                                    <NuxtImg v-if="task.imageUrl" width="64" height="64"
                                        :src="'https://burlive.ru/uploads/' + task.imageUrl" />
                                    <div v-else class="placeholder-image">
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 19V17C21 15.9391 20.5786 14.9217 19.8284 14.1716C19.0783 13.4214 18.0609 13 17 13H9C7.93913 13 6.92172 13.4214 6.17157 14.1716C5.42143 14.9217 5 15.9391 5 17V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M13 9C15.2091 9 17 7.20914 17 5C17 2.79086 15.2091 1 13 1C10.7909 1 9 2.79086 9 5C9 7.20914 10.7909 9 13 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M23 9.00999L27 13.01L23 17.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="item-header-content">
                                    <div class="item-header-content-title">{{ task.title }}</div>
                                    <div class="item-header-content-description">{{ task.description }}</div>
                                    <div class="item-points" v-if="task.rewardPoints">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7 1.16667L8.16317 4.81917H12.0186L8.92775 7.13167L10.0915 10.7833L7 8.46917L3.90858 10.7833L5.07225 7.13167L1.98142 4.81917H5.83683L7 1.16667Z" fill="#FFD700"/>
                                        </svg>
                                        <span>{{ task.rewardPoints }} очков</span>
                                    </div>
                                </div>
                                <div class="arrow-right">
                                    <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M8.23749 6.86914C8.58999 7.21797 8.58999 7.78203 8.23749 8.12715L2.23749 14.0684C1.88499 14.4172 1.31499 14.4172 0.966245 14.0684C0.617495 13.7195 0.613745 13.1555 0.966245 12.8104L6.32874 7.50371L0.962495 2.19336C0.609995 1.84453 0.609995 1.28047 0.962495 0.935351C1.315 0.590234 1.885 0.586523 2.23375 0.935351L8.23749 6.86914Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Другие типы задач можно добавить здесь -->
                    </div>
                </div>
                
                <!-- Сообщение, если нет активных кампаний -->
                <div v-if="tasks.length === 0" class="no-campaigns">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M24 16V24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M24 32H24.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>В настоящее время нет активных кампаний</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Использование модального окна -->
    <TaskModal 
        ref="taskModalRef" 
        v-if="user" 
        :isVisible="isModalVisible" 
        :isOpen="isModalOpen"
        :selectedTask="selectedTask" 
        @close="closeModal"
        @subscribe="() => subscribeChannel(selectedTask?.telegram_channel || 'bur_live')"
        @checkSubscription="() => checkSubscription(user?._id, selectedTask?.telegram_channel)" 
        @invite="inviteFriend" 
    />
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { ITask } from '~/server/api/tasks.get'
import type { User } from '@/stores/userStore'

interface Props {
    tasks: ITask[],
    promotionId: string,
    user: User | null
}

const props = defineProps<Props>()

const isModalOpen = ref(false)
const isModalVisible = ref(false)
const selectedTask = ref<ITask | null>(null)
const isCheckingSubscription = ref(false)

// Ссылка на модальное окно для доступа к его методам
const taskModalRef = ref<any>(null)

const openSubscriptionModal = (task: ITask) => {
    selectedTask.value = task
    isModalVisible.value = true

    setTimeout(() => {
        isModalOpen.value = true
    }, 10)
}

const openFriendModal = (task: ITask) => {
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

const checkSubscription = async (userId: string | undefined, channel_username: string | undefined) => {
    isCheckingSubscription.value = true

    if (!channel_username) {
        if (taskModalRef.value) {
            taskModalRef.value.updateSubscriptionStatus(false)
        }
        isCheckingSubscription.value = false
        return
    }

    try {
        const response = await $fetch<any>(`/api/telegram/check-subscription`, {
            method: 'POST',
            body: {
                userId,
                channel_username
            }
        })

        // Обновляем статус подписки в модальном окне
        if (taskModalRef.value) {
            taskModalRef.value.updateSubscriptionStatus(response.subscribed)
        }

        if (response.subscribed) {
            await $fetch<any>(`/api/tasks/complete`, {
                method: 'POST',
                body: {
                    taskId: selectedTask.value?._id,
                    userId: userId,
                    promotionId: props.promotionId
                }
            })
        }
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error)
        if (taskModalRef.value) {
            taskModalRef.value.updateSubscriptionStatus(false)
        }
    } finally {
        isCheckingSubscription.value = false
    }
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
.campaign-container {
    display: flex;
    flex-direction: column;
    background: var(--background-component-color);
    border-radius: 18px;
    box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.06);
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
}

.campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.campaign-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.campaign-title {
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

.campaign-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
}

.campaign-wrapper {
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

.campaign-content {
    display: flex;
    flex-direction: column;
}

.frame-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.item {
    background: var(--background-component-color);
    border-radius: 15px;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.05);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08);
    }
}

.item-wrapper {
    padding: 14px;
}

.item-header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.item-header-photo {
    width: 64px;
    height: 64px;
    min-width: 64px;
    min-height: 64px;
    border-radius: 15px;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.placeholder-image {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgba(0, 0, 0, 0.3);
}

.item-header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .item-header-content-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary-color, #333);
    }
    
    .item-header-content-description {
        font-size: 14px;
        color: var(--text-secondary-color, #666);
        margin-bottom: 4px;
    }
}

.item-points {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #D4AF37;
    background-color: rgba(255, 215, 0, 0.1);
    padding: 3px 8px;
    border-radius: 10px;
    width: fit-content;
}

.arrow-right {
    margin-left: auto;
    
    svg {
        path {
            fill: var(--text-color);
        }
    }
}

.no-campaigns {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary-color, #666);
    
    svg {
        color: var(--text-secondary-color, #666);
        opacity: 0.5;
        margin-bottom: 16px;
    }
    
    p {
        font-size: 16px;
        margin: 0;
    }
}

/* Responsive styles */
@media (max-width: 768px) {
    .campaign-header {
        padding: 14px 16px;
    }

    .campaign-title {
        font-size: 16px;
    }

    .campaign-wrapper {
        padding: 14px;
    }
    
    .item-wrapper {
        padding: 12px;
    }
    
    .item-header-photo {
        width: 56px;
        height: 56px;
        min-width: 56px;
        min-height: 56px;
    }
    
    .info-tooltip .tooltip-content {
        width: 220px;
    }
}

@media (max-width: 480px) {
    .campaign-header {
        padding: 12px 14px;
    }

    .campaign-title {
        font-size: 15px;
    }

    .campaign-wrapper {
        padding: 12px;
    }
    
    .item-header-content {
        .item-header-content-title {
            font-size: 15px;
        }
        
        .item-header-content-description {
            font-size: 13px;
        }
    }
    
    .info-tooltip .tooltip-content {
        width: 200px;
        font-size: 13px;
    }
}
</style>