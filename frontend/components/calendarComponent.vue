
<script lang="ts" setup>
import { ref } from "vue";
const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const days = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
const abbreviatedDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const today = new Date();
const day = today.getDate();
const month = today.getMonth() + 1; // Месяцы начинаются с 0, поэтому добавляем 1
const year = today.getFullYear();
const selectedMonth = ref(months[month - 1]);
const monthPicker = ref(false);

const formattedDate = `${day}.${month}.${year}`;

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day); // Месяцы начинаются с 0, поэтому вычитаем 1
  const dayOfWeek = date.getDay(); // Возвращает число от 0 (воскресенье) до 6 (суббота)
  const daysOfWeek = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return daysOfWeek[dayOfWeek];
}

async function selectMonth(index: number) {
  selectedMonth.value = months[index];
  monthPicker.value = false;
}
async function selectMonthToggler() {
  if (monthPicker.value) {
    return (monthPicker.value = false);
  }

  if (monthPicker.value == false) {
    return (monthPicker.value = true);
  }
}
const props = defineProps({
  title: String,
});
</script>

<template>
  <div class="calendar">
    <!-- {{ formattedDate }} -->
    <div class="calendar-heading">
      <!-- <h6>Календарь</h6> -->
      <div class="month-name">
        <div class="month" @click="selectMonthToggler">
          <span>{{ selectedMonth }}</span>
          <div :class="monthPicker ? 'months' : 'months collapsed'">
            <ul>
              <li
                v-for="(month, index) in months"
                :key="month"
                :data-month-index="index"
                @click="selectMonth(index)"
              >
                {{ month }}
              </li>
            </ul>
          </div>
        </div>
        , <p>{{ year }}</p>
      </div>

      <!-- <div class="years">
        <ul>
            <li v-for=""></li>
        </ul>
      </div> -->
    </div>
    <div class="calendar-body">
      <div class="week-days">
        <div
          class="week-day"
          v-for="(day, index) in abbreviatedDays"
          :key="day"
          :data-day-name-russian="day"
          :data-day-position="index"
        >
          <span>{{ day }}</span>
        </div>
      </div>
    </div>
    <div class="calendar-footer"></div>
  </div>
</template>

<style lang="scss" scoped>
.calendar {
  position: absolute;
  top: calc(100% + 15px);
  // background-color: #222;
  color: #333;
  width: 100%;
}

.week-days {
  display: flex;
  justify-content: center;
  .week-day {
    padding: 0.3rem 0.5rem;
    margin: 0.2rem;
    cursor: pointer;
    font-size: 14px;
  }
}
.calendar-heading {
  width: fit-content;
  margin: auto;
  .month-name {
    margin: 0;
    font-size: 14px;
    text-align: center;
    cursor: pointer;
    margin: auto;
    display: flex;
    .month {
      width: 100px;
    }
  }
  .months {
    position: relative;
    &.collapsed {
      ul {
        height: 0;
      }
    }
    ul {
      width: 100px;
      height: 252px;
      overflow: hidden;
      margin: 0;
      padding: 0;
      list-style-type: none;
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
      background: #fff;
      transition: 200ms ease-in;
      li {
        transition: 400ms;
        position: relative;
        font-size: 14px;
        left: 0;
        cursor: pointer;
        text-align: left;

        &:hover {
          left: 3px;
        }
      }
    }
  }
}
</style>