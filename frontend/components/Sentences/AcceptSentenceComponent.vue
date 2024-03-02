<template>
  <button
    @click="acceptSentence"
    class="btn btn-sm btn-primary"
    style="text-align: center; display: block; margin: auto"
    :disabled="sentencesStore.isLoading"
  >
    <span style="font-size: 12px">{{
      sentencesStore.isLoadingAcceptSentence ? "Принятие..." : "Принять"
    }}</span>
  </button>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import { useSentencesStore } from "@/stores/sentences";

const props = defineProps({
  sentenceId: {
    type: String,
  },
});

const sentencesStore = useSentencesStore();

async function acceptSentence() {
  if (props.sentenceId) {
    await sentencesStore.acceptSentence(props.sentenceId);
  }
  // Вместо alert, рассмотрите использование компонента уведомлений или другого UI элемента
}
</script>
