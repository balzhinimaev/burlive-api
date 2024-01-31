export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const query = await $fetch('http://localhost:5555/api/deeplink', {
        method: 'get',
        headers: {
            'Authorization': `Bearer ${body.token}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо
        },
    })

    return query
})
