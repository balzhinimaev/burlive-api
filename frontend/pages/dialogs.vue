<template>
  <div class="page home-page">
    <header>
      <div class="container">
        <h2 class="mb-0">Сбор диалогов</h2>
        <p>Диалоги будут использоваться для обучения языковой модели</p>
        <!-- <button class="btn btn-dark">Присоединиться</button> -->
      </div>
    </header>

    <main>
      <section>
        <div class="container">
          <div class="row">
            <div class="col-lg-6">
              <button
                class="btn btn-primary"
                @click="newDialog"
                v-if="!showForm"
              >
                Новый диалог
              </button>
              <form @submit.prevent="" v-if="showForm">
                <div>
                  <div>Selected: {{ selected }}</div>

                  <select v-model="selected" class="form-select">
                    <option v-for="(option, index) of options" :key="index">
                      {{ option.value }}
                    </option>
                  </select>
                  <div class="mt-2">
                    <label for="text" class="form-label">Сообщение</label>
                    <textarea
                      name="text"
                      class="form-control"
                      id="text"
                      v-model="message"
                    ></textarea>
                  </div>
                  <input
                    type="submit"
                    class="btn btn-primary my-2"
                    value="Следующее сообщение"
                    @click="nextStep"
                  />
                </div>
                <button class="btn btn-primary my-2" @click="saveDialog">
                  Заврешить диалог
                </button>
              </form>
              <div class="mt-2" v-if="dialog.length">{{ dialog }}</div>
            </div>
            <!-- <div class="col-lg-6">
                <p>{{ dialog.messages.length }} Сообщений</p>
                {{ dialog }}
            </div> -->
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
  
<style lang="scss" scoped>
header {
  padding: 50px 0;
}
</style>

<script lang="ts" setup>
const message = ref("");
const showForm = ref(false);
const promt = ref([
  {
    role: "system",
    content: "ты знакомишься и общаешься с парнями",
  },
]);

const selected = ref("user");

const options = ref([
  { role: "user", value: "user" },
  { role: "assistant", value: "assistant" },
]);

const dialog = ref([]);

const roles = ["user", "assistant"];
async function newDialog() {
  showForm.value = true;
}
async function nextStep() {
  const element = {
    role: selected.value,
    content: message.value,
  };

  dialog.value.push(element);
}
async function saveDialog() {
  const newDialog = {
    messages: promt.value.concat(dialog.value),
  };

  const { data, pending, error } = useFetch(
    () => `http://localhost:5555/api/dialogs/save`,
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
        "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
      },
      body: {
        messages: newDialog,
      },
      onResponse({ request, response, options }) {
        // Process the response data
        console.log(response._data);
      },
    }
  );

  dialog.value = [];
}
</script>