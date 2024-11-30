<template>
  <div class="page home-page">
    <UserInfo />
    <header>
      <div class="container">
        <div class="header-inner">
          <p class="typography-body">
            Каждое ваше взаимодействие с уроками <br />
            помогает сохранять и развивать бурятский язык.
          </p>
        </div>
      </div>
    </header>

    <main>
      <div class="container">
        <div class="cards-wrapper">
          <div class="new-customcard-wrapper" v-for="(card, index) in cards" :key="index">
            <div class="new-customcard">
              <p class="card-title">{{ card.title }}</p>
              <p class="card-body">{{ card.body }}</p>
              <button class="card-button" @click="card.action()">
                {{ card.buttonText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer>
      <div class="container">
        <div class="footer-block">
          <button class="frame" @click="goToChannel()">
            <p>💬 Сообщество</p>
            <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.34821 5.27192C5.33894 5.40156 5.28649 5.52436 5.19925 5.6207L1.01382 10.2712C0.962768 10.328 0.901033 10.3741 0.832138 10.4071C0.763243 10.44 0.688537 10.459 0.612285 10.4631C0.536034 10.4671 0.45973 10.4561 0.387733 10.4307C0.315735 10.4052 0.249454 10.3659 0.192672 10.3148C0.135891 10.2638 0.0897232 10.202 0.0568043 10.1331C0.0238854 10.0642 0.00486054 9.98952 0.000816144 9.91327C-0.00322825 9.83702 0.00778706 9.76071 0.033233 9.68872C0.0586789 9.61673 0.0980571 9.55045 0.149119 9.49368L3.98576 5.23194L0.149119 0.970224C0.0980571 0.913448 0.0586789 0.847176 0.033233 0.775181C0.00778706 0.703187 -0.00322825 0.626885 0.000816144 0.550633C0.00486054 0.474381 0.0238854 0.399668 0.0568043 0.330769C0.0897232 0.26187 0.135891 0.200122 0.192672 0.149067C0.249454 0.0980117 0.315735 0.05864 0.387733 0.0332024C0.45973 0.00776469 0.536034 -0.00323723 0.612285 0.000815906C0.688537 0.00486904 0.763243 0.0239055 0.832138 0.0568323C0.901033 0.089759 0.962768 0.135935 1.01382 0.192722L5.19925 4.8432C5.25156 4.90102 5.2917 4.96877 5.31729 5.04242C5.34288 5.11607 5.3534 5.19412 5.34821 5.27192Z"
                fill="black" />
            </svg>
          </button>
          <button class="frame" @click="goToProgram()">
            <div class="left-side">
              <p>🤝 Партнерство</p>
              <p class="description">Зарабатывайте с нами</p>
            </div>
            <div class="right-side">
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.34821 5.27192C5.33894 5.40156 5.28649 5.52436 5.19925 5.6207L1.01382 10.2712C0.962768 10.328 0.901033 10.3741 0.832138 10.4071C0.763243 10.44 0.688537 10.459 0.612285 10.4631C0.536034 10.4671 0.45973 10.4561 0.387733 10.4307C0.315735 10.4052 0.249454 10.3659 0.192672 10.3148C0.135891 10.2638 0.0897232 10.202 0.0568043 10.1331C0.0238854 10.0642 0.00486054 9.98952 0.000816144 9.91327C-0.00322825 9.83702 0.00778706 9.76071 0.033233 9.68872C0.0586789 9.61673 0.0980571 9.55045 0.149119 9.49368L3.98576 5.23194L0.149119 0.970224C0.0980571 0.913448 0.0586789 0.847176 0.033233 0.775181C0.00778706 0.703187 -0.00322825 0.626885 0.000816144 0.550633C0.00486054 0.474381 0.0238854 0.399668 0.0568043 0.330769C0.0897232 0.26187 0.135891 0.200122 0.192672 0.149067C0.249454 0.0980117 0.315735 0.05864 0.387733 0.0332024C0.45973 0.00776469 0.536034 -0.00323723 0.612285 0.000815906C0.688537 0.00486904 0.763243 0.0239055 0.832138 0.0568323C0.901033 0.089759 0.962768 0.135935 1.01382 0.192722L5.19925 4.8432C5.25156 4.90102 5.2917 4.96877 5.31729 5.04242C5.34288 5.11607 5.3534 5.19412 5.34821 5.27192Z"
                  fill="black" />
              </svg>
            </div>
          </button>
          <button class="frame" @click="goToProfile()">
            <p>💎 Мой профиль</p>
            <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.34821 5.27192C5.33894 5.40156 5.28649 5.52436 5.19925 5.6207L1.01382 10.2712C0.962768 10.328 0.901033 10.3741 0.832138 10.4071C0.763243 10.44 0.688537 10.459 0.612285 10.4631C0.536034 10.4671 0.45973 10.4561 0.387733 10.4307C0.315735 10.4052 0.249454 10.3659 0.192672 10.3148C0.135891 10.2638 0.0897232 10.202 0.0568043 10.1331C0.0238854 10.0642 0.00486054 9.98952 0.000816144 9.91327C-0.00322825 9.83702 0.00778706 9.76071 0.033233 9.68872C0.0586789 9.61673 0.0980571 9.55045 0.149119 9.49368L3.98576 5.23194L0.149119 0.970224C0.0980571 0.913448 0.0586789 0.847176 0.033233 0.775181C0.00778706 0.703187 -0.00322825 0.626885 0.000816144 0.550633C0.00486054 0.474381 0.0238854 0.399668 0.0568043 0.330769C0.0897232 0.26187 0.135891 0.200122 0.192672 0.149067C0.249454 0.0980117 0.315735 0.05864 0.387733 0.0332024C0.45973 0.00776469 0.536034 -0.00323723 0.612285 0.000815906C0.688537 0.00486904 0.763243 0.0239055 0.832138 0.0568323C0.901033 0.089759 0.962768 0.135935 1.01382 0.192722L5.19925 4.8432C5.25156 4.90102 5.2917 4.96877 5.31729 5.04242C5.34288 5.11607 5.3534 5.19412 5.34821 5.27192Z"
                fill="black" />
            </svg>
          </button>

        </div>
      </div>
    </footer>
  </div>
</template>


<script lang="ts" setup>
const router = useRouter()
const cards = [
  {
    title: '📚 Уроки',
    body: 'Начни своё обучение с уроков, которые помогут тебе освоить основы бурятского языка.',
    buttonText: 'Перейти к урокам',
    action: () => router.push("/selectmodule"),
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
function goToChannel() {
  if (window.Telegram?.WebApp) {
    // Используем встроенные функции Telegram
    window.Telegram.WebApp.openTelegramLink("https://t.me/bur_live");
  } else {
    // На случай, если Mini App открывается не через Telegram
    window.open("https://t.me/bur_live", "_blank");
  }
}
function goToProfile() {
  useRouter().push("/profile")
}
function goToProgram() {
  useRouter().push("/program")
}
</script>

<style scoped lang="scss">
.description {
  color: #ccc;
}

.cards-wrapper {
  display: flex;
  flex-direction: column;

  .new-customcard-wrapper {
    margin-bottom: 15px;
  }
}

// header {
//   .header-inner {
//     padding: 16px 0;
//   }
// }

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
  // box-shadow: 0px 2px 8px var(--inner-component-shadow);
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

footer {
  .footer-block {
    background: var(--background-component-color);
    // padding: 16px;
    border-radius: 10px;
    padding-bottom: 16px;

    p {
      margin: 0;
      color: var(--text-color);
    }

    .frame {
      width: 100%;
      display: flex;
      border: none;
      padding: 16px;
      background-color: transparent;
      padding-bottom: 0;

      svg,
      path {
        fill: var(--text-color)
      }

      .left-side {
        p {
          margin: 0;
          text-align: left;

          &.description {
            color: var(--description-color);
            font-size: 15px;
            margin-left: 25px;
            margin-bottom: 0;
          }
        }
      }

      svg,
      .right-side {
        margin: auto 5px auto auto;
      }

      .right-side {
        margin-right: 0;
      }
    }
  }
}
</style>
