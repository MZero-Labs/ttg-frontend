<template>
  <div class="w-full flex justify-between space-x-4">
    <div class="block w-1/2">
      <div
        v-if="hasAllowedCashTokens"
        class="bg-grey-800 bg-opacity-85 flex flex-col gap-1 p-4 my-2"
      >
        <span class="uppercase text-xxs">Parameter description</span>
        <p class="font-inter">
          Update the currency used for payment when submitting proposal
        </p>
      </div>

      <div>
        <div v-if="hasAllowedCashTokens">
          <label for="governance-config-input">Value *</label>
          <MInputMultiSelect
            v-model="address"
            label="Select Cash token"
            data-test="select-cash-token"
            :options="options"
            :class="{ error: hasErrors }"
            description="Update the currency used for payment when submitting proposal"
            @on-change="handleChangeList"
          />
          <span class="text-xxs">
            {{ address }}
          </span>
        </div>
        <div v-else>
          <InputDynamic
            v-model="address"
            :model-value-errors="modelValueErrors"
            :maska="masks.ethereumAddress"
            description="Update the currency used for payment when submitting proposal"
            placeholder="Token Address"
            data-test="proposalValue"
          />
        </div>

        <div class="text-red-500 text-xs my-2 h-4">
          <p v-for="error of props.modelValueErrors" :key="error.$uid">
            {{ error.$message }}
          </p>
        </div>
      </div>
    </div>

    <div class="block w-1/2">
      <InputDynamic
        v-model="inputTaxAmount"
        :model-value-errors="modelValue2Errors"
        :maska="masks.eth"
        description="Update the Tax charged for submitting proposals based on the new Token."
        placeholder="Amount"
        data-test="proposalValue2"
        :decorator="selectedToken?.symbol"
        :disabled="hasAllowedCashTokens && !selectedToken"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ErrorObject } from "@vuelidate/core";
import { parseUnits, Hash } from "viem";
import { masks } from "@/utils/masks";

export interface InputProps {
  modelValue: string;
  modelValue2: number;
  modelValueErrors?: ErrorObject[];
  modelValue2Errors?: ErrorObject[];
}

interface TokenOptionItem {
  value: Hash;
  label?: string;
  id?: string;
  decimals?: number;
  symbol?: string;
}

const props = defineProps<InputProps>();
const emit = defineEmits(["update:modelValue", "update:modelValue2"]);

const address = useVModelWrapper<InputProps>(props, emit, "modelValue");
const tax = useVModelWrapper<InputProps>(props, emit, "modelValue2"); // in bigint wei already with the selected token's decimals
const inputTaxAmount = ref();

const ttg = useTtgStore();
const hasErrors = computed(() => props.modelValueErrors?.length);

const selectedToken = ref<TokenOptionItem>();
const hasAllowedCashTokens = computed(
  () => (ttg.governors.zero.allowedCashTokens?.length ?? 0) > 0,
);

const options: TokenOptionItem[] | undefined =
  ttg.governors.zero.allowedCashTokens?.map((token) => ({
    value: token.address,
    label: token.symbol,
    id: token.symbol,
    decimals: token.decimals,
    symbol: token.symbol,
  }));

function handleChangeList(option: any) {
  address.value = option.value;
  selectedToken.value = option;
  inputTaxAmount.value = undefined;
}

tax.value = computed(() => {
  if (!inputTaxAmount.value) return undefined;
  if (hasAllowedCashTokens.value) {
    return parseUnits(inputTaxAmount.value, selectedToken.value?.decimals || 0);
  }
  return inputTaxAmount.value;
});
</script>

<style scoped>
.error {
  @apply border border-red-500;
}

.error--message {
  @apply text-red-500 text-xs my-2 h-4;
}
</style>
