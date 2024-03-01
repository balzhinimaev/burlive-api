<template>
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
</template>

<style lang="scss" scoped>
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
</style>