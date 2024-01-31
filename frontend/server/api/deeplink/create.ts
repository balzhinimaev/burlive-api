export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log(body)
    const query = await $fetch('http://localhost:5555/api/deeplink/create', {
        method: 'post',
        headers: {
            'Authorization': `Bearer ${body.token}`,
            'Content-Type': 'application/json', // Укажите тип контента, если это необходимо
        },
        body: {
            name: body.name,
            deeplink: body.deeplink,
        }
    })

    return query

})
