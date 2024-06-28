<template>
  <div
    v-if="props.description"
    class="bg-grey-800 bg-opacity-85 flex flex-col gap-1 p-4 my-2"
  >
    <span class="uppercase text-xxs">Parameter description</span>
    <p class="font-inter">
      {{ props.description }}
    </p>
  </div>

  <div class="my-3 mb-4">
    <label for="governance-config-input">Value *</label>

    <div class="flex">
      <input
        v-bind="$attrs"
        v-model="value"
        v-maska
        :data-maska="props.maska?.mask"
        :data-maska-tokens="props.maska?.tokens"
        :class="{ error: hasErrors }"
        class="input"
      />
      <span
        v-if="props.decorator"
        class="inline-flex items-center px-3 bg-grey-800 border border-l-0 border-grey-700"
      >
        <div class="text-gray-600 font-inter whitespace-nowrap">
          {{ props.decorator }}
        </div>
      </span>
    </div>

    <div
      v-if="props.modelValueErrors?.length"
      class="text-red-500 text-xs my-2 h-4"
    >
      <p v-for="error of props.modelValueErrors" :key="error.$uid">
        {{ error.$message }}
      </p>
    </div>

    <div v-else-if="props.currentValue" class="text-xs text-grey-600 my-2">
      Current: {{ props.currentValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ErrorObject } from "@vuelidate/core";

export interface InputProps {
  description?: string;
  currentValue?: string;
  decorator?: string;
  maska?: {
    mask: string;
    tokens?: string;
  };
  modelValue: any;
  modelValueErrors?: ErrorObject[];
}

const props = defineProps<InputProps>();
const emit = defineEmits(["update:modelValue"]);
const value = useVModelWrapper<InputProps>(props, emit, "modelValue");
const hasErrors = computed(() => props.modelValueErrors?.length);
</script>

<style>
.error {
  @apply border border-red-500;
}
</style>
