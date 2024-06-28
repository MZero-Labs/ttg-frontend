<template>
  <div class="flex justify-between gap-2 items-center">
    <div class="bg-green-800 h-2 w-2"></div>

    <span id="vote-yes-percentage" class="text-green-800 text-xs">
      {{ props.votes?.yes?.percentage }}%
    </span>

    <span id="vote-yes-percentage" class="text-grey-500 text-xs">
      ({{ props.votes?.yes?.formatted }})
    </span>

    <MProgressBarThreshold
      v-if="props.thresholdRatio"
      :yes="props.votes?.yes?.percentage"
      :no="props.votes?.no?.percentage"
      :threshold="thresholdRatioPercentage"
    />

    <MProgressBar
      v-else
      :width="props.votes?.yes?.percentage"
      :has-votes="hasVotes"
    />

    <div class="bg-red-500 h-2 w-2"></div>

    <span
      id="vote-no-percentage"
      class="text-red-500 text-xs flex items-baseline"
    >
      {{ props.votes?.no?.percentage }}%
    </span>

    <span id="vote-yes-percentage" class="text-grey-500 text-xs">
      ({{ props.votes?.no?.formatted }})
    </span>

    <div v-if="props.thresholdRatio">
      <span class="text-grey-500 text-xs uppercase whitespace-nowrap">
        Threshold: {{ thresholdRatio }}% ({{ props.thresholdFormatted }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  thresholdRatio?: number; // in percentage 0-1 i.e: 0.5 = 50%, 1=100%
  thresholdFormatted?: string;
  votes: {
    total: bigint;
    yes: {
      count: bigint;
      formatted: string;
      percentage: number;
    };
    no: {
      count: bigint;
      formatted: string;
      percentage: number;
    };
  };
}
const props = defineProps<Props>();

const hasVotes = computed(
  () => props.votes?.yes?.count > 0n || props.votes?.no?.count > 0n,
);

const thresholdRatioPercentage = (props.thresholdRatio || 1) / 100;
</script>
