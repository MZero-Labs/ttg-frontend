<template>
  <div class="my-1 mb-3 p-6 font-inter bg-grey-800 bg-opacity-85">
    <div class="grid grid-cols-2 gap-6">
      <div class="col-span-2">
        <label>Proposal type:</label>
        <span v-if="selectedProposalType?.votingType === 'Standard'">
          Standard proposals
        </span>
        <span v-if="selectedProposalType?.votingType === 'Emergency'">
          POWER Threshold proposals
        </span>
        <span v-if="selectedProposalType?.votingType === 'Zero'">
          ZERO Threshold proposals
        </span>
        <NuxtLink
          :href="getDocsLink(selectedProposalType?.votingType)"
          class="underline text-xs text-grey-500 block"
          target="_blank"
          >Learn more</NuxtLink
        >
      </div>
      <div>
        <label>Token holders eligible to participate:</label>
        <div
          v-if="selectedProposalType?.votingType !== 'Zero'"
          class="proposal-type-detail"
        >
          <MIconPower class="min-w-[24px] h-[24px]" /> POWER
        </div>
        <div v-else class="proposal-type-detail">
          <MIconZero class="min-w-[24px] h-[24px]" /> ZERO
        </div>
      </div>
      <div>
        <label>Voting threshold:</label>
        <div class="proposal-type-detail">
          <img src="/img/vote.svg" class="w-[24px] h-[24px]" alt="" />
          <div>
            <span v-if="selectedProposalType?.votingType === 'Standard'"
              >Simple majority wins
            </span>
            <span v-else-if="selectedProposalType?.votingType === 'Emergency'"
              >Immediately executable after reaching
              {{
                basisPointsToPercentage(
                  ttgValues.emergencyProposalThresholdRatio,
                )
              }}%
            </span>
            <span v-else-if="selectedProposalType?.votingType === 'Zero'"
              >Immediately executable after reaching
              {{
                basisPointsToPercentage(ttgValues.zeroProposalThresholdRatio)
              }}%
            </span>
          </div>
        </div>
      </div>
      <div>
        <label>Voting will start:</label>
        <div>
          <span v-if="selectedProposalType?.votingType !== 'Standard'">
            Immediately votable
          </span>
          <span v-else>
            {{ nextEpochAsDate }} (Epoch #{{ epoch?.current?.asNumber }})
          </span>
        </div>
      </div>
      <div>
        <label>Submission fee:</label>
        <div class="proposal-type-detail">
          <MIconWeth class="w-[24px] h-[24px]" />
          <span v-if="selectedProposalType?.hasToPayFee">{{
            ttgValuesFormatted.setProposalFee
          }}</span>
          <span v-else>0</span>
        </div>
        <p
          v-if="selectedProposalType?.hasToPayFee"
          class="text-xs text-grey-500 mt-2"
        >
          You'll receive a refund if the proposal succeeds
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ttg = useTtgStore();
const {
  getValuesFormatted: ttgValuesFormatted,
  getValues: ttgValues,
  epoch,
} = storeToRefs(ttg);

defineProps({
  selectedProposalType: {
    type: Object,
    required: true,
  },
});

const nextEpochAsDate = computed(() => {
  const { toFormat } = useDate(Number(epoch.value.next?.asTimestamp));
  return toFormat("LL");
});

const getDocsLink = (votingType: string) => {
  const docsLink =
    "https://docs.m0.org/portal/overview/whitepaper/iii.-governance/iii.ii-operation/iii.ii.ii-proposals/";
  switch (votingType) {
    case "Standard":
      return `${docsLink}iii.ii.ii.i-standard-proposals`;
    case "Emergency":
      return `${docsLink}iii.ii.ii.ii-power-threshold-proposals`;
    case "Zero":
      return `${docsLink}iii.ii.ii.iii-zero-threshold-proposals`;
  }
};
</script>

<style>
.proposal-type-detail {
  @apply flex items-center gap-3;
}
</style>
