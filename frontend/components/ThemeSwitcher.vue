<template>
    <div class="theme-switch-container">
        <label class="theme-switch">
            <input type="checkbox" v-model="isDark" @change="toggleTheme" />
            <span class="slider">
                <span class="icon">
                    <i v-if="isDark" class="fas fa-moon"></i>
                    <i v-else class="fas fa-sun"></i>
                </span>
            </span>
        </label>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useThemeStore } from '@/stores/themeStore';

// Подключаем хранилище с темами
const themeStore = useThemeStore();
const theme = computed(() => themeStore.theme);

// Состояние для темы
const isDark = ref(false);

// Инициализация свитчера на основе текущей темы
onMounted(() => {
    isDark.value = theme.value === 'dark';
});

// Переключение темы и сохранение в хранилище
const toggleTheme = () => {
    const newTheme = isDark.value ? 'dark' : 'light';
    themeStore.saveTheme(newTheme);
};
</script>

<style scoped lang="scss">
.theme-switch-container {
    display: flex;
    // justify-content: center;
    // align-items: center;
    // height: 100vh;
    // background-color: var(--background-color, #f0f0f0);
}

.theme-switch {
    position: relative;
    width: 60px;
    height: 34px;
}

.theme-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: background-color 0.4s;
    border-radius: 34px;
}

input:checked+.slider {
    background-color: #4d4d4d;
}

.icon {
    position: absolute;
    top: 50%;
    left: 5px;
    transform: translateY(-50%);
    color: white;
    transition: transform 0.4s;
    font-size: 16px;
}

input:checked+.slider .icon {
    transform: translate(30px, -50%);
}
</style>
