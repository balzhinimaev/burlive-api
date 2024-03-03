// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@pinia/nuxt", "@nuxt/image"],
  app: {
    head: {
      title: "Заголовок по умолчанию для всего сайта",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },
        { name: "description", content: "Изучение и развитие бурятского языка" },
        // Добавьте другие глобальные мета-теги здесь
      ],
      // Дополнительно можно добавить link теги, скрипты и т.д.
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        // Добавьте другие ресурсы, которые должны быть предварительно загружены или подключены глобально
      ],
    },
  },
  css: [
    "@/node_modules/bootstrap/scss/bootstrap.scss",
    `@/node_modules/bootstrap-icons/font/bootstrap-icons.min.css`,
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_variables.scss" as *;',
        },
      },
    },
  },
  alias: {
    "/analytics": "/dashboard/analytics",
  },
});