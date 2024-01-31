# M^ZERO Governance dApp

This app is based on Nuxt v3, Vue, and Wagmi

## 1. Contracts

The Dapp is based on the TTG contracts in order to run the local testnet. Although it does not keep track of versioniong of TTG yet. Meaning, the FE code base has to be updated to latest changes of TTG otherwise it might break.

This will download the TTG contracts and all of their submodules recursively

```bash
git submodule update --init --recursive
```

If you need to update the module with the latest commit from remote TTG use this instead:

```bash
git submodule update --init --recursive --remote
```

Note: Run `git submodule status` on root / of this repo to find the commit hash of the code based placed in contracts/ folder.

### 1.2 Update SDK from TTG smart contracts (only when contracts change) - (optional)

1. Do steps on (1.2) item
2. then run `yarn wagmi generate`
3. Finally, update the lib/sdk.ts file replace the import `"wagmi/actions";` to `"@wagmi/core"`

Depending on contract changes this file must be also updated with correct import dependencies of contracts:
`/wagmi.config.ts`

## 2. Setup

### 2.1 Setup manully

Make sure to install the dependencies:

```bash
yarn install
```

#### 2.1.2 Local development with hardhat

In one terminal:

```bash
yarn hardhat
```

This starts a test blockchain on port 8545.

To test with the [rpc-proxy](https://github.com/MZero-Labs/rpc-proxy) on port 3005, clone it and run it in another terminal. It will connect to hardhat.

To test without the rpc-proxy, verify your .env connects to hardhat port 8545 instead of 3005 for RPC

See file `/hardhat.config.js` for configs.

#### 2.1.3 Env vars

This app uses an environment variables locally (not in docker-compose). For local development: See package.json.

```
NETWORK=sepolia | mainnet | local | hardhat | undefined
```

#### 2.1.4 RUN

In another terminal, run:

```bash
yarn dev
```

This starts the development server on `http://localhost:3000`

### 2.2 Running with docker-compose

The easiest way to run everything for development is with docker-compose. Make sure you have SSH access to the `rpc-proxy` repo as well.

```bash
ssh-add
docker-compose up
```

To force a rebuild, use

```bash
docker-compose up --build
```

This will start:

- a test blockchain on port 8545
- an rpc-proxy on port 3005
- the app on port 3000 with live reloading when files change

## Testing with Metamask

You can test everything locally with 5 pre-funded accounts.

In metamask, import a wallet using the seed phrase

```
1. test
2. test
3. test
4. test
5. test
6. test
7. test
8. test
9. test
10. test
11. test
12. junk
```

Afterward, in metamask, each time you create a new account, for up to 5 accounts, they will all have ETH, CASH, VOTE, VALUE and can participate in governance. You can switch between accounts and vote on proposals to achieve a threshold.

### Note

Each time hardhat is restarted, metamask will need to be reset

Settings > Advanced > Clear activity

This resets the nonce and state for the wallet

## E2E Test

We use cypress that on every .cy.ts file deploys the TTG contract found on `hardhat/deploy-spog.ts`

To Run specific test or debug:

In one terminal tab:

```bash
yarn dev
```

In a second terminal tab:

```bash
yarn cy:open
```

To Run all tests:

```bash
yarn test
```

## Production

Build the application for production:

```bash
yarn generate
```

Locally preview production build:

```bash
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


## Desktop App
The app is wrapped using tauri.app

### 1. install rust
https://tauri.app/v1/guides/getting-started/prerequisites/#managing-the-rust-installation

### 2. `yarn install`

### 3. `yarn tauri dev` - for yarn dev

### 4. `yarn tauri build` - for yarn build