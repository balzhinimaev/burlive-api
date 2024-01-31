<script lang="ts" setup>
const { data: promts, pending, error } = useFetch<{
    promts: [{
        text: string,
    }]
}>(() => `http://localhost:5555/api/promt`, {
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
                        <th scope="col" class="small" style="text-align: left;">Текст промта</th>
                        <!-- <th scope="col" class="small">Удалить</th> -->
                    </tr>
                </thead>
                <tbody>
                    <tr class="table-item selected" v-for="(promt, index) in promts?.promts" :key="index">
                        <td style="padding: 0"><input style="margin: auto; display: block;" class="form-check-input mt-0" type="checkbox" value="" :aria-label="promt.text"></td>
                        <th>{{ index + 1 }}</th>
                        <td style="text-align: left;">{{ promt.text }}</td>
                    </tr>
                </tbody>
            </table>
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