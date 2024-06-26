<template>
  <div>
    <div class="px-6 lg:p-0">
      <PageTitle class="items-center">
        <template #default>
          <div class="flex items-center gap-2">
            <span class="capitalize">{{
              epoch?.current?.type.toLowerCase()
            }}</span>
            epoch
            <span class="text-green-700">#{{ phasesEpoch }}</span>
            <span class="text-grey-600 text-sm">
              - Epoch #{{ epoch?.current?.asNumber }}
            </span>
          </div>

          <div>
            <p class="text-grey-600 text-xxs lg:text-xs">
              {{ currentEpochAsDate }} - {{ nextEpochAsDate }}
              <span
                v-if="nextEpochAsTimeLeft"
                class="uppercase text-gray-700 mx-1"
              >
                (ends {{ nextEpochAsTimeLeft }})
              </span>
            </p>
          </div>
        </template>
        <template #side>
          <NuxtLink to="/proposals/all/">
            <MNavButton
              class="text-sm font-ppformula underline normal-case text-grey-600"
            >
              All proposals
            </MNavButton>
          </NuxtLink>
        </template>
      </PageTitle>
    </div>

    <div class="text-grey-600 my-6 px-6 lg:px-0">
      <h5 class="text-xxs mb-1">Proposals:</h5>

      <div
        class="flex justify-between items-center lg:justify-start gap-6 whitespace-nowrap overflow-x-auto text-sm"
      >
        <NuxtLink to="/proposals/">
          <MNavButton
            class="proposals-nav-button"
            data-test="button-tab-standard"
          >
            Standard
            <MBadge v-if="standardProposals" version="info">{{
              standardProposals
            }}</MBadge>
          </MNavButton>
        </NuxtLink>

        <hr v-if="emergency || zero" class="border-l border-grey-600 h-4" />

        <NuxtLink v-if="emergency" to="/proposals/emergency/">
          <MNavButton
            class="proposals-nav-button"
            data-test="button-tab-emergency"
          >
            Emergency <MBadge version="error">{{ emergency }}</MBadge>
          </MNavButton>
        </NuxtLink>

        <NuxtLink v-if="zero" to="/proposals/zero/">
          <MNavButton class="proposals-nav-button" data-test="button-tab-zero">
            Zero <MBadge>{{ zero }}</MBadge>
          </MNavButton>
        </NuxtLink>

        <hr
          v-if="pendingExecution || pending"
          class="border-l border-grey-600 h-4"
        />

        <NuxtLink v-if="pendingExecution" to="/proposals/succeeded/">
          <MNavButton
            class="proposals-nav-button"
            data-test="button-tab-pending-execution"
          >
            Pending Execution <MBadge>{{ pendingExecution }}</MBadge>
          </MNavButton>
        </NuxtLink>

        <NuxtLink v-if="pending" to="/proposals/pending/">
          <MNavButton
            class="proposals-nav-button"
            data-test="button-tab-scheduled"
          >
            Scheduled <MBadge>{{ pending }}</MBadge>
          </MNavButton>
        </NuxtLink>
      </div>
    </div>

    <div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useProposalsStore();
const ttg = useTtgStore();

const standardProposals = computed(
  () =>
    store
      .getProposalsByState("Active")
      .filter((p) => !p.isEmergency && p.votingType !== "Zero").length,
);

const pendingExecution = computed(
  () => store.getProposalsByState("Succeeded").length,
);

const emergency = computed(
  () => store.getProposalsByState("Active").filter((p) => p.isEmergency).length,
);

const zero = computed(
  () =>
    store.getProposalsByState("Active").filter((p) => p.votingType === "Zero")
      .length,
);

const pending = computed(() => store.getProposalsByState("Pending").length);

const { epoch } = storeToRefs(ttg);

const currentEpochAsDate = computed(() => {
  const { toFormat } = useDate(Number(epoch.value.current?.asTimestamp));
  return toFormat("LLL");
});

const nextEpochAsDate = computed(() => {
  const { toFormat } = useDate(Number(epoch.value.next?.asTimestamp));
  return toFormat("LLL");
});

const getTimeLeft = () => {
  const { timeAgo } = useDate(Number(epoch.value.next?.asTimestamp));
  return timeAgo;
};
const nextEpochAsTimeLeft = ref(getTimeLeft());

onMounted(() => {
  setInterval(() => {
    nextEpochAsTimeLeft.value = getTimeLeft();
  }, 1000);
});

const phasesEpoch = computed(() => {
  return Math.ceil(epoch.value.current!.asNumber / 2);
});
</script>

<style scoped>
.router-link-active button {
  @apply text-grey-100;
}
.proposals-nav-button {
  @apply text-grey-500 text-base flex items-center gap-1 capitalize font-ppformula;
}
.proposals-nav-button span {
  @apply text-xs px-[5px] py-[1px] mb-1 ml-0.5;
}
</style>
