<template>
    <div class="page vocabular-page">
        <!-- <div class="container"></div> -->
         <section style="height: 100%;">
            <div class="container" style="height: 100%;">
                <VocabularTranslateComponent />
            </div>
         </section>
    </div>
</template>

<script lang="ts" setup>
onMounted(async () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: `/leaderboard` });
        });
    }
})
</script>

<style lang="scss" scoped>
.page {
    // padding: 1rem 10px;
    padding: 10px 0;
    // background-color: var(--background-leaderpage-color);
    background-color: var(--background-component-color);

    // .frame {
    //     margin-bottom: 1rem;
    //     text-align: center;
    // }

    section {
        margin-bottom: 16px;

        &:last-child {
            margin: 0;
        }
    }
}
</style>