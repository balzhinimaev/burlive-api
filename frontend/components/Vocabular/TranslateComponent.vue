<template>
    <div class="dictionary-container" style="height: 100%;">
        <!-- Шапка осталась без изменений -->
        <div class="dictionary-header">
            <div class="dictionary-title-wrapper">
                <h3 class="dictionary-title">Словарь</h3>
                <div class="info-tooltip">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="var(--text-tertiary-color, #999)" stroke-width="1.5" />
                        <text x="8" y="11" font-size="11" font-weight="bold" fill="var(--text-tertiary-color, #999)"
                            text-anchor="middle">?</text>
                    </svg>
                    <div class="tooltip-content">
                        <p>Введите слово для поиска перевода. Результаты будут отображаться автоматически после
                            небольшой задержки. Возможен поиск по разным диалектам.</p>
                    </div>
                </div>
            </div>
            <div class="dictionary-status" v-if="recentSearches.length > 0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M14 3C14 1.89543 13.1046 1 12 1H4C2.89543 1 2 1.89543 2 3V13C2 14.1046 2.89543 15 4 15H12C13.1046 15 14 14.1046 14 13V3Z"
                        stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6 5H10" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M6 8H10" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M6 11H8" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <span>{{ recentSearches.length }} в истории</span>
            </div>
        </div>

        <div class="dictionary-wrapper">
            <!-- Форма поиска осталась без изменений -->
            <div class="search-form">
                <div class="search-input-wrapper">
                    <div class="language-selector">
                        <div class="language-button" :class="{ active: sourceLanguage === 'ru' }"
                            @click="setSourceLanguage('ru')">RU</div>
                        <div class="language-button" :class="{ active: sourceLanguage === 'bur' }"
                            @click="setSourceLanguage('bur')">BUR</div>
                    </div>
                    <div class="input-container">
                        <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                                stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M14 14L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        <input type="text" v-model="searchQuery"
                            :placeholder="sourceLanguage === 'ru' ? 'Введите слово для перевода...' : 'Оршуулха үгэ оруулагты...'"
                            class="search-input" @input="handleInput" />
                        <button v-if="searchQuery" class="clear-button" @click="clearSearch">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <button class="swap-button" @click="swapLanguages">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M6 2L4 4L6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M14 12L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M10 14L12 12L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Индикаторы загрузки, ошибок, пустого состояния остались без изменений -->
            <div v-if="isLoading" class="loading-indicator">
                <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25" />
                    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22" stroke="currentColor"
                        stroke-width="4" stroke-linecap="round" />
                </svg>
                <span>Поиск перевода...</span>
            </div>
            <div v-else-if="error" class="error-message">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#FF6B6B" stroke-width="2" />
                    <path d="M12 8V12" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" />
                    <path d="M12 16H12.01" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>{{ error }}</span>
            </div>
            <div v-else-if="!searchQuery && !translations.length && !recentSearches.length" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M21 36C28.7319 36 35 29.7319 35 22C35 14.2681 28.7319 8 21 8C13.2681 8 7 14.2681 7 22C7 29.7319 13.2681 36 21 36Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M41 42L31 32" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <span>Введите слово для поиска перевода</span>
            </div>
            <div v-else-if="searchQuery && !isLoading && !translations.length" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M21 36C28.7319 36 35 29.7319 35 22C35 14.2681 28.7319 8 21 8C13.2681 8 7 14.2681 7 22C7 29.7319 13.2681 36 21 36Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M41 42L31 32" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M17 16L25 28" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M25 16L17 28" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <span>По запросу "{{ searchQuery }}" ничего не найдено</span>
                <button class="suggestion-button" @click="suggestTranslation">Предложить перевод</button>
            </div>

            <!-- Translation results -->
            <div v-else-if="translations.length > 0" class="translation-results">
                <!-- Секция с исходным словом осталась без изменений -->
                <div class="result-word-section">
                    <h3 class="result-word">{{ searchQuery }}</h3>
                    <div class="word-actions">
                        <button class="action-button" title="Добавить в избранное (не реализовано)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 3.5V12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M3.5 8H12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </button>
                        <button class="action-button" title="Прослушать (не реализовано)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M3 8C3 6.89543 3.89543 6 5 6H5.5C6.05228 6 6.5 6.44772 6.5 7V9C6.5 9.55228 6.05228 10 5.5 10H5C3.89543 10 3 9.10457 3 8Z"
                                    stroke="currentColor" stroke-width="1.5" />
                                <path d="M6.5 8H10.5C11.8807 8 13 6.88071 13 5.5V5.5C13 4.11929 11.8807 3 10.5 3H10"
                                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                                <path d="M10.5 8C11.8807 8 13 9.11929 13 10.5V10.5C13 11.8807 11.8807 13 10.5 13H10"
                                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                            </svg>
                        </button>
                        <button class="action-button" title="Поделиться (не реализовано)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="4" r="2" stroke="currentColor" stroke-width="1.5" />
                                <circle cx="4" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
                                <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5" />
                                <path d="M6.06077 8.8489L9.93923 11.1511" stroke="currentColor" stroke-width="1.5"
                                    stroke-linecap="round" />
                                <path d="M9.93933 4.84888L6.06087 7.15111" stroke="currentColor" stroke-width="1.5"
                                    stroke-linecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="translations-list">
                    <!-- *ИЗМЕНЕНИЕ*: Добавлен span для диалекта -->
                    <div v-for="(translation, index) in translations" :key="index" class="translation-item">
                        <div class="translation-header">
                            <div class="part-of-speech">{{ translation.partOfSpeech }}</div>
                            <div class="translation-rating" :class="'rating-' + getRatingClass(translation.rating)">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M8 1L10.5267 5.60557L15.6085 6.45492L11.8042 10.1444L12.7023 15.2451L8 12.85L3.29772 15.2451L4.19577 10.1444L0.391548 6.45492L5.47329 5.60557L8 1Z"
                                        fill="currentColor" />
                                </svg>
                                <span>{{ translation.rating }}</span>
                            </div>
                        </div>
                        <div class="main-translation">
                            {{ translation.text }}
                            <!-- *НОВОЕ*: Отображение диалекта -->
                            <span v-if="translation.dialect" class="dialect-tag">({{ translation.dialect }})</span>
                        </div>

                        <!-- Секция с примерами осталась без изменений -->
                        <div v-if="translation.examples && translation.examples.length > 0" class="examples-section">
                            <div class="examples-header" @click="toggleExamples(index)">
                                <span>Примеры</span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                                    xmlns="http://www.w3.org/2000/svg" :class="{ rotated: openExamples[index] }">
                                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div v-if="openExamples[index]" class="examples-list">
                                <div v-for="(example, exampleIndex) in translation.examples" :key="exampleIndex"
                                    class="example-item">
                                    <div class="example-source">{{ example.source }}</div>
                                    <div class="example-target">{{ example.target }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- История поиска осталась без изменений в структуре, но данные могут стать сложнее -->
            <div v-else-if="recentSearches.length > 0" class="recent-searches">
                <div class="recent-header">
                    <h4>История поиска</h4>
                    <button class="clear-history" @click="clearHistory">Очистить</button>
                </div>
                <div class="recent-list">
                    <div v-for="(item, index) in recentSearches" :key="index" class="recent-item"
                        @click="loadSearch(item)">
                        <div class="recent-word">{{ item.word }}</div>
                        <div class="recent-translation">{{ item.translation }}</div>
                        <div class="recent-lang">{{ item.sourceLang.toUpperCase() }} → {{ item.targetLang.toUpperCase()
                            }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

// Определение структуры перевода с опциональным диалектом
interface Translation {
    partOfSpeech: string;
    text: string;
    dialect?: string; // Диалект (например, 'хор.', 'сарт.', 'бул.')
    rating: number;
    examples?: { source: string; target: string }[];
}

// Определение структуры элемента истории поиска
interface HistoryItem {
    word: string;
    translation: string; // Может содержать несколько переводов или указание диалекта
    sourceLang: 'ru' | 'bur';
    targetLang: 'ru' | 'bur';
}

// Состояния
const searchQuery = ref('')
const sourceLanguage = ref<'ru' | 'bur'>('ru')
const targetLanguage = ref<'ru' | 'bur'>('bur')

const isLoading = ref(false)
const error = ref('')
const translations = ref<Translation[]>([])
// *ИЗМЕНЕНИЕ*: Обновлен тип и примеры истории
const recentSearches = ref<HistoryItem[]>([
    { word: 'хлеб', translation: 'хилээмэн (хор.), талха (сарт.)', sourceLang: 'ru', targetLang: 'bur' },
    { word: 'талха', translation: 'мука (хор.), хлеб (сарт.)', sourceLang: 'bur', targetLang: 'ru' },
    { word: 'привет', translation: 'сайн байна', sourceLang: 'ru', targetLang: 'bur' },
])
const openExamples = ref<Record<number, boolean>>({})
const searchTimeout = ref<any>(null)

// Методы
const handleInput = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
    }
    if (!searchQuery.value.trim()) {
        translations.value = []
        error.value = ''
        isLoading.value = false
        return
    }
    isLoading.value = true
    searchTimeout.value = setTimeout(() => {
        fetchTranslations()
    }, 500)
}

