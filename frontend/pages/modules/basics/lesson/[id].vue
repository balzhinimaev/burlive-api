<template>
    <div>
        <header>
            <div class="container">
                <p>lesson {{ useRoute().params.id }}</p>
            </div>
        </header>
        <main>
            <section>
                <div class="container">
                    <p class="typography-body">
                        {{ module }}
                    </p>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts" setup>
const lessonsStore = useLessonsStore()

const router = useRoute()
const _id = router.params.id

const module = computed(() => lessonsStore.module);

onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: `/modules/basics` }); // Или другой маршрут по умолчанию
        });
    }
    // lessonsStore.fetchLessonById(useRoute().params.id)
    if (typeof (_id) === 'string') {
        lessonsStore.fetchLessonById(_id)
    }
});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
});</script>