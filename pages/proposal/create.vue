<template>
  <div>
    <MModal ref="modal" @on-closed="onCloseModal">
      <MTransactionsStepper
        ref="stepper"
        title="Submitting your proposal"
        :steps="steps"
      />
    </MModal>
    <form @submit.prevent="onSubmit">
      <div v-if="isWritting">Writting transaction on blockchain...</div>
      <div v-else>
        <div v-if="!isPreview">
          <h1>Create a proposal</h1>

          <div class="mb-6">
            <label for="proposal-type">Proposal type</label>
            <MInputMultiSelect
              :options="proposalTypes"
              @on-change="onChangeProposalType"
            />
          </div>

          <div v-show="formData.proposalType" class="mb-6">
            <label for="type-value">{{ selectedProposalType?.label }}</label>

            <component
              :is="selectedProposalType.component"
              v-if="selectedProposalType"
              v-model="formData.proposalValue"
              v-model:modelValue2="formData.proposalValue2"
              v-model:modelValue3="formData.proposalValue3"
              :placeholder="selectedProposalType.placeholder"
            />
          </div>

          <div class="mb-6">
            <div class="flex justify-between mb-2">
              <label for="description"> Description </label>
              <div class="text-sm text-gray-400 flex">
                <img src="/img/icon-markdown.svg" class="h-6 mx-2" />
                Markdown supported
              </div>
            </div>

            <textarea v-model="formData.description" name="description" />
          </div>
        </div>

        <div v-else>
          <ProposalPreview
            :description="formData.description"
            @on-back="onBack"
          />
        </div>
      </div>

      <div v-if="isPreview" class="flex justify-end mt-12">
        <button class="text-primary-dark uppercase mx-4" @click="onBack">
          &#60; back
        </button>
        <MButton v-if="isPreview" type="submit">Submit proposal</MButton>
      </div>

      <div v-else class="flex justify-end mt-12">
        <MButton type="button" @click="onPreview">Preview proposal</MButton>
      </div>

      <hr class="my-12" />

      <div id="info-text" class="mb-6">
        <h2 class="text-white">
          What is the standard for Governor proposal descriptions?
        </h2>
        <div class="text-sm text-grey-primary">
          <p>
            Ever since Governor proposals have had an on-chain, human-readable
            description field. Governor front ends like Tally, Compound and
            others follow this de-facto standard:
          </p>
          <ul>
            <li>• Proposal descriptions should be markdown text</li>
            <li>
              • The first line of the description, regardless of format, is the
              title
            </li>
            <li>
              • Everything after the first newline is the body of the proposal.
              Frontends should renderer it as markdown
            </li>
          </ul>
          <p>
            If a proposal description does not follow this standard, Tally's
            frontend will make a best-effort to render it, but it might look
            weird.
          </p>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import get from "lodash/get";
import random from "lodash/random";
import { ref } from "vue";
import { waitForTransaction } from "@wagmi/core";
import {
  encodeFunctionData,
  encodeAbiParameters,
  keccak256,
  toHex,
  toBytes,
  stringToBytes,
} from "viem";
import { useAccount } from "use-wagmi";
import {
  ispogGovernorABI,
  writeIspogGovernor,
  writeIerc20,
  readIerc20,
  ispogABI,
} from "@/lib/sdk";
import ProposalInputSingleNumber from "@/components/proposal/InputSingleNumber";
import ProposalInputRangeNumber from "@/components/proposal/InputRangeNumber";
import ProposalInputListOperation from "@/components/proposal/InputListOperation";
import ProposalInputSingleText from "@/components/proposal/InputSingleText";
import ProposalInputUpdateConfig from "@/components/proposal/InputUpdateConfig";

/* control stepper */
let steps = reactive([]);

const stepper = ref(null);
const modal = ref(null);

function onCloseModal() {
  stepper.value.reset();
  throw new Error("rejected by user");
}

/* control Form */

const isPreview = ref(false);
const selectedProposalType = ref();
const isWritting = ref(false);

const formData = reactive({
  proposalType: null,
  proposalValue: null,
  proposalValue2: null,
  proposalValue3: null,
  description: null,
});

const { address: userAccount } = useAccount();

const config = useRuntimeConfig();
const spog = useSpogStore();

