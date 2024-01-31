export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    try {

        console.log(body)

        const query = await $fetch('http://localhost:5555/api/cash/checkPseudonym', {
            method: 'get',
            params: {
                cashPseudonym: body.pseudonym 
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
