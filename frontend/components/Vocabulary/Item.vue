<template>
    <div class="theme-item-component" @click="goToTheme(theme._id)">
        <div class="header">
            <div class="title">
                <p>{{ theme.name }}</p>
            </div>
            <div class="complexity">
                <StarRating :rating="theme.complexity" />
            </div>
        </div>

        <p class="description">{{ theme.description ? theme.description : "Описание отсутствует." }}</p>

        <div class="footer">
            <p>{{ theme.viewCounter }}</p>
            <div class="eye">
                <!-- SVG иконка глаза -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                        d="M106.3 124.3C151.4 82.4 212.4 48 288 48s136.6 34.4 181.7 76.3c44.9 41.7 75 91.7 89.1 125.6c1.6 3.9 1.6 8.4 0 12.3C544.7 296 514.6 346 469.7 387.7C424.6 429.6 363.6 464 288 464s-136.6-34.4-181.7-76.3C61.4 346 31.3 296 17.2 262.2c-1.6-3.9-1.6-8.4 0-12.3C31.3 216 61.4 166 106.3 124.3zM288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM192 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm208 0a112 112 0 1 0 -224 0 112 112 0 1 0 224 0z" />
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import StarRating from '@/components/StarRating.vue';

defineProps<{
    theme: Theme;
}>();

const router = useRouter();

function goToTheme(id: string) {
    router.push('/vocabulary/' + id);
}
</script>

<style scoped>
/* Ваши стили */
.header {
    display: flex;
    justify-content: space-between;

    .title {
        p {
            margin: 0;
            font-weight: bold;
            font-size: 18px;
        }
    }

    .complexity {
        display: flex;
        align-items: center;
    }
}
.lock-icon {
    width: 14px;
    margin-right: 5px;
    position: relative;
    bottom: 2px;

    svg,
    path {
        fill: var(--text-color)
    }
}

.dif {
    display: flex;
    gap: 5px;
}

.star,
.star-half {
    width: 16px;

    path,
    svg {
        fill: #AC9306;
    }
}

.theme-item-component {
    padding: 16px;
    background-color: var(--background-component-color);
    border-radius: 10px;
    margin: 8px auto;
    min-height: 80px;
    cursor: pointer;
}

.footer {
    display: flex;
    justify-content: flex-end;
    margin-right: 4px;

    .eye {
        margin: auto 0 auto 5px;
        width: 14px;
        position: relative;
        top: -2px;

        path,
        svg {
            fill: var(--description-color);
        }
    }

    p {
        margin: auto 0;
        line-height: 10px;
        font-size: 14px;
        color: var(--description-color);
    }
}

p {
    font-size: 15px;
    margin: 0;

    &.description {
        color: var(--description-color);
    }
}

hr {
    margin: 15px 0;
}
/* Остальные стили */
</style>
