import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      walletConnectProjectId: process.env.WALLET_CONNECT_PROJECT_ID,
      network: {
        defaultRpc: process.env.NETWORK_DEFAULT_RPC,
        rpcs: process.env.NETWORK_RPC_LIST,
        chainId: process.env.NETWORK_CHAIN_ID,
      },
      contracts: {
        deployedBlock: process.env.CONTRACT_DEPLOYED_BLOCK,
        listFactory: process.env.CONTRACT_ADDRESS_LIST_FACTORY,
        multicall: process.env.CONTRACT_ADDRESS_MULTICALL,
        spog: process.env.CONTRACT_ADDRESS_SPOG,
      },
    },
  },
  ssr: false,
  buildModules: ["@nuxtjs/pwa"],
  components: [
    "~/components/design-system",
    "~/components/layout",
    "~/components",
  ],
  // https://tailwindcss.nuxtjs.org/getting-started/setup
  modules: ["@nuxtjs/tailwindcss", "@vueuse/nuxt", "@pinia/nuxt"],
  tailwindcss: {
    config: {
      theme: {
        letterSpacing: {
          widest: "1.0em",
        },
        extend: {
          colors: {
            primary: "#00CC9B",
            "primary-dark": "#009974",
            "primary-darker": "#00664e",
            "secondary-dark": "#20221F",
            "secondary-light": "#FFFFFF",
            "body-dark": "#0B0B0B",
            red: "#FF3333",
            "grey-primary": "#868886",
            "grey-secondary": "#353835",
          },
        },
      },
    },
  },
  imports: {
    dirs: ["./stores"],
  },

  pinia: {
    autoImports: ["defineStore"],
  },
  vite: {
    plugins: [
      nodePolyfills({
        // To exclude specific polyfills, add them to this list.
        exclude: [
          "fs", // Excludes the polyfill for `fs` and `node:fs`.
        ],
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      }),
    ],
  },
});
