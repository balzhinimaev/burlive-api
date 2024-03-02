<script lang="ts" setup>
const sentenceText = ref("");
const selectedLanguage = ref("ru");
const options: any = ref([
  { text: "Русский", value: "ru" },
  { text: "Бурятский", value: "bur" },
  { text: "Английский", value: "en" },
]);

const {
  data: acceptedSentence,
  pending: createdSentencePending,
  error: createdSentenceError,
}: {
  data: any;
  pending: any;
  error: any;
} = useAsyncData(`acceptedSentence`, () =>
  $fetch(`http://localhost:5555/api/sentences/get-accepted-sentence`, {
    method: "get",
    headers: {
      Authorization: `Bearer ${useCookie("token").value}`,
      "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
    },
    onResponse({ response }: { response: any }) {
      // Process the response data
      sentenceText.value = "";
    },
    onResponseError({
      request,
      response,
      options,
    }: {
      request: any;
      response: any;
      options: any;
    }) {
      console.log(response);
      // Handle the response errors
    },
  })
);

const selectedPair = ref("personalDevelopment");
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

async function addSentence() {
  // Удаление переносов строк из каждой строки в массиве
  let cleanedStrings: string[] = sentenceText.value
    .split(".")
    .map((str: string) => str.replace(/\n/g, ""))
    .filter((str: string) => str.trim() !== "");

  let sentencesSplitted: { text: string }[] = [];

  for (let i = 0; i < cleanedStrings.length; i++) {
    sentencesSplitted.push({ text: cleanedStrings[i] });
  }
}
</script>
<template>
  <div>
    <article class="form-for-add-sentence">
      <form @submit.prevent="addSentence">
        <h6>Случайное предложение</h6>
        <p class="text-muted">{{ acceptedSentence.sentence.text }}</p>
        <label for="translate" class="form-label">Перевод</label>
        <div class="for-translate">
          <textarea
            id="translate"
            class="form-control"
            placeholder="Переведите текст"
            v-model.lazy="sentenceText"
          >
          </textarea>
          <div class="my-2">
            <label for="sentenceLanguage" class="form-label">Укажите диалект</label>
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
          <input type="submit" class="mt-3 btn btn-primary" />
        </div>
      </form>
    </article>
  </div>
</template>

<style lang="scss" scoped>
.form-for-add-sentence {
  padding: 1.5rem;
  width: 100%;
  border-radius: 1rem;
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
</style>