// *ИЗМЕНЕНИЕ*: Модифицирована логика fetchTranslations для поддержки диалектов
const fetchTranslations = async () => {
    error.value = ''
    isLoading.value = true
    translations.value = [] // Очищаем предыдущие результаты

    const query = searchQuery.value.trim().toLowerCase()
    const source = sourceLanguage.value
    const target = targetLanguage.value

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 700))

    let results: Translation[] = []

    try {
        // --- Имитация данных API с диалектами ---
        if (source === 'ru' && target === 'bur') {
            if (query === 'хлеб') {
                results = [
                    { partOfSpeech: 'сущ.', text: 'хилээмэн', dialect: 'хор.', rating: 4.8, examples: [] },
                    { partOfSpeech: 'сущ.', text: 'талха', dialect: 'сарт.', rating: 4.7, examples: [] },
                    // Можно добавить булагатский, если есть:
                    // { partOfSpeech: 'сущ.', text: 'хлеэб', dialect: 'бул.', rating: 4.6, examples: [] },
                ]
            } else if (query === 'мука') {
                results = [
                    { partOfSpeech: 'сущ.', text: 'гурил', dialect: 'сарт.', rating: 4.6, examples: [] },
                    { partOfSpeech: 'сущ.', text: 'талха', dialect: 'хор.', rating: 4.5, examples: [] }, // мука на хоринском = талха
                    // Можно добавить булагатский:
                    // { partOfSpeech: 'сущ.', text: 'гурил', dialect: 'бул.', rating: 4.4, examples: [] },
                ]
            } else if (query === 'привет') {
                results = [
                    { partOfSpeech: 'межд.', text: 'сайн байна', rating: 4.9, examples: [] }, // Без диалекта - общее
                    { partOfSpeech: 'межд.', text: 'мэндэ', dialect: 'хор.', rating: 4.7, examples: [] }, // Пример диалектного варианта
                ]
            }
            // ... другие русские слова
        } else if (source === 'bur' && target === 'ru') {
            if (query === 'талха') {
                results = [
                    { partOfSpeech: 'сущ.', text: 'мука', dialect: 'хор.', rating: 4.5, examples: [] }, // Значение в хоринском
                    { partOfSpeech: 'сущ.', text: 'хлеб', dialect: 'сарт.', rating: 4.7, examples: [] }, // Значение в сартульском
                ]
            } else if (query === 'хилээмэн') {
                results = [
                    { partOfSpeech: 'сущ.', text: 'хлеб', dialect: 'хор.', rating: 4.8, examples: [] }, // Значение в хоринском
                ]
            } else if (query === 'гурил') {
                results = [
                    { partOfSpeech: 'сущ.', text: 'мука', dialect: 'сарт.', rating: 4.6, examples: [] }, // Значение в сартульском
                    // Если в других диалектах тоже 'мука', можно добавить без диалекта или с другим
                    // { partOfSpeech: 'сущ.', text: 'мука', dialect: 'бул.', rating: 4.4, examples: [] },
                ]
            }
            // ... другие бурятские слова
        }
        // --- Конец имитации ---

        translations.value = results

        // Добавляем в историю поиска, если найдены результаты
        if (results.length > 0) {
            // Формируем строку для истории
            const translationString = results
                .map(t => `${t.text}${t.dialect ? ` (${t.dialect})` : ''}`)
                .join(', ')

            // Проверяем, нет ли точно такого же запроса уже в истории
            const existingIndex = recentSearches.value.findIndex(
                item => item.word.toLowerCase() === query && item.sourceLang === source
            );

            // Удаляем старую запись, если она есть
            if (existingIndex > -1) {
                recentSearches.value.splice(existingIndex, 1);
            }

            // Добавляем новую запись в начало
            recentSearches.value.unshift({
                word: searchQuery.value, // Сохраняем оригинальный запрос пользователя
                translation: translationString,
                sourceLang: source,
                targetLang: target
            });

            // Ограничиваем историю до 5 элементов
            if (recentSearches.value.length > 5) {
                recentSearches.value.pop();
            }
        }

    } catch (err) {
        console.error('Error fetching translations:', err)
        error.value = 'Произошла ошибка при поиске перевода. Пожалуйста, попробуйте позже.'
    } finally {
        isLoading.value = false
    }
}

