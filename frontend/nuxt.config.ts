// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],
  app: {
    pageTransition: {
      name: 'bounce',
      mode: 'out-in' // default
    }
  },
  css: [
    '@/node_modules/bootstrap/scss/bootstrap.scss',
    `@/node_modules/bootstrap-icons/font/bootstrap-icons.min.css`
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_variables.scss" as *;'
        }
      }
    }
  }
})