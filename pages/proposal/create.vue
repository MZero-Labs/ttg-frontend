<template>
  <div>
    <MModal ref="modal" @on-closed="onCloseModal">
      <MTransactionsStepper
        ref="stepper"
        title="Submitting your proposal"
        :steps="steps"
      />
    </MModal>

    <PageTitle v-if="!isPreview" class="px-6 lg:p-0 mb-3">
      Create a proposal
    </PageTitle>

    <form class="px-6 lg:p-0" @submit.prevent="onSubmit">
      <div v-if="isWritting">Writting transaction on blockchain...</div>
      <div v-else>
        <div v-show="!isPreview">
          <div class="create-steps">
            <div class="number">[1]</div>
            <span>Define the action to be executed if proposal succeeds</span>
          </div>

          <div class="mb-1">
            <label for="proposal-type">Action *</label>
            <MInputMultiSelect
              :options="proposalTypes"
              data-test="proposalTypeSelect"
              @on-change="onChangeProposalType"
            />
          </div>

          <ProposalCreateActionDescription
            v-if="selectedProposalType"
            :selected-proposal-type="selectedProposalType"
          />

          <div :class="{ disabled: selectedProposalType === undefined }">
            <div v-show="formData.proposalType">
              <component
                :is="selectedProposalType.component"
                v-if="selectedProposalType"
                v-model="formData.proposalValue"
                v-model:modelValue2="formData.proposalValue2"
                v-model:modelValue3="formData.proposalValue3"
                :model-value-errors="$validation.proposalValue?.$errors"
                :model-value2-errors="$validation.proposalValue2?.$errors"
                :model-value3-errors="$validation.proposalValue3?.$errors"
                :placeholder="selectedProposalType.placeholder"
                :current-value="currentValue"
                :selected-proposal-type="selectedProposalType"
              />
            </div>

            <div class="create-steps">
              <div class="number">[2]</div>
              <span>Name your proposal and add description</span>
            </div>

            <div class="mb-6">
              <label for="title-input">Title *</label>
              <MInput
                id="title-input"
                v-model="formData.title"
                data-test="title"
                type="text"
                placeholder="Title"
                :errors="$validation.title.$errors"
                class="font-inter"
              />
            </div>

            <div class="mb-6" data-test="description">
              <div class="flex justify-between mb-2">
                <label for="description">Description *</label>
                <div
                  class="text-sm text-grey-600 flex items-center gap-1 font-inter"
                >
                  <img src="/img/icon-markdown.svg" class="h-[14px]" />
                  Markdown supported
                </div>
              </div>

              <ProposalCreateFormMarkdown
                v-model="formData.description"
                data-test="description"
                name="description"
                :errors="$validation.description.$errors"
              />
            </div>

            <div class="mb-6">
              <label for="type-value">IPFS</label>

              <MInput
                v-model="formData.ipfsURL"
                type="text"
                placeholder="https://"
                data-test="create-proposal-input-url-ipfs"
                class="font-inter"
                :errors="$validation.ipfsURL.$errors"
              />
            </div>

            <div class="mb-6">
              <label for="type-value">Discussion URL:</label>

              <MInput
                v-model="formData.discussionURL"
                type="text"
                placeholder="https://"
                data-test="create-proposal-input-url-discussion"
                class="font-inter"
                :errors="$validation.discussionURL.$errors"
              />
            </div>
          </div>
        </div>

        <div v-if="isPreview">
          <ProposalPreview
            :title="formData.title"
            :proposal="previewProposal"
            @on-back="onBack"
          />
        </div>
      </div>

      <div class="flex justify-end font-inter">
        <div class="flex items-center gap-2 text-lg">
          Submission tax:
          <div v-if="hasToPayFee" class="flex items-center gap-2">
            {{ ttgValuesFormatted.setProposalFee }}
            <MIconWeth />
          </div>
          <div v-else class="flex items-center gap-2">
            0
            <MIconWeth />
          </div>
        </div>
      </div>

      <div v-if="hasToPayFee" class="text-grey-500 text-xs text-end font-inter">
        <p>
          Available balance:
          {{ useNumberFormatterEth(cashToken?.data?.value?.formatted || 0) }}
          WETH
        </p>
        <p>You'll receive a refund if the proposal succeeds</p>
      </div>

      <div v-if="isPreview" class="flex justify-end mt-6 gap-3">
        <MButton
          class="text-green-700 uppercase"
          data-test="create-proposal-button-back-bottom"
          version="outline-light"
          @click="onBack"
        >
          Back
        </MButton>
        <MButton
          v-if="isPreview"
          type="submit"
          :disabled="isDisconnected"
          data-test="create-proposal-button-submit"
        >
          Submit
        </MButton>
      </div>
      <div v-else class="flex justify-end mt-6">
        <MButton
          type="button"
          data-test="create-proposal-button-preview"
          :disabled="isDisconnected || !userHasEnoughBalance"
          @click="onPreview"
        >
          Preview and submit
        </MButton>
      </div>
    </form>
    <div class="text-end text-grey-500 font-inter text-xs px-6 lg:px-0 my-3">
      <p v-if="isDisconnected">
        Please,
        <MModalWeb3Connect>
          <template #default="{ connect }">
            <button
              class="font-inter underline text-nowrap cursor-pointer"
              @click="connect"
            >
              connect your wallet
            </button>
          </template>
        </MModalWeb3Connect>
        to proceed. Your proposal will not be lost.
      </p>
      <p v-else-if="!userHasEnoughBalance">
        You don't have enough balance to submit proposal.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  waitForTransactionReceipt,
  writeContract,
  readContract,
} from "@wagmi/core";
import { encodeFunctionData, encodeAbiParameters, Hash, erc20Abi } from "viem";
import { useAccount } from "use-wagmi";
import { required, minLength, maxLength, url } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { storeToRefs } from "pinia";

