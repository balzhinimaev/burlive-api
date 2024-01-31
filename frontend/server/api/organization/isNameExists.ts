export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    try {

        const query = await $fetch('http://localhost:5555/api/organization/isNameExists', {
            method: 'get',
            params: {
                name: body.name
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
