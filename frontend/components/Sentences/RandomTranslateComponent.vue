<script lang="ts" setup>
import { useSentencesStore } from "@/stores/sentences";
const sentencesStore = useSentencesStore();

const sentenceText = ref("");
const selectedLanguage = ref("ru");
const options: any = ref([
  { text: "Русский", value: "ru" },
  { text: "Бурятский", value: "bur" },
  { text: "Английский", value: "en" },
]);

onBeforeMount(() => {
  sentencesStore.fetchAcceptedSentence();
});

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
        <div v-if="sentencesStore.isLoadingFetchAcceptedSentence">
          <p>Поиск случайного предложения ...</p>
        </div>
        <div v-else-if="sentencesStore.isErrorFetchAcceptedSentence">
          <p>{{ sentencesStore.errorFetchAcceptedSentence }}</p>
        </div>
        <div v-else>
          <p class="text-muted">{{ sentencesStore.acceptedSentence.text }}</p>
          <label for="translate" class="form-label">Перевод</label>
          <div class="for-translate">
            <textarea
              id="translate"
              class="form-control"
              placeholder="Переведите текст"
              v-model="sentencesStore.randomSentenceTranslateText"
            >
            </textarea>
            <div class="my-2">
              <label for="sentenceLanguage" class="form-label"
                >Укажите диалект</label
              >
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
  // background-image: linear-gradient(109deg, rgb(14 14 14), rgb(0 0 0 / 11%));
  background-color: var(--sidebar-background-color);
  .custom-form-row {
    display: flex;
    #sentence {
      margin-right: 1rem;
    }
  }
}
</style>
