<template>
  <div>
    <label>Configuration parameter *</label>
    <div>
      <MInputMultiSelect
        :options="configParams"
        label="Select configuration parameter"
        data-test="protocolConfigSelect"
        @on-change="handleChangeList"
      />
    </div>

    <div v-if="hasErrors" class="text-red-500 text-xs my-2 h-4">
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
const emit = defineEmits(["update:modelValue"]);

const list = useVModelWrapper<InputProps>(props, emit, "modelValue");
const parameter = ref();

const hasErrors = computed(() => props.errors?.length);

const configParams = [
  {
    header: "protocol",
  },
  {
    value: "update_collateral_interval",
    label: "Update collateral interval",
    shortDescription:
      "Update the period of time between which Update Collateral must be called by a Minter.",
    description:
      "The length of time in seconds that Minter has to call updateCollateral, from the previous time it was called by that minter, before they will incur the penalty.",
  },
  {
    value: "update_collateral_threshold",
    label: "Update collateral threshold",
    shortDescription:
      "Update the minimum number of signatures required to execute Update Collateral.",
  },
  {
    value: "penalty_rate",
    label: "Penalty rate",
    shortDescription:
      "Update the fee charged on Owed M that in case of insufficient reserve.",
  },
  {
    header: "mint",
  },
  {
    value: "mint_delay",
    label: "Mint delay",
    shortDescription:
      "Update the amount of time between when a Minter has called Propose Mint and when they can call Mint M.",
  },
  {
    value: "mint_ttl",
    label: "Mint TTL",
    shortDescription:
      "Update the amount of time that mint request can remain live before it can no longer be executed",
  },
  {
    value: "mint_ratio",
    label: "Mint ratio",
    shortDescription:
      "Update the fraction size of a Minter’s on-chain Collateral Value that they can generate in M.",
  },
  {
    value: "minter_freeze_time",
    label: "Minter freeze time",
    shortDescription:
      "Update the amount of time that Mint has to be called before Propose Mint expires.",
  },
  {
    header: "interest rates",
  },
  {
    value: "minter_rate_model",
    label: "Minter rate model",
    shortDescription:
      "Smart contract that implements logic for calculation of Minter rate.",
  },

  {
    value: "base_minter_rate",
    label: "Base minter rate",
    shortDescription:
      "Base yearly interest rate that continuously accrues on M owed to the protocol.",
  },

  {
    value: "earner_rate_model",
    label: "Earner rate model",
    shortDescription:
      "Smart contract that implements the logic for calculation of Earner rate.",
  },

  {
    value: "max_earner_rate",
    label: "Max earner rate",
    shortDescription:
      "Maximum yearly interest rate that continuously accrues on M owned by Earners.",
  },
];

function handleChangeList(e: any) {
  parameter.value = e;
  list.value = e.value;
}
</script>

<style>
.error {
  @apply border border-red-500;
}
</style>
