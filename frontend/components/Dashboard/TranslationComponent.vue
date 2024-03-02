<script lang="ts" setup>
const {
  data: translations,
  pending,
  error,
} = useAsyncData(`translations`, () =>
  $fetch("http://localhost:5555/api/translations", {
    method: "get",
    headers: {
      Authorization: `Bearer ${useCookie("token").value}`,
      "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
    },
  })
);

function formatTimeString(timeString: any) {
  const dateObject = new Date(timeString);

  const year = dateObject.getFullYear();
  const month = dateObject.getMonth() + 1; // Месяцы в JavaScript начинаются с 0
  const day = dateObject.getDate();
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const seconds = dateObject.getSeconds();

  const formattedDateString = `${year}-${month < 10 ? "0" : ""}${month}-${
    day < 10 ? "0" : ""
  }${day} ${hours < 10 ? "0" : ""}${hours}:${
    minutes < 10 ? "0" : ""
  }${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return formattedDateString;
}
</script>
<template>
  <div class="mt-5">
    <div class="custom-row">
      <h5>Переводы</h5>
    </div>
    <p v-if="pending">Загрузка</p>
    <div v-else-if="error">
      {{ error.data.message }}
    </div>
    <div v-else>
      <table class="table table-borderless" v-if="translations">
        {{ translations }}
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">#</th>
            <th scope="col">Текст предложения</th>
            <th scope="col">Автор</th>
            <th scope="col">Переводы</th>
            <th scope="col">Статус</th>
            <th scope="col">Язык</th>
            <th scope="col">Создан</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(sentence, index) in translations.sentences" :key="index">
            <td>
              <input
                class="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckDefault"
              />
            </td>
            <th scope="row">{{ index + 1 }}</th>
            <td>{{ sentence.text }}</td>
            <td>
              <NuxtLink :to="'users/' + sentence.author">{{
                sentence.author
              }}</NuxtLink>
            </td>
            <td>
              <ul v-if="sentence.translations.length">
                <li
                  v-for="(
                    translation, indexTranslations
                  ) in sentence.translations"
                  :key="indexTranslations"
                >
                  {{ indexTranslations }}. {{ translation }}
                </li>
              </ul>
              <p v-else>Переводов нет</p>
            </td>
            <td>{{ sentence.status === "accepted" ? "Принят" : "" }}</td>
            <td>
              {{ sentence.language === "ru" ? "Русский" : sentence.language }}
            </td>
            <td>{{ formatTimeString(sentence.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p>{{ translations.message }}: {{ translations.count }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
table {
  margin: 1rem 0;
}
.custom-row {
  display: flex;
  justify-content: space-between;

  h5,
  button {
    margin: auto 0;
  }
}
</style>
