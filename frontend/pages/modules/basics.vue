<template>
    <div class="page module-page">
        <header>
            <h2>Основы бурятского языка</h2>
            <p>
                Изучите базовые фразы и попрактикуйтесь в приветствиях.
            </p>
            {{ useRouter().options.history.state.back }}
        </header>

        <main>
            <section id="lessons-list">
                <div class="lesson-card box-shadow" v-for="lesson in lessons" :key="lesson.id">
                    <div class="lesson-info">
                        <h3 class="lesson-title">{{ lesson.title }}</h3>
                        <p class="lesson-description">{{ lesson.description }}</p>
                    </div>
                    <button class="start-button">Начать</button>
                </div>
            </section>
            <NuxtLink class="btn btn-primary" style="display: block; margin: 16px 0;" to="/modules">Назад</NuxtLink>

        </main>
    </div>
</template>

<script setup lang="ts">
interface Lesson {
    id: number;
    title: string;
    description: string;
}

const lessons: Lesson[] = [
    { id: 1, title: 'Урок 1: Приветствие', description: 'Основные приветствия на бурятском.' },
    { id: 2, title: 'Урок 2: Знакомство', description: 'Фразы для знакомства.' },
];
onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: "/selectmodule" }); // Или другой маршрут по умолчанию
        });
    }
});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
});

</script>

<style scoped lang="scss">
.lesson-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    background-color: white;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
}

.start-button {
    padding: 10px 16px;
    background-color: #323232;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #454545;
    }
}
</style>
