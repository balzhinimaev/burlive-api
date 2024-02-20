

<script lang="ts" setup>
const index = ref(0);
const selectedLanguage = ref('ru')

const options = ref([
  { text: 'Русский', value: 'ru' },
  { text: 'Бурятский', value: 'bur' },
  { text: 'Английский', value: 'en' }
])
const {
  data: result,
  pending,
  error,
} = useFetch(() => `http://localhost:5555/api/sentences/?notAccepted=true`, {
  method: "get",
  headers: {
    Authorization: `Bearer ${useCookie("token").value}`,
    "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
  },
  watch: [index],
  onResponse({ request, response, options }) {
    // Process the response data

    let sentences = response._data.sentences;

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i];
      sentence.checkStatus = false;
    }
  },
});

const sentenceText = ref("");
const sentenceLanguage = ref("");

function formatTimeString(timeString: any) {
  const dateObject = new Date(timeString);

  const year = dateObject.getFullYear();
  const month = dateObject.getMonth() + 1; // Месяцы в JavaScript начинаются с 0
  const day = dateObject.getDate();
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const seconds = dateObject.getSeconds();

  const formattedDateString = {
    date: `${year}-${month < 10 ? "0" : ""}${month}-${
      day < 10 ? "0" : ""
    }${day}`,
    time: `${hours < 10 ? "0" : ""}${hours}:${
      minutes < 10 ? "0" : ""
    }${minutes}:${seconds < 10 ? "0" : ""}${seconds}`,
  };

  return formattedDateString;
}

async function addSentence() {
  const {
    data: createdSentence,
    pending: createdSentencePending,
    error: createdSentenceError,
  } = useFetch(() => `http://localhost:5555/api/sentences`, {
    method: "post",
    body: {
      text: sentenceText.value,
      language: selectedLanguage.value,
    },
    headers: {
      Authorization: `Bearer ${useCookie("token").value}`,
      "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
    },
    onResponse({ request, response, options }) {
      // Process the response data
      sentenceText.value = "";
      index.value++;
    },
    onResponseError({ request, response, options }) {
      console.log(response);
      // Handle the response errors
    },
  });
}

async function checked(event: any, index: number) {
  // Проверяем, была ли нажата клавиша Shift
  console.log(event)
  const shiftKey = event.shiftKey;
  console.log(`Shift key was ${shiftKey ? "pressed" : "not pressed"}`);
  const sentences = result.value.sentences;
  let checkedItems = [];
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i];
    if (sentence.checkStatus) {
      checkedItems.push(sentence);
    }
  }
  console.log(checkedItems);
}
</script>
<template>
  <div>
    <div class="custom-row">
      <h5>Предложения</h5>
      <button class="btn btn-dark btn-sm">Новое предложение</button>
    </div>
    <div>
      <article class="form-for-add-sentence">
        <form @submit.prevent="addSentence">
          <h6>Добавить предложение</h6>
          <div class="mb-2">
            <label for="sentenceLanguage" class="form-label">Язык</label>
            <select
              class="form-select"
              aria-label="Default select example"
              id="sentenceLanguage"
              v-model="selectedLanguage"
            >
              <option v-for="option in options" :value="option.value">{{ option.text }}</option>
            </select>
          </div>
          <label for="sentence" class="form-label">Предложение</label>
          <div class="custom-form-row">
            <input
              type="text"
              id="sentence"
              class="form-control"
              placeholder="Предложение для перевода"
              v-model="sentenceText"
            />
            <input type="submit" class="btn btn-primary" />
          </div>
        </form>
      </article>
    </div>
    <p v-if="pending">Загрузка</p>
    <div v-else-if="error">
      {{ error.data }}
    </div>
    <div v-else>
      <pre>{{ result.sentences[0] }}</pre>
      <p>
        <i>{{ result.message }}: {{ result.count }}</i>
      </p>
      <div class="table-responsive">
        <table class="table table-bordered" v-if="result">
          <thead>
            <tr>
              <th scope="col" style="text-align: center;">#</th>
              <!-- <th scope="col" style="text-align: center;">#</th> -->
              <th scope="col">Текст</th>
              <th scope="col">Автор</th>
              <th scope="col">Переводы</th>
              <th scope="col">Язык</th>
              <!-- <th scope="col">Создан</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sentence, index) in result.sentences" :key="index">
              <td style="width: 5px">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value=""
                  :id="'table-item-' + index"
                  v-model="sentence.checkStatus"
                  @change.passive="checked($event, index)"
                  style="cursor: pointer;"
                />
              </td>
              <!-- <th scope="row" style="width: 5px; text-align: center;">{{ index + 1 }}</th> -->
              <td class="sentenceText">{{ sentence.text }}</td>
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
              <td>
                {{ sentence.language === "ru" ? "Русский" : null }}
                {{ sentence.language === "en" ? "Английский" : null }}
                {{ sentence.language === "bur" ? "Бурятский" : null }}
              </td>
              <!-- <td class="createdAt"><span>{{ formatTimeString(sentence.createdAt).date }}<br>{{ formatTimeString(sentence.createdAt).time }}</span></td> -->
            </tr>
          </tbody>
        </table>
      </div>
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
.form-for-add-sentence {
  padding: 1rem;
  width: 450px;
  border: 1px solid #eee;
  border-radius: 5px;
  margin: 1rem 0;
  .custom-form-row {
    display: flex;
    #sentence {
      margin-right: 1rem;
    }
  }
}
.createdAt {
  span {
    font-size: 10px;
    text-align: center;
  }
}

.sentenceText {
  width: 400px;
}

td {
  p {
    margin: 0;
  }
}
</style>