<template>
    <div class="lesson-item-component" @click="goToModule(module._id)">
        <div class="header">
            <div class="title">
                <div class="lock-icon" style="margin-left: 4px;" v-if="module.isPremium">
                    <svg style="transform: skew(-15deg);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path
                            d="M144 128v64H304V128c0-44.2-35.8-80-80-80s-80 35.8-80 80zM96 192V128C96 57.3 153.3 0 224 0s128 57.3 128 128v64h32c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H96zM48 256V448c0 8.8 7.2 16 16 16H384c8.8 0 16-7.2 16-16V256c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16z" />
                    </svg>
                </div>
                <p v-if="module.isPremium"><i>{{ module.title }}</i></p>
                <p v-else>{{ module.title }}</p>
            </div>
            <div class="complexity">
                <StarRating :rating="module.complexity" />
            </div>
        </div>

        <p class="description">{{ module.description ? module.description : "Описание отсутствует." }}</p>
        <!-- <p>{{ lesson.questions.length }}</p> -->

        <div class="footer">
            <p>{{ module.viewsCounter }}</p>
            <div class="eye">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                        d="M106.3 124.3C151.4 82.4 212.4 48 288 48s136.6 34.4 181.7 76.3c44.9 41.7 75 91.7 89.1 125.6c1.6 3.9 1.6 8.4 0 12.3C544.7 296 514.6 346 469.7 387.7C424.6 429.6 363.6 464 288 464s-136.6-34.4-181.7-76.3C61.4 346 31.3 296 17.2 262.2c-1.6-3.9-1.6-8.4 0-12.3C31.3 216 61.4 166 106.3 124.3zM288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM192 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm208 0a112 112 0 1 0 -224 0 112 112 0 1 0 224 0z" />
                </svg>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.header {
    display: flex;
    justify-content: space-between;
    .title {
        display: flex;
        // padding-left: 5px;
        p {
            margin: auto 0 0;
        }
    }
}
.lock-icon {
    width: 14px;
    margin-right: 5px;
    position: relative;
    bottom: 2px;
    svg, path {
        fill: var(--text-color)
    }
}
.complexity {
    display: flex;
    gap: 5px;
}
.star, .star-half {
    width: 16px;
    path, svg {
        fill: #AC9306;
    }
}
.lesson-item-component {
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
        path, svg {
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
.title {
    p {
        font-weight: 600;
    }
}
hr {
    margin: 15px 0;
}
</style>

<script lang="ts" setup>
// Определение интерфейсов
interface Module {
    _id: string;
    title: string;
    description: string;
    short_title: string;
    lessons: string[];
    disabled: boolean;
    order: number;
    complexity: number;
    isPremium: boolean;
    viewsCounter: number;
}
// Определение props с использованием дженериков
defineProps<{
    module: Module
}>();
// Функция перехода к уроку
function goToModule(id: string) {
    useRouter().push('/modules/' + id);
}
</script>