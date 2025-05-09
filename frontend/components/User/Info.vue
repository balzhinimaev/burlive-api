<template>
    <div class="user-wrapper">
        <div class="container">
            <div v-if="isFetching">Подтягивание данных...</div>
            <div v-else-if="user">
                <div class="user-wrapper-inner">
                    <img v-if="user.photo_url" class="user-avatar has" :src="user.photo_url" alt="User Avatar">
                    <img v-else class="user-avatar" alt="User Avatar">
                    <div class="user-data">
                        <h6 style="margin: 0;">{{ user.first_name || user.username }}</h6>
                        <div class="level">
                            <p class="level-title">
                                {{ user.level.icon }} <span class="name-l">{{ user.level.name }}</span>
                            </p>
                            <div class="progress-level">
                                <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
                            </div>
                            <p class="left">{{ user.rating }}/{{ user.level.maxRating }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore();
const user = computed(() => userStore.user);
const isFetching = computed(() => userStore.on_fetching_user_result);

const progressPercentage = computed(() => {
    const currentRating = user.value?.rating ?? 0;
    const maxRating = user.value?.level?.maxRating ?? 1;
    return ((currentRating / maxRating) * 100).toFixed(2);
});
</script>

<style lang="scss" scoped>
.progress-level {
    position: relative;
    width: 50px;
    height: 8px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(to right, #41d95d, #356440);
    transition: width 0.3s ease-in-out;
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
    box-shadow: var(--box-shadow);

    .user-avatar {
        height: 48px;
        width: 48px;
        background-color: #d7d7d7;
        border-radius: 50%;
        margin: 5px 15px;

        &.has {
            background-color: transparent;
        }
    }

    .user-data {
        margin: auto 0;
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
    align-items: center;
    white-space: nowrap;
    gap: 5px;
    font-size: 13px;
}
</style>
