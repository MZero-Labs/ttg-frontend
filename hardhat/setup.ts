// @ts-nocheck
import http from "node:http";
import hre from "hardhat";
import {
  TASK_NODE,
  TASK_NODE_GET_PROVIDER,
  TASK_NODE_SERVER_READY,
} from "hardhat/builtin-tasks/task-names";
import { EthereumProvider, HardhatNetworkAccountsConfig } from "hardhat/types";

import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { toExternallyOwnedAccounts } from "./accounts";

export interface Network {
  /** The network's JSON-RPC address. */
  url: string;
  /** Accounts configured via hardhat's {@link https://hardhat.org/hardhat-network/reference/#accounts}. */
  accounts: ExternallyOwnedAccount[];
}

const PORT = 8545;

// see file hardhat.config.js#L12
const _BLOCK_TIME = 12;

// see file lib/api/modules/epoch/epoch.ts#L17
const _STARTING_TIMESTAMP = 1_704_809_636;
const _EPOCH_PERIOD_SECONDS = 400;

type ChainServer = {
  address: string;
  port: number;
  close: () => Promise<void>;
  provider: EthereumProvider;
  mine: (blocks: number) => Promise<void>;
};
const chainServers: ChainServer[] = [];

/**
 * Initializes a chain server.
 * The provider *must* be configured for the chainId before calling runChainServer.
 */
function runChainServer(chainId: number): Promise<ChainServer> {
  if (chainServers[chainId]) return Promise.resolve(chainServers[chainId]);

  const run = hre.run(TASK_NODE, { port: PORT });
  return new Promise((resolve) =>
    hre.tasks[TASK_NODE_SERVER_READY].setAction(
      ({ address, port, provider, server }) => {
        const close = async () => {
          await Promise.all([server.close(), run]);
        };
        chainServers[chainId] = { address, port, close, provider };
        resolve(chainServers[chainId]);
      }
    )
  );
}

async function moveToVotingEpoch() {
  const getEpochFromTimestamp = (timestamp: number) =>
    Math.floor((timestamp - _STARTING_TIMESTAMP) / _EPOCH_PERIOD_SECONDS) + 1;

  const currentTimestamp = await time.latest();
  const currentEpoch = getEpochFromTimestamp(currentTimestamp);
  console.log({ currentTimestamp, currentEpoch });
  if (currentEpoch % 2 === 0) {
    console.log("epoch is transfer");
    await time.setNextBlockTimestamp(currentTimestamp + 400); // move to voting epoch
  }
}

/** Sets up the hardhat environment for use with cypress. */
export default async function setup(): Promise<
  Network & {
    /** Resets the hardhat environment. Call before a spec to reset the environment. */
    reset: () => Promise<void>;
    /** Tears down the hardhat environment. Call after a run to clean up the environment. */
    close: () => Promise<void>;
    mine: (blocks: number) => Promise<void>;
  }
> {
  const hardhatConfig = hre.config.networks.hardhat;
  const defaultChainId = hardhatConfig.chainId;

  function reset() {
    return hre.network.provider.send("hardhat_reset", [
      {
        hardhat: { mining: hardhatConfig.mining },
      },
    ]);
  }

  hre.tasks[TASK_NODE_GET_PROVIDER].setAction(() => {
    // Use the network provider, which was redefined as part of reset(chainId).
    const provider = hre.network.provider;

    const request = provider.request;
    provider.request = (...args) => {
      return request.call(provider, ...args);
    };
    return provider;
  });

  // Initializes the servers.
  const forwardingServer = http.createServer((req, res) => {
    // Forward responses to the active server.
    req.pipe(
      http.request(
        {
          ...req,
          hostname: server.address,
          port: server.port,
          joinDuplicateHeaders: true,
        },
        (response) => {
          for (const header in response.headers) {
            res.setHeader(header, response.headers[header]!);
          }
          response.pipe(res);
        }
      )
    );
  });
  const listen = new Promise<void>((resolve) =>
    forwardingServer.listen(PORT, resolve)
  );
  const run = runChainServer(defaultChainId);

  // Deriving ExternallyOwnedAccounts is computationally intensive, so we do it while waiting for the server to come up.
  const accounts = toExternallyOwnedAccounts(
    hre.network.config.accounts as HardhatNetworkAccountsConfig
  );
  if (accounts.length > 4) {
    process.stderr.write(
      `${accounts.length} hardhat accounts specified - consider specifying fewer.\n`
    );
    process.stderr.write(
      "Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n"
    );
  }
  const [server] = await Promise.all([run, listen]);

  await moveToVotingEpoch();

  return {
    url: "http://" + server.address + ":" + PORT,
    accounts,
    reset,
    close: async () => {
      await Promise.all([
        new Promise((resolve) => forwardingServer.close(resolve)),
        ...chainServers.map((server) => server.close()),
      ]);
    },
    mine: async (blocks) => {
      console.log("mine", { blocks, increase: blocks * _BLOCK_TIME });
      const currentTimestamp = await time.latest();
      const newTimestamp = currentTimestamp + blocks * _BLOCK_TIME;
      console.log({ currentTimestamp, newTimestamp });
      await time.setNextBlockTimestamp(newTimestamp);
      return hre.network.provider.send("hardhat_mine", [
        "0x" + blocks.toString(16),
      ]);
    },
  };
}