// Остальные методы без существенных изменений
const clearSearch = () => {
    searchQuery.value = ''
    translations.value = []
    error.value = ''
    isLoading.value = false // Убедимся, что индикатор загрузки скрыт
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value); // Отменяем таймаут при очистке
    }
}

const swapLanguages = () => {
    const temp = sourceLanguage.value
    sourceLanguage.value = targetLanguage.value
    targetLanguage.value = temp
    // Перезапускаем поиск с новым направлением, если было что-то введено
    if (searchQuery.value.trim()) {
        handleInput()
    } else {
        translations.value = [] // Очищаем результаты, если поле было пустым
    }
}

const setSourceLanguage = (lang: 'ru' | 'bur') => {
    if (sourceLanguage.value !== lang) {
        sourceLanguage.value = lang
        targetLanguage.value = lang === 'ru' ? 'bur' : 'ru'
        // Перезапускаем поиск с новым направлением, если было что-то введено
        if (searchQuery.value.trim()) {
            handleInput()
        } else {
            translations.value = [] // Очищаем результаты, если поле было пустым
        }
    }
}

const toggleExamples = (index: number) => {
    openExamples.value[index] = !openExamples.value[index]
}

const getRatingClass = (rating: number) => {
    if (rating >= 4.5) return 'high'
    if (rating >= 3.5) return 'medium'
    return 'low'
}

