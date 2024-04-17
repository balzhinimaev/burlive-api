<script setup lang="ts">
import { useSentencesStore } from "@/stores/sentences";
import { useAcceptedSentencesStore } from "@/stores/acceptedSentences";
useSeoMeta({
  title: "Предложения",
});
definePageMeta({
  middleware: ["authed"],
});
const sentencesStore = useSentencesStore();
const acceptedSentencesStore = useAcceptedSentencesStore();

async function updateCurrentPage(page: number) {
  acceptedSentencesStore.currentPage = page;
  // Здесь вызовите метод для получения данных новой страницы
}
// Вызовите fetchSentences при монтировании компонента
onMounted(() => {
  sentencesStore.fetchSentences();
  acceptedSentencesStore.fetchSentences();
});

</script>
<template>
  <div>
    <div class="container-fluid">
      <DashboardHeadingComponent title="Предложения" />

      <div>
        <div class="row">
          <div class="col-lg-3">
            <sentences-sidebar-component></sentences-sidebar-component>
          </div>
          <div class="col-lg-9">
            <main>
              <section id="pending-sentences">
                <div class="custom-row">
                  <h5>Предложения</h5>
                  <!-- <button class="btn btn-dark btn-sm">Новое предложение</button> -->
                </div>

                <p v-if="sentencesStore.isLoading">Загрузка</p>
                <div v-else-if="sentencesStore.isError">
                  {{ sentencesStore.error?.message }}
                </div>
                <div v-else-if="sentencesStore.sentences.length">
                  <!-- <p>
                <i
                  >Предложений получено:
                  {{ sentencesStore.sentences.length }}</i
                >
              </p> -->
                  <sentences-pending-table
                    :sentences="sentencesStore.sentences"
                  ></sentences-pending-table>
                </div>
              </section>
              <section id="accepted-sentences">
                <div class="custom-row">
                  <h5>Принятые предложения</h5>
                </div>
                <p v-if="acceptedSentencesStore.isLoading">Загрузка</p>
                <div v-else-if="acceptedSentencesStore.isError">
                  {{ acceptedSentencesStore.error?.message }}
                </div>
                <div v-else-if="acceptedSentencesStore.acceptedSentences">
                  <!-- <p>
                <i
                  >Предложений получено:
                  {{ acceptedSentencesStore.acceptedSentences.length }}</i
                >
              </p> -->
                  <sentences-accepted-table
                    :sentences="acceptedSentencesStore.acceptedSentences"
                  ></sentences-accepted-table>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
main {
  width: 100%;
  padding: 1rem;
  border-radius: 3px;
  margin-top: 0.5rem;
}

.form-filter {
  display: flex;
  justify-content: space-between;
}

.calendar {
  user-select: none;
  width: 180px;
  text-align: center;
}

.dateFillTo {
}
[data-bs-theme="dark"] {
  .table-responsive {
    background-color: #0e0f0f;
    border-radius: 1rem;
    font-size: 14px;
    p {
      font-size: 14px;
    }
  }
}
main {
  section {
    margin-bottom: 1.5rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
}
.custom-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  h5,
  button {
    margin: auto 0;
  }
}
.form-for-add-sentence {
  padding: 30px;
  width: 450px;
  border-radius: 5px;
  margin: 1rem 0;
  color: #2c2c2c;
  background-image: linear-gradient(109deg, rgb(14 14 14), rgb(0 0 0 / 11%));
  .custom-form-row {
    display: flex;
    #sentence {
      margin-right: 1rem;
    }
  }
}
.createdAt {
  span {
    font-size: 10px;
    text-align: center;
  }
}

.sentenceText {
  width: 400px;
}

td {
  p {
    margin: 0;
  }
}
</style>
