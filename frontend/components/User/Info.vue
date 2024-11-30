<template>
    <div class="user-wrapper">
        <div class="container">
            <div v-if="isFetching">Подтягивание данных</div>
            <div v-else-if="user">
                <div class="user-wrapper-inner" v-if="user">
                    <img v-if="user.photo_url" class="user-avatar" :src="user?.photo_url" alt="">
                    <div class="user-data">
                        <h6 style="margin: 0;">{{ user.first_name ? user.first_name : user.username }}</h6>

                        <div class="level">
                            <p class="level-title">
                                {{ user.level.icon }} <span class="name-l">{{ user.level.name }}</span>
                            </p>

                            <div class="progress-level">
                                <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
                            </div>
                            <p class="left">{{ user?.rating }}/{{ user.level.maxRating }}</p>
                        </div>

                        <!-- <p class="typography-body">Рейтинг: {{ userStore.user?.rating }}</p> -->
                        <!-- <div class="theme-toggler">
              <p class="typography-body">Цветовая схема:</p>
              <select v-model="selectedTheme" @change="changeTheme" class="theme-select">
                <option value="light">Светлая</option>
                <option value="dark">Темная</option>
              </select>
            </div> -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
// const props = defineProps<{
    // user: User;
    // progressPercentage: any;
// }>();
// onMounted(async () => {
//     if (window.Telegram?.WebApp) {
//         if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
//             await userStore.checkUserExists(window.Telegram.WebApp.initDataUnsafe.user.id)
//         }
//     }
// })
const userStore = useUserStore();
const user = computed(() => userStore.user);
const isFetching = computed(() => userStore.on_fetching_user_result);

const progressPoints = computed(() => {
    const currentRating = user.value?.rating ?? 0;
    const maxRating = user.value?.level?.maxRating ?? 1; // Avoid division by zero
    return `${currentRating}/${maxRating}`;
});
// Вычисление процента
const progressPercentage = computed(() => {
    const [current, max] = progressPoints.value.split("/").map(Number);
    return ((current / max) * 100).toFixed(2);
});
</script>

<style lang="scss" scoped>
.progress-level {
    position: relative;
    width: 50px;
    height: 8px;
    background-color: #e0e0e0;
    /* Цвет фона */
    border-radius: 10px;
    overflow: hidden;
    /* Чтобы градиент был в рамках */
}

.progress-bar {
    height: 100%;
    background: linear-gradient(to right, #41d95d, #356440);
    /* Градиент */
    transition: width 0.3s ease-in-out;
    /* Плавное изменение ширины */
}

.level {
    margin: 5px auto;
    display: flex;

    .progress-level {
        display: flex;
        margin: auto 5px;
        border: 1px solid #646464;
        border-radius: 10px;

        span {
            display: block;
            height: 5px;
            width: 10px;

            &.fill {
                background-color: rgb(41, 219, 41);
            }

            // border-radius: 5px;
        }
    }

    .left {
        font-size: 10px;
        margin: auto;
    }
}
.user-wrapper-inner {
    padding: 8px;
    background-color: var(--background-component-color);
    margin-top: 16px;
    display: flex;
    border-radius: 10px;

    .user-avatar {
        height: 64px;
        border-radius: 50%;
        margin: auto 15px;
    }

    .user-data {
        margin: auto 0;
    }

    .theme-toggler {
        display: flex;

        .btn {
            margin: auto 0;
            padding: 0;
            margin: 0 !important;
            display: block;
            font-size: 8px;
        }
    }

    h6 {
        margin-bottom: 0;
        line-height: 100%;
    }

    p {
        margin: 0;
        line-height: 100%;
    }
}
.level-title {
    display: inline-flex;
    /* Элементы будут находиться в одной строке */
    align-items: center;
    /* Выравнивание по вертикали */
    white-space: nowrap;
    /* Запрет на перенос текста */
    gap: 5px;
    /* Отступ между иконкой и текстом */
    font-size: 13px;
    /* Текущий размер шрифта */
}
</style>