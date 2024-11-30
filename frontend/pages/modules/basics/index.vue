<template>
    <div class="page module-page">
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">Основы бурятского языка</h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/selectmodule">Модули</nuxt-link><span class="split">/</span>
                        <nuxt-link to="/modules/basics">Базовый модуль</nuxt-link>
                    </p>
                    <p class="typography-body">
                        Изучите базовые фразы и попрактикуйтесь в приветствиях.
                    </p>
                </div>
            </div>
        </header>
        <!-- <button @click="checkAnswer()">test</button> -->
        <main>
            <div class="container">
                <section id="lessons-list">
                    <a href="javascript:void(0)" @click.prevent="goToLesson(lesson.id)" class="
                        lesson-card" v-for="lesson in lessons" :key="lesson.id">
                        <div class="lesson-icon">
                            {{ lesson.id }}
                            <div class="circle"></div>
                        </div>
                        <div class="lesson-info">
                            <h3 class="lesson-title">{{ lesson.title }}</h3>
                            <p class="lesson-description">{{ lesson.description }}</p>
                        </div>
                    </a>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
interface Lesson {
    id: number;
    title: string;
    description: string;
}
// function checkAnswer() {
//     vibrateSuccess(); // Запускаем вибрацию
// }

// function vibrateSuccess() {
//     if (navigator.vibrate) {
//         navigator.vibrate(300); // Вибрация на 200 мс
//     } else {
//         console.log("Вибрация не поддерживается на этом устройстве.");
//     }
// }

const lessons: Lesson[] = [
    { id: 1, title: 'Введение в бурятский язык', description: 'Основные приветствия на бурятском.' },
    { id: 2, title: 'Гласные и согласные звуки', description: 'Фразы для знакомства.' },
    { id: 3, title: 'Приветствия и базовые фразы', description: 'Фразы для знакомства.' },
    { id: 4, title: 'Личные местоимения', description: 'Фразы для знакомства.' },
    { id: 5, title: 'Числительные', description: 'Фразы для знакомства.' },
    { id: 6, title: 'Простые существительные', description: 'Фразы для знакомства.' },
    { id: 7, title: 'Простейшие глаголы', description: 'Фразы для знакомства.' },
    { id: 8, title: 'Простые предложения', description: 'Фразы для знакомства.' },
    { id: 9, title: 'Прощание и обзор модуля', description: 'Фразы для знакомства.' },
];
function goToLesson (id: number) {
    useRouter().push('basics/lesson/' + id)
}
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
header {
    .header-inner {
        padding: 16px 0;
    }
}
#lessons-list {
    a {
        text-decoration: none;
    }
}
.lesson-card {
    display: flex;
    // justify-content: space-between;
    // align-items: center;
    // padding: 16px;
    border-radius: 8px;
    // background-color: var(--background-component-color);
    // box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
    // color: var(--text-color)
    color: #ccc;

    .lesson-icon {
        margin: 0 15px auto 0;
        position: relative;

        .circle {
            display: block;
            width: 15px;
            height: 15px;
            background-color: rgba(114, 35, 109, 0.416);
            border-radius: 50%;
            margin: auto;
            position: absolute;
            z-index: -1;
            left: -5px;
            top: 5px;
        }
    }

    .lesson-title {
        font-size: 18px;
        margin: 0;
    }
}

.lesson-description {
    font-size: 14px;
    color: #555;
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
