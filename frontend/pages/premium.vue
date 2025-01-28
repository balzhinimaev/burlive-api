<template>
    <div class="page home-page">
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">
                        <!-- <template v-if="isFetching">
                            <div class="loading-placeholder title-placeholder">
                                <div class="line" style="width: 90%; height: 20px;"></div>
                            </div>
                        </template>
                        <template v-else>
                            {{ lesson?.title }}
                        </template> -->
                        Премиум доступ
                    </h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/premium">Премиум</nuxt-link>
                    </p>
                </div>
            </div>
        </header>
        <div class="container" style="margin-bottom: 20px;">
            <div class="header-inner">
                <p class="description">
                    Откройте новые возможности изучения бурятского языка с премиум-доступом.
                </p>
            </div>
        </div>
        <main>
            <div class="container">
                <div class="content-wrapper mb-3">
                    <h5>Что включает Премиум?</h5>
                    <ul class="premium-features">
                        <li><strong>Эксклюзивные материалы:</strong> доступ к уникальным урокам и подробным разборам
                            сложных тем.</li>
                        <li><strong>Ускоренный прогресс:</strong> персонализированные рекомендации и дополнительные
                            задания.</li>
                        <li><strong>Без рекламы:</strong> полное отсутствие рекламы для комфортного обучения.</li>
                        <li><strong>Продвинутый рейтинг и награды:</strong> ускоренное продвижение и уникальные награды.
                        </li>
                        <li><strong>Доступ к словарю:</strong> расширенные функции работы со словарём.</li>
                    </ul>
                </div>
                <div class="content-wrapper mb-3">
                    <h5>Станьте частью сообщества</h5>
                    <p>Премиум-доступ поддерживает развитие нашего проекта и помогает сохранить бурятский язык. Ваша
                        подписка помогает расширять базу данных, улучшать алгоритмы и создавать новые материалы для
                        обучения.</p>
                </div>
                <button class="btn btn-cta">200 руб. / 1 Месяц</button>
                <button class="btn btn-cta">400 руб. / 3 Месяца</button>
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
const router = useRouter();

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
onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: `/` });
        });
        // window.Telegram.WebApp.MainButton.setText('Продолжить');
        // window.Telegram.WebApp.MainButton.show();
        // window.Telegram.WebApp.MainButton.enable();
        // Добавляем обработчик нажатия на MainButton
        // window.Telegram.WebApp.MainButton.onClick(() => {
        //     startTest();
        // });
    }
});
</script>

<style scoped lang="scss">
.btn-cta {
    padding: 10px 16px;
    background-color: #409f7f;
    // background-color: #323232;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
    width: 100%;
    &:hover,
    &:active {
        background-color: #36a47f;
        // background-color: #454545;
    }
    margin: 0 0 1rem;
}
footer {
  .footer-block {
    background: var(--background-component-color);
    // padding: 16px;
    border-radius: 10px;
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
      svg, path {
        fill: var(--text-color)
      }

      svg {
        margin: auto 5px auto auto;
      }
    }
  }
}
h5 {
    font-size: 1rem;
    font-weight: 500;
    font-family: 'Nunito', sans-serif;
}
.premium-features {
    li {
        margin: 5px 0;
        font-size: 14px;
    }
}
.content-wrapper {
    padding: 1.3rem 1rem;
    border-radius: var(--border-radius);
    background-color: var(--background-component-color);
}
</style>