const loadSearch = (item: HistoryItem) => {
    sourceLanguage.value = item.sourceLang
    targetLanguage.value = item.targetLang
    searchQuery.value = item.word // Устанавливаем слово из истории в поле ввода
    fetchTranslations() // Выполняем поиск
}

const clearHistory = () => {
    recentSearches.value = []
}

const suggestTranslation = () => {
    // В будущем здесь может быть логика открытия модального окна или перехода на страницу
    alert(`Функция "Предложить перевод" для слова "${searchQuery.value}" еще не реализована.`);
    console.log('Suggest translation for:', searchQuery.value)
}
</script>

<style lang="scss" scoped>
/* Все предыдущие стили остаются здесь */
.dictionary-container {
    display: flex;
    flex-direction: column;
    background: var(--background-dictionary-container-color); // Используем переменную
    border-radius: 18px;
    box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.06);
    overflow: hidden;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05)); // Переменная для границы
    margin-bottom: 16px;
    height: 100%; // Попробуем задать высоту 100% для родителя
    max-height: 70vh; // Ограничение максимальной высоты, чтобы не растягивался слишком сильно
}

.dictionary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
    flex-shrink: 0; // Не сжимать шапку
}

.dictionary-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dictionary-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--text-color); // Используем переменную
}

.info-tooltip {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg text {
        // Стили для текста внутри SVG
        fill: var(--text-tertiary-color, #999); // Цвет текста "?"
    }

    svg circle {
        // Стили для круга внутри SVG
        stroke: var(--text-tertiary-color, #999); // Цвет обводки круга
    }
}

.info-tooltip .tooltip-content {
    position: absolute;
    top: 100%;
    left: 50%; // Центрируем по горизонтали относительно иконки
    transform: translateX(-50%) translateY(8px); // Сдвигаем вниз
    width: 240px;
    background: var(--background-tooltip-color); // Переменная
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 12px;
    font-size: 14px;
    color: var(--text-color); // Переменная
    z-index: 10;
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 0.2s, opacity 0.2s ease; // Задержка перед скрытием
    line-height: 1.4;
    margin-top: 4px; // Небольшой отступ сверху

    p {
        margin: 0;
    }
}

.info-tooltip:hover .tooltip-content {
    visibility: visible;
    opacity: 1;
    transition-delay: 0s; // Убираем задержку при наведении
}

.dictionary-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
}

.dictionary-wrapper {
    padding: 16px;
    overflow-y: auto; // Включаем скролл по вертикали
    flex-grow: 1; // Позволяет этому блоку занимать оставшееся место
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;

    /* Стилизация скроллбара для WebKit */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
        margin: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.3);
    }
}

