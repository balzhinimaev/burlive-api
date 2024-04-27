<script setup lang="ts">
const randomMessages = [
  "Ищу вдохновение для нового проекта. Какие у вас советы по поиску творческой идеи?",
  "Мечтаю о путешествии. Какие места в вашем списке желаемого посещения?",
  "Размышляю о своих целях на этот год. Какие планы у вас?",
  "Хочу научиться чему-то новому. Какие навыки вы считаете полезными в современном мире?",
  "Ищу рецепт веганского десерта. Чем вы обычно заменяете молоко и яйца?",
  "Что для вас является источником мотивации? Поделитесь своими мыслями.",
  "Как вы боретесь с процрастинацией? Мне трудно сосредоточиться на работе в последнее время.",
  "Что вы думаете о будущем искусственного интеллекта? Какие проблемы и преимущества вы видите?",
  "Какие книги вы читали в прошлом месяце? Расскажите о своих впечатлениях.",
  "Как вы относитесь к идее работы удаленно? Чем бы вы предпочли заниматься, если бы имели такую возможность?",
];

// Пример использования:
const randomMessage = ref(
  randomMessages[Math.floor(Math.random() * randomMessages.length)]
);
function truncateString(str: string) {
  return str.length > 30 ? str.slice(0, 30) + "..." : str;
}
</script>
<template>
  <div class="message-component">
    <div class="avatar">
      <NuxtImg src="https://placehold.co/64x64" alt="" />
    </div>
    <div class="userdata">
      <p class="username">Александр</p>
      <p class="part-message">{{ truncateString(randomMessage) }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-component {
  display: flex;
  margin-bottom: 5px;
  padding: 5px;
  background: var(--messages-message-component-background);
  border-radius: 15px;
  &:last-child {
    margin-bottom: 0;
  }
}
.avatar {
  margin-right: 10px;
  border-radius: 15px;
  overflow: hidden;
  img {
    width: 64px;
  }
}
.userdata {
  margin: auto 0;
  p {
    margin: 0;
    color: var(--messages-wrapper-color-heading);
    overflow: hidden;
    white-space: nowrap;
    &.part-message {
      color: #646464;
    }
  }
}
</style>
