<template>
    <div>
        <DashboardHeadingComponent title="Промты" />
        <div class="mt-4">
            <h5>Список промтов</h5>
            <getPromtsComponent />
        </div>
        <NuxtLink to="/dashboard/create-ref-promt">Добавить новый промт</NuxtLink>
    </div>
</template>