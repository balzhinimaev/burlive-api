<script lang="ts" setup>
const { data: deeplinks, pending, error } = useFetch<{
    list: [{
        name: string,
        value: string,
        referredUserId: any[]
    }]
}>(() => `http://localhost:5555/api/deeplink`, {
    method: 'get',
    headers: {
        'Authorization': `Bearer ${useCookie("token").value}`,
        'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
    },
})
</script>

<template>
    <div>
        <p v-if="pending">Fetching...</p>
        <pre v-else-if="error">Could not load quote: {{ error }}</pre>
        <form  v-else @submit.prevent="">
            <table class="table align-middle text-center table-sm">
                <thead>
                    <tr>
                        <th style="width: 15px; height: 15px;" scope="col"><input style="display: block; margin-bottom: 4px" class="form-check-input mt-0" type="checkbox" value="" aria-label="check all"></th>
                        <th style="width: 15px" scope="col" class="small">#</th>
                        <th scope="col" class="small" style="text-align: left;">Назначение ссылки</th>
                        <th scope="col" class="small" style="text-align: left;">Ссылка</th>
                        <th scope="col" class="small">Переходов</th>
                        <!-- <th scope="col" class="small">Удалить</th> -->
                    </tr>
                </thead>
                <tbody>
                    <tr class="table-item selected" v-for="(link, index) in deeplinks?.list" :key="index">
                        <td style="padding: 0"><input style="margin: auto; display: block;" class="form-check-input mt-0" type="checkbox" value="" :aria-label="link.name"></td>
                        <th>{{ index + 1 }}</th>
                        <td style="text-align: left;">{{ link.name }}</td>
                        <td style="text-align: left;">
                            <pre style="margin-bottom: 0; padding: 0"><a href="https://t.me/api3flbot?start=" + link.value>https://t.me/api3flbot?start={{ link.value }}</a></pre>
                        </td>
                        <td>{{ link.referredUserId.length }}</td>
                        <!-- <td class="text-center"><button class="btn btn-danger btn-sm btn-delete"><i class="bi bi-trash"></i> -->
                        <!-- </button></td> -->
                    </tr>
                </tbody>
            </table>
            <!-- <button class="mt-3 mb-4 btn btn-primary">Удалить выбранное</button> -->
        </form>
    </div>
</template>

<style lang="scss" scoped>
.table-item {
    transition: 400ms;
    cursor: pointer;
    position: relative;
    top: 0;
    left: 0;
    &:hover {
        left: 3px;
    }
}

</style>