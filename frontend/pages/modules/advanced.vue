<template>
    <div class="page module-page">
        <header>
            <h2 class="heading">Продвинутый курс</h2>
            <p class="typography-body">
                Углубитесь в грамматику и изучите сложные фразы.
            </p>
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
const lessons = [
    { id: 3, title: 'Урок 3: Прощание', description: 'Фразы для прощания.' },
];
</script>
