<script lang="ts" setup>
const { data: bin, pending, error } = <any>useFetch(() => `http://localhost:5555/api/bin`, {
    method: 'get',
    headers: {
        'Authorization': `Bearer ${useCookie("token").value}`,
        'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
    }
})
async function saveTelegramData() {
    const { data: updateResponse, pending: updatePending, error: updateError } = <any>useFetch(() => `http://localhost:5555/api/bin/updateTelegramData`, {
        method: 'put',
        body: {
            telegramToken: bin.value[0].openaiToken,
            telegramBotLink: bin.value[0].telegramBotLink,
            telegramChannelLink: bin.value[0].telegramChannelLink,
        },
        headers: {
            'Authorization': `Bearer ${useCookie("token").value}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
        }
    })

    console.log(updateResponse)
    console.log(updateError)
}
async function saveOpenaiData() {
    const { data: updateResponse, pending: updatePending, error: updateError } = <any>useFetch(() => `http://localhost:5555/api/bin/updateOpenaiToken`, {
        method: 'put',
        body: {
            openaiToken: bin.value[0].openaiToken
        },
        headers: {
            'Authorization': `Bearer ${useCookie("token").value}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
        }
    })

    console.log(updateResponse)
    console.log(updateError)
}
async function savePricingData() {
    const { data: updateResponse, pending: updatePending, error: updateError } = <any>useFetch(() => `http://localhost:5555/api/bin/updatePriceData`, {
        method: 'put',
        body: {
            price: parseFloat(bin.value[0].price),
            priceTest: parseFloat(bin.value[0].priceTest),

        },
        headers: {
            'Authorization': `Bearer ${useCookie("token").value}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо,
        }
    })
}
</script>
<template>
    <div>
        <DashboardHeadingComponent title="Настройки" />
        <p v-if="pending">Fetching...</p>
        <pre v-else-if="error">Could not load quote: {{ error }}</pre>
        <div v-else class="row">
            <div class="col-xl-5">
                <!-- <article class="mt-2">
                    <div>
                        <form @submit.prevent="saveTelegramData" id="telegram-bot">
                            <h5 class="mb-3"># Телеграмм бот</h5>
                            <div class="mb-3">
                                <label for="bot-token" class="form-label">Токен</label>
                                <input id="bot-token" class="form-control" type="text" v-model="bin[0].telegramToken">
                            </div>
                            <div class="mb-3">
                                <label for="bot-link" class="form-label">Ссылка</label>
                                <input id="bot-link" class="form-control" type="text" v-model="bin[0].telegramBotLink">
                            </div>
                            <div>
                                <label for="telegram-channel-link" class="form-label">Канал для подписки</label>
                                <input id="telegram-channel-link" class="form-control" type="text"
                                    v-model="bin[0].telegramChannelLink">
                            </div>
                            <button class="btn btn-primary mt-3">Соханить</button>
                        </form>
                    </div>
                </article> -->

                <!-- <article class="mt-5">
                    <div>
                        <form @submit.prevent="saveOpenaiData" id="openai">
                            <h5 class="mb-3"># Open AI</h5>
                            <div class="">
                                <label for="openai-token" class="form-label">Токен</label>
                                <input id="openai-token" class="form-control" type="text" v-model="bin[0].openaiToken">
                            </div>
                            <button class="btn btn-primary mt-3">Соханить</button>
                        </form>
                    </div>
                </article> -->

                <article class="mt-2">
                    <div>
                        <form @submit.prevent="savePricingData" id="pricing">
                            <h5 class="mb-3"># Ценообразование</h5>
                            <div class="mb-3">
                                <label for="price" class="form-label">Стоимость подписки</label>
                                <input id="price" class="form-control" type="text" v-model="bin[0].price">
                            </div>
                            <div class="">
                                <label for="price-test" class="form-label">Стоимость тестовой подписки</label>
                                <input id="price-test" class="form-control" type="text" v-model="bin[0].priceTest">
                            </div>
                            <button class="btn btn-primary mt-3">Соханить</button>
                        </form>
                    </div>
                </article>
            </div>
        </div>
    </div>
</template>