.search-form {
    margin-bottom: 16px;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
}

.language-selector {
    display: flex;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
    background-color: var(--background-item-color); // Переменная
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
    flex-shrink: 0; // Не сжимать переключатель языков
}

.language-button {
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-secondary-color); // Цвет неактивной кнопки

    &.active {
        background-color: var(--accent-color, #4285F4);
        color: white;
    }

    &:not(.active):hover {
        background-color: rgba(0, 0, 0, 0.05); // Немного темнее при наведении
        color: var(--text-color); // Цвет текста при наведении
    }
}

.input-container {
    position: relative;
    flex: 1; // Занимает доступное пространство
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary-color, #666);
    pointer-events: none; // Иконка не должна мешать клику в инпут
}

.search-input {
    width: 100%;
    padding: 10px 40px 10px 36px; // Отступы: справа и слева для иконок
    border-radius: 12px;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    font-size: 15px;
    background-color: var(--background-item-color); // Переменная
    color: var(--text-color); // Переменная
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--accent-color, #4285F4);
        box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1); // Тень при фокусе
    }

    &::placeholder {
        color: var(--text-tertiary-color, #999);
    }
}

.clear-button {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    color: var(--text-secondary-color, #666);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: var(--text-primary-color); // Темнее при наведении
    }
}

.swap-button {
    background-color: var(--background-item-color, #fff);
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    border-radius: 12px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary-color, #666);
    transition: all 0.2s ease;
    flex-shrink: 0; // Не сжимать кнопку смены

    &:hover {
        background-color: rgba(0, 0, 0, 0.02);
        color: var(--accent-color, #4285F4);
    }
}

.loading-indicator,
.error-message,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary-color, #666);

    svg {
        margin-bottom: 16px;
        width: 32px; // Уменьшим иконки в этих состояниях
        height: 32px;
        opacity: 0.7; // Сделаем их чуть менее заметными
    }

    span {
        font-size: 15px; // Немного меньше
    }
}

.spinner {
    animation: spin 1.5s linear infinite;
    width: 24px !important; // Задать размер спиннера явно
    height: 24px !important;
    opacity: 1 !important; // Спиннер должен быть виден
}


@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.error-message {
    color: #FF6B6B;
}

.translation-results {
    display: flex;
    flex-direction: column;
    gap: 16px; // Отступ между шапкой слова и списком переводов
}

.result-word-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
}

.result-word {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary-color, #333);
    word-break: break-word; // Перенос длинных слов
}

.word-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0; // Не сжимать кнопки действий
    margin-left: 12px; // Отступ слева, если слово длинное
}

