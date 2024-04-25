<template>
    <div>
        <h4>Финансы</h4>
        <div v-if="userStore.isLoadingWalletData">
            <p>Загрузка данных кошелька ...</p>
        </div>
        <div v-else-if="userStore.isErrorLoadingWalletData">
            <p>{{ userStore.errorLoadingWalletData }}</p>
        </div>
        <p style="display: flex;" v-else><span>Ваш адрес Ton</span>: <pre style="display: block; margin: auto 5px; cursor: pointer;">{{ userStore.wallet.walletAddress }}</pre></p>
        <button class="btn btn-sm btn-primary my-3 disabled">Сгенерировать кошелек</button>
        <hr>
        <h4>История транзакций</h4>
    </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();
onBeforeMount(() => {
    userStore.fetchWalletData()
})
useSeoMeta({
  title: "Финансы",
});
</script>

<style lang="scss" scoped>
h4 {
    color: #4BE1BA;
}</style>