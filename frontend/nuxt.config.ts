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
        {
          name: "description",
          content: "Изучение и развитие бурятского языка",
        },
        // Добавьте другие глобальные мета-теги здесь
      ],
      // Дополнительно можно добавить link теги, скрипты и т.д.
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        // Добавьте другие ресурсы, которые должны быть предварительно загружены или подключены глобально
      ],
      script: [
        {
          src: 'https://telegram.org/js/telegram-web-app.js?56"',
          // async: true,
          defer: true,
        },
      ],
    },
  },

  runtimeConfig: {
    // Доступно только на сервере
    apiBase: process.env.API_BASE,
    jwtToken: process.env.JWT_TOKEN,
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME,
  },

  css: [
    "bootstrap/scss/bootstrap.scss",
    "@fortawesome/fontawesome-free/css/all.css",
    "bootstrap-icons/font/bootstrap-icons.css",
    "@/assets/scss/textStyles.scss",
    "swiper/css", // Используем swiper/css вместо swiper-bundle.min.css
    "@/assets/scss/styles.scss",
  ],

  vite: {
    server: {
      allowedHosts: ["anoname.xyz"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "~/assets/scss/_custom_variables.scss" as *;
            @use "~/assets/scss/_custom_theme.scss" as *;
          `,
        },
      },
    },
  },

  alias: {
    "/analytics": "/dashboard/analytics",
  },

  compatibilityDate: "2024-11-25",
});
