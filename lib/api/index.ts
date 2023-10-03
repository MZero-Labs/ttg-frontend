import { createPublicClient, Hash, http } from "viem";
import { IApiConfig } from "./types";
import { ApiContext } from "./api-context";
import { Registrar } from "./modules/registrar";
import { Governor } from "./modules/governor";
import { MVotingTokens } from "./modules/governor/modules/voting/voting.types";

export const MProposalEmergencyVotingTokens = {
  addToList: [MVotingTokens.Power],
  removeFromList: [MVotingTokens.Power],
  updateConfig: [MVotingTokens.Power],
};

export const MProposalVotingTokens = {
  addToList: [MVotingTokens.Power],
  removeFromList: [MVotingTokens.Power],
  updateConfig: [MVotingTokens.Power],
  reset: [MVotingTokens.Zero],
  updateVoteQuorumNumerator: [MVotingTokens.Power, MVotingTokens.Zero],
  updateValueQuorumNumerator: [MVotingTokens.Power, MVotingTokens.Zero],
  changeTax: [MVotingTokens.Power],
  changeTaxRange: [MVotingTokens.Power, MVotingTokens.Zero],
  emergency: { ...MProposalEmergencyVotingTokens },
};

export class Api {
  private context: ApiContext;
  registrar: Registrar;
  governor?: Governor;

  constructor(rpcUrl: string, config: IApiConfig) {
    const client = createPublicClient({ transport: http(rpcUrl) });

    this.context = new ApiContext(client, config);

    this.registrar = new Registrar(this.context);
  }

  setRpc(rpcUrl: string) {
    this.context.client = createPublicClient({ transport: http(rpcUrl) });
  }

  addConfig(config: Partial<IApiConfig>): void {
    this.context.config = { ...this.context.config, ...config };
  }

  setGovernor(governor: Hash) {
    this.governor = new Governor(governor, this.context);
  }
}