/* custom libs */
import {
  stringToHexWith32Bytes,
  addressToHexWith32Bytes,
} from "@/lib/api/utils";
import { watchProposalCreated } from "@/lib/watchers";
import {
  standardGovernorAbi,
  emergencyGovernorAbi,
  zeroGovernorAbi,
} from "@/lib/sdk";
import { useMBalances } from "@/lib/hooks";
import { wait } from "@/utils/misc";

/* components */
import InputListOperation from "@/components/proposal/InputListOperation.vue";
import InputListRemoveAddOperation from "@/components/proposal/InputListRemoveAddOperation.vue";
import InputProtocolConfigOperation from "@/components/proposal/InputProtocolConfigOperation.vue";
import InputProtocolGuidanceConfigOperation from "@/components/proposal/InputProtocolGuidanceConfigOperation.vue";
import InputGovernanceSetCashToken from "@/components/proposal/InputGovernanceSetCashToken.vue";
import InputGovernanceSetZeroProposalThreshold from "@/components/proposal/InputGovernanceSetZeroProposalThreshold.vue";
import InputGovernanceSetEmergencyProposalThreshold from "@/components/proposal/InputGovernanceSetEmergencyProposalThreshold.vue";
import InputGovernanceSetProposalFee from "@/components/proposal/InputGovernanceSetProposalFee.vue";
import { MProposal } from "@/lib/api/types";

/* wagmi */
const wagmiConfig = useWagmiConfig();

/* control stepper */
let steps = reactive([]);

const stepper = ref(null);
const modal = ref(null);

useHead({
  titleTemplate: "%s - Create proposal",
});

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
  title: null,
  description: "",
  ipfsURL: null,
  discussionURL: null,
});

