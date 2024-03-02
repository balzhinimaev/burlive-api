<template>
  <input
    class="form-check-input"
    type="checkbox"
    :checked="isChecked"
    @change="handleChange"
    style="cursor: pointer"
  />
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";
import { useSentencesStore } from "@/stores/sentences";

const props = defineProps({
  sentenceId: String,
  checked: Boolean,
});

const store = useSentencesStore();
const isChecked = ref(props.checked);

function handleChange() {
  if (props.sentenceId) {
    isChecked.value = !isChecked.value;
    store.toggleSentenceCheckStatus(props.sentenceId, isChecked.value);
  }
}
</script>
