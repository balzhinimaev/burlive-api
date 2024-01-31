export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    try {

        const query = await $fetch('http://localhost:5555/api/cash/isCodeExists', {
            method: 'get',
            params: {
                cashCode: body.cashCode 
            },
            headers: {
                authorization: body.authentication,
            }
        })

        return query

    } catch (error) {

        return error

    }

})
