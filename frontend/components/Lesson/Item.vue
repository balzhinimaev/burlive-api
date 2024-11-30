<template>
    <div class="lesson-item-component" @click="goToLesson(lesson._id)">
        <div class="header">
            <p>{{ lesson.title }}</p>
            <div class="dif">
                <div class="star">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                        <path class="fa-secondary"
                            d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                        <path class="fa-primary" />
                    </svg>
                </div>
                <div class="star-half">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                        <path class="fa-secondary"
                            d="M288.1 376.3l-.1 .1v63.5l.1-.1 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18C311.6 7 300.4 0 288.1 0c-.5 0-1.1 0-1.6 0H288V87.1l.1-.3 42.7 87.9 12.9 26.6 29.3 4.3 96.1 14.2-70.1 69.3-20.7 20.5 4.8 28.7 16.5 97.6-85.2-45.5-26.4-14.1zM146.3 512c-1.1 .1-2.1 .1-3.2 0h3.2z" />
                        <path class="fa-primary"
                            d="M289.7 0H288V87.1 376.4v63.5L159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18c.5 0 1.1 0 1.6 0zM433.2 512c-1.1 .1-2.1 .1-3.2 0h3.2z" />
                    </svg>
                </div>
                <div class="star-half">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 576 512">
                        <path
                            d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z" />
                    </svg>
                </div>
            </div>
        </div>

        <p class="description">{{ lesson.description ? lesson.description : "Описание отсутствует." }}</p>
        <!-- <p>{{ lesson.questions.length }}</p> -->

        <div class="footer">
            <p>{{ lesson.viewsCounter }}</p>
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
    justify-content: space-between
}
.dif {
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
hr {
    margin: 15px 0;
}
</style>

<script lang="ts" setup>
interface Question {
    question: string;
    options: string[];
    correct: number;
    _id: string;
}
interface Lesson {
    _id: string;
    title: string;
    description?: string;
    order: number;
    moduleId: string;
    questions: Question[];
    disabled?: boolean;
    viewsCounter?: number;
}
// Определение props с использованием дженериков
defineProps<{
    lesson: Lesson
}>();
// Функция перехода к уроку
function goToLesson(id: string) {
    useRouter().push('/lesson/' + id);
}
</script>