.action-button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    background-color: var(--background-item-color, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary-color, #666);
    transition: all 0.2s ease;

    &:hover {
        background-color: rgba(0, 0, 0, 0.02);
        color: var(--accent-color, #4285F4);
        border-color: rgba(0, 0, 0, 0.1); // Убедимся что граница не меняется сильно
    }
}

.translations-list {
    display: flex;
    flex-direction: column;
    gap: 12px; // Уменьшим отступ между переводами
}

.translation-item {
    background-color: var(--background-item-color); // Переменная
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px; // Уменьшим внутренние отступы
    border: 1px solid var(--inner-border-color, transparent); // Граница для элемента
    transition: border-color 0.2s ease;

    &:hover {
        border-color: var(--border-color, rgba(0, 0, 0, 0.05)); // Граница при наведении
    }
}

.translation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.part-of-speech {
    font-size: 13px; // Чуть меньше
    color: var(--text-secondary-color, #666);
    font-style: italic;
}

.translation-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px; // Чуть меньше
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 12px;
    flex-shrink: 0; // Не сжимать рейтинг

    svg {
        width: 10px; // Маленькая звезда
        height: 10px;
    }

    &.rating-high {
        color: #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
    }

    &.rating-medium {
        color: #FFA000;
        background-color: rgba(255, 160, 0, 0.1);
    }

    &.rating-low {
        color: #F44336;
        background-color: rgba(244, 67, 54, 0.1);
    }
}

.main-translation {
    font-size: 17px; // Чуть меньше основного слова
    font-weight: 500;
    color: var(--text-primary-color, #333);
    line-height: 1.4;
}

/* *НОВЫЙ СТИЛЬ*: Стиль для тега диалекта */
.dialect-tag {
    font-size: 0.8em;
    /* Меньше основного перевода */
    color: var(--text-secondary-color, #666);
    /* Менее заметный цвет */
    margin-left: 6px;
    /* Отступ слева */
    font-weight: 400;
    /* Нормальный вес */
    // font-style: italic; /* Можно сделать курсивом */
    white-space: nowrap;
    /* Предотвратить перенос тега */
}

.examples-section {
    margin-top: 8px; // Отступ сверху
}

.examples-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0; // Уменьшим паддинг
    cursor: pointer;
    font-size: 14px;
    color: var(--accent-color, #4285F4);
    font-weight: 500;

    svg {
        transition: transform 0.2s ease;

        &.rotated {
            transform: rotate(180deg);
        }
    }

    &:hover {
        color: var(--accent-hover-color, #3367d6);
    }
}

.examples-list {
    display: flex;
    flex-direction: column;
    gap: 10px; // Отступ между примерами
    padding: 12px;
    background-color: var(--inner-background-color, rgba(0, 0, 0, 0.02)); // Переменная
    border-radius: 8px;
    margin-top: 4px;
}

.example-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.example-source {
    font-size: 14px;
    color: var(--text-primary-color, #333);
    line-height: 1.3;
}

.example-target {
    font-size: 14px;
    color: var(--text-secondary-color, #666);
    font-style: italic;
    line-height: 1.3;
}

.recent-searches {
    margin-top: 24px; // Увеличим отступ до истории
}

.recent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary-color, #333);
    }
}

.clear-history {
    background: none;
    border: none;
    font-size: 14px;
    color: var(--text-secondary-color, #666);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;

    &:hover {
        color: #F44336;
        background-color: rgba(244, 67, 54, 0.05);
    }
}

.recent-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: 12px;
    background-color: var(--inner-component-color); // Переменная
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent; // Граница для ховера

    &:hover {
        background-color: var(--inner-component-color-hover); // Переменная
        border-color: var(--border-color, rgba(0, 0, 0, 0.05));
    }
}

.recent-word {
    font-weight: 500;
    color: var(--text-primary-color);
    margin-right: 12px; // Отступ справа от слова
    flex-shrink: 0; // Не сжимать слово
}

.recent-translation {
    color: var(--text-secondary-color, #666);
    flex: 1; // Занимает доступное место
    text-align: right; // Выравнивание перевода по правому краю
    white-space: nowrap; // Предотвратить перенос
    overflow: hidden; // Скрыть лишнее
    text-overflow: ellipsis; // Добавить троеточие
    margin-right: 12px; // Отступ справа от перевода
}

.recent-lang {
    font-size: 12px;
    color: var(--text-tertiary-color, #999);
    background-color: var(--inner-background-color, rgba(0, 0, 0, 0.05));
    padding: 4px 8px;
    border-radius: 6px;
    white-space: nowrap; // Не переносить текст языка
    flex-shrink: 0; // Не сжимать блок языка
}

.suggestion-button {
    margin-top: 16px;
    padding: 8px 16px;
    background-color: var(--accent-color, #4285F4);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--accent-hover-color, #3367d6);
    }
}

/* Responsive styles */
@media (max-width: 640px) {
    .dictionary-container {
        max-height: none; // Убрать ограничение высоты на мобильных
        height: auto; // Высота по контенту
    }

    .search-input-wrapper {
        flex-direction: column; // Переключатель, инпут, кнопка - друг под другом
        gap: 12px;
        align-items: stretch; // Растянуть элементы на всю ширину
    }

    .language-selector {
        justify-content: center; // Кнопки языка по центру
        width: auto; // Ширина по содержимому
        align-self: center; // Выровнять по центру контейнера
    }

    .input-container {
        width: 100%; // Инпут на всю ширину
    }

    .swap-button {
        width: 100%; // Кнопка смены на всю ширину
        height: 38px;
    }

    .recent-item {
        flex-direction: column; // Элементы истории друг под другом
        align-items: flex-start; // Выравнивание по левому краю
        gap: 6px;
    }

    .recent-word {
        margin-right: 0;
    }

    .recent-translation {
        text-align: left; // Перевод слева
        margin-right: 0;
        white-space: normal; // Разрешить перенос текста перевода
        overflow: visible;
        text-overflow: clip;
    }

    .recent-lang {
        align-self: flex-end; // Блок языка справа внизу
        margin-top: 4px;
    }

    .translation-header {
        flex-direction: column; // Часть речи и рейтинг друг под другом
        align-items: flex-start;
        gap: 4px;
    }

    .translation-rating {
        margin-left: 0; // Убрать отступ для рейтинга
    }

    .result-word-section {
        flex-direction: column; // Слово и кнопки друг под другом
        align-items: flex-start;
        gap: 12px;
    }

    .word-actions {
        margin-left: 0; // Убрать отступ для кнопок
        align-self: flex-end; // Кнопки справа
    }
}

/* Dark mode styles (примерные, адаптируйте под ваши переменные) */
:root {
    /* Светлая тема по умолчанию */
    --background-dictionary-container-color: #fff;
    --background-item-color: #fff;
    --background-tooltip-color: #333;
    /* Темный тултип для контраста */
    --inner-component-color: #f7f7f7;
    --inner-component-color-hover: #eee;
    --inner-background-color: rgba(0, 0, 0, 0.03);
    --border-color: rgba(0, 0, 0, 0.08);
    --inner-border-color: transparent;
    --text-color: #222;
    --text-primary-color: #222;
    --text-secondary-color: #555;
    --text-tertiary-color: #888;
    --accent-color: #4285F4;
    --accent-hover-color: #3367d6;
}

@media (prefers-color-scheme: dark) {
    :root {
        /* Темная тема */
        --background-dictionary-container-color: #1e1e1e;
        --background-item-color: #2a2a2a;
        --background-tooltip-color: #444;
        --inner-component-color: #2f2f2f;
        --inner-component-color-hover: #3a3a3a;
        --inner-background-color: rgba(255, 255, 255, 0.05);
        --border-color: rgba(255, 255, 255, 0.1);
        --inner-border-color: transparent;
        --text-color: #eee;
        --text-primary-color: #eee;
        --text-secondary-color: #bbb;
        --text-tertiary-color: #888;
        --accent-color: #5c9eff;
        /* Светлее синий для темного фона */
        --accent-hover-color: #7bacff;

        .info-tooltip .tooltip-content {
            color: #eee;
            /* Светлый текст в тултипе */
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .info-tooltip svg text,
        .info-tooltip svg circle {
            stroke: var(--text-tertiary-color);
            fill: var(--text-tertiary-color);
        }

        .language-button:not(.active):hover {
            background-color: rgba(255, 255, 255, 0.08);
        }

        .clear-button:hover {
            background-color: rgba(255, 255, 255, 0.08);
        }

        .swap-button:hover,
        .action-button:hover {
            background-color: rgba(255, 255, 255, 0.05);
            color: var(--accent-color);
        }

        .translation-rating.rating-high {
            background-color: rgba(76, 175, 80, 0.2);
        }

        .translation-rating.rating-medium {
            background-color: rgba(255, 160, 0, 0.2);
        }

        .translation-rating.rating-low {
            background-color: rgba(244, 67, 54, 0.2);
        }

        .clear-history:hover {
            background-color: rgba(244, 67, 54, 0.15);
        }
    }
}
</style>