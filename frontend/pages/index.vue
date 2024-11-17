<template>
  <div class="page home-page">
    <header>
      <div class="container">
        <div class="header-inner">
          {{ user }}
          <h2>Самоучитель <br />бурятского языка!</h2>
          <p class="typography-body">
            Каждое ваше взаимодействие с уроками <br />
            помогает сохранять и развивать бурятский язык.
          </p>
        </div>
      </div>
    </header>

    <main>
      <div class="container">
        <Swiper :modules="[Autoplay]" autoplay loop :pagination="{ clickable: true }" :spaceBetween="20"
          class="mySwiper">
          <SwiperSlide v-for="(card, index) in cards" :key="index">
            <div class="new-customcard">
              <p class="card-title">{{ card.title }}</p>
              <p class="card-body">{{ card.body }}</p>
              <button class="card-button" @click="card.action()">
                {{ card.buttonText }}
              </button>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination } from 'swiper/modules';
import { useUserStore } from '@/stores/userStore';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import { useRouter } from 'vue-router';
const userStore = useUserStore();
const router = useRouter();
const user = ref()
const cards = [
  {
    title: '📚 Уроки',
    body: 'Начни своё обучение с уроков, которые помогут тебе освоить основы бурятского языка.',
    buttonText: 'Перейти к урокам',
    action: () => router.push({ path: "/selectmodule" }),
  },
  {
    title: '📖 Словарь',
    body: 'Ищи и изучай слова на бурятском языке. Добавляй новые слова в личный список для повторения.',
    buttonText: 'Открыть словарь',
    action: () => router.push('/vocabulary'),
  },
  {
    title: '📝 Тесты и упражнения',
    body: 'Проверь свои знания и закрепи изученное с помощью тестов. Получай баллы и соревнуйся с друзьями.',
    buttonText: 'Начать тест',
    action: () => router.push('/tests'),
  },
];
onMounted(async () => {
  user.value = userStore.getUser
})
</script>

<style scoped lang="scss">
header {
  .header-inner {
    padding: 16px 0;
  }
}
.mySwiper {
  width: 100%;
  height: auto;
  padding-bottom: 30px;
  /* Отступ для пагинации */
}

.swiper-pagination {
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.swiper-pagination-bullet {
  width: 10px;
  height: 10px;
  background-color: #ddd;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.swiper-pagination-bullet-active {
  background-color: #007bff;
}

.swiper-slide {
  padding: 5px;
}

.new-customcard {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--background-component-color);
  box-shadow: 0px 2px 8px var(--inner-component-shadow);
  text-align: center;
  color: var(--text-color);
}

.card-title {
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 8px;
}

.card-body {
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  color: #aaa;
}

.card-button {
  padding: 10px 16px;
  background-color: #323232;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #454545;
  }
}
</style>
