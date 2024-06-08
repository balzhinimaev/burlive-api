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
// import { useSentencesStore } from "@/stores/sentences";
import { useVocabularyStore } from "@/stores/vocabularyStore"; 

const props = defineProps({
  elementId: String,
  checked: Boolean,
});

const store = useVocabularyStore();
const isChecked = ref(props.checked);

function handleChange() {
  if (props.elementId) {
    isChecked.value = !isChecked.value;
    store.toggleCheckStatus(props.elementId, isChecked.value);
    console.log(props.elementId)
  }
}
</script>
