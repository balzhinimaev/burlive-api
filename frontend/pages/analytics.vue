<template>
    <div class="analytics-page">
        <!-- <header>
            <h2 class="heading">Аналитика</h2>
        </header>

        <main>
            <div class="chart-container">
                <canvas ref="progressChart"></canvas>
            </div>

            <div class="stats">
                <div class="stat-item">
                    <p class="stat-value">45%</p>
                    <p class="stat-label">Прогресс обучения</p>
                </div>
                <div class="stat-item">
                    <p class="stat-value">25</p>
                    <p class="stat-label">Пройдено модулей</p>
                </div>
            </div>
        </main> -->
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables); // Регистрация модулей Chart.js

const progressChart = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
    if (progressChart.value) {
        new Chart(progressChart.value, {
            type: 'doughnut',
            data: {
                labels: ['Пройдено', 'Осталось'],
                datasets: [
                    {
                        data: [45, 55], // Пример данных для графика
                        backgroundColor: ['#a569ff', '#e0e0e0'],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: false, // Отключаем легенду для минимализма
                    },
                },
                cutout: '70%', // Уменьшаем середину графика
            },
        });
    }
});
</script>

<style scoped lang="scss">
.analytics-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 32px 16px;
    background: linear-gradient(to bottom right, #f0f4f8, #ffffff);
}

.heading {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #333;
    text-align: center;
}

.chart-container {
    width: 200px;
    height: 200px;
    margin-bottom: 32px;
}

.stats {
    display: flex;
    gap: 24px;
    justify-content: center;

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
            font-weight: 700;
            font-size: 24px;
            color: #007bff;
        }

        .stat-label {
            font-size: 14px;
            color: #555;
        }
    }
}
</style>