const rules = computed(() => {
  const constRules = {
    description: { required, minLength: minLength(6) },
    title: { required, minLength: minLength(6) },
    ipfsURL: { url },
    discussionURL: { url },
  };

  const type = selectedProposalType?.value?.value;

  if (["addToList", "removeFromList"].includes(type)) {
    return {
      proposalValue: { required },
      proposalValue2: {
        required,
        minLength: minLength(42),
        maxLength: maxLength(42),
      },
      proposalValue3: {},
      ...constRules,
    };
  }

  if (["removeFromAndAddToList"].includes(type)) {
    return {
      proposalValue: { required },
      proposalValue2: {
        required,
        minLength: minLength(42),
        maxLength: maxLength(42),
      },
      proposalValue3: {
        required,
        minLength: minLength(42),
        maxLength: maxLength(42),
      },
      ...constRules,
    };
  }

  if (["setKey"].includes(type)) {
    return {
      proposalValue: { required },
      proposalValue2: { required },
      proposalValue3: {},
      ...constRules,
    };
  }

  if (["setProposalFee", "setStandardProposalFee"].includes(type)) {
    return {
      proposalValue: { required },
      proposalValue2: {},
      proposalValue3: {},
      ...constRules,
    };
  }

  if (
    [
      "setEmergencyProposalThresholdRatio",
      "setZeroProposalThresholdRatio",
    ].includes(type)
  ) {
    return {
      proposalValue: { required },
      proposalValue2: {},
      proposalValue3: {},
      ...constRules,
    };
  }

  // default (type === "reset")
  return {
    proposalValue: {},
    proposalValue2: {},
    proposalValue3: {},
    ...constRules,
  };
});

const hasToPayFee = computed(() => {
  return selectedProposalType?.value?.hasToPayFee;
});

const $validation = useVuelidate(rules, formData);

const previewDescription = ref();

const { address: userAccount, isDisconnected } = useAccount();
const { forceSwitchChain } = useCorrectChain();
const ttg = useTtgStore();
const { getValuesFormatted: ttgValuesFormatted, getValues: ttgValues } =
  storeToRefs(ttg);

const { cashToken, refetch: refetchBalances } = useMBalances(userAccount);

const userHasEnoughBalance = computed(() => {
  if (!hasToPayFee.value) return true;
  return cashToken?.data?.value?.value >= BigInt(ttgValues.value.proposalFee);
});

