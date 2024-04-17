<script lang="ts" setup>
import type { Sentence, SentencesResponse } from "@/types/sentences";
import { useSentencesStore } from "@/stores/sentences";
const acceptedSentencesStore = useAcceptedSentencesStore();

async function updateCurrentPage(page: number) {
  acceptedSentencesStore.currentPage = page;
  // Здесь вызовите метод для получения данных новой страницы
}

const sentencesStore = useSentencesStore();

defineProps<{
  sentences: Sentence[];
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
          <th scope="col">Автор</th>
          <th scope="col">Язык</th>
          <th scope="col" style="width: 115px" class="text-center">Принять</th>
          <th scope="col" style="width: 115px" class="text-center">
            Отклонить
          </th>
          <!-- <th scope="col">Создан</th> -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="(element, index) in sentences" :key="element._id">
          <td style="width: 5px">
            <sentences-sentence-checkbox
              :sentence-id="element._id"
              :checked="element.checkStatus"
            ></sentences-sentence-checkbox>
          </td>
          <!-- <th scope="row" style="width: 5px; text-align: center;">{{ index + 1 }}</th> -->
          <td class="sentenceText">{{ element.text }}</td>
          <td>
            <NuxtLink :to="'users/' + element.author.username">{{
              element.author.username
            }}</NuxtLink>
          </td>
          <td>
            <span>
              {{ element.language === "ru" ? "Русский" : null }}
              {{ element.language === "en" ? "Английский" : null }}
              {{ element.language === "bur" ? "Бурятский" : null }}
            </span>
          </td>
          <td>
            <div class="d-flex">
              <sentences-accept-sentence-component
                :sentenceId="element._id"
              ></sentences-accept-sentence-component>
            </div>
          </td>
          <td>
            <div class="d-flex">
              <sentences-decline-sentence-component
                :sentenceId="element._id"
              ></sentences-decline-sentence-component>
            </div>
          </td>
          <!-- <td class="createdAt"><span>{{ formatTimeString(sentence.createdAt).date }}<br>{{ formatTimeString(sentence.createdAt).time }}</span></td> -->
        </tr>
      </tbody>
    </table>
    <div class="my-2" v-if="sentencesStore.declineSentenceResponse.message">
      <p>{{ sentencesStore.declineSentenceResponse.message }}</p>
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
  margin: 0;
}
</style>