const proposalTypes = [
  {
    header: "protocol",
  },
  {
    value: "addToList",
    label: "Add to a list",
    component: ProposalInputListOperation,
  },
  {
    value: "removeFromList",
    label: "Remove from a list",
    component: ProposalInputListOperation,
  },

  {
    value: "updateConfig",
    label: "Update Config",
    component: ProposalInputUpdateConfig,
  },

  {
    value: "reset",
    label: "Reset",
    placeholder: "Governance Address",
    component: ProposalInputSingleText,
  },

  {
    header: "governance",
  },

  {
    value: "Quorums",
    label: "Quorums",
    children: [
      {
        value: "updateVoteQuorumNumerator",
        label: "Vote Quorum",
        component: ProposalInputSingleNumber,
        modelValue: formData.proposalValue,
      },
      {
        value: "updateValueQuorumNumerator",
        label: "Value Quorum",
        component: ProposalInputSingleNumber,
      },
    ],
  },
  {
    value: "tax",
    label: "Tax",
    children: [
      {
        value: "changeTax",
        label: "Change Tax",
        component: ProposalInputSingleNumber,
      },
      {
        value: "changeTaxRange",
        label: "Change Tax range",
        component: ProposalInputRangeNumber,
      },
    ],
  },

  {
    value: "emergency",
    label: "Emergency",
    isEmergency: true,
    children: [
      {
        value: "addToList",
        label: "Emergency Add to a list",
        isEmergency: true,
        component: ProposalInputListOperation,
      },
      {
        value: "removeFromList",
        label: "Emergency Remove from a list",
        isEmergency: true,
        component: ProposalInputListOperation,
      },
      {
        value: "updateConfig",
        label: "Emergency Update Config",
        isEmergency: true,
        component: ProposalInputUpdateConfig,
      },
    ],
  },
];

const isEmergency = computed(
  () => selectedProposalType.value.isEmergency || false
);

function onChangeProposalType(option) {
  console.log("onChangeProposalType", { option });
  formData.proposalType = option.value;
  selectedProposalType.value = option;
}

function onPreview() {
  isPreview.value = true;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function writeAllowance() {
  const account = userAccount.value;
  console.log({ account });
  // It needs approval to pay for taxes
  const allowance = await readIerc20({
    address: spog.contracts.cash,
    functionName: "allowance",
    args: [account, config.public.contracts.spog], // address owner, address spender
    account,
  });

  // TODO: allowance > tax  : check againts tax for create proposal
  const tax = 1n;
  if (allowance <= tax) {
    const { hash } = await writeIerc20({
      address: spog.contracts.cash,
      functionName: "approve",
      args: [config.public.contracts.spog, tax * BigInt(1e18)], // address spender, uint256 amount
      account,
    });

    stepper.value.changeCurrentStep("pending");

    const txReceipt = await waitForTransaction({
      confirmations: 1,
      hash,
    });
    // Fail tx
    if (txReceipt.status !== "success") {
      throw new Error("Transaction was not successful");
    }

    return txReceipt;
  }
}

async function writeProposal(calldatas, formData) {
  const account = userAccount.value;
  const targets = [
    "updateValueQuorumNumerator",
    "updateVoteQuorumNumerator",
  ].includes(formData.proposalType)
    ? [spog.contracts.governor] // dual governor contract as target for dual governance proposals
    : [config.public.contracts.spog];

  const description = formData.description;
  const values = [0]; // do not change

  const { hash } = await writeIspogGovernor({
    address: spog.contracts.governor,
    functionName: "propose",
    args: [targets, values, [calldatas], description],
    account,
    overrides: {
      gasLimit: 2100000n,
    },
  });

  stepper.value.changeCurrentStep("pending");

  const txReceipt = await waitForTransaction({
    confirmations: 1,
    hash,
  });
  // Fail tx
  if (txReceipt.status !== "success") {
    throw new Error("Transaction was rejected");
  }

  return txReceipt;
}

async function onSubmit() {
  const catchErrorStep = (error) => {
    console.error({ error });
    stepper.value.changeCurrentStep("error");
    throw error;
  };

  try {
    steps = reactive([
      {
        title: "Allowance",
        status: "current",
      },
      {
        title: "Create Proposal",
        status: "incomplete",
      },
      {
        title: "Confirmation",
        status: "incomplete",
      },
    ]);

    modal.value.open();

    await writeAllowance().catch(catchErrorStep);

    stepper.value.nextStep();

    const calldatas = buildCalldatas(formData);
    await writeProposal(calldatas, formData).catch(catchErrorStep);

    stepper.value.nextStep();
    stepper.value.changeCurrentStep("complete");

    await wait(1000);

    return navigateTo("/proposals/active");
  } catch (error) {
    console.error({ error });
    catchErrorStep(error);
  }
}

function stringToHexWith32Bytes(data) {
  return toHex(stringToBytes(data, { size: 32 }));
}

function buildCalldatasEmergency({ input1, input2, type }) {
  const emergencyTypesMap = {
    removeFromList: 0,
    addToList: 1,
    updateConfig: 2,
  };

  const emergencyType = emergencyTypesMap[type];
  console.log({ type, emergencyType });
  const valueEncoded = encodeAbiParameters(
    [{ type: "uint8" }],
    [BigInt(emergencyType)]
  );

  const encodeUpdateConfig = ({ input1: valueName, input2: value }) => {
    return encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes32" }],
      [stringToHexWith32Bytes(valueName), stringToHexWith32Bytes(value)]
    );
  };

  const encondeListOperation = ({ input1: list, input2: address }) => {
    return encodeAbiParameters(
      [
        { name: "list", type: "bytes32" },
        { name: "account", type: "address" },
      ],
      [stringToHexWith32Bytes(list), address]
    );
  };

  const valueEncoded2 =
    emergencyType === emergencyTypesMap.updateConfig
      ? encodeUpdateConfig({ input1, input2 })
      : encondeListOperation({ input1, input2 });

  return buildCalldatasSpog("emergency", [valueEncoded, valueEncoded2]);
}

