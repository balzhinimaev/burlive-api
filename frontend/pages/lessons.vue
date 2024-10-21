<template>
    <div class="page lessons-page">
        <header>
            <div class="container-fluid">
                <h2 class="heading">📚 Уроки</h2>
                <p class="typography-body">
                    Выберите урок и начните обучение. Ваш прогресс сохранится
                    автоматически.
                </p>
            </div>
        </header>

        <main>
            <section id="lessons-list">
                <div class="lesson-card box-shadow" v-for="lesson in lessons" :key="lesson.id">
                    <div class="lesson-info">
                        <h3 class="lesson-title">{{ lesson.title }}</h3>
                        <p class="lesson-description">{{ lesson.description }}</p>
                        <div class="progress-bar">
                            <div class="progress" :style="{ width: lesson.progress + '%' }"></div>
                        </div>
                    </div>
                    <button class="start-button">Начать</button>
                </div>
            </section>
        </main>
    </div>
</template>


<style lang="scss" scoped>
.page {
    margin: 32px 0;

    main {
        margin: 0 16px;
    }
}

.heading {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 32px;
    line-height: 1.2;
    letter-spacing: -0.05em;
}

.typography-body {
    font-family: 'Nunito', sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.5;
    letter-spacing: -0.05em;
    margin-bottom: 24px;
}

#lessons-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .lesson-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1),
            0px 1px 3px rgba(0, 0, 0, 0.05);
    }

    .lesson-info {
        flex: 1;
        margin-right: 16px;

        .lesson-title {
            font-family: 'Nunito', sans-serif;
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 4px;
        }

        .lesson-description {
            font-family: 'Nunito', sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .progress-bar {
            background-color: #f0f0f0;
            border-radius: 4px;
            height: 8px;
            overflow: hidden;

            .progress {
                background-color: #4caf50;
                height: 100%;
                transition: width 0.3s;
            }
        }
    }

    .start-button {
        padding: 10px 16px;
        background-color: #323232;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s;

        &:hover {
            background-color: #454545;
        }
    }
}
</style>


<script setup lang="ts">
interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
}

const lessons: Lesson[] = [
    {
        id: 1,
        title: 'Урок 1: Приветствие',
        description: 'Изучите основные фразы для приветствия на бурятском языке.',
        progress: 50,
    },
    {
        id: 2,
        title: 'Урок 2: Знакомство',
        description: 'Научитесь представляться и задавать вопросы о других.',
        progress: 20,
    },
    {
        id: 3,
        title: 'Урок 3: Прощание',
        description: 'Попрактикуйтесь в прощальных фразах и пожеланиях.',
        progress: 0,
    },
];
</script>
