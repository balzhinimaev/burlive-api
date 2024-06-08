<script lang="ts" setup>
import { useAcceptedSentencesStore } from "@/stores/acceptedSentences";
import type { ISuggestedWordModel } from "~/types/IVocabulary";
const acceptedSentencesStore = useAcceptedSentencesStore();

async function updateCurrentPage(page: number) {
  acceptedSentencesStore.currentPage = page;
  // Здесь вызовите метод для получения данных новой страницы
}

defineProps<{
  words: ISuggestedWordModel[];
}>();

</script>
<template>
  <div
    class="table-responsive"
    style="padding: 1.5rem; background: var(--sentences-table-background-color); border-radius: 1rem"
  >
    <table class="table table-borderless">
      <thead>
        <tr>
          <th scope="col" style="text-align: center">#</th>
          <!-- <th scope="col" style="text-align: center;">#</th> -->
          <th scope="col">Текст</th>
          <th scope="col">Язык</th>
          <th scope="col">Автор</th>
          <th scope="col">Пре-переводы</th>
          <th scope="col">Контрибьютеры</th>
          <th scope="col">Статус</th>
          <th scope="col">Создан</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(element, index) in words" :key="element._id">
          <td style="width: 5px">
            <vocabulary-checkbox
              :element-id="element._id"
              :checked="element.checkStatus"
            ></vocabulary-checkbox>
          </td>
          <!-- <th scope="row" style="width: 5px; text-align: center;">{{ index + 1 }}</th> -->
          <td class="sentenceText">{{ element.text }}</td>
          <td>{{ element.language }}</td>
          <td>
            <NuxtLink :to="'users/' + element.author.username">{{
              element.author.username
            }}</NuxtLink>
          </td>
          <td>
            <p style="margin: 0">
              <span v-for="(translations, index) in element.pre_translations" :key="translations">
                <i v-if="element.pre_translations.length === index + 1">
                  {{ translations.text }}
                </i>
                <i v-else>
                  {{ translations.text }}, 
                </i>
              </span>
            </p>
          </td>
          <td>{{ element.contributors }}</td>
          <td>{{ element.status }}</td>
          <td>{{ element.createdAt }}</td>
          <!-- <td class="createdAt"><span>{{ formatTimeString(sentence.createdAt).date }}<br>{{ formatTimeString(sentence.createdAt).time }}</span></td> -->
        </tr>
      </tbody>
    </table>
    <div class="my-2" v-if="acceptedSentencesStore.declineSentenceResponse.message">
      <p>{{ acceptedSentencesStore.declineSentenceResponse.message }}</p>
    </div>
    <sentences-pagination-component
      :currentPage="acceptedSentencesStore.currentPage"
      :totalItems="acceptedSentencesStore.totalItems"
      :pageSize="acceptedSentencesStore.pageSize"
      @update:currentPage="updateCurrentPage"
    ></sentences-pagination-component>
  </div>
</template>

<style lang="scss" scoped>
.table {
  margin: 0 0 1rem;
}
</style>
