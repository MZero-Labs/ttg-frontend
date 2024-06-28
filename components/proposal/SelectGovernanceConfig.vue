<template>
  <div>
    <label>Configuration parameter *</label>
    <div v-if="customConfig" class="flex">
      <button
        class="input px-4 inline-flex items-center min-w-fit border border-e-0 border-gray-700 bg-gray-200 text-sm text-gray-500"
        data-test="create-proposal-button-close-other-config"
        @click="customConfig = false"
      >
        X
      </button>

      <input
        v-model="list"
        :class="{ input: true, error: hasErrors }"
        data-test="proposalValue"
        placeholder="Custom parameter name"
        type="text"
      />
    </div>

    <div v-else>
      <MInputMultiSelect
        :options="configParams"
        label="Select configuration parameter"
        data-test="governanceConfigSelect"
        @on-change="handleChangeList"
      />
    </div>

    <div v-if="props.errors?.length > 0" class="text-red-500 text-xs my-2 h-4">
      <p v-for="error of props.errors" :key="error.$uid">
        {{ error.$message }}
      </p>
    </div>

    <div
      v-show="parameter?.description || parameter?.shortDescription"
      class="bg-grey-800 bg-opacity-85 flex flex-col gap-3 p-4 mt-2"
    >
      <span class="uppercase text-xxs">Parameter description</span>
      <p class="font-inter">
        {{ parameter?.description || parameter?.shortDescription }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ErrorObject } from "@vuelidate/core";

export interface InputProps {
  modelValue: string;
  errors?: ErrorObject[];
}

const props = defineProps<InputProps>();
const emit = defineEmits(["update:modelValue", "handleChangeList"]);

const list = useVModelWrapper<InputProps>(props, emit, "modelValue");
const parameter = ref();

const hasErrors = computed(() => props.errors?.length);

const customConfig = ref(false);

const configParams = [
  {
    value: "setProposalFee",
    label: "Proposal Fee",
    shortDescription: "Update the fee charged for submitting proposals.",
    id: "setProposalFee",
  },
  {
    value: "setCashToken",
    label: "Cash Token",
    shortDescription: "Update the currency used for payment in auctions.",
    id: "setCashToken",
  },
  {
    value: "setZeroProposalThresholdRatio",
    label: "ZERO Threshold",
    shortDescription:
      "Update the number of yes votes required to pass Zero proposals.",
    id: "setZeroProposalThresholdRatio",
  },
  {
    value: "setEmergencyProposalThresholdRatio",
    label: "Power Threshold",
    shortDescription:
      "Update the number of yes votes required to pass Power proposals.",
    id: "setEmergencyProposalThresholdRatio",
  },
];

function handleChangeList(e: any) {
  parameter.value = e;
  if (e?.value === "custom_parameter") {
    list.value = "";
    customConfig.value = true;
  } else {
    list.value = e?.value;
  }
  emit("handleChangeList", e.value);
}
</script>

<style>
.error {
  @apply border border-red-500;
}
</style>