function buildCalldatas(formData) {
  const {
    proposalType: type,
    proposalValue: input1,
    proposalValue2: input2,
    proposalValue3: input3,
  } = formData;

  if (["addToList", "removeFromList"].includes(type)) {
    if (isEmergency.value) {
      return buildCalldatasEmergency({
        type,
        input1,
        input2,
        input3,
      });
    }

    const encondeInputsListOperation = ({ input1: list, input2: address }) => {
      return [stringToHexWith32Bytes(list), address];
    };

    return buildCalldatasSpog(
      type,
      encondeInputsListOperation({ input1, input2 })
    );
  }

  if (["updateConfig"].includes(type)) {
    if (isEmergency.value) {
      return buildCalldatasEmergency({
        type,
        input1,
        input2,
      });
    }

    const encondeInputsUpdateConfig = ({
      input1: valueName,
      input2: value,
    }) => {
      return [stringToHexWith32Bytes(valueName), stringToHexWith32Bytes(value)];
    };

    return buildCalldatasSpog(
      type,
      encondeInputsUpdateConfig({ input1, input2 })
    );
  }

  if (["reset"].includes(type)) {
    // TODO? add checkers if inputs are  addresses that instances of smartcontracts ISPOG
    return buildCalldatasSpog(type, [input1, spog.contracts.voteVault]);
  }

  if (["changeTax"].includes(type)) {
    const valueEncoded = encodeAbiParameters(
      [{ type: "uint256" }],
      [BigInt(input1 * 1e18)] // tax is using 18 decimals precision
    );
    return buildCalldatasSpog(type, [valueEncoded]);
  }

  if (["changeTaxRange"].includes(type)) {
    // tax is using 18 decimals precision
    const encodeBigInt = (value) =>
      encodeAbiParameters([{ type: "uint256" }], [BigInt(value * 1e18)]);

    const encondeInputsChangeTaxRange = ({
      input1: lowerBound,
      input2: upperBound,
    }) => [encodeBigInt(lowerBound), encodeBigInt(upperBound)];

    return buildCalldatasSpog(
      type,
      encondeInputsChangeTaxRange({ input1, input2 })
    );
  }

  if (
    ["updateValueQuorumNumerator", "updateVoteQuorumNumerator"].includes(type)
  ) {
    const valueEncoded = encodeAbiParameters(
      [{ type: "uint256" }],
      [BigInt(input1)] // tax is using 18 decimals precision
    );
    return buildCalldatasGovernor(type, [valueEncoded]);
  }
}

function buildCalldatasSpog(functionName, args) {
  return encodeFunctionData({ abi: ispogABI, functionName, args });
}

function buildCalldatasGovernor(functionName, args) {
  return encodeFunctionData({ abi: ispogGovernorABI, functionName, args });
}

function onBack() {
  isPreview.value = false;
}
</script>

<style scoped>
h1 {
  @apply text-3xl font-light mb-12;
}

label {
  @apply text-grey-primary block mb-2 text-sm font-medium;
}

textarea {
  @apply h-80;
}

hr {
  border-top: 1px dashed #979797;
}

#info-text * {
  @apply my-4;
}
</style>