const proposalTypes = [
  {
    header: "protocol",
  },
  {
    value: "addToList",
    label: "Add actor",
    component: InputListOperation,
    votingType: "Standard",
    governor: ttg.contracts.standardGovernor,
    abi: standardGovernorAbi,
    hasToPayFee: true,
    id: "addToList",
  },
  {
    value: "removeFromList",
    label: "Remove actor",
    component: InputListOperation,
    votingType: "Standard",
    governor: ttg.contracts.standardGovernor,
    abi: standardGovernorAbi,
    hasToPayFee: true,
    id: "removeFromList",
  },

  {
    value: "removeFromAndAddToList",
    label: "Update actor",
    component: InputListRemoveAddOperation,
    votingType: "Standard",
    governor: ttg.contracts.standardGovernor,
    abi: standardGovernorAbi,
    hasToPayFee: true,
    id: "removeFromAndAddToList",
  },

  {
    value: "setKey",
    label: "Update protocol config",
    component: InputProtocolConfigOperation,
    votingType: "Standard",
    governor: ttg.contracts.standardGovernor,
    abi: standardGovernorAbi,
    hasToPayFee: true,
    id: "protocolSetKey",
  },

  {
    value: "setKeyGuidance",
    label: "Update protocol guidance",
    component: InputProtocolGuidanceConfigOperation,
    votingType: "Standard",
    governor: ttg.contracts.standardGovernor,
    abi: standardGovernorAbi,
    hasToPayFee: true,
    id: "protocolGuidanceSetKey",
  },

  {
    header: "governance",
  },

  {
    value: "setProposalFee",
    label: "Update proposal fee",
    component: InputGovernanceSetProposalFee,
    votingType: "Standard",
    governor: ttg.contracts.standardGovernor,
    abi: standardGovernorAbi,
    hasToPayFee: true,
  },

  {
    value: "setCashToken",
    label: "Change cash token",
    component: InputGovernanceSetCashToken,
    votingType: "Zero",
    governor: ttg.contracts.zeroGovernor,
    abi: zeroGovernorAbi,
    hasToPayFee: false,
  },

  {
    value: "setEmergencyProposalThresholdRatio",
    label: "Update power threshold",
    component: InputGovernanceSetEmergencyProposalThreshold,
    modelValue: formData.proposalValue,
    votingType: "Zero",
    governor: ttg.contracts.zeroGovernor,
    abi: zeroGovernorAbi,
    hasToPayFee: false,
  },
  {
    value: "setZeroProposalThresholdRatio",
    label: "Update zero threshold",
    component: InputGovernanceSetZeroProposalThreshold,
    votingType: "Zero",
    governor: ttg.contracts.zeroGovernor,
    abi: zeroGovernorAbi,
    hasToPayFee: false,
  },

  {
    value: "emergency",
    label: "Emergency",
    id: "menuEmergency",
    isEmergency: true,
    submenuText:
      "Emergency Proposals require a POWER (yes) threshold and are immediately voteable. They are also immediately executable upon reaching this threshold, rather than only being executable in the following epoch.",
    children: [
      {
        value: "addToList",
        label: "Add actor",
        isEmergency: true,
        component: InputListOperation,
        votingType: "Emergency",
        governor: ttg.contracts.emergencyGovernor,
        abi: emergencyGovernorAbi,
        hasToPayFee: false,
        id: "emergencyAddToList",
      },
      {
        value: "removeFromList",
        label: "Remove actor",
        isEmergency: true,
        component: InputListOperation,
        votingType: "Emergency",
        governor: ttg.contracts.emergencyGovernor,
        abi: emergencyGovernorAbi,
        hasToPayFee: false,
        id: "emergencyRemoveFromList",
      },

      {
        value: "removeFromAndAddToList",
        label: "Update actor",
        isEmergency: true,
        component: InputListRemoveAddOperation,
        votingType: "Emergency",
        governor: ttg.contracts.emergencyGovernor,
        abi: emergencyGovernorAbi,
        hasToPayFee: false,
        id: "emergencyRemoveFromAndAddToList",
      },
      {
        value: "setStandardProposalFee",
        label: "Update proposal fee",
        isEmergency: true,
        component: InputGovernanceSetProposalFee,
        votingType: "Emergency",
        governor: ttg.contracts.emergencyGovernor,
        abi: emergencyGovernorAbi,
        hasToPayFee: false,
        id: "emergencySetStandardProposalFee",
      },
      {
        value: "setKey",
        label: "Update protocol config",
        isEmergency: true,
        component: InputProtocolConfigOperation,
        votingType: "Emergency",
        governor: ttg.contracts.emergencyGovernor,
        abi: emergencyGovernorAbi,
        hasToPayFee: false,
        id: "emergencySetKey",
      },

      {
        value: "setKeyGuidance",
        label: "Update protocol guidance",
        component: InputProtocolGuidanceConfigOperation,
        votingType: "Emergency",
        governor: ttg.contracts.emergencyGovernor,
        abi: emergencyGovernorAbi,
        isEmergency: true,
        hasToPayFee: false,
        id: "emergencyGuidanceSetKey",
      },
    ],
  },

  {
    value: "reset",
    label: "Reset",
    isReset: true,
    submenuText:
      "The Reset proposals allows a yes threshold of ZERO holders to change the current governor of the system to a new version with a new POWER token.",
    id: "menuReset",
    children: [
      {
        value: "resetToPowerHolders",
        label: "Reset to Power holders",
        isReset: true,
        component: undefined,
        votingType: "Zero",
        governor: ttg.contracts.zeroGovernor,
        abi: zeroGovernorAbi,
        hasToPayFee: false,
        id: "resetToPowerHolders",
      },

      {
        value: "resetToZeroHolders",
        label: "Reset to Zero holders",
        isReset: true,
        component: undefined,
        votingType: "Zero",
        governor: ttg.contracts.zeroGovernor,
        abi: zeroGovernorAbi,
        hasToPayFee: false,
        id: "resetToZeroHolders",
      },
    ],
  },
];

