export default defineEventHandler(async (event) => {
    const body = await readBody(event)    
    const query = await $fetch('http://localhost:5555/api/users/register', {
        method: 'post',
        body: {
            email: body.email,
            password: body.password
        }
    })

    return query

})
