<template>
    <div>
        <HeadingPage title="Мой словарь" />
        <div class="wrapper-my-vocabulary">
            <button class="block" @click="selectContent('Всего слов')">
                <p>Всего слов</p>
                <h4>3</h4>
            </button>
            <button class="block" @click="selectContent('Повторение')">
                <p>Повторение</p>
                <h4>3</h4>
            </button>
            <button class="block" @click="selectContent('Изучение')">
                <p>Изучение</p>
                <h4>3</h4>
            </button>
        </div>
        <div v-if="selectedContent" class="content-display">
            <p>Отображаемый контент: {{ selectedContent }}</p>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            selectedContent: 'Всего слов', // Инициализация по умолчанию
        };
    },
    methods: {
        selectContent(content) {
            this.selectedContent = content;
        },
    },
};
</script>

<style scoped lang="scss">
.wrapper-my-vocabulary {
    display: flex;
    justify-content: space-around;
    gap: 8px;
    padding: 8px;
    background-color: #f9f9f9;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    width: 300px;
    margin: 0 auto;
    button {
        all: unset;
        /* Убираем дефолтные стили кнопок */
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        p {
            margin: 0;
            font-size: 12px;
            color: #6b6b6b;
            margin-bottom: 0;
        }

        h4 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
    }
}

.content-display {
    margin-top: 20px;
    padding: 10px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: fit-content;
    margin: 20px auto 0;
    min-width: 300px;
}
</style>
