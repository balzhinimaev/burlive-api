<template>
    <div>
        <DashboardHeadingComponent title="Статистические данные" />
        <p v-if="pending">Fetching...</p>
        <pre v-else-if="error">Could not load quote: {{ error }}</pre>
        <div v-else class="row">
            <div class="col-xl-5">
                <article class="mt-2">
                    <div>
                        <form @submit.prevent="saveTelegramData" id="telegram-bot">
                            <h5 class="mb-3"># Приветствие</h5>
                            <div class="">
                                <label for="bot-token" class="form-label">Текст</label>
                                <textarea v-model="bin[0].greeting" id="bot-token" class="form-control"></textarea>
                            </div>
                            <button class="btn btn-primary mt-3" :class="{ 'disabled': pending }">Соханить</button>
                        </form>
                    </div>
                </article>
                <article class="mt-4">
                    <div>
                        <form @submit.prevent="saveActionData" id="telegram-bot">
                            <h5 class="mb-3"># Призыв к действию</h5>
                            <div class="">
                                <label for="bot-token" class="form-label">Текст</label>
                                <textarea v-model="bin[0].action" id="bot-token" class="form-control"></textarea>
                            </div>
                            <button class="btn btn-primary mt-3" :class="{ 'disabled': pending }">Соханить</button>
                        </form>
                    </div>
                </article>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
const { data: bin, pending, error } = <any>useFetch(() => `http://localhost:5555/api/bin`, {
    method: 'get',
    headers: {
        'Authorization': `Bearer ${useCookie("token").value}`,
        'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
    }
})

async function saveTelegramData() {
    const { data: updateResponse, pending: updatePending, error: updateError } = <any>useFetch(() => `http://localhost:5555/api/bin/updateGreetingMessage`, {
        method: 'put',
        body: {
            greeting: bin.value[0].greeting,
        },
        headers: {
            'Authorization': `Bearer ${useCookie("token").value}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
        }
    })
}

async function saveActionData() {
    const { data: updateResponse, pending: updatePending, error: updateError } = <any>useFetch(() => `http://localhost:5555/api/bin/updateActionMessage`, {
        method: 'put',
        body: {
            action: bin.value[0].action,
        },
        headers: {
            'Authorization': `Bearer ${useCookie("token").value}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
        }
    })
}
</script>