const currentValue = computed(() => {
  if (
    selectedProposalType?.value?.value === "setEmergencyProposalThresholdRatio"
  ) {
    return `${basisPointsToPercentage(
      ttg.getValues.emergencyProposalThresholdRatio!,
    )}%`;
  }

  if (selectedProposalType?.value?.value === "setZeroProposalThresholdRatio") {
    return `${basisPointsToPercentage(
      ttg.getValues.zeroProposalThresholdRatio!,
    )}%`;
  }

  const formatFee = (value: string) => useFormatCash(value);

  if (
    ["setProposalFee", "setStandardProposalFee"].includes(
      selectedProposalType?.value?.value,
    )
  ) {
    return formatFee(ttg.getValues.proposalFee!);
  }
});

const previewProposal = computed(() => {
  return {
    proposalLabel: selectedProposalType?.value?.label,
    proposer: userAccount.value,
    description: formData.description,
    proposalType: formData.proposalType,
    isEmergency: selectedProposalType?.value?.isEmergency as boolean,
    votingType: selectedProposalType?.value?.votingType,
    proposalParams: [
      formData.proposalValue,
      formData.proposalValue2,
      formData.proposalValue3,
    ].filter((e) => e),
  } as unknown as MProposal;
});

function onChangeProposalType(option) {
  console.log("onChangeProposalType", option);
  formData.proposalType = option.value;
  selectedProposalType.value = option;
  $validation.value.$reset();
  formData.proposalValue = null;
  formData.proposalValue2 = null;
  formData.proposalValue3 = null;
}

function buildDescriptionPayload() {
  const addHyperlink = (text, url) => (url ? `[${text}](${url})` : "");

  const descriptionPayload = [
    `# ${formData.title}`,
    formData.description,
    "\n\n---",
    addHyperlink("Discussion", formData.discussionURL),
    addHyperlink("IPFS", formData.ipfsURL),
  ].join("\n\n");

  return descriptionPayload;
}

async function onPreview() {
  await $validation.value.$validate();
  if (!$validation.value.$error) {
    previewDescription.value = buildDescriptionPayload();
    isPreview.value = true;
  }
}

async function writeAllowance() {
  const account = userAccount.value;
  // It needs approval to pay for fees
  const allowance = await readContract(wagmiConfig, {
    abi: erc20Abi,
    address: ttg.contracts.cashToken as Hash,
    functionName: "allowance",
    args: [account as Hash, selectedProposalType.value.governor as Hash], // address owner, address spender
    account,
  });

  const fee = BigInt(ttg.getValues.proposalFee!);
  console.log({ allowance, fee });
  if (allowance < fee && hasToPayFee.value) {
    const hash = await writeContract(wagmiConfig, {
      abi: erc20Abi,
      address: ttg.contracts.cashToken as Hash,
      functionName: "approve",
      args: [selectedProposalType.value.governor as Hash, fee], // address spender, uint256 amount
      account,
    });

    stepper.value.changeCurrentStep("pending");

    const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
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
  console.log({ selectedProposalType });
  const targets = [selectedProposalType.value.governor as Hash];

  const description = formData.description;
  const values = [0n]; // do not change

  const hash = await writeContract(wagmiConfig, {
    abi: selectedProposalType.value.abi,
    address: selectedProposalType.value.governor as Hash,
    functionName: "propose",
    args: [targets, values, [calldatas], description],
    account,
  });

  stepper.value.changeCurrentStep("pending");

  const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
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
  await forceSwitchChain();

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
        message: "Searching for the event of the transaction...",
      },
    ]);

    modal.value.open();

    await writeAllowance().catch(catchErrorStep);

    stepper.value.nextStep();

    const formDataWithLinks = {
      ...formData,
      description: buildDescriptionPayload(),
    };

    // start listening for proposal event
    const { unwatchAll } = watchProposalCreated(
      async (newProposals: Array<MProposal>) => {
        console.log({ newProposals });

        await wait(1000);

        unwatchAll();

        return navigateTo(`/proposal/${newProposals[0].proposalId}`);
      },
    );

    const calldatas = buildCalldatas(formDataWithLinks);
    await writeProposal(calldatas, formDataWithLinks).catch(catchErrorStep);

    stepper.value.nextStep();
    stepper.value.changeCurrentStep("complete");
    refetchBalances();
  } catch (error) {
    console.error({ error });
    catchErrorStep(error);
  }
}

