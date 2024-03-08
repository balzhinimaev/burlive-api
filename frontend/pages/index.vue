<template>
  <div class="page home-page">
    <header>
      <div class="container-fluid">
        <h2 class="mb-0">Погрузитесь в мир бурятской культуры с BurLive!</h2>
        <p>
          Наша платформа предлагает уникальную возможность изучения языка и
          вовлечения в создание его будущего.
        </p>
        <!-- <button class="btn btn-dark">Присоединиться</button> -->
      </div>
    </header>

    <main>
      <section id="advantages">
        <div class="advantages-content">
          <div class="custom-card">
            <h6 class="card-heading mb-2">Сбор переводов</h6>
            <p class="small mb-2">
              Пользователи могут добавлять переводы для предложений, помогая нам
              расширить базу знаний и улучшить качество нашей
              <b>языковой модели</b>
            </p>
            <!-- <button class="btn btn-dark btn-sm my-2">Добавить переводы</button> -->
          </div>
          <div class="custom-card">
            <h6 class="card-heading mb-2">Сбор материалов</h6>
            <p class="small mb-2">
              Благодаря вашим материалам мы расширим наш языковой корпус, что
              откроет новые горизонты для изучения и понимания бурятского языка.
            </p>
            <!-- <button class="btn btn-dark btn-sm my-2">Добавить материалы</button> -->
          </div>
          <div class="custom-card">
            <h6 class="card-heading mb-2">Сообщество</h6>
            <p class="small mb-2">
              Присоединяйтесь к нам, чтобы общаться с людьми, которые разделяют
              ваш интерес и готовы делиться с вами своим опытом, взглядами и
              идеями
            </p>
            <!-- <button class="btn btn-dark btn-sm my-2">Добавить материалы</button> -->
          </div>
        </div>
      </section>
      <section></section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
header {
  padding: 50px 0;
}

.advantages-content {
  padding: 1rem;
  background: var(--custom-wrapper-background-color);
  width: fit-content;
  border-radius: 5px;
  display: flex;
  gap: 1rem;
  .custom-card {
    padding: 1rem;
    min-height: 150px;
    border-radius: 8px;
    background: var(--custom-wrapper-inner-background-color);
    width: 350px;
  }
}
// footer {
//   padding: 30px 0;
//   background-color: #111;
//   color: #fff;
//   min-height: 400px;
// }
</style>
