<script lang="ts" setup>
import { useSentencesStore } from "@/stores/sentences";
const pendingSentencesStore = useSentencesStore();

const totalPages = computed(() => Math.ceil(pendingSentencesStore.totalItems / pendingSentencesStore.pageSize));

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === pendingSentencesStore.currentPage) {
    return;
  }
  pendingSentencesStore.updateCurrentPage(page);
};
</script>
<template>
  <nav aria-label="Page navigation">
    <ul class="pagination">
      <li class="page-item" :class="{ disabled: pendingSentencesStore.currentPage <= 1 }">
        <a class="page-link" href="#" @click="changePage(pendingSentencesStore.currentPage - 1)">Предыдущая</a>
      </li>
      <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: page === pendingSentencesStore.currentPage }">
        <a class="page-link" href="#" @click="changePage(page)">{{ page }}</a>
      </li>
      <li class="page-item" :class="{ disabled: pendingSentencesStore.currentPage >= totalPages }">
        <a class="page-link" href="#" @click="changePage(pendingSentencesStore.currentPage + 1)">Следующая</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* Стили остаются без изменений */
.pagination {
  display: flex;
  list-style: none;
  padding: 0;
  margin-bottom: 0;
}
.page-item.disabled a, .page-item.active a {
  pointer-events: none;
}
.page-link {
  padding: 0.5rem 0.75rem;
  margin-left: -1px;
  line-height: 1.25;
  color: var(--bs-body-color);
  background-color: var(-scrollbar-thumb-hover-color);
  border: none;
  &:focus {
    box-shadow: none;
  }
}
.page-link:hover {
  color: var(--bs-body-color);
  text-decoration: none;
  background-color: var(--notify-background-color);
  border-color: #dee2e6;  
}
.active .page-link {
  color: var(--bs-body-color);
  background-color: var(--body-background-color);
  border-color: #007bff;
}
</style>
