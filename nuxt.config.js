export default defineNuxtConfig({
  publicRuntimeConfig: {
    WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    INFURA_API_KEY: process.env.INFURA_API_KEY,
  },
  ssr: false,
  buildModules: ["@nuxtjs/pwa"],
  components: [
    "~/components/design-system",
    "~/components/layout",
    "~/components",
  ],
  // https://tailwindcss.nuxtjs.org/getting-started/setup
  modules: ["@nuxtjs/tailwindcss"],
  tailwindcss: {
    config: {
      theme: {
        extend: {
          colors: {
            primary: "#00CC9B",
            "primary-dark": "#009974",
            "primary-darker": "#F9F9F9",
            "secondary-light": "#FFFFFF",
            "secondary-dark": "#20221F",
            "body-dark": "#0B0B0B",
            red: "#FF3333",
            "primary-grey": "#868886",
          },
        },
      },
    },
  },
});
