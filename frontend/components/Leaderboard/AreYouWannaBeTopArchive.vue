<template>
    <div class="frame-wrapper">
        <div class="item">
            <div class="item-header">
                <div class="item-header-photo">

                </div>

                <div class="item-header-content">
                    <div class="item-header-content-title">BurLive</div>
                    <div class="item-header-content-description">Следите за новостями проекта</div>
                    <div class="item-header-content-description"><a @click.prevent="subscribeChannel" href="https://t.me/bur_live" target="_blank">@bur_live</a></div>
                </div>
            </div>

            <div class="item-footer">
                <button v-if="!subscriptionStatus" @click="subscribeChannel"><span>Подписаться</span></button>
                <button v-if="!subscriptionStatus" @click="checkSubscription" class="check-btn">
                    <span>Проверить подписку</span>
                </button>
                <!-- Выводим статус подписки -->
                <p v-if="subscriptionStatus !== null" class="status-message">
                    <i>{{ subscriptionStatus ? "Вы подписаны! +300 очков получены" : "Вы не подписаны" }}</i>
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
// Храним статус подписки: true - подписан, false - нет, null - не проверялось
const subscriptionStatus = ref<boolean>(true)
const checkSubscription = async () => {
    if (window.Telegram?.WebApp) {
        // Получаем Telegram ID пользователя из WebApp
        const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id
        if (!userId) return
        try {
            // Предполагается, что на сервере есть endpoint для проверки подписки
            const response: {
                status: string;
                subscribed: boolean;
            } = await $fetch("/api/telegram/check-subscription", {
                method: 'POST',
                body: {
                    userId
                }
            })
            subscriptionStatus.value = response.subscribed
        } catch (error) {
            console.error('Ошибка проверки подписки:', error)
        }
    }
}
const subscribeChannel = () => {
    // Ссылка для перехода в телеграм-канал
    const channelLink = "https://t.me/bur_live";
    // Открываем ссылку через Telegram WebApp API
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(channelLink);
    }
};
const inviteFriend = () => {
    const inviteLink = `https://t.me/share/url?url=https://t.me/burlang_bot&text=Присоединяйся ко мне в изучении и продвижении бурятского языка!`;
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(inviteLink);
    }
};</script>

<style lang="scss" scoped>
.frame-wrapper {
    /* Frame 21 */

    /* Auto layout */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 8px;

    /* Inside auto layout */
    /* flex: none; */
    /* order: 2; */
    /* flex-grow: 0; */
    .item {
        /* Frame 17 */

        /* Auto layout */
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 16px;
        gap: 8px;
        width: 100%;
        background: var(--background-component-color);
        box-shadow: 0px 4px 4px rgba(16, 16, 16, 0.25);
        border-radius: 15px;

        .item-header {
            /* Frame 22 */

            /* Auto layout */
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            padding: 0px;
            gap: 16px;

            height: 64px;

            align-self: stretch;


            .item-header-photo {
                /* Frame 17 */
                width: 64px;
                height: 64px;

                background: #FFFFFF;
                box-shadow: 0px 4px 4px rgba(64, 64, 64, 0.25);
                border-radius: 15px;

                /* Inside auto layout */
                flex: none;
                order: 0;
                flex-grow: 0;

            }

            .item-header-content {
                /* Frame 19 */

                /* Auto layout */
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                padding: 0px;
                gap: 4;

                .item-header-content-title {
                    /* BurLive */

                    font-size: 16px;
                    line-height: 21px;

                }

                .item-header-content-description {

                    font-size: 14px;
                    line-height: 16px;

                }

            }

        }

        .item-footer {
            /* Frame 23 */

            /* Auto layout */
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0px;
            gap: 10px;

            order: 1;
            align-self: stretch;
            flex-grow: 0;

            button {
                /* Frame 20 */

                /* Auto layout */
                border: none;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                padding: 7px 18px;
                gap: 10px;

                background: rgba(68, 141, 235, 0.94);
                box-shadow: 0px 4px 4px rgba(34, 34, 34, 0.25);
                border-radius: 5px;

                span {
                    /* Подписаться */

                    font-style: normal;
                    font-weight: 400;
                    font-size: 14px;
                    line-height: 18px;

                    color: #FFFFFF;

                }
            }

            p {
                /* +300 очков за подписку */

                font-weight: 400;
                font-size: 14px;
                line-height: 16px;
                /* identical to box height */

                color: var(--text-color);

            }
        }
    }
}
</style>