export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const runtimeConfig = useRuntimeConfig()
    console.log(body)
    const query = await $fetch(`${runtimeConfig.public.apiUrl}/users/login`, {
      method: "post",
      body: {
        password: body.password,
        email: body.username,
      },
    });

    return query

})
