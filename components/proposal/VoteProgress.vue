<template>
  <div>
    <div class="my-6">
      <!-- Power or Emergency -->
      <div v-if="version === 'Standard'">
        <VoteProgressPower :votes="powerVotes" />
      </div>

      <div v-else-if="version === 'Emergency'">
        <VoteProgressPower
          :votes="powerVotes"
          :threshold-ratio="thresholdRatio"
          :threshold-formatted="thresholdFormatted"
        />
      </div>

      <!-- Zero -->
      <div v-else-if="version === 'Zero'">
        <VoteProgressZero
          :votes="zeroVotes"
          :threshold-ratio="thresholdRatio"
          :threshold-formatted="thresholdFormatted"
        />
      </div>
      <p class="my-1 text-sm text-grey-500">
        Total participation:
        {{ getParticipationPercentage }}%
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MVotingType } from "@/lib/api/types";
import { useNumberFormatterCompact } from "@/utils/numberFormatter";
import { formatUnits } from "viem";

interface Props {
  yesVotes: bigint;
  noVotes: bigint;
  version: MVotingType;
  threshold?: bigint; // in aboslute value
  thresholdBps?: number; // in basis points
  powerTotalSupply?: bigint;
  zeroTotalSupply?: bigint;
}
const props = withDefaults(defineProps<Props>(), {
  yesVotes: () => 0n,
  noVotes: () => 0n,
  version: "Standard",
  threshold: undefined,
  thresholdBps: undefined,
  powerTotalSupply: () => 0n,
  zeroTotalSupply: () => 0n,
});

/* @output: range 0.00-100.00 */
const percentageSafeDiv = (a: bigint, b: bigint) =>
  Number((a * 10000n) / b) / 100;

function parseVotesForMajority({ yes, no }: { yes: string; no: string }) {
  const yesBI = BigInt(yes);
  const noBI = BigInt(no);

  const total = yesBI + noBI;

  const yesPercentage = total === 0n ? 0 : percentageSafeDiv(yesBI, total);
  const noPercentage = total === 0n ? 0 : percentageSafeDiv(noBI, total);

  return {
    total,
    yes: {
      count: yesBI,
      formatted: useNumberFormatterCompact(yes),
      percentage: yesPercentage,
    },
    no: {
      count: noBI,
      formatted: useNumberFormatterCompact(no),
      percentage: noPercentage,
    },
  };
}

function parseVotesForQuorom(
  {
    yes,
    no,
  }: {
    yes: string;
    no: string;
  },
  totalSupply: bigint,
) {
  const yesBI = BigInt(yes);
  const noBI = BigInt(no);

  const total = totalSupply;

  const yesPercentage = total === 0n ? 0 : percentageSafeDiv(yesBI, total);
  const noPercentage = total === 0n ? 0 : percentageSafeDiv(noBI, total);

  return {
    total,
    yes: {
      count: yesBI,
      formatted: useNumberFormatterCompact(yes),
      percentage: yesPercentage,
    },
    no: {
      count: noBI,
      formatted: useNumberFormatterCompact(no),
      percentage: noPercentage, // range 0-100
    },
  };
}

const powerVotes = computed(() => {
  return props.version === "Standard"
    ? parseVotesForMajority({
        yes: props.yesVotes.toString(),
        no: props.noVotes.toString(),
      })
    : parseVotesForQuorom(
        {
          yes: props.yesVotes.toString(),
          no: props.noVotes.toString(),
        },
        props.powerTotalSupply!,
      );
});

const zeroVotes = computed(() => {
  const parsed = parseVotesForQuorom(
    {
      yes: props.yesVotes.toString(),
      no: props.noVotes.toString(),
    },
    props.zeroTotalSupply!,
  );

  return {
    total: parsed.total,
    yes: {
      count: parsed.yes.count,
      formatted: useNumberFormatterCompact(formatUnits(parsed.yes.count, 6)),
      percentage: parsed.yes.percentage,
    },
    no: {
      count: parsed.no.count,
      formatted: useNumberFormatterCompact(formatUnits(parsed.no.count, 6)),
      percentage: parsed.no.percentage,
    },
  };
});

const thresholdFormattedPower = computed(() =>
  useNumberFormatterCompact(props.threshold!),
);

const thresholdFormattedZero = computed(() =>
  useNumberFormatterCompact(formatUnits(props.threshold!, 6)),
);

const powerThresholdRatio = computed(
  () => basisPointsToPercentage(props.thresholdBps!), //0-100
);

const zeroThresholdRatio = computed(
  () => basisPointsToPercentage(props.thresholdBps!), //0-100
);

const thresholdFormatted = computed(() =>
  props.version === "Emergency"
    ? thresholdFormattedPower.value
    : thresholdFormattedZero.value,
);

const thresholdRatio = computed(() =>
  props.version === "Emergency"
    ? powerThresholdRatio.value
    : zeroThresholdRatio.value,
);

const getParticipationPercentage = computed(() => {
  return percentageSafeDiv(
    props.yesVotes + props.noVotes,
    props.version === "Zero" ? props.zeroTotalSupply : props.powerTotalSupply,
  );
});
</script>
<style scoped>
.text-yes {
  @apply text-green-900 text-xs mx-auto;
}

.text-no {
  @apply text-red-500 text-xs mx-auto;
}
</style>
