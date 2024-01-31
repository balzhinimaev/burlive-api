<template>
  <div class="mb-4">
    <label :for="inputName" class="form-label">{{ labelText }}</label>
    <input
      class="form-control"
      :id="inputName"
      :name="inputName"
      :placeholder="placeholder"
      type="text"
      v-model="inputName"
    />
  </div>
</template>

<script lang="ts" setup>

const props = defineProps({
  inputName: String,
  labelText: String,
  placeholder: String || null
});

const inputName = props.inputName

// import 

</script>