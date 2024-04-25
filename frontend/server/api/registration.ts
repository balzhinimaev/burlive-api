export default defineEventHandler(async (event) => {
    const runtimeConfig = useRuntimeConfig()
    const body = await readBody(event)    
    const query = await $fetch(
      `${runtimeConfig.public.apiUrl}/users/register`,
      {
        method: "post",
        body: {
          email: body.email,
          password: body.password,
        },
      }
    );

    return query

})