function buildCalldatas(formData) {
  const {
    proposalType: type,
    proposalValue: input1,
    proposalValue2: input2,
    proposalValue3: input3,
  } = formData;

  if (["addToList", "removeFromList"].includes(type)) {
    const encondeInputsListOperation = ({
      input1: list,
      input2: address,
    }: {
      input1: string;
      input2: string;
    }) => {
      return [stringToHexWith32Bytes(list), address];
    };

    return buildCalldatasTtg(
      type,
      encondeInputsListOperation({ input1, input2 }),
    );
  }

  if (["removeFromAndAddToList"].includes(type)) {
    const encondeInputsListAddRemoveOperation = ({
      input1: list,
      input2: remove,
      input3: add,
    }: {
      input1: string;
      input2: string;
      input3: string;
    }) => {
      return [stringToHexWith32Bytes(list), remove, add];
    };

    return buildCalldatasTtg(
      type,
      encondeInputsListAddRemoveOperation({ input1, input2, input3 }),
    );
  }

  if (["setKey"].includes(type)) {
    const getValueEncoded = (inp: any) => {
      if (["minter_rate_model", "earner_rate_model"].includes(key)) {
        return addressToHexWith32Bytes(inp);
      }

      if (
        [
          "penalty_rate",
          "mint_ratio",
          "base_minter_rate",
          "max_earner_rate",
        ].includes(key)
      ) {
        return encodeAbiParameters(
          [{ type: "uint256" }],
          [BigInt(percentageToBasispoints(inp))],
        );
      }

      return encodeAbiParameters([{ type: "uint256" }], [BigInt(inp)]);
    };

    const key = input1;
    const value = getValueEncoded(input2);

    return buildCalldatasTtg(type, [stringToHexWith32Bytes(key), value]);
  }

  if (["setKeyGuidance"].includes(type)) {
    const key = input1;
    const value = "0x" + input2;

    return buildCalldatasTtg("setKey", [stringToHexWith32Bytes(key), value]);
  }

  if (["resetToPowerHolders", "resetToZeroHolders"].includes(type)) {
    // TODO? add checkers if inputs are  addresses that instances of smartcontracts ITTG
    return buildCalldatasTtg(type, undefined);
  }

  if (["setProposalFee", "setStandardProposalFee"].includes(type)) {
    const valueEncoded = encodeAbiParameters(
      [{ type: "uint256" }],
      [useParseCash(input1)],
    );
    return buildCalldatasTtg(type, [valueEncoded]);
  }

  if (["setCashToken"].includes(type)) {
    const newFee = encodeAbiParameters([{ type: "uint256" }], [input2]);
    return buildCalldatasTtg(type, [input1, newFee]);
  }

  if (
    [
      "setEmergencyProposalThresholdRatio",
      "setZeroProposalThresholdRatio",
    ].includes(type)
  ) {
    const valueEncoded = encodeAbiParameters(
      [{ type: "uint256" }],
      [BigInt(percentageToBasispoints(input1))],
    );
    return buildCalldatasTtg(type, [valueEncoded]);
  }
}

function buildCalldatasTtg(functionName: any, args: any) {
  return encodeFunctionData({
    abi: selectedProposalType.value.abi,
    functionName,
    args,
  });
}

function onBack() {
  isPreview.value = false;
  previewDescription.value = null;
}
</script>

<style>
label {
  @apply text-grey-500 block mb-2 font-medium text-xs font-inter;
}
</style>

<style scoped>
h1 {
  @apply text-3xl font-light mb-12;
}

hr {
  border-top: 1px dashed #979797;
}

#info-text * {
  @apply my-4;
}

.error {
  @apply border border-red-500;
}

.create-steps {
  @apply flex items-center my-6 font-mono text-xxs lg:text-xs uppercase;
}

.create-steps .number {
  @apply text-accent-mint text-xxs lg:text-xs tracking-[8px];
}

.disabled {
  /* selectedProposalType */
  pointer-events: none;
  opacity: 0.4;
}
</style>
