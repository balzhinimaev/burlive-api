<template>
  <div class="giveaway-container">
    <div class="giveaway-header">
      <h3 class="giveaway-title">{{ giveaway.title }}</h3>
      <div class="giveaway-status" v-if="giveaway.status === 'active'">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="#4CAF50" stroke-width="2"/>
          <circle cx="8" cy="8" r="3" fill="#4CAF50"/>
        </svg>
        <span>Активный розыгрыш</span>
      </div>
    </div>

    <div class="giveaway-wrapper">
      <div class="giveaway-content">
        <div class="giveaway-description">
          <p>{{ giveaway.description }}</p>
        </div>

        <div class="giveaway-dates">
          <div class="date-item">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.6667 2.33334H2.33333C1.59695 2.33334 1 2.93029 1 3.66667V11.6667C1 12.403 1.59695 13 2.33333 13H11.6667C12.403 13 13 12.403 13 11.6667V3.66667C13 2.93029 12.403 2.33334 11.6667 2.33334Z" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 5.66667H13" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4.33333 1V3.66667" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.66667 1V3.66667" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Дата начала: <strong>{{ formattedStartDate }}</strong></span>
          </div>
          <div class="date-item">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.6667 2.33334H2.33333C1.59695 2.33334 1 2.93029 1 3.66667V11.6667C1 12.403 1.59695 13 2.33333 13H11.6667C12.403 13 13 12.403 13 11.6667V3.66667C13 2.93029 12.403 2.33334 11.6667 2.33334Z" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 5.66667H13" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.5 9L8 10.5L6.5 9" stroke="#888888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Дата окончания: <strong>{{ formattedEndDate }}</strong></span>
          </div>
        </div>

        <!-- Новый блок: список призовых мест -->
        <div class="prizes-list-container">
          <div class="prizes-list-header">
            <h4>Призовые места</h4>
          </div>
          <div class="prizes-list">
            <div
              v-for="(prize, index) in sortedPrizes"
              :key="index"
              class="prize-item"
            >
              <div class="rank-column">{{ formatRank(prize) }}</div>
              <div class="prize-info">
                <div class="prize-avatar">
                  <svg width="36" height="36" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="#BBBBBB"/>
                    <path d="M8 9C5.33333 9 2 10.3333 2 13V14H14V13C14 10.3333 10.6667 9 8 9Z" fill="#BBBBBB"/>
                  </svg>
                </div>
                <div class="prize-details">
                  <div class="prize-description">
                    {{ prize.description || defaultPrizeDescription(prize) }}
                  </div>
                </div>
              </div>
              <div class="points-column">
                <span>{{ prize.amount }} руб</span>
              </div>
            </div>
          </div>
        </div>
        <!-- /Новый блок -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface IPrize {
  minRank: number;
  maxRank: number;
  prizeType: "money";
  amount: number | string;
  description: string;
}

export interface Giveaway {
  _id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "inactive";
  prizes: IPrize[];
}

const props = defineProps<{ giveaway: Giveaway }>();

const formattedStartDate = computed(() =>
  props.giveaway.startDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
);

const formattedEndDate = computed(() =>
  props.giveaway.endDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
);

// Сортируем призы по возрастанию места (minRank)
const sortedPrizes = computed(() => {
  return [...props.giveaway.prizes].sort((a, b) => a.minRank - b.minRank);
});

// Функция для форматирования номера места или диапазона
const formatRank = (prize: IPrize): string => {
  return prize.minRank === prize.maxRank
    ? String(prize.minRank)
    : `${prize.minRank}-${prize.maxRank}`;
};

// Если описание отсутствует – формируем его на основе мест
const defaultPrizeDescription = (prize: IPrize): string => {
  return prize.minRank === prize.maxRank
    ? `${prize.minRank} место`
    : `${prize.minRank}-${prize.maxRank} места`;
};
</script>

<style lang="scss" scoped>
.giveaway-container {
  display: flex;
  flex-direction: column;
  background: var(--background-component-color);
  border-radius: 18px;
  box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.06);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
}

.giveaway-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.giveaway-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary-color, #333);
}

.giveaway-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.giveaway-wrapper {
  padding: 16px;
}

.giveaway-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.giveaway-description {
  font-size: 14px;
  color: var(--text-secondary-color, #666);
  line-height: 1.5;
}

.giveaway-dates {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary-color, #666);
}

.date-item strong {
  color: var(--text-primary-color, #333);
}

/* Новый дизайн для списка призовых мест */
.prizes-list-container {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 16px;
}

.prizes-list-header {
  margin-bottom: 8px;
}

.prizes-list-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary-color, #333);
  margin: 0;
}

.prizes-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.prizes-list::-webkit-scrollbar {
  width: 6px;
}

.prizes-list::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px;
}

.prizes-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.prizes-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.prize-item {
  display: flex;
  align-items: center;
  background: var(--background-component-color);
  border-radius: 14px;
  box-shadow: 0px 3px 6px rgba(16, 16, 16, 0.06);
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 6px 12px rgba(16, 16, 16, 0.1);
  }
}

.rank-column {
  width: 30px;
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
}

.prize-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
}

.prize-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.prize-details {
  display: flex;
  flex-direction: column;
}

.prize-description {
  font-weight: 500;
  font-size: 15px;
  color: var(--text-primary-color, #333);
}

.points-column {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #4CAF50;
}

@media (max-width: 768px) {
  .giveaway-header {
    padding: 14px 16px;
  }
  .giveaway-title {
    font-size: 16px;
  }
  .giveaway-wrapper {
    padding: 14px;
  }
  .prize-item {
    border-radius: 12px;
    padding: 10px 14px;
  }
  .rank-column {
    width: 26px;
    height: 26px;
    min-width: 26px;
    font-size: 13px;
  }
  .prize-avatar {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
  .prize-description {
    font-size: 14px;
  }
  .points-column {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .giveaway-header {
    padding: 12px 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .giveaway-title {
    font-size: 15px;
  }
  .giveaway-wrapper {
    padding: 12px;
  }
  .rank-column {
    width: 24px;
    height: 24px;
    min-width: 24px;
    font-size: 12px;
  }
  .prize-avatar {
    width: 28px;
    height: 28px;
    min-width: 28px;
  }
  .prize-description {
    font-size: 13px;
  }
  .points-column {
    font-size: 13px;
  }
}
</style>
