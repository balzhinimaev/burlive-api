<script lang="ts" setup>
import { useSentencesStore } from '@/stores/sentences';
const sentencesStore = useSentencesStore();
const selectedLanguage = sentencesStore.addSentencesLanguage;
const options: any = ref([
  { text: "Русский", value: "ru" },
  { text: "Бурятский", value: "bur" },
  { text: "Английский", value: "en" },
]);

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
  { value: "literature", key: "Литература" },
]);
</script>
<template>
  <div>
    <article class="form-for-add-sentence">
      <form @submit.prevent="sentencesStore.addSentence()">
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
        <div class="for-translate">
          <textarea
            id="sentence"
            class="form-control"
            placeholder="Предложение для перевода"
            v-model="sentencesStore.addSentences"
          >
          </textarea>
          <input type="submit" class="mt-3 btn btn-primary" />
          <div class="my-2" v-if="sentencesStore.isErrorAddSentence">
            <p class="text-muted">{{ sentencesStore.errorAddSentence }}</p>
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
