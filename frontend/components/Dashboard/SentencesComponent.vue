

<script lang="ts" setup>
const index = ref(0);
const selectedLanguage = ref("ru");
const selectedPair = ref("personalDevelopment");
const deleteResponse = ref();
const pairs = ref([
  { value: "scientificResearch", key: "Научные исследования" },
  { value: "familyRelationships", key: "Семейные отношения" },
  { value: "environmentalIssues", key: "Экологические проблемы" },
  { value: "technologicalInnovations", key: "Технологические новинки" },
  { value: "ethicsAndMorality", key: "Этика и мораль" },
  { value: "financialLiteracy", key: "Финансовая грамотность" },
  { value: "healthyLifestyle", key: "Здоровый образ жизни" },
  { value: "internationalRelations", key: "Международные отношения" },
  { value: "personalDevelopment", key: "Развитие личности" },
  { value: "culturalHeritage", key: "Культурное наследие" },
]);

console.log(pairs);

let arrayItems: any = ref("");
const options = ref([
  { text: "Русский", value: "ru" },
  { text: "Бурятский", value: "bur" },
  { text: "Английский", value: "en" },
]);
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
  // Удаление переносов строк из каждой строки в массиве
  let cleanedStrings = sentenceText.value
    .split(".")
    .map((str: string) => str.replace(/\n/g, ""))
    .filter((str: string) => str.trim() !== "");
  let customData = [];
  for (let i = 0; i < cleanedStrings.length; i++) {
    customData.push({ text: cleanedStrings[i] });
  }
  console.log(customData);
  const {
    data: createdSentence,
    pending: createdSentencePending,
    error: createdSentenceError,
  } = useFetch(
    () => `http://localhost:5555/api/sentences/create-sentences-multiple`,
    {
      method: "post",
      body: {
        sentences: customData,
        language: selectedLanguage.value,
        context: selectedPair.value,
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
    }
  );
}

async function checked(event: any, index: number) {
  // Проверяем, была ли нажата клавиша Shift
  console.log(event);
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
  arrayItems.value = checkedItems;
  console.log(arrayItems.value);
}

async function deleteSentences() {
  try {
    const { data, pending, error } = useFetch(
      () => `http://localhost:5555/api/sentences`,
      {
        method: "delete",
        body: {
          sentences: arrayItems.value,
        },
        headers: {
          Authorization: `Bearer ${useCookie("token").value}`,
          "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
        },
        onResponse({ request, response, options }) {
          deleteResponse.value = response._data;

          // Process the response data
          index.value++;
          // for (let i = 0; i < result.value.sentences.length; i++) {
          //   for (let z = 0; z < arrayItems.value.length; z++) {

          //     const tempSentence = result.value.sentences[i]
          //     const tempSelectedSentence = arrayItems.value[i]

          //     if (tempSentence._id === tempSelectedSentence._id) {
          //       console.log('123')
          //     }

          //   }
          // }
        },
        onResponseError({ request, response, options }) {
          console.log(response);
          // Handle the response errors
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
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
              <option v-for="option in options" :value="option.value">
                {{ option.text }}
              </option>
            </select>
          </div>
          <div class="my-2">
            <label for="context" class="form-label">Контекст предложения</label>
            <select
              class="form-select"
              aria-label="Default select example"
              id="sentenceLanguage"
              v-model="selectedPair"
            >
              <option v-for="pair in pairs" :value="pair.value">
                {{ pair.key }}
              </option>
            </select>
          </div>
          <label for="sentence" class="form-label">Предложение</label>
          <div class="">
            <textarea
              id="sentence"
              class="form-control"
              placeholder="Предложение для перевода"
              v-model="sentenceText"
            >
            </textarea>
            <input type="submit" class="mt-3 btn btn-primary" />
          </div>
        </form>
      </article>
    </div>
    <p v-if="pending">Загрузка</p>
    <div v-else-if="error">
      {{ error.data.message }}
    </div>
    <div v-else>
      <p>
        <i>{{ result.message }}: {{ result.count }}</i>
      </p>
      <div class="table-responsive">
        <table class="table table-bordered" v-if="result">
          <thead>
            <tr>
              <th scope="col" style="text-align: center">#</th>
              <!-- <th scope="col" style="text-align: center;">#</th> -->
              <th scope="col">Текст</th>
              <th scope="col">Автор</th>
              <th scope="col">Переводы</th>
              <th scope="col">Язык</th>
              <th scope="col" style="width: 115px" class="text-center">
                Принять
              </th>
              <th scope="col" style="width: 115px" class="text-center">
                Отклонить
              </th>
              <!-- <th scope="col">Создан</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sentence, index) in result.sentences" :key="sentence">
              <td style="width: 5px">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value=""
                  :id="'table-item-' + index"
                  v-model="sentence.checkStatus"
                  @change.passive="checked($event, index)"
                  style="cursor: pointer"
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
              <td>
                <div class="d-flex">
                  <button
                    class="btn btn-sm btn-primary"
                    style="text-align: center; display: block; margin: auto"
                  >
                    <span>Принять</span>
                  </button>
                </div>
              </td>
              <td>
                <div class="d-flex">
                  <button
                    class="btn btn-sm btn-danger"
                    style="text-align: center; display: block; margin: auto"
                  >
                    <span>Отклонить</span>
                  </button>
                </div>
              </td>
              <!-- <td class="createdAt"><span>{{ formatTimeString(sentence.createdAt).date }}<br>{{ formatTimeString(sentence.createdAt).time }}</span></td> -->
            </tr>
          </tbody>
        </table>
        <!-- <button class="btn btn-danger" :class="{ 'disabled': !arrayItems.length }">Удалить {{ arrayItems.length ? arrayItems.length : "" }}</button> -->
        <div class="btn-group" role="group" aria-label="Basic example">
          <button
            @click.prevent="deleteSentences"
            class="btn btn-success"
            :class="{ disabled: !arrayItems.length }"
          >
            Принять
          </button>
          <button
            @click.prevent="deleteSentences"
            class="btn btn-warning"
            :class="{ disabled: !arrayItems.length }"
          >
            Отклонить
          </button>
          <button
            @click.prevent="deleteSentences"
            class="btn btn-danger"
            :class="{ disabled: !arrayItems.length }"
          >
            Удалить
          </button>
        </div>

        <div class="my-2" v-if="deleteResponse">
          <p>{{ deleteResponse }}</p>
        </div>
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
  padding: 30px;
  width: 450px;
  border-radius: 5px;
  margin: 1rem 0;
  color: #2c2c2c;
  background-image: linear-gradient(109deg, rgb(14 14 14), rgb(0 0 0 / 11